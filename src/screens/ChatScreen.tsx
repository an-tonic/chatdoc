import {Alert, Animated, Keyboard, ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {useEffect, useRef, useState} from 'react';
import {releaseAllLlama} from 'llama.rn';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import PhotoPicker, {PickedFile} from '../components/PhotoPicker.tsx';
import InputBar, {InputBarHandle} from '../components/InputBar.tsx';
import {
    doesFileExist,
    saveFileFromLocalFS,
    saveFileFromRemoteFS,
    searchLocalDB,
    searchServerDB,
    updateMetadataLocalDB,
} from '../api/utils.ts';
import {loadLlamaModel, loadWhisperModel} from '../api/model.ts';
import DocBubble from '../components/BubbleDoc.tsx';
import {releaseAllWhisper} from 'whisper.rn';
import {checkRecordPermissions, requestRecordPermissions} from '../api/permissions.ts';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import {t} from '../languages/i18n';
import {BarIndicator} from 'react-native-indicators';
import {executeSQL} from '../api/dev_utils.ts';
import {useDB} from '../context/DBContext.tsx';
import {DocMessage} from '../types/types.ts';
import {generateThumbnail, getFileType} from '../api/file_utils.ts';
import {useStyles} from '../custom_hooks/useStyles.ts';
import {useTheme} from '../context/ThemeContext.tsx';

type Message =
    | { type: 'text'; text: string; source: 'user' | 'search' }
    | DocMessage
    | { type: 'loading'; source: 'user' | 'search' };


function ChatScreen() {
    console.log('ChatScreen Rendered!');
    const styles = useStyles();
    const {colors} = useTheme();
    const inputBarRef = useRef<InputBarHandle>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [llamaContext, setLlamaContext] = useState<any>(null);
    const [whisperContext, setWhisperContext] = useState<any>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [pinnedDocID, setPinnedDocID] = useState<number | null>(null);
    const [showScrollDownButton, setShowScrollDownButton] = useState(false);

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
                        await handleFileSelected({path: files[0].filePath});
                    }
                },
                (error: any) => console.log(error),
                'ShareMedia',
            );
        } catch (err) {
            console.log('ReceiveSharingIntent error', err);
        }
        return () => ReceiveSharingIntent.clearReceivedFiles();
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
        const newLlamaContext = await loadLlamaModel('nomic-embed-text-v1.5.Q8_0.gguf', llamaContext);
        if (!newLlamaContext) return null;
        setLlamaContext(newLlamaContext);
        return newLlamaContext;
    };

    const initWhisper = async () => {
        const newWhisperContext = await loadWhisperModel('ggml-tiny.bin', whisperContext);
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
            if (stat.size <= 44) {
                setMessages(prev => [...prev, {type: 'text', text: t('tooShortAudio'), source: 'search'}]);
                return;
            }
            let context = whisperContext;
            if (!context) {
                context = await initWhisper();
                if (!context) return;
                setWhisperContext(context);
            }

            if (!pinnedDocID) {
                setMessages(prev => [...prev, {type: 'loading', source: 'user'}]);
            }
            const {promise} = context.transcribe(internalPath, {language: 'en'});
            let {result} = await promise;
            result = result.trim();

            if (result === '[BLANK_AUDIO]' || result === '[INAUDIBLE]') {
                substituteLastMessage(t('badAudioMessage'));
            } else {
                if (pinnedDocID) {
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
        } catch (err) {
            console.warn('Failed to process recording', err);
            setMessages(prev => [...prev, {type: 'text', text: t('badAudioMessage'), source: 'search'}]);
        } finally {
            RNFS.unlink(internalPath).catch(() => {});
        }
    };

    const substituteLastMessage = (text: string) => {
        setMessages(prev => [...prev.slice(0, -1), {type: 'text', text, source: 'search'}]);
    };

    // --- core file handler ---
    const handleFileSelected = async (file: PickedFile) => {
        const {savedFileID, savedFilePath} = await saveFileFromLocalFS(dbInstance, file.path);
        if (!savedFilePath) return;

        const fileType = getFileType(savedFilePath);
        const thumbnailUri = await generateThumbnail(savedFilePath, fileType);

        addDocToUI(savedFileID, savedFilePath, thumbnailUri, fileType);
        Keyboard.dismiss();
        setTimeout(() => inputBarRef.current?.focus(), 50);
        scrollViewRef.current?.scrollToEnd();
    };

    const addDocToUI = (
        id: number,
        filePath: string,
        thumbnailUri: string,
        fileType = getFileType(filePath),
        description: string = '...',
        source: 'user' | 'search' = 'user',
    ) => {
        setMessages(prev => [...prev, {
            type: 'doc',
            localDBID: id,
            filePath,
            thumbnailUri,
            fileType,
            description,
            source,
        }]);
        setPinnedDocID(source === 'user' ? id : null);
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
            Alert.alert('Error During Inference', err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const runEmbeddingSearch = async (text: string, context: any) => {
        const result = await context.embedding(text);
        await context.embedding('');

        const foundServerDocuments = await searchServerDB(result.embedding, 1);

        if (foundServerDocuments && foundServerDocuments[0]) {
            const firstServerFile = foundServerDocuments[0];
            const fileExistsLocally = await doesFileExist(dbInstance, firstServerFile.server_id);
            if (!fileExistsLocally) {
                const {savedFileID, savedFilePath} = await saveFileFromRemoteFS(dbInstance, firstServerFile);
                const fileType = getFileType(savedFilePath);
                const thumbnailUri = await generateThumbnail(savedFilePath, fileType);
                addDocToUI(savedFileID, savedFilePath, thumbnailUri, fileType, firstServerFile.description || '', 'search');
                return;
            }
        }

        if (!foundServerDocuments) {
            const foundDocuments = await searchLocalDB(dbInstance, result.embedding);
            if (foundDocuments && foundDocuments[0]) {
                const firstLocalFile = foundDocuments[0];
                const confidence = (1.5 - Number(firstLocalFile.distance)) / 1.5 * 100;
                setMessages(prev => [
                    ...prev,
                    {type: 'text', text: `Found this document (${confidence.toFixed(1)}%): `, source: 'search'},
                ]);
                const fileType = getFileType(firstLocalFile.image_url);
                const thumbnailUri = await generateThumbnail(firstLocalFile.image_url, fileType);
                addDocToUI(firstLocalFile.local_id, firstLocalFile.image_url, thumbnailUri, fileType, firstLocalFile.description, 'search');
            } else {
                setMessages(prev => [
                    ...prev,
                    {type: 'text', text: 'Sorry, could not find any matching documents.', source: 'search'},
                ]);
            }
        }
    };

    const handleNewEmbedding = async (text: string) => {
        if (!llamaContext) {
            const ok = await initLlama();
            if (!ok) return;
        }
        if (pinnedDocID == null) return;

        setMessages(prev =>
            prev.map(msg =>
                msg.type === 'doc' && msg.localDBID === pinnedDocID
                    ? {...msg, description: text}
                    : msg,
            ),
        );

        const result = await llamaContext.embedding(text);
        await updateMetadataLocalDB(dbInstance, pinnedDocID, null, text, result.embedding);
        setPinnedDocID(null);
    };

    return (
        <View style={{flex: 1, backgroundColor: colors.bgPrimary}}>
            <Animated.ScrollView
                contentContainerStyle={styles.chatContainer}
                ref={scrollViewRef}
                onScroll={event => {
                    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
                    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
                    setShowScrollDownButton(!isAtBottom);
                }}
                scrollEventThrottle={30}
            >
                {messages.length === 0 && <Text style={styles.welcomeText}>{t('welcomeText')}</Text>}

                {messages.map((msg, index) => {
                    if (msg.type === 'doc') {
                        return (
                            <DocBubble
                                key={index}
                                doc={msg}
                                pinnedImageID={pinnedDocID}
                                onPress={() => {
                                    const id = msg.localDBID;
                                    setPinnedDocID(prev => (prev === id ? null : id));
                                    if (pinnedDocID !== id) {
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
                            <View key={index} style={[styles.textBubble, msg.source === 'search' ? styles.msgLeft : styles.msgRight]}>
                                <Text style={styles.textMessage}>{msg.text}</Text>
                            </View>
                        );
                    } else if (msg.type === 'loading') {
                        return (
                            <View key={index} style={[styles.textBubble, msg.source === 'search' ? styles.msgLeft : styles.msgRight, {height: 41.5}]}>
                                <BarIndicator count={15} size={10}/>
                            </View>
                        );
                    }
                    return null;
                })}
            </Animated.ScrollView>

            {showScrollDownButton && (
                <View style={styles.scrollDownButton}>
                    <Text
                        onPress={() => scrollViewRef.current?.scrollToEnd({animated: true})}
                        style={styles.scrollDownText}>↓</Text>
                </View>
            )}

            {__DEV__ && (
                <TouchableOpacity onPress={() => void executeSQL(dbInstance, inputBarRef.current?.getText() || '')}>
                    <Text>Execute SQL</Text>
                </TouchableOpacity>
            )}

            <InputBar
                ref={inputBarRef}
                isDocPinned={pinnedDocID !== null}
                onPressAttachFiles={handlePaperclipPress}
                onRecordPressIn={handleRecordStart}
                onRecordPressOut={handleRecordStop}
                onPressSendMessage={async (text) => {
                    scrollViewRef.current?.scrollToEnd();
                    if (pinnedDocID) {
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
                onFileSelected={handleFileSelected}
            />
        </View>
    );
}

export default ChatScreen;