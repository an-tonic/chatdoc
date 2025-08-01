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

export async function requestRecordPermissions() {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {

                console.log('Recording permission granted');
                return true;
            } else {
                console.log('Recording permission denied');
                return false;
            }
        } catch (err) {
            console.warn(err);
            return false;
        }
    }
    return false;
}