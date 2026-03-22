import React, {useRef, useState} from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
    PixelRatio,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import Svg, {Line} from 'react-native-svg';

const W = Dimensions.get('window').width;
const H = Dimensions.get('window').height;
const R = 22;

type Point = { x: number; y: number };

type Props = {
    uri: string;
    onClose: () => void;
    onConfirm: (corners: [Point, Point, Point, Point]) => void;
    imageWidth: number;
    imageHeight: number;
};

const defaults = (): [Point, Point, Point, Point] => [
    {x: W * 0.1, y: H * 0.15},
    {x: W * 0.9, y: H * 0.15},
    {x: W * 0.9, y: H * 0.85},
    {x: W * 0.1, y: H * 0.85},
];

const AnimatedLine = Animated.createAnimatedComponent(Line);

export default function PerspectiveCropEditor({uri, onClose, onConfirm, imageWidth, imageHeight}: Props) {

    const def = useRef(defaults()).current;
    const [imageLayout, setImageLayout] = useState({x: 0, y: 0, width: 0, height: 0});
    console.log("rendered");
    const pans = useRef(def.map(() => new Animated.ValueXY())).current;

    const abs = useRef(pans.map((pan, i) => ({
        x: Animated.add(pan.x, new Animated.Value(def[i].x)),
        y: Animated.add(pan.y, new Animated.Value(def[i].y)),
    }))).current;

    const responders = useRef(pans.map(pan => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {useNativeDriver: false}),
        onPanResponderRelease: () => pan.extractOffset(),
    }))).current;

    const handleConfirm = () => {
        const sx = (imageWidth * PixelRatio.get()) / imageLayout.width;
        const sy = (imageHeight * PixelRatio.get()) / imageLayout.height;
        console.log(sx);
        console.log(PixelRatio.get());
        const mapped = abs.map(p => ({
            // @ts-ignore
            x: Math.round((((p.x._a._value + p.x._a._offset) + p.x._b._value) - imageLayout.x)),
            // @ts-ignore
            y: Math.round((((p.y._a._value + p.y._a._offset) + p.y._b._value) - imageLayout.y) * sy),
        })) as [Point, Point, Point, Point];
        // console.log(mapped[0]);
        // onConfirm(mapped);
    };

    const rate = 5;
    const offsetsX = [10, -10, -10, 10].map(v => v * rate);
    const offsetsY = [10, 10, 10, 10].map(v => v * rate);


    return (
        <Modal transparent={false} animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.container}>
                <View style={styles.imageContainer} onLayout={e => setImageLayout(e.nativeEvent.layout)}>
                    <Image source={{uri}}
                           style={{width: '100%', aspectRatio: imageWidth / imageHeight}} resizeMode="contain"/>
                </View>

                <Svg style={StyleSheet.absoluteFill}>
                    {[0, 1, 2, 3].map(i => (
                        <AnimatedLine
                            key={i}
                            x1={abs[i].x} y1={abs[i].y}
                            x2={abs[(i + 1) % 4].x} y2={abs[(i + 1) % 4].y}
                            stroke="#00aaff" strokeWidth={1}
                        />
                    ))}
                </Svg>

                {pans.map((pan, i) => (
                    <Animated.View
                        key={i}
                        {...responders[i].panHandlers}
                        style={[styles.handle, {
                            left: def[i].x - R + offsetsX[i],
                            top: def[i].y - R + offsetsY[i],
                            transform: pan.getTranslateTransform(),
                        }]}
                    />
                ))}

                <TouchableOpacity style={styles.confirm} onPress={handleConfirm}>
                    <Icon name="check" size={28} color="#fff"/>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        padding: 8,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ff0000',
        borderRadius: 1,
    },
    imageContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 1,
        overflow: 'hidden',
    },
    handle: {
        position: 'absolute',
        width: R * 2,
        height: R * 2,
        borderRadius: R,
        backgroundColor: 'rgba(0,170,255,0.4)',
        borderWidth: 1,
        borderColor: '#00aaff',
    },
    confirm: {
        position: 'absolute',
        bottom: 48,
        alignSelf: 'center',
        backgroundColor: '#00aaff',
        borderRadius: 30,
        padding: 16,
    },
});