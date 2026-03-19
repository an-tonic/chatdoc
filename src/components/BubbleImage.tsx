import {useState} from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {styles} from '../styles/styles.ts';
import Icon from '@react-native-vector-icons/material-design-icons';
import {ImageMessage} from '../types/types.ts';
import ImageViewer from './ImageViewer.tsx';


export default function BubbleImage(props: {
    pinnedImageID: number | null;
    image: ImageMessage;
    onPress: () => void;
}) {
    const [viewerVisible, setViewerVisible] = useState(false);

    return (
        <>
            <View
                style={[
                    styles.imageBubble,
                    props.image.source === 'search' ? styles.msgLeft : styles.msgRight,
                    props.pinnedImageID === props.image.localDBID && styles.pinnedImageBubble,
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setViewerVisible(true)}
                >
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{uri: props.image.uri}}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        {props.pinnedImageID === props.image.localDBID && (
                            <View style={styles.pinIconOverlay}>
                                <Icon name="pin-outline" size={20} color="#0b43d6"/>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity  onPress={props.onPress}>
                    <Text
                        style={styles.imageDescription}
                        numberOfLines={2}
                        ellipsizeMode="tail"
                    >
                        {props.image.description ?? ''}
                    </Text>
                    <Icon
                        name="pencil"
                        size={18}
                        color={"#0b43d6"}
                    />
                </TouchableOpacity>
            </View>

            <ImageViewer
                uri={props.image.uri}
                visible={viewerVisible}
                onClose={() => setViewerVisible(false)}
            />
        </>
    );
}