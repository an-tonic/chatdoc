import React, {createRef, useEffect, useState} from 'react';
import {Alert, Text, TouchableOpacity} from 'react-native';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SplashScreen from './src/screens/SplashScreen';
import Icon from '@react-native-vector-icons/material-design-icons';
import ReactNativeBiometrics from "react-native-biometrics";
import {t} from "./src/languages/i18n";
import {DBProvider} from './src/context/DBContext';

const Stack = createNativeStackNavigator();
const rnBiometrics = new ReactNativeBiometrics();
export let showModelNotice: ((text: string) => void) | null = null;


export default function App() {

    const [showSplashScreen, setShowSplashScreen] = useState(true);
    const [authenticated, setAuthenticated] = useState(true);
    const [modelNoticeText, setModelNoticeText] = useState<string | null>(null);
    const navigationRef = createRef<NavigationContainerRef<any>>();



    useEffect(() => {
        showModelNotice = (text: string) => setModelNoticeText(text);
        if (authenticated) return
        rnBiometrics.simplePrompt({promptMessage: 'Authenticate to enter the app'})
            .then(({success}) => {
                if (success) setAuthenticated(true);
                else Alert.alert('Authentication failed');
            })
            .catch(() => {
                Alert.alert('Biometrics not available');
            });
    }, []);

    const showSplash = showSplashScreen || !authenticated;

    if (showSplashScreen) {
        console.log("App Splash rendered");
        return <SplashScreen onAnimationFinish={() => setShowSplashScreen(false)} />;
    }
    console.log("App rendered");
    return (
            <DBProvider>
                <NavigationContainer ref={navigationRef}>
                    <Stack.Navigator initialRouteName={t('chatPage')}>
                        <Stack.Screen
                            name="Chat"
                            component={ChatScreen}
                            options={({navigation}) => ({
                                title: 'Chat',
                                headerRight: () => (
                                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                                        <Icon name="cog" size={34} color="#0b43d6"/>
                                    </TouchableOpacity>
                                ),
                            })}
                        />
                        <Stack.Screen name="Settings" component={SettingsScreen}/>
                    </Stack.Navigator>
                </NavigationContainer>
                {modelNoticeText && (
                    <TouchableOpacity
                        onPress={() => {
                            setModelNoticeText(null);
                            navigationRef.current?.navigate('Settings');
                        }}
                        style={{
                            position: 'absolute',
                            top: 60,
                            left: 20,
                            right: 20,
                            backgroundColor: '#0b43d6',
                            padding: 14,
                            borderRadius: 10,
                        }}>
                        <Text style={{color: 'white', textAlign: 'center'}}>
                            {modelNoticeText}
                        </Text>
                    </TouchableOpacity>
                )}
            </DBProvider>
    );
}
