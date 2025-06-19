import React, {useEffect, useRef} from 'react';
import {Alert, Animated, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useState} from 'react';
import {downloadModel} from "./src/api/model.ts";
import ProgressBar from "./src/components/ProgressBar.tsx";
import {initLlama, releaseAllLlama} from 'llama.rn';
import RNFS from 'react-native-fs';
import ScrollView = Animated.ScrollView; // File system module
import {open} from '@op-engineering/op-sqlite';


import Icon from "@react-native-vector-icons/material-design-icons";


function App(): React.JSX.Element {

    const db = open({
        name: "documents.db",
        location: "../files/databases"
    });

    db.execute(`
      CREATE VIRTUAL TABLE IF NOT EXISTS embeddings 
      USING vec0(embedding float[768], image_path TEXT, description TEXT);
    `);

    function insertEmbedding(db: any, embedding: number[], imagePath: string, description: string) {
        console.debug('inserting embedding');
        db.execute(
            `INSERT INTO embeddings (embedding, image_path, description)
             VALUES (?, ?, ?)`,
            [JSON.stringify(embedding), imagePath, description]
        );
        printDb()
    }

    const printDb = async () => {

        const result = await db.execute("SELECT * FROM embeddings");
        console.log("result", result.rows);
    };


    const model = "nomic-ai/nomic-embed-text-v1.5-GGUF";

    const [embeddingResult, setEmbeddingResult] = useState<string>('test');
    const [progress, setProgress] = useState<number>(0);
    const [context, setContext] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>('');

    const handleDownloadModel = async (file: string) => {
        const downloadUrl = `https://huggingface.co/${model}/resolve/main/${file}`;

        setIsDownloading(true);
        setProgress(0);

        try {
            const destPath = await downloadModel(file, downloadUrl, progress =>
                setProgress(progress),
            );

            if (destPath) {
                await loadModel(file);
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

    const loadModel = async (modelName: string) => {

        try {

            const destPath = `${RNFS.DocumentDirectoryPath}/${modelName}`;

            const fileExists = await RNFS.exists(destPath);
            if (!fileExists) {
                Alert.alert('Error Loading Model', 'The model file does not exist.');
                return null;
            }

            if (context) {
                await releaseAllLlama();
                setContext(null);
            }

            const llamaContext = await initLlama({
                model: destPath,

                embedding: true,
            });

            setContext(llamaContext);
            console.log("llamaContext set");

            return llamaContext;
        } catch (error) {
            Alert.alert('Error Loading Model', error instanceof Error ? error.message : 'An unknown error occurred.');
            return null;
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!context) {
            Alert.alert('Model Not Loaded', 'Please load the model first.');
            return;
        }

        try {

            const result = await context.embedding(text);
            console.log(result)
            setEmbeddingResult(result.embedding);
            await context.embedding("");
            insertEmbedding(db, result.embedding, "", text);

        } catch (error) {

            Alert.alert(
                'Error During Inference',
                error instanceof Error ? error.message : 'An unknown error occurred.',
            );
        }
    };


    function cosineSimilarity(a: number[], b: number[]) {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }


    return (
        <SafeAreaView style={{flex: 1}}>

            <TouchableOpacity style={styles.button} onPress={() => loadModel("nomic-embed-text-v1.5.Q8_0.gguf")}>
                <Text style={styles.buttonText}>Load Model</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => {
                handleDownloadModel("nomic-embed-text-v1.5.Q8_0.gguf");
            }}>
                <Text style={styles.buttonText}>Download Model</Text>
            </TouchableOpacity>

            {isDownloading && <ProgressBar progress={progress}/>}

            <ScrollView><Text>{embeddingResult}</Text> </ScrollView>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    value={inputText}
                    onChangeText={setInputText}
                />
                <TouchableOpacity onPress={() => {
                }} style={styles.iconButton}>
                    <Icon name="paperclip" size={24} color="#818181"/>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                }} style={styles.iconButton}>
                    <Icon name="microphone-outline" size={24} color="#818181"/>
                </TouchableOpacity>

                {inputText.length > 0 && (
                    <TouchableOpacity onPress={() => handleSendMessage(inputText)} style={styles.iconButton}>
                        <Icon name="send" size={32} color="#0b43d6"/>
                    </TouchableOpacity>
                )}

            </View>
        </SafeAreaView>
    );


}


const styles = StyleSheet.create({
    container: {padding: 20},

    button: {
        backgroundColor: '#007AFF',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 0,
        borderWidth: 0,
        overflow: 'hidden',
    },

    input: {
        flex: 1,
        padding: 10,
        paddingLeft: 20,
        fontSize: 18
    },

    iconButton: {
        backgroundColor: 'rgba(0,0,0,0)',
        paddingHorizontal: 10,
        justifyContent: 'center',
        alignItems: 'center',
    }


});


export default App;
