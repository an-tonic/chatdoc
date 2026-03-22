import React, {useEffect, useRef} from 'react';
import {Animated, Dimensions, Image, Modal, PanResponder, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import Svg, {Line} from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const HANDLE_RADIUS = 22;

type Point = { x: number; y: number };

type Props = {
    uri: string,
    onClose: () => void;
    onConfirm: (corners: [Point, Point, Point, Point]) => void;
    imageWidth: number;
    imageHeight: number;
};

const defaultCorners = (): [Point, Point, Point, Point] => {
    const insetX = SCREEN_W * 0.1;
    const insetY = SCREEN_H * 0.15;
    return [
        {x: insetX, y: insetY},
        {x: SCREEN_W - insetX, y: insetY},
        {x: SCREEN_W - insetX, y: SCREEN_H - insetY},
        {x: insetX, y: SCREEN_H - insetY},
    ];
};

const AnimatedLine = Animated.createAnimatedComponent(Line);

export default function PerspectiveCropEditor({uri, onClose, onConfirm, imageWidth, imageHeight}: Props) {

    const defaults = useRef(defaultCorners()).current;

    // pan values start at 0,0 — offset from default corner positions
    const panValues = useRef(
        defaults.map(() => new Animated.ValueXY({x: 0, y: 0}))
    ).current;

    // derived absolute positions for SVG lines and confirm mapping
    const absPoints = useRef(
        panValues.map((pan, i) => ({
            x: Animated.add(pan.x, new Animated.Value(defaults[i].x)),
            y: Animated.add(pan.y, new Animated.Value(defaults[i].y)),
        }))
    ).current;
    useEffect(() => {
        return () => {
            console.log('PerspectiveCropEditor unmounted');
        };
    }, []);
    const panResponders = useRef(
        panValues.map(pan =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderMove: Animated.event(
                    [null, {dx: pan.x, dy: pan.y}],
                    {useNativeDriver: false},
                ),
                onPanResponderRelease: () => {
                    pan.extractOffset();
                },
            })
        )
    ).current;

    // TODO fix this - wrong values?
    const handleConfirm = () => {
        const scaleX = imageWidth / SCREEN_W;
        const scaleY = imageHeight / SCREEN_H;

        const mapped = absPoints.map(p => {
            // @ts-ignore — internal _value + _offset is reliable here
            const x = (p.x._a._value + p.x._a._offset) + p.x._b._value;
            // @ts-ignore
            const y = (p.y._a._value + p.y._a._offset) + p.y._b._value;
            return {
                x: Math.round(x * scaleX),
                y: Math.round(y * scaleY),
            };
        }) as [Point, Point, Point, Point];

        onConfirm(mapped);
    };

    return (
        <Modal
            backdropColor={'black'}
            transparent={false}
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Image source={{uri}} style={styles.image} resizeMode="contain"/>
            {/* SVG lines — fully animated, zero re-renders */}
            <Svg style={StyleSheet.absoluteFill} width={SCREEN_W} height={SCREEN_H}>
                <AnimatedLine x1={absPoints[0].x} y1={absPoints[0].y} x2={absPoints[1].x} y2={absPoints[1].y}
                              stroke="#00aaff" strokeWidth={2}/>
                <AnimatedLine x1={absPoints[1].x} y1={absPoints[1].y} x2={absPoints[2].x} y2={absPoints[2].y}
                              stroke="#00aaff" strokeWidth={2}/>
                <AnimatedLine x1={absPoints[2].x} y1={absPoints[2].y} x2={absPoints[3].x} y2={absPoints[3].y}
                              stroke="#00aaff" strokeWidth={2}/>
                <AnimatedLine x1={absPoints[3].x} y1={absPoints[3].y} x2={absPoints[0].x} y2={absPoints[0].y}
                              stroke="#00aaff" strokeWidth={2}/>
            </Svg>

            {/* draggable handles */}
            {panValues.map((pan, i) => (
                <Animated.View
                    key={i}
                    {...panResponders[i].panHandlers}
                    style={[
                        styles.handle,
                        {
                            left: defaults[i].x - HANDLE_RADIUS,
                            top: defaults[i].y - HANDLE_RADIUS,
                            transform: pan.getTranslateTransform(),
                        },
                    ]}
                />
            ))}

            {/* confirm button */}
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Icon name="check" size={28} color="#fff"/>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    image: {
        flex: 1,
        width: SCREEN_W,
        borderColor: 'white',
        borderWidth: 1,
    },
    handle: {
        position: 'absolute',
        width: HANDLE_RADIUS * 2,
        height: HANDLE_RADIUS * 2,
        borderRadius: HANDLE_RADIUS,
        backgroundColor: 'rgba(0, 170, 255, 0.4)',
        borderWidth: 2,
        borderColor: '#00aaff',
    },
    closeButton: {
        position: 'absolute',
        top: 48,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 20,
        padding: 8,
    },
    confirmButton: {
        position: 'absolute',
        bottom: 48,
        alignSelf: 'center',
        backgroundColor: '#00aaff',
        borderRadius: 30,
        padding: 16,
    },
});