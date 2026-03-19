import ImageViewing from 'react-native-image-viewing';

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
        />
    );
}