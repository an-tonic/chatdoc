import React from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';
import Modal from 'react-native-modal';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {requestCameraPermissions, requestStoragePermissions} from "../api/permissions.ts";
import {DB} from "@op-engineering/op-sqlite";

type Props = {
    visible: boolean;
    onClose: () => void;
    onPhotoSelected: (filePath: string) => void;
    db: DB;
};


export default function PhotoPicker({visible, onClose, onPhotoSelected, db}: Props) {
    const openCamera = async () => {
        onClose();
        const hasPermission = await requestCameraPermissions();
        if (!hasPermission) {
            Alert.alert('Permission denied');
            return;
        }
        const result = await launchCamera({mediaType: 'photo'});
        if (result.assets?.[0]?.uri) {
            onPhotoSelected(result.assets[0].uri);
        }
    };

    const openGallery = async () => {
        onClose();
        const hasPermission = await requestStoragePermissions();
        if (!hasPermission) {
            Alert.alert('Permission denied');
            return;
        }
        const result = await launchImageLibrary({mediaType: 'photo'});
        if (result.assets?.[0]?.uri) {

            onPhotoSelected(result.assets[0].uri);
        }
    };

    return (
        <Modal isVisible={visible} onBackdropPress={onClose} style={{justifyContent: 'flex-end', margin: 0}}>
            <View style={{backgroundColor: 'white', padding: 20, borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
                <TouchableOpacity onPress={openCamera}
                                  style={{paddingVertical: 15, borderBottomWidth: 1, borderColor: '#eee'}}>
                    <Text style={{fontSize: 18, textAlign: 'center'}}>Take a Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openGallery} style={{paddingVertical: 15}}>
                    <Text style={{fontSize: 18, textAlign: 'center'}}>Choose from Gallery</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}
