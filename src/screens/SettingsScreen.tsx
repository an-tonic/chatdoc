import React, {useState} from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {SafeAreaView} from "react-native-safe-area-context";
import {styles} from "../styles/styles.ts";
import {downloadModel} from "../api/model.ts";
import RNFS from "react-native-fs";
import {initLlama, releaseAllLlama} from "llama.rn";
import ProgressBar from "../components/ProgressBar.tsx";

function SettingsScreen() {


    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);

    const model = "nomic-ai/nomic-embed-text-v1.5-GGUF";
    const navigation = useNavigation();

    const handleDownloadModel = async (file: string) => {
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


    return (
        <SafeAreaView style={{ flex: 1, padding: 20 }}>

            <TouchableOpacity style={styles.button} onPress={() => {
                handleDownloadModel("nomic-embed-text-v1.5.Q8_0.gguf");
            }}>
                <Text style={styles.buttonText}>Download Model</Text>
            </TouchableOpacity>
            {isDownloading && <ProgressBar progress={progress}/>}
        </SafeAreaView>
    );
}

export default SettingsScreen;
