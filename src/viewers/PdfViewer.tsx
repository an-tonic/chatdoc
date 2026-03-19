import React from 'react';
import {Modal, StatusBar, StyleSheet, TouchableOpacity, View} from 'react-native';
import Pdf from 'react-native-pdf';
import Icon from '@react-native-vector-icons/material-design-icons';

type Props = {
    filePath: string;
    visible: boolean;
    onClose: () => void;
};

export default function PdfViewer({filePath, visible, onClose}: Props) {
    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                <Pdf
                    source={{uri: filePath, cache: true}}
                    style={styles.pdf}
                    enablePaging={false}
                    trustAllCerts={false}
                />
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={26} color="#fff"/>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222',
    },
    pdf: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: (StatusBar.currentHeight ?? 0) + 12,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 20,
        padding: 6,
    },
});