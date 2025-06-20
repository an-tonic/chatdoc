import {PermissionsAndroid, Platform, Alert} from 'react-native';


export async function requestCameraPermissions() {
    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
}
export async function requestStoragePermissions() {
    if (Platform.OS === 'android') {
        const permission =
            Platform.Version >= 33
                ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

        const granted = await PermissionsAndroid.request(permission);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
}