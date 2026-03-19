import {Alert, Animated, Keyboard, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import {releaseAllLlama} from 'llama.rn';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import PhotoPicker from "../components/PhotoPicker.tsx";
import InputBar, {InputBarHandle} from "../components/InputBar.tsx";
import {
    doesFileExist,
    saveFileFromLocalFS,
    saveFileFromRemoteFS,
    searchLocalDB,
    searchServerDB,
    updateMetadataLocalDB
} from "../api/utils.ts";
import {loadLlamaModel, loadWhisperModel} from "../api/model.ts";
import BubbleImage from "../components/BubbleImage.tsx";
import {releaseAllWhisper} from "whisper.rn";
import {checkRecordPermissions, requestRecordPermissions} from "../api/permissions.ts";
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import {t} from '../languages/i18n';
import {BarIndicator,} from 'react-native-indicators';
import {executeSQL} from "../api/dev_utils.ts";
import {useDB} from "../context/DBContext.tsx";
import {ImageMessage} from "../types/types.ts";
import {useStyles} from "../custom_hooks/useStyles.ts";
import {useTheme} from "../context/ThemeContext.tsx";
// import NetInfo from '@react-native-community/netinfo';
// import {syncUnsyncedDocuments} from "../api/sync.ts";


// @formatter:off
type Message =
    | { type: 'text'; text: string; source: 'user' | 'search' }
    | ImageMessage
    | { type: 'loading'; source: 'user' | 'search' };


function ChatScreen() {
    console.log("ChatScreen Rendered!")
    const inputBarRef = useRef<InputBarHandle>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [llamaContext, setLlamaContext] = useState<any>(null);
    const [whisperContext, setWhisperContext] = useState<any>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [pinnedImageID, setPinnedImageID] = useState<number | null>(null);
    const [showScrollDownButton, setShowScrollDownButton] = useState(false);
    const styles = useStyles();
    const {colors} = useTheme();

    // TODO: Fix this? null safety
    const dbInstance = useDB()!;

    useEffect(() => {

        const setup = async () => {

            void initLlama();

            AudioRecord.init({
                sampleRate: 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6,
                wavFile: 'temp_recording.wav',
            });
        };

        void setup();

        return () => {
            void releaseAllLlama();
            void releaseAllWhisper();
        };
    }, []);

    useEffect(() => {
        try {
            ReceiveSharingIntent.getReceivedFiles(
                async (files: any) => {
                    if (files && files.length > 0) {
                        const { savedFileID, savedFilePath } = await saveFileFromLocalFS(dbInstance, files[0].filePath);
                        if(!savedFilePath) return;
                        addImageToUI(savedFileID, savedFilePath);
                    }
                },
                (error: any) => console.log(error),
                'ShareMedia'
            );
        } catch (err) {
            console.log('ReceiveSharingIntent error', err);
        }

        return () => {
            ReceiveSharingIntent.clearReceivedFiles();
        };
    }, []);


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

        if (!newLlamaContext) return null;
        setLlamaContext(newLlamaContext);
        return newLlamaContext;
    };

    const initWhisper = async () => {
        const newWhisperContext = await loadWhisperModel("ggml-tiny.bin", whisperContext);

        if (!newWhisperContext) return null;
        setWhisperContext(newWhisperContext);
        return newWhisperContext;
    };

    const handlePaperclipPress = () => setPickerVisible(true);

    const handleRecordStart = async () => {
        const granted = await checkRecordPermissions();
        if (!granted) {
            const permission = await requestRecordPermissions();
            if (!permission) {
                Alert.alert(
                    'Microphone Permission Required',
                    'Please enable microphone access in your device settings to record audio.'
                );
                return;
            }
            AudioRecord.init({
                sampleRate: 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6,
                wavFile: 'temp_recording.wav',
            });
        }

        AudioRecord.start();

    };


    const handleRecordStop = async () => {

        const internalPath = await AudioRecord.stop();

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
            let context = whisperContext;
            if (!context) {
                context = await initWhisper();
                if (!context) return;
                setWhisperContext(context);
            }

            if (!pinnedImageID) {
                setMessages(prev => [...prev, {type: 'loading', source: 'user'}]);
            }
            const {promise} = context.transcribe(internalPath, {language: 'en'});
            let {result} = await promise;
            result = result.trim();

            if (result === "[BLANK_AUDIO]" || result === "[INAUDIBLE]") {
                substituteLastMessage(t('badAudioMessage'));
            } else {
                if (pinnedImageID) {
                    inputBarRef.current?.setText(result);
                } else {
                    setMessages(prev => {
                        const updated = [...prev];
                        const idx = updated.findIndex(m => m.type === 'loading' && m.source === 'user');
                        if (idx !== -1) updated[idx] = {type: 'text', text: result, source: 'user'};
                        return updated;
                    });
                    await runEmbeddingSearch(result, llamaContext);
                }
            }
        } finally {
            RNFS.unlink(internalPath).catch(() => {
            });
        }
    };

    const substituteLastMessage = (text: string) => {
        setMessages(prev => prev.slice(0, -1));
        setMessages(prev => [
            ...prev,
            {type: 'text', text: text, source: 'search'},
        ]);
    }

    const handlePhotoSelected = async (path: string) => {
        const {savedFileID, savedFilePath} = await saveFileFromLocalFS(dbInstance, path)
        if (!savedFilePath) return;
        addImageToUI(savedFileID, savedFilePath);
        inputBarRef.current?.focus();
        scrollViewRef.current?.scrollToEnd();
    };

    const addImageToUI = (id:number, uri: string, description: string = "...", source: 'user' | 'search' = 'user') => {
        setMessages(prev => [...prev, {localDBID:id, type: 'image', uri, description, source}]);
        setPinnedImageID(source === 'user' ? id : null);
    };

    const handleSendMessage = async (text: string) => {
        try {
            let context = llamaContext;
            if (!context) {
                const newContext = await initLlama();
                if (!newContext) return;
                context = newContext;
            }
            setMessages(prev => [...prev, {type: 'text', text, source: 'user'}]);
            await runEmbeddingSearch(text, context);
        } catch (err) {
            Alert.alert("Error During Inference", err instanceof Error ? err.message : "Unknown error");
        }
    };

    const runEmbeddingSearch = async (text: string, context: any) => {

        const result = await context.embedding(text);
        await context.embedding("");

        const foundServerDocuments = await searchServerDB(result.embedding, 1);

        if(foundServerDocuments && foundServerDocuments[0]) {

            const firstServerFile = foundServerDocuments[0];
            const fileExistsLocally = await doesFileExist(dbInstance, firstServerFile.server_id)

            if(!fileExistsLocally){
                const {savedFileID, savedFilePath} = await saveFileFromRemoteFS(dbInstance, firstServerFile);
                addImageToUI(savedFileID, savedFilePath, firstServerFile.description || "", 'search');
                return;
            }
        }

        if(!foundServerDocuments){
            const foundDocuments = await searchLocalDB(dbInstance, result.embedding);
            if (foundDocuments && foundDocuments[0]) {

                const firstLocalFile = foundDocuments[0];

                const confidence = (1.5 - Number(firstLocalFile.distance)) / 1.5 * 100;
                setMessages(prev => [
                    ...prev,
                    {type: 'text', text: `Found this document (${confidence.toFixed(1)}%): `, source: 'search'},
                ]);
                addImageToUI(firstLocalFile.local_id, firstLocalFile.image_url, firstLocalFile.description, 'search');
            } else {
                console.log("adding from local");
                setMessages(prev => [
                    ...prev,
                    {type: 'text', text: "Sorry, could not find any matching documents.", source: 'search'},
                ]);
            }
        }


    };

    const handleNewEmbedding = async (text: string) => {
        if (!llamaContext) {
            const ok = await initLlama();
            if (!ok) return;
        }
        if (pinnedImageID == null) return;

        setMessages(prev =>
            prev.map(msg =>
                msg.type === 'image' && msg.localDBID === pinnedImageID
                    ? {...msg, description: text}
                    : msg
            )
        );

        const result = await llamaContext.embedding(text);
        await updateMetadataLocalDB(dbInstance, pinnedImageID, null, text, result.embedding);
        setPinnedImageID(null)
    };

    return (
        <View style={{flex: 1, backgroundColor: colors.bgPrimary}}>
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
                                pinnedImageID={pinnedImageID}
                                onPress={() => {
                                    const id = msg.localDBID;
                                    setPinnedImageID(prev => (prev === id ? null : id));
                                    if (pinnedImageID !== id) {
                                        Keyboard.dismiss();
                                        setTimeout(() => inputBarRef.current?.focus(), 100);
                                        inputBarRef.current?.setText(msg.description);
                                    } else {
                                        inputBarRef.current?.setText("");
                                    }
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

            {__DEV__ && (
                <TouchableOpacity
                    onPress={() => {
                        void executeSQL(dbInstance, inputBarRef.current?.getText() || "")
                    }}
                >
                    <Text>Execute SQL</Text>
                </TouchableOpacity>
            )}
            <InputBar
                pinnedImageID={pinnedImageID}
                ref={inputBarRef}
                onPressAttachFiles={handlePaperclipPress}
                onRecordPressIn={handleRecordStart}
                onRecordPressOut={handleRecordStop}
                onPressSendMessage={async (text) => {
                    scrollViewRef.current?.scrollToEnd();
                    if (pinnedImageID) {
                        await handleNewEmbedding(text);
                    } else {
                        await handleSendMessage(text);
                    }
                    scrollViewRef.current?.scrollToEnd();
                }}
            />

            <PhotoPicker
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onPhotoSelected={handlePhotoSelected}
            />
        </View>
    );


}


export default ChatScreen;
