import React from 'react';
import {StyleSheet, View} from 'react-native';

type Props = {
    children: React.ReactNode;
};

export default function ViewerBottomBar({children}: Props) {
    return (
        <View style={styles.bottomBar}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 28,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
});