import React, {useEffect, useState} from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import {SafeAreaView} from "react-native-safe-area-context";
import {styles} from "../styles/styles.ts";
import {downloadModel} from "../api/model.ts";
import ProgressBar from "../components/ProgressBar.tsx";
import {open} from "@op-engineering/op-sqlite";

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

    const embeddingModel = "nomic-ai/nomic-embed-text-v1.5-GGUF";
    const whisperModel = "ggerganov/whisper.cpp";

    const handleDownloadModel = async (model: string, file: string) => {
        const downloadUrl = `https://huggingface.co/${model}/resolve/main/${file}`;

        setIsDownloading(true);
        setProgress(0);

        try {
            const destPath = await downloadModel(file, downloadUrl, progress =>
                setProgress(progress),
            );

            if (destPath) {
                //await loadModel(file);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Download failed due to an unknown error.';
            Alert.alert('Error', errorMessage);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePurgeDatabase = () => {
        Alert.alert(
            'Confirm Deletion',
            'Are you sure you want to delete all embeddings?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dbInstance.execute(`DELETE FROM embeddings`);
                            Alert.alert('Success', 'All embeddings have been deleted.');
                        } catch (error) {
                            const errorMessage =
                                error instanceof Error
                                    ? error.message
                                    : 'Deletion failed due to an unknown error.';
                            Alert.alert('Error', errorMessage);
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
                <Text style={styles.buttonText}>Download Embed Model</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.defaultButton} onPress={() => {
                void handleDownloadModel(whisperModel, "ggml-large-v3.bin");
            }}>
                <Text style={styles.buttonText}>Download Whisper Model</Text>
            </TouchableOpacity>
            {isDownloading && <ProgressBar progress={progress}/>}

            <TouchableOpacity style={styles.dangerButton} onPress={() => {
                handlePurgeDatabase();
            }}>
                <Text style={styles.buttonText}>Purge Database</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

export default SettingsScreen;
