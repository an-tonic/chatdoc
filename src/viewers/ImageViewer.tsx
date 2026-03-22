import React, {useEffect, useState} from 'react';
import ImageViewing from 'react-native-image-viewing';
import ViewerTopBar from '../components/ViewerTopBar.tsx';
import ViewerBottomBar from "../components/ViewverBottomBar.tsx";
import {Image, TouchableOpacity} from "react-native";
import Icon from "@react-native-vector-icons/material-design-icons";
// import {Point} from "react-native-fast-opencv";
import {applyPerspectiveCrop} from './perspective_crop.ts';
import {Point} from "../types/types.ts";
import PerspectiveCropEditor from "./PerspectiveCropEditor.tsx";

type Props = {
    uri: string;
    visible: boolean;
    onClose: () => void;
    onFileUpdated?: () => void;
};

export default function ImageViewer({uri, visible, onClose, onFileUpdated}: Props) {

    const [displayUri, setDisplayUri] = useState(uri);
    const [cropEditorVisible, setCropEditorVisible] = useState(false);
    const [imgSize, setImgSize] = useState({width: 1, height: 1});
    useEffect(() => {
        if (visible) {
            Image.getSize(uri, (w, h) => setImgSize({width: w, height: h}));
        }
    }, [visible, uri]);

    return (
        <>
            <ImageViewing
                images={[{uri: displayUri}]}
                imageIndex={0}
                visible={visible}
                onRequestClose={onClose}
                swipeToCloseEnabled={true}
                doubleTapToZoomEnabled={true}
                HeaderComponent={() =>
                    <ViewerTopBar filePath={uri} fileType="image" onClose={onClose}/>
                }
                FooterComponent={() => (
                    <ViewerBottomBar>
                        <TouchableOpacity onPress={() => setCropEditorVisible(true)}>
                            <Icon name="crop" size={24} color="white"/>
                        </TouchableOpacity>
                    </ViewerBottomBar>
                )}


            />
            {cropEditorVisible && (
                <PerspectiveCropEditor
                    uri={displayUri}
                    onClose={() => setCropEditorVisible(false)}
                    imageWidth={imgSize.width}
                    imageHeight={imgSize.height}
                    onConfirm={async (corners) => {
                        setCropEditorVisible(false);
                        const success = await applyPerspectiveCrop(displayUri, corners);
                        if (success) {
                            setDisplayUri(uri + '?t=' + Date.now());
                            onFileUpdated?.();
                        }
                    }}
                />)}
        </>
    );
}