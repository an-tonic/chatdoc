import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

type Props = { onAnimationFinish: () => void };

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <LottieView
                source={require('../assets/SplashAnimation.json')}
                autoPlay
                loop={true}
                style={styles.lottie}
                // onAnimationFinish={() => {}}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    lottie: { flex: 1 },
});
