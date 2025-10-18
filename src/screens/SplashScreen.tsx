import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

type Props = { onAnimationFinish: () => void };

export default function SplashScreen({ onAnimationFinish }: Props) {
    return (
        <View style={styles.container}>
            <LottieView
                duration={1000}
                source={require('../assets/SplashAnimation.json')}
                autoPlay
                loop={false}
                style={styles.lottie}
                onAnimationFinish={onAnimationFinish}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    lottie: { flex: 1 },
});
