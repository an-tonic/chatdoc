import {
    Alert,
    Animated,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {useEffect, useState} from 'react';
import {initLlama, releaseAllLlama} from 'llama.rn';
import RNFS from 'react-native-fs';
import {DB, open} from '@op-engineering/op-sqlite';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import PhotoPicker from "./src/components/PhotoPicker.tsx";
import InputBar from "./src/components/InputBar.tsx";
import {savePhotoToLocal} from "./src/api/utils.ts";
import {downloadModel} from "./src/api/model.ts";
import ProgressBar from "./src/components/ProgressBar.tsx";
import ScrollView = Animated.ScrollView;
import {styles} from "./src/styles/styles.ts";
import Icon from "@react-native-vector-icons/material-design-icons"; // File system module


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

    useEffect(() => {
        ReceiveSharingIntent.getReceivedFiles(async (files: any) => {

                const savedPath = await savePhotoToLocal(files[0].contentUri)
                addImage(savedPath)
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


    const model = "nomic-ai/nomic-embed-text-v1.5-GGUF";


    const [progress, setProgress] = useState<number>(0);
    const [context, setContext] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [inputText, setInputText] = useState<string>('');
    const [dbInstance, setDbInstance] = useState<any>(null);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [images, setImages] = useState<{ uri: string; description?: string }[]>([]);
    const [pinnedImage, setPinnedImage] = useState<string | null>(null);

    const handlePaperclipPress = () => setPickerVisible(true);

    const handlePhotoSelected = (path: string) => {
        console.log('Photo saved at:', path);
        addImage(path);
    };

    const addImage = (path: string) => {
        const uri = path.startsWith('file://') ? path : `file://${path}`;
        setImages(prev => [...prev, {uri: `file://${path}`, description: ""}]);
    };

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
            setImages(prev =>
                prev.map(img =>
                    img.uri === pinnedImage
                        ? {...img, description: text}
                        : img
                )
            );
            const result = await context.embedding(text);

            await context.embedding("");
            //insertEmbedding(dbInstance, result.embedding, "", text);
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

        if (results.rows.length > 0) {
            const description = results.rows[0].description?.toString() || "";
        }

    }


    return (
        <SafeAreaView style={{flex: 1}}>

            <TouchableOpacity style={styles.button} onPress={() => {
                handleDownloadModel("nomic-embed-text-v1.5.Q8_0.gguf");
            }}>
                <Text style={styles.buttonText}>Download Model</Text>
            </TouchableOpacity>

            {isDownloading && <ProgressBar progress={progress}/>}

            <ScrollView contentContainerStyle={styles.chatContainer}>
                {images.map(({uri, description}, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.imageBubble,
                            pinnedImage === uri && styles.pinnedImageBubble
                        ]}
                        onPress={() => {
                            setPinnedImage(prev => (prev === uri ? null : uri));
                            if (description) {
                                setInputText(description);
                            }
                        }}
                    >
                        <Animated.Image
                            source={{uri}}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        {pinnedImage === uri && (
                            <View style={styles.pinIconOverlay}>
                                <Icon name="pin-outline" size={20} color="#0b43d6"/>
                            </View>
                        )}
                        <Text style={styles.imageDescription}>
                            {(description ?? '').length > 38
                                ? `${description?.slice(0, 38)}...`
                                : description ?? ''}
                        </Text>



                    </TouchableOpacity>
                ))}

            </ScrollView>


            <InputBar
                value={inputText} onChangeText={setInputText} onPressAttachFiles={handlePaperclipPress}
                onPressSendMessage={() => handleSendMessage(inputText)} context={context}/>
            <PhotoPicker
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onPhotoSelected={handlePhotoSelected}
            />
        </SafeAreaView>
    );


}


export default App;
