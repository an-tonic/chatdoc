import RNFS from "react-native-fs";
import {Alert} from "react-native";
import {initLlama, releaseAllLlama} from "llama.rn";
import {initWhisper, releaseAllWhisper} from 'whisper.rn';
import {showModelNotice} from "../../App.tsx";

export const downloadModel = async (
    modelName: string,
    modelUrl: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
    try {
        if (!modelName || !modelUrl) {
            throw new Error('Invalid model name or URL');
        }

        const fileExists = await RNFS.exists(destPath);
        if (fileExists) {
            await RNFS.unlink(destPath);
            console.log(`Deleted existing file at ${destPath}`);
        }

        console.log("Starting download from:", modelUrl);
        const downloadResult = await RNFS.downloadFile({
            fromUrl: modelUrl,
            toFile: destPath,
            progressDivider: 5,
            begin: (res) => {
                console.log("Download started:", res);
            },
            progress: ({bytesWritten, contentLength}: { bytesWritten: number; contentLength: number }) => {
                const progress = (bytesWritten / contentLength) * 100;
                console.log("Download progress:", progress);
                onProgress(Math.floor(progress));
            },
        }).promise;

        if (downloadResult.statusCode === 200) {
            return destPath;
        } else {
            throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
        }
    } catch (error) {
        throw new Error(`Failed to download model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


export const loadLlamaModel = async (modelName: string, context: any) => {

    try {
        const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
        const fileExists = await RNFS.exists(destPath);

        if (!fileExists) {
            showModelNotice?.('Before continuing, download the Llama model. Tap here to open settings.');
            return null;
        }

        if (context) {
            await releaseAllLlama();
            return null
        }

        console.log('Initializing llama...');
        const llamaContext = await initLlama({
            model: destPath,
            embedding: true,
        });
        console.log('Model loaded successfully');
        return llamaContext;
    } catch (error) {
        showModelNotice?.(`Error loading Llama! ${error instanceof Error ? error.message : 'An unknown error occurred.'}. Try re-downloading the model.`);
        // Alert.alert('Error Llama Loading Model', error instanceof Error ? error.message : 'An unknown error occurred.');
        return null;
    }
};


export const loadWhisperModel = async (modelName: string, context: any) => {

    try {
        const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
        const fileExists = await RNFS.exists(destPath);

        if (!fileExists) {
            showModelNotice?.('Before continuing, download the Whisper model. Tap here to open settings.');
            return null;
        }


        if (context) {
            await releaseAllWhisper();
            return null
        }

        console.log('Initializing Whisper...');
        const whisperContext = await initWhisper({
            filePath: destPath
        });

        console.log('Model loaded successfully', whisperContext);
        return whisperContext;
    } catch (error) {
        showModelNotice?.(`Error loading Whisper! ${error instanceof Error ? error.message : 'An unknown error occurred.'}. Try re-downloading the model.`);
        // Alert.alert('Error Loading Whisper Model', error instanceof Error ? error.message : 'An unknown error occurred.');
        return null;
    }
};