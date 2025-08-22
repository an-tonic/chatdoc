import {Alert, Animated, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEffect, useRef, useState} from 'react';
import {releaseAllLlama} from 'llama.rn';
import {DB, open} from '@op-engineering/op-sqlite';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import PhotoPicker from "../components/PhotoPicker.tsx"; // File system module
import InputBar, {InputBarHandle} from "../components/InputBar.tsx";
import {savePhotoToLocal} from "../api/utils.ts";
import {styles} from "../styles/styles.ts";
import {loadLlamaModel, loadWhisperModel} from "../api/model.ts";
import BubbleImage from "../components/BubbleImage.tsx";
import {releaseAllWhisper} from "whisper.rn";
import {requestRecordPermissions} from "../api/permissions.ts";
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import {t} from '../languages/i18n';

type Props = {
    onReady: () => void;
};

type Message =
    | {
    type: 'text';
    text: string;
    source: 'user' | 'search';
}
    | {
    type: 'image';
    uri: string;
    description: string;
    source: 'user' | 'search';
};


function ChatScreen({onReady}: Props) {


    useEffect(() => {
        const setup = async () => {

            const db = open({
                name: "documents.db",
                location: "../files/databases"
            });

            await db.execute(`
              CREATE VIRTUAL TABLE IF NOT EXISTS embeddings
              USING vec0(embedding float[768], image_path TEXT, description TEXT);
            `);
            setDbInstance(db);

            void initLlama();
            // void initWhisper();

            AudioRecord.init({
                sampleRate: 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6,
                wavFile: 'temp_recording.wav',
            });

            onReady();
        };

        void setup();

        return () => {
            void releaseAllLlama();
            void releaseAllWhisper();
        };
    }, []);

    useEffect(() => {
        ReceiveSharingIntent.getReceivedFiles(async (files: any) => {
                const savedPath = await savePhotoToLocal(files[0].filePath)

                addImage(savedPath)
            },
            (error: any) => {
                console.log(error);
            },
            'ShareMedia' // share url protocol (must be unique to your app, suggest using your apple bundle id)
        );

        return () => {
            ReceiveSharingIntent.clearReceivedFiles();
        };
    }, []);

    const inputBarRef = useRef<InputBarHandle>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    const [llamaContext, setLlamaContext] = useState<any>(null);
    const [whisperContext, setWhisperContext] = useState<any>(null);
    const [inputText, setInputText] = useState<string>('');
    const [dbInstance, setDbInstance] = useState<any>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [pinnedImagePath, setPinnedImagePath] = useState<string | null>(null);
    const [showScrollDownButton, setShowScrollDownButton] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const initLlama = async () => {
        const newLlamaContext = await loadLlamaModel("nomic-embed-text-v1.5.Q8_0.gguf", llamaContext);

        if (!newLlamaContext) return false;
        setLlamaContext(newLlamaContext);
        return true;
    };

    const initWhisper = async () => {
        const newWhisperContext = await loadWhisperModel("ggml-tiny.bin", whisperContext);

        if (!newWhisperContext) return false;
        setWhisperContext(newWhisperContext);
        return true;
    };


    const handlePaperclipPress = () => setPickerVisible(true);

    const handleRecordStart = async () => {
        const granted = await requestRecordPermissions();

        if (!granted) {
            Alert.alert(
                'Microphone Permission Required',
                'Please enable microphone access in your device settings to record audio.'
            );
            return;
        }

        AudioRecord.start();
        setIsRecording(true);
        console.log('Started recording...');
    };


    const handleRecordStop = async () => {
        const internalPath = await AudioRecord.stop();
        setIsRecording(false);
        console.log('Saved to app storage:', internalPath);

        if (!whisperContext) {
            void initWhisper();
        }
        if (whisperContext) {
            const {stop, promise} = whisperContext.transcribe(internalPath, {
                language: 'auto',
            });
            const {result} = await promise;
            if (result == "[BLANK_AUDIO]") return;

            if (pinnedImagePath) {
                setInputText(result);
            } else {
                void handleSendMessage(result);
            }

            RNFS.unlink(internalPath).catch(() => {
            });
        }
    };


    const handlePhotoSelected = (path: string) => {
        addImage(path);
        inputBarRef.current?.focus();
        scrollViewRef.current?.scrollToEnd();
    };


    const addImage = (path: string, description: string = "...", source: 'user' | 'search' = 'user') => {
        const uri = path.startsWith('file://') ? path : `file://${path}`;
        setMessages(prev => [...prev, {type: 'image', uri, description, source}]);
        setPinnedImagePath(source === 'user' ? uri : null);
    };


    const handleSendMessage = async (text: string) => {

        if (!llamaContext) {
            const isLlama = await initLlama();

            if (!isLlama) return;
        }

        try {
            setMessages(prev => [...prev, {type: 'text', text: text, source: 'user'}]);
            const result = await llamaContext.embedding(text);
            await llamaContext.embedding("");
            const foundDocument = await searchSimilarEmbedding(dbInstance, result.embedding);
            if (foundDocument) {

                scrollViewRef.current?.scrollToEnd();
                const confidence = (1.5 - Number(foundDocument.distance)) / 1.5 * 100;

                const text = `Found this document (${confidence.toFixed(1)}%): `
                setMessages(prev => [...prev, {type: 'text', text: text, source: 'search'}]);
                addImage(foundDocument.path, foundDocument.description, 'search')

            } else {
                const text = "Sorry, could not find any matching documents."
                setMessages(prev => [...prev, {type: 'text', text: text, source: 'search'}]);
            }
            setInputText("")
        } catch (error) {
            Alert.alert(
                'Error During Inference',
                error instanceof Error ? error.message : 'An unknown error occurred.',
            );
        }
    };

    const handleNewEmbedding = async (text: string) => {
        if (!llamaContext) {
            Alert.alert('Model Not Loaded', 'Please load the model first.');
            return;
        }

        const imageUri = pinnedImagePath || "Not Found";
        setMessages(prev =>
            prev.map(msg =>
                msg.type === 'image' && msg.uri === pinnedImagePath
                    ? {...msg, description: text}
                    : msg
            )
        );
        setInputText("")
        setPinnedImagePath("")
        const result = await llamaContext.embedding(text);
        await updateEmbeddingByPath(dbInstance, imageUri, result.embedding, text);

    };

    async function updateEmbeddingByPath(db: DB, imagePath: string, newEmbedding: number[], newDescription: string) {
        const newEmbed = JSON.stringify(newEmbedding)
        const updateResult = await db.execute(
            `UPDATE embeddings
             SET embedding   = ?,
                 description = ?
             WHERE image_path = ?`,
            [newEmbed, newDescription, imagePath]
        );

        if (updateResult.rowsAffected === 0) {
            await db.execute(
                `INSERT INTO embeddings (embedding, image_path, description)
                 VALUES (?, ?, ?)`,
                [newEmbed, imagePath, newDescription]
            );
        }

    }

    async function searchSimilarEmbedding(db: DB, embedding: number[], limit: number = 10) {

        const results = await db.execute(
            `SELECT description, image_path, distance
             FROM embeddings
             WHERE embedding MATCH ?
             ORDER BY distance LIMIT ?`,
            [JSON.stringify(embedding), limit]
        );
        console.log(results);
        if (results.rows.length > 0) {
            const description = results.rows[0].description?.toString() || "";
            const path = results.rows[0].image_path?.toString()
            const distance = results.rows[0].distance?.toString() || "";
            if (path) {
                return {path, description, distance}
            }
        }
        return null

    }


    return (
        <SafeAreaView style={{flex: 1}}>

            <Animated.ScrollView
                contentContainerStyle={styles.chatContainer}
                ref={scrollViewRef}
                onScroll={event => {
                    const offsetY = event.nativeEvent.contentOffset.y;
                    const contentHeight = event.nativeEvent.contentSize.height;
                    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
                    const isAtBottom = offsetY + layoutHeight >= contentHeight - 100;
                    setShowScrollDownButton(!isAtBottom);
                }}
                scrollEventThrottle={30}
            >
                {messages.length === 0 && <Text style={styles.welcomeText}>{t('welcomeText')}</Text>}

                {messages.map((msg, index) => {
                    if (msg.type === 'image') {
                        return (
                            <BubbleImage
                                key={index}
                                image={msg}
                                pinnedImage={pinnedImagePath}
                                onPress={() => {
                                    setPinnedImagePath(prev => (prev === msg.uri ? null : msg.uri));
                                    setInputText(msg.description);
                                }}
                            />
                        );
                    } else if (msg.type === 'text') {
                        return (
                            <View key={index} style={[styles.textBubble,
                                msg.source === "search" ? styles.msgLeft : styles.msgRight]}>
                                <Text style={styles.textMessage}>{msg.text}</Text>
                            </View>
                        );
                    } else {
                        return null;
                    }
                })}
            </Animated.ScrollView>

            {showScrollDownButton && (
                <View style={styles.scrollDownButton}>
                    <Text onPress={() => scrollViewRef.current?.scrollToEnd({animated: true})}
                          style={styles.scrollDownText}>
                        ↓
                    </Text>
                </View>
            )}


            <InputBar
                ref={inputBarRef}
                value={inputText}
                onChangeText={setInputText}
                onPressAttachFiles={handlePaperclipPress}
                onRecordPressIn={handleRecordStart}
                onRecordPressOut={handleRecordStop}
                onPressSendMessage={async () => {
                    if (pinnedImagePath) {
                        await handleNewEmbedding(inputText);
                    } else {

                        await handleSendMessage(inputText);
                    }
                }}
                isRecording={isRecording}
            />


            <PhotoPicker
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onPhotoSelected={handlePhotoSelected}
            />
        </SafeAreaView>
    );


}


export default ChatScreen;
