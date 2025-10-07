import {Alert, Animated, ScrollView, Text, TouchableOpacity, View} from 'react-native';
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
import {BarIndicator,} from 'react-native-indicators';
import {executeSQL} from "../api/dev_utils.ts";
import {useDB} from "../context/DBContext.tsx";
// import NetInfo from '@react-native-community/netinfo';
// import {syncUnsyncedDocuments} from "../api/sync.ts";

type Props = {
    onReady: () => void;
};

type Message =
    | { type: 'text'; text: string; source: 'user' | 'search' }
    | { type: 'image'; uri: string; description: string; source: 'user' | 'search'; serverID?: number }
    | { type: 'loading'; source: 'user' | 'search' };


function ChatScreen({onReady}: Props) {

    // TODO: Fix this? null safety
    const dbInstance = useDB()!;

    useEffect(() => {
        const setup = async () => {

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

                addImageToUI(savedPath)
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
    const executeSQL = async (sql: string) => {
        try {
            const result = await dbInstance.execute(sql);
            console.log('SQL result:', result.rows);
        } catch (err) {
            console.error('SQL error:', err);
        }
    };
    // useEffect(() => {
    //     let timeout: NodeJS.Timeout | null = null;
    //
    //     const unsubscribe = NetInfo.addEventListener(state => {
    //         if (state.isConnected) {
    //             // debounce reconnection to avoid rapid toggles
    //             if (timeout) clearTimeout(timeout);
    //             timeout = setTimeout(() => {
    //                 syncUnsyncedDocuments(dbInstance);
    //             }, 2000);
    //         }
    //     });
    //
    //     return () => {
    //         if (timeout) clearTimeout(timeout);
    //         unsubscribe();
    //     };
    // }, [dbInstance]);


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
        if (!whisperContext) {
            void initWhisper();
        }
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

    function substituteLastMessage(text: string) {
        setMessages(prev => prev.slice(0, -1));
        setMessages(prev => [
            ...prev,
            {type: 'text', text: text, source: 'search'},
        ]);
    }

    const handleRecordStop = async () => {
        const internalPath = await AudioRecord.stop();
        setIsRecording(false);

        try {
            const stat = await RNFS.stat(internalPath);
            console.log('size (bytes):', stat.size);
            if (stat.size <= 44) {
                setMessages(prev => [
                    ...prev,
                    {type: 'text', text: t('tooShortAudio'), source: 'search'},
                ]);
                return;
            }

            if (!whisperContext) {
                await initWhisper();
                return;
            }

            if (!pinnedImagePath) {
                setMessages(prev => [...prev, {type: 'loading', source: 'user'}]);
            }

            const {promise} = whisperContext.transcribe(internalPath, {language: 'en'});
            let {result} = await promise;
            result = result.trim();

            if (result === "[BLANK_AUDIO]" || result === "[INAUDIBLE]") {
                substituteLastMessage(t('badAudioMessage'));
            } else {
                if (pinnedImagePath) {
                    setInputText(result);
                } else {
                    setMessages(prev => {
                        const updated = [...prev];
                        const idx = updated.findIndex(m => m.type === 'loading' && m.source === 'user');
                        if (idx !== -1) updated[idx] = {type: 'text', text: result, source: 'user'};
                        return updated;
                    });
                    await runEmbeddingSearch(result);
                }
            }
        } finally {
            RNFS.unlink(internalPath).catch(() => {
            });
        }
    };

    // const uploadPhotoToServer = async (filePath: string, description: string = "") => {
    //     try {
    //         const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
    //         const formData = new FormData();
    //         formData.append('image', {
    //             uri,
    //             name: uri.split('/').pop(),
    //             type: 'image/jpeg', // you can detect mime type if needed
    //         });
    //         formData.append('description', description);
    //
    //         const response = await fetch('http://107.172.80.108:3000/upload', {
    //             method: 'POST',
    //             body: formData,
    //             headers: {
    //                 'Content-Type': 'multipart/form-data',
    //             },
    //         });
    //
    //         const data = await response.json();
    //         console.log('Upload response:', response);
    //         return data;
    //     } catch (err) {
    //         console.error('Upload failed', err);
    //     }
    // };

    const handlePhotoSelected = (path: string) => {
        const uri = path.startsWith('file://') ? path : `file://${path}`;
        addImageToUI(uri);
        inputBarRef.current?.focus();
        scrollViewRef.current?.scrollToEnd();
        insertNewImage(dbInstance, uri);
    };


    const addImageToUI = (uri: string, description: string = "...", source: 'user' | 'search' = 'user') => {
        setMessages(prev => [...prev, {type: 'image', uri, description, source}]);
        setPinnedImagePath(source === 'user' ? uri : null);
    };


    const handleSendMessage = async (text: string) => {
        if (!llamaContext) {
            const ok = await initLlama();
            if (!ok) return;
        }
        try {
            setMessages(prev => [...prev, {type: 'text', text, source: 'user'}]);
            await runEmbeddingSearch(text);
            setInputText("");
        } catch (err) {
            Alert.alert("Error During Inference", err instanceof Error ? err.message : "Unknown error");
        }
    };

    const runEmbeddingSearch = async (text: string) => {
        const result = await llamaContext.embedding(text);
        await llamaContext.embedding("");
        const foundDocument = await searchSimilarEmbedding(dbInstance, result.embedding);

        if (foundDocument) {
            scrollViewRef.current?.scrollToEnd();
            const confidence = (1.5 - Number(foundDocument.distance)) / 1.5 * 100;
            setMessages(prev => [
                ...prev,
                {type: 'text', text: `Found this document (${confidence.toFixed(1)}%): `, source: 'search'},
            ]);
            addImageToUI(foundDocument.path, foundDocument.description, 'search');
        } else {
            setMessages(prev => [
                ...prev,
                {type: 'text', text: "Sorry, could not find any matching documents.", source: 'search'},
            ]);
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

    async function insertNewImage(db: DB, imagePath: string) {
        try {
            await db.execute(
                `INSERT INTO embeddings (image_path)
                 VALUES (?)`,
                [imagePath]
            );
        } catch (err) {
            console.error('SQL error:', err);
        }

    }

    async function updateEmbeddingByPath(db: DB, imagePath: string, newEmbedding: number[], newDescription: string) {
        console.log(newEmbedding)

        try {
            const updateResult = await db.execute(
                `UPDATE embeddings
                 SET embedding   = ?,
                     description = ?
                 WHERE image_path = ?`,
                [new Float32Array(newEmbedding), newDescription, imagePath]
            );

            console.log(updateResult)
            if (updateResult.rowsAffected === 0) {
                await db.execute(
                    `INSERT INTO embeddings (embedding, image_path, description)
                     VALUES (?, ?, ?)`,
                    [new Float32Array(newEmbedding), imagePath, newDescription]
                );

            }
        } catch (err) {
            console.error('SQL error:', err);
        }


    }

    async function searchSimilarEmbedding(db: DB, embedding: number[], limit: number = 10) {
        try{
            const results = await db.execute(
                `SELECT 
                description, 
                image_path,
                vec_distance_cosine(embedding, ?) as distance
            FROM embeddings
            WHERE embedding IS NOT NULL
            ORDER BY distance LIMIT ?`,
                [new Float32Array(embedding), limit]
            );

            if (results.rows.length > 0) {
                const description = results.rows[0].description?.toString() || "";
                const path = results.rows[0].image_path?.toString()
                const distance = results.rows[0].distance?.toString() || "";
                if (path) {
                    return {path, description, distance}
                }
            }
        }  catch (err) {
            console.error('SQL error:', err);
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
                    } else if (msg.type === 'loading') {
                        return (
                            <View key={index} style={[styles.textBubble,
                                msg.source === "search" ? styles.msgLeft : styles.msgRight, {height: 41.5}]}>
                                <BarIndicator count={15} size={10}/>
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

            <TouchableOpacity
                onPress={() => {
                    executeSQL(inputText)
                }}
            >
                <Text>Execute SQL</Text>
            </TouchableOpacity>
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
