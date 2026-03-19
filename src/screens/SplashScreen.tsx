import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import {useTheme} from "../context/ThemeContext.tsx";

type Props = { onAnimationFinish: () => void };

export default function SplashScreen({ onAnimationFinish }: Props) {
    const {colors} = useTheme();

    return (
        <View style={{flex: 1, backgroundColor: colors.bgPrimary}}>
            <LottieView
                duration={1000}
                source={require('../assets/SplashAnimation.json')}
                autoPlay
                loop={false}
                style={{ flex: 1 }}
                onAnimationFinish={onAnimationFinish}
            />
        </View>
    );
}
