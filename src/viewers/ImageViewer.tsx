import React from 'react';
import ImageViewing from 'react-native-image-viewing';
import ViewerTopBar from '../components/ViewerTopBar.tsx';
import ViewerBottomBar from "../components/ViewverBottomBar.tsx";

type Props = {
    uri: string;
    visible: boolean;
    onClose: () => void;
};

export default function ImageViewer({uri, visible, onClose}: Props) {
    return (
        <ImageViewing
            images={[{uri}]}
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
                    {/* crop, rotate, transform etc. go here */}
                </ViewerBottomBar>
            )}
        />
    );
}