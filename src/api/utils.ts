import RNFS from "react-native-fs";

export const savePhotoToLocal = async (uri: string) => {
    const extension = uri.substring(uri.lastIndexOf(".") + 1);
    const destPath = `${RNFS.ExternalDirectoryPath}/photo_${Date.now()}.${extension}`;
    await RNFS.copyFile(uri, destPath);
    console.log(destPath)
    return destPath
};

export const savePDFToLocal = async (uri: string) => {
    const destPath = `${RNFS.ExternalDirectoryPath}/pdf_${Date.now()}.pdf`;
    await RNFS.copyFile(uri, destPath);
    return destPath
};