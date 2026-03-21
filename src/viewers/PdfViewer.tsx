import React, {useState} from 'react';
import {Modal, StyleSheet, Text, View} from 'react-native';
import Pdf from 'react-native-pdf';
import ViewerTopBar from '../components/ViewerTopBar.tsx';
import ViewerBottomBar from "../components/ViewverBottomBar.tsx";
// import ViewerBottomBar from './ViewerBottomBar.tsx';

type Props = {
    filePath: string;
    visible: boolean;
    onClose: () => void;
};

export default function PdfViewer({filePath, visible, onClose}: Props) {
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    return (
        <Modal
            visible={visible}
            transparent={false}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent={false}
        >
            <View style={styles.container}>
                <Pdf
                    source={{uri: filePath, cache: true}}
                    style={styles.pdf}
                    enablePaging={false}
                    trustAllCerts={false}
                    onPageChanged={(p, total) => {
                        setPage(p);
                        setTotalPages(total);
                    }}
                />
            </View>
            <ViewerTopBar filePath={filePath} fileType="pdf" onClose={onClose}/>

            <ViewerBottomBar>
                {totalPages > 0 && (
                    <Text style={styles.pageCount}>{page} / {totalPages}</Text>
                )}
            </ViewerBottomBar>

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
    pageCount: {
        color: '#fff',
        fontSize: 14,
    },
});