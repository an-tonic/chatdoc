import React from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {launchCamera} from 'react-native-image-picker';
import {keepLocalCopy, pick} from '@react-native-documents/picker';
import {requestCameraPermissions} from '../api/permissions.ts';

export type PickedFile = {
    path: string;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    onFileSelected: (file: PickedFile) => void;
};


export default function PhotoPicker({visible, onClose, onFileSelected}: Props) {

    const openCamera = async () => {
        onClose();
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) {
            Alert.alert('Permission denied');
            return;
        }
        const result = await launchCamera({mediaType: 'photo'});
        if (result.assets?.[0]?.uri) {
            onFileSelected({path: result.assets[0].uri});
        }
    };

    const openFiles = async () => {
        onClose();
        try {
            const [file] = await pick({type: ['image/*', 'application/pdf']});
            const [localCopy] = await keepLocalCopy({
                files: [{uri: file.uri, fileName: file.name ?? 'file'}],
                destination: 'documentDirectory',
            });
            if (localCopy.status === 'error' || !localCopy.localUri) {
                Alert.alert('Error', 'Could not copy file');
                return;
            }
            onFileSelected({path: localCopy.localUri});
        } catch (err: any) {
            if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
                Alert.alert('Error', err.message);
            }
        }
    };

    // noinspection RequiredAttributes
    return (
        <Modal isVisible={visible} onBackdropPress={onClose} style={{justifyContent: 'flex-end', margin: 0}}>
            <View style={{backgroundColor: 'white', padding: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
                <TouchableOpacity onPress={openCamera}
                                  style={{paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee'}}>
                    <Text style={{fontSize: 18, textAlign: 'center'}}>Take a Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openFiles} style={{paddingVertical: 15}}>
                    <Text style={{fontSize: 18, textAlign: 'center'}}>Choose from Files</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}