import React, {createRef, useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {NavigationContainer, NavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SplashScreen from './src/screens/SplashScreen';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/material-design-icons';
import ReactNativeBiometrics from "react-native-biometrics";

const Stack = createNativeStackNavigator();
const rnBiometrics = new ReactNativeBiometrics();
export let showModelNotice: ((text: string) => void) | null = null;


export default function App() {
    const [chatReady, setChatReady] = useState(false);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);
    const [authenticated, setAuthenticated] = useState(true);
    const [modelNoticeText, setModelNoticeText] = useState<string | null>(null);
    const navigationRef = createRef<NavigationContainerRef<any>>();

    useEffect(() => {
        showModelNotice = (text: string) => setModelNoticeText(text);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => setMinTimeElapsed(true), 1000);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (authenticated) return
        rnBiometrics.simplePrompt({ promptMessage: 'Authenticate to enter the app' })
            .then(({ success }) => {
                if (success) setAuthenticated(true);
                else Alert.alert('Authentication failed');
            })
            .catch(() => {
                Alert.alert('Biometrics not available');
            });
    }, []);

    const showSplash = !chatReady || !minTimeElapsed || !authenticated;


    return (
        <SafeAreaProvider>
            <View style={{flex: 1}}>
                <NavigationContainer ref={navigationRef}>
                <Stack.Navigator initialRouteName="Chat">
                        <Stack.Screen
                            name="Chat"
                            options={({navigation}) => ({
                                title: 'Chat',
                                headerRight: () => (
                                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                                        <Icon name="cog" size={34} color="#0b43d6"/>
                                    </TouchableOpacity>
                                ),
                            })}
                        >
                            {() => <ChatScreen onReady={() => setChatReady(true)}/>}
                        </Stack.Screen>
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

                {showSplash && (
                    <View style={StyleSheet.absoluteFill}>
                        <SplashScreen/>
                    </View>
                )}
            </View>
        </SafeAreaProvider>
    );
}
