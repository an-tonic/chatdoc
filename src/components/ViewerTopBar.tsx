import React from 'react';
import {Alert, StyleSheet, TouchableOpacity, View} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import {FileType} from '../types/types.ts';
import RNFS from "react-native-fs";
import Share from 'react-native-share';

const MIME_TYPES: Record<FileType, string> = {
    image: 'image/jpeg',
    pdf: 'application/pdf',
    video: 'video/mp4',
};

type Props = {
    filePath: string;
    fileType: FileType;
    onClose: () => void;
};

export default function ViewerTopBar({filePath, fileType, onClose}: Props) {

    const handleShare = async () => {
        try {
            const base64 = await RNFS.readFile(filePath.replace('file://', ''), 'base64');
            const mimeType = MIME_TYPES[fileType];
            await Share.open({
                url: `data:${mimeType};base64,${base64}`,
                type: mimeType,
                failOnCancel: false,
                useInternalStorage: true,
            }as any);
        } catch (err: any) {
            if (!err?.message?.includes('cancel')) Alert.alert('Share failed', err.message);
        }
    };

    return (
        <View style={styles.topBar}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
                <Icon name="close" size={24} color="#fff"/>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleShare}>
                <Icon name="share-variant" size={24} color="#fff"/>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    button: {
        padding: 12,
    },
});