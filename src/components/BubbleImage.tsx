import {useState} from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import {ImageMessage} from '../types/types.ts';
import ImageViewer from './ImageViewer.tsx';
import {useStyles} from "../custom_hooks/useStyles.ts";
import {useTheme} from "../context/ThemeContext.tsx";


export default function BubbleImage(props: {
    pinnedImageID: number | null;
    image: ImageMessage;
    onPress: () => void;
}) {
    const [viewerVisible, setViewerVisible] = useState(false);
    const styles = useStyles();
    const {colors} = useTheme();
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
                    </View>
                </TouchableOpacity>

                <TouchableOpacity  onPress={props.onPress}>
                    <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingTop: 4}}>
                        <Text
                            style={[styles.imageDescription, {flex: 1, paddingHorizontal: 0, paddingTop: 0}]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {props.image.description ?? ''}
                        </Text>
                        <Icon
                            name="pencil"
                            size={18}
                            color={colors.primaryMuted}
                        />

                    </View>
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