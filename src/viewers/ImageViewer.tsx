import React, {useState} from 'react';
import ImageViewing from 'react-native-image-viewing';
import ViewerTopBar from '../components/ViewerTopBar.tsx';
import ViewerBottomBar from "../components/ViewverBottomBar.tsx";
import {Image, TouchableOpacity} from "react-native";
import Icon from "@react-native-vector-icons/material-design-icons";
// import {Point} from "react-native-fast-opencv";
import {applyPerspectiveCrop} from '../api/perspectiveCrop.ts';

type Props = {
    uri: string;
    visible: boolean;
    onClose: () => void;
    onFileUpdated?: () => void;
};
type Point = {x: number; y: number};

export default function ImageViewer({uri, visible, onClose, onFileUpdated}: Props) {

    const [displayUri, setDisplayUri] = useState(uri);

    const testCrop = async () => {
        const corners: [Point, Point, Point, Point] = [
            {x: 250, y: 150},   // topLeft     — shifted right
            {x: 700, y: 50},    // topRight    — higher up
            {x: 750, y: 950},   // bottomRight
            {x: 50,  y: 1000},  // bottomLeft  — shifted left, lower
        ];
        const result = await applyPerspectiveCrop(uri, corners);
        if (result) {
            setDisplayUri(displayUri + '?t=' + Date.now());
            onFileUpdated?.();
        }
    };

    return (
        <ImageViewing

            images={[{uri: displayUri}]}
            imageIndex={0}
            visible={visible}
            onRequestClose={onClose}
            swipeToCloseEnabled={true}
            doubleTapToZoomEnabled={true}
            HeaderComponent={() => (
                <ViewerTopBar filePath={uri} fileType="image" onClose={onClose}/>
            )}
            FooterComponent={() => (
                <ViewerBottomBar>
                    <TouchableOpacity onPress={testCrop}>
                        <Icon name="crop" size={24} color="white" />
                    </TouchableOpacity>
                </ViewerBottomBar>
            )}
        />
    );
}