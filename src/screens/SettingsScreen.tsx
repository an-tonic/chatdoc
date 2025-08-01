import React, {useEffect, useState} from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import {SafeAreaView} from "react-native-safe-area-context";
import {styles} from "../styles/styles.ts";
import {downloadModel} from "../api/model.ts";
import ProgressBar from "../components/ProgressBar.tsx";
import {open} from "@op-engineering/op-sqlite";
import {getLocale, setLocale, t} from '../languages/i18n';

function SettingsScreen() {


    useEffect(() => {
        const setup = async () => {

            const db = open({
                name: "documents.db",
                location: "../files/databases"
            });
            setDbInstance(db);
        };
        void setup();
    }, []);

    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [dbInstance, setDbInstance] = useState<any>(null);
    const [language, setLanguage] = useState(getLocale());



    const embeddingModel = "nomic-ai/nomic-embed-text-v1.5-GGUF";
    const whisperModel = "ggerganov/whisper.cpp";

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'ru' : 'en';
        setLanguage(newLang);
        setLocale(newLang);
    };

    const handleDownloadModel = async (model: string, file: string) => {
        const downloadUrl = `https://huggingface.co/${model}/resolve/main/${file}`;

        setIsDownloading(true);
        setProgress(0);

        try {
            await downloadModel(file, downloadUrl, progress =>
                setProgress(progress),
            );

            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : t('downloadFailed');
            Alert.alert(t('error'), errorMessage);
            return false;
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePurgeDatabase = () => {
        Alert.alert(
            t('confirmDeletion'),
            t('confirmDeletionMessage'),
            [
                {
                    text: t('cancel'),
                    style: 'cancel',
                },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dbInstance.execute(`DELETE FROM embeddings`);
                            Alert.alert(t('success'), t('embeddingsDeleted'));
                        } catch (error) {
                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : t('deletionFailed');
                            Alert.alert(t('error'), errorMessage);
                        }
                    },
                },
            ]
        );
    };


    return (
        <SafeAreaView style={{flex: 1, padding: 20}}>

            <TouchableOpacity style={styles.defaultButton} onPress={() => {
                void handleDownloadModel(embeddingModel, "nomic-embed-text-v1.5.Q8_0.gguf");
            }}>
                <Text style={styles.buttonText}>{t('downloadEmbedModel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.defaultButton} onPress={() => {
                void handleDownloadModel(whisperModel, "ggml-tiny.bin");

            }}>
                <Text style={styles.buttonText}>{t('downloadWhisperModel')}</Text>
            </TouchableOpacity>
            {isDownloading && <ProgressBar progress={progress}/>}

            <TouchableOpacity style={styles.dangerButton} onPress={() => {
                handlePurgeDatabase();
            }}>
                <Text style={styles.buttonText}>{t('purgeDatabase')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.defaultButton} onPress={toggleLanguage}>
                <Text style={styles.buttonText}>
                    {language === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
                </Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
}

export default SettingsScreen;
