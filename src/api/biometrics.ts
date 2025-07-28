import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

function BiometricGate({ onAuthenticated }: { onAuthenticated: () => void }) {
    useEffect(() => {
        rnBiometrics.simplePrompt({ promptMessage: 'Authenticate to access the app' })
            .then(resultObject => {
                const { success } = resultObject;

                if (success) {
                    onAuthenticated();
                } else {
                    Alert.alert('Authentication failed');
                }
            })
            .catch(() => {
                Alert.alert('Biometric authentication not available');
            });
    }, []);

    return null;
}
