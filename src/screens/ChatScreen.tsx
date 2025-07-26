import {Alert, Animated, Image, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useEffect, useState} from 'react';
import {releaseAllLlama} from 'llama.rn';
import {DB, open} from '@op-engineering/op-sqlite';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import PhotoPicker from "../components/PhotoPicker.tsx"; // File system module
import InputBar from "../components/InputBar.tsx";
import {savePhotoToLocal} from "../api/utils.ts";
import {styles} from "../styles/styles.ts";
import Icon from "@react-native-vector-icons/material-design-icons";
import {useNavigation} from "@react-navigation/native";
import {RootStackParamList} from "../navigation/types.ts";
import {NativeStackNavigationProp} from "@react-navigation/native-stack";
import {loadModel} from "../api/model.ts";
import ScrollView = Animated.ScrollView;

type Props = {
    onReady: () => void;
};

function ChatScreen({onReady}: Props) {


    useEffect(() => {
        const setup = async () => {

            const db = open({
                name: "documents.db",
                location: "../files/databases"
            });

            await db.execute(`
              CREATE VIRTUAL TABLE IF NOT EXISTS embeddings
              USING vec0(embedding float[768], image_path TEXT, description TEXT);
            `);
            setDbInstance(db);

            const newContext = await loadModel("nomic-embed-text-v1.5.Q8_0.gguf", context);
            setContext(newContext);
            onReady();
        };

        void setup();

        return () => {
            void releaseAllLlama();
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


    type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

    const navigation = useNavigation<NavigationProp>();


    const [context, setContext] = useState<any>(null);
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
        setImages(prev => [...prev, {uri: uri, description: ""}]);
    };

    const handleSendMessage = async (text: string) => {
        if (!context) {
            Alert.alert('Model Not Loaded', 'Please load the model first.');
            return;
        }

        try {
            const result = await context.embedding(text);
            await context.embedding("");
            await searchSimilarEmbedding(dbInstance, result.embedding);
        } catch (error) {
            Alert.alert(
                'Error During Inference',
                error instanceof Error ? error.message : 'An unknown error occurred.',
            );
        }
    };

    const handleNewEmbedding = async (text: string) => {
        if (!context) {
            Alert.alert('Model Not Loaded', 'Please load the model first.');
            return;
        }
        const result = await context.embedding(text);
        console.log(pinnedImage);
        const imageUri = pinnedImage || "Not Found";
        // await insertEmbedding(dbInstance, result.embedding, imageUri, text);
        await updateEmbeddingByPath(dbInstance, imageUri, result.embedding, text);

        setImages(prev =>
            prev.map(img =>
                img.uri === pinnedImage
                    ? {...img, description: text}
                    : img
            )
        );
    };


    async function insertEmbedding(db: DB, embedding: number[], imagePath: string, description: string) {

        await db.execute(
            `INSERT INTO embeddings (embedding, image_path, description)
             VALUES (?, ?, ?)`,
            [JSON.stringify(embedding), imagePath, description]
        );

    }

    async function updateEmbeddingByPath(
        db: DB,
        imagePath: string,
        newEmbedding: number[],
        newDescription: string
    ) {
        await db.execute(
            `UPDATE embeddings
             SET embedding = ?,
                 description = ?
             WHERE image_path = ?`,
            [JSON.stringify(newEmbedding), newDescription, imagePath]
        );
        const results = await db.execute(
            `SELECT *
             FROM embeddings
            `
        );
        console.log(results.rows);
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
                        <View style={styles.imageWrapper}>
                            <Image
                                source={{uri}}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            {pinnedImage === uri && (
                                <View style={styles.pinIconOverlay}>
                                    <Icon name="pin-outline" size={20} color="#0b43d6"/>
                                </View>
                            )}
                        </View>

                        <Text
                            style={styles.imageDescription}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {description ?? ''}
                        </Text>
                    </TouchableOpacity>

                ))}

            </ScrollView>


            <InputBar
                value={inputText}
                onChangeText={setInputText}
                onPressAttachFiles={handlePaperclipPress}
                onPressSendMessage={async () => {
                    if (pinnedImage) {
                        await handleNewEmbedding(inputText);
                    } else {
                        await handleSendMessage(inputText);
                    }
                }}
                context={context}
            />


            <PhotoPicker
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onPhotoSelected={handlePhotoSelected}
            />
        </SafeAreaView>
    );


}


export default ChatScreen;
