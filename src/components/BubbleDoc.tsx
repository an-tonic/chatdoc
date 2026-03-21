import {useState} from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {DocMessage, FileType} from '../types/types.ts';
import ImageViewer from '../viewers/ImageViewer.tsx';
import PdfViewer from '../viewers/PdfViewer.tsx';
import Icon from '@react-native-vector-icons/material-design-icons';
import {useStyles} from '../custom_hooks/useStyles.ts';
import {useTheme} from '../context/ThemeContext.tsx';

function getBadgeIcon(fileType: FileType): string | null {
    switch (fileType) {
        case 'image':
            return 'image-outline';
        case 'pdf':
            return 'file-pdf-box';
        case 'video':
            return 'play-circle';
    }
}

function openViewer(
    fileType: FileType,
    filePath: string,
    setImageViewerVisible: (v: boolean) => void,
    setPdfViewerVisible: (v: boolean) => void,
) {
    switch (fileType) {
        case 'image':
            setImageViewerVisible(true);
            break;
        case 'pdf':
            setPdfViewerVisible(true);
            break;
        case 'video':
            break;
    }
}

export default function BubbleDoc(props: {
    pinnedImageID: number | null,
    doc: DocMessage,
    onPress: () => void,
    onDocUpdated?: () => void
}) {
    const [imageViewerVisible, setImageViewerVisible] = useState(false);
    const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
    const styles = useStyles();
    const {colors} = useTheme();

    const badgeIcon = getBadgeIcon(props.doc.fileType);

    return (
        <>
            <View
                style={[
                    styles.imageBubble,
                    props.doc.source === 'search' ? styles.msgLeft : styles.msgRight,
                    props.pinnedImageID === props.doc.localDBID && styles.pinnedImageBubble,
                ]}
            >
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openViewer(
                        props.doc.fileType,
                        props.doc.filePath,
                        setImageViewerVisible,
                        setPdfViewerVisible,
                    )}
                >
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{uri: props.doc.thumbnailUri + '?t=' + props.doc.cacheKey}}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        {badgeIcon && (
                            <View style={styles.fileBadge}>
                                <Icon name={badgeIcon as any} size={20} color="#fff"/>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={props.onPress}>
                    <View style={styles.descriptionRow}>
                        <Text
                            style={[styles.imageDescription, {flex: 1}]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {props.doc.description ?? ''}
                        </Text>
                        <Icon name="pencil" size={18} color={colors.primary}/>
                    </View>
                </TouchableOpacity>
            </View>

            <ImageViewer
                uri={props.doc.thumbnailUri}
                visible={imageViewerVisible}
                onFileUpdated={() => props.onDocUpdated?.()}
                onClose={() => setImageViewerVisible(false)}
            />
            <PdfViewer
                filePath={props.doc.filePath}
                visible={pdfViewerVisible}
                onClose={() => setPdfViewerVisible(false)}
            />
        </>
    );
}