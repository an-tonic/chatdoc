import {Alert, Animated, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useEffect, useState} from 'react';
import {downloadModel} from "./src/api/model.ts";
import ProgressBar from "./src/components/ProgressBar.tsx";
import {initLlama, releaseAllLlama} from 'llama.rn';
import RNFS from 'react-native-fs';
import ScrollView = Animated.ScrollView; // File system module
import {DB, open} from '@op-engineering/op-sqlite';


import Icon from "@react-native-vector-icons/material-design-icons";


function App(): React.JSX.Element {



    useEffect(() => {
        const setupDb = async () => {
            const db = open({
                name: "documents.db",
                location: "../files/databases"
            });

            await db.execute(`
              CREATE VIRTUAL TABLE IF NOT EXISTS embeddings 
              USING vec0(embedding float[768], image_path TEXT, description TEXT);
            `);

            setDbInstance(db);

        };
        loadModel("nomic-embed-text-v1.5.Q8_0.gguf");
        setupDb();

        return () => {
            releaseAllLlama();
        };
    }, []);


    const model = "nomic-ai/nomic-embed-text-v1.5-GGUF";

    const [embeddingResult, setEmbeddingResult] = useState<string>('test');
    const [progress, setProgress] = useState<number>(0);
    const [context, setContext] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>('');
    const [dbInstance, setDbInstance] = useState<any>(null);

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

            console.log('Initializing llama...');
            const llamaContext = await initLlama({
                model: destPath,
                embedding: true,
            });
            console.log('Model loaded successfully');
            setContext(llamaContext);
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
            await context.embedding("");
            //insertEmbedding(db, result.embedding, "", text);
            await searchSimilarEmbedding(dbInstance, result.embedding);

        } catch (error) {

            Alert.alert(
                'Error During Inference',
                error instanceof Error ? error.message : 'An unknown error occurred.',
            );
        }
    };


    async function insertEmbedding(db: DB, embedding: number[], imagePath: string, description: string) {

        await db.execute(
            `INSERT INTO embeddings (embedding, image_path, description)
             VALUES (?, ?, ?)`,
            [JSON.stringify(embedding), imagePath, description]
        );
    }

    async function searchSimilarEmbedding(db: DB, embedding: number[], limit: number = 1) {


        const results = await db.execute(
            `SELECT description, distance
             FROM embeddings
             WHERE embedding MATCH ?
             ORDER BY distance LIMIT ?`,
            [JSON.stringify(embedding), limit]
        );
        const description = results.rows[0].description?.toString() || "";


        setEmbeddingResult(description);
    }


    return (
        <SafeAreaView style={{flex: 1}}>

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
                    <TouchableOpacity
                        onPress={() => handleSendMessage(inputText)}
                        style={styles.iconButton}
                        disabled={!context}>

                        <Icon name="send" size={32} color={context ? "#0b43d6" : "#8c8c8c"}/>
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
