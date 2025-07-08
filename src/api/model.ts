import RNFS from "react-native-fs";
import {Alert} from "react-native";
import {initLlama, releaseAllLlama} from "llama.rn";

export const downloadModel = async (
    modelName: string,
    modelUrl: string,
    onProgress: (progress: number) => void
): Promise<string> => {
    const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
    try {
        // Check if the destination path is valid
        if (!modelName || !modelUrl) {
            throw new Error('Invalid model name or URL');
        }

        const fileExists = await RNFS.exists(destPath);

        // If it exists, delete it
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
            progress: ({ bytesWritten, contentLength }: { bytesWritten: number; contentLength: number }) => {
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


export const loadModel = async (modelName: string, context: any) => {

    try {
        const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;
        const fileExists = await RNFS.exists(destPath);

        if (!fileExists) {
            Alert.alert('Error Loading Model', 'The model file does not exist.');
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
        Alert.alert('Error Loading Model', error instanceof Error ? error.message : 'An unknown error occurred.');
        return null;
    }
};