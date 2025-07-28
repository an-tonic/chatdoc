import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SplashScreen from './src/screens/SplashScreen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/material-design-icons';
import ReceiveSharingIntent from "react-native-receive-sharing-intent";
import {savePhotoToLocal} from "./src/api/utils.ts";

const Stack = createNativeStackNavigator();

export default function App() {
    const [chatReady, setChatReady] = useState(false);
    const [minTimeElapsed, setMinTimeElapsed] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setMinTimeElapsed(true), 1000);
        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        console.log("test")
        ReceiveSharingIntent.getReceivedFiles(async (files: any) => {

                const savedPath = await savePhotoToLocal(files[0].contentUri)
                console.log("hey", savedPath)
                // addImage(savedPath)
            },
            (error: any) => {
                console.log(error);
            },
            'ShareMedia' // share url protocol (must be unique to your app, suggest using your apple bundle id)
        );

        return () => {
            ReceiveSharingIntent.clearReceivedFiles();
        };
    }, []);

    const showSplash = !chatReady || !minTimeElapsed;

    return (
        <SafeAreaProvider>
            <View style={{ flex: 1 }}>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="Chat">
                        <Stack.Screen
                            name="Chat"
                            options={({ navigation }) => ({
                                title: 'Chat',
                                headerRight: () => (
                                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                                        <Icon name="cog" size={34} color="#0b43d6" />
                                    </TouchableOpacity>
                                ),
                            })}
                        >
                            {() => <ChatScreen onReady={() => setChatReady(true)} />}
                        </Stack.Screen>
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                    </Stack.Navigator>
                </NavigationContainer>

                {showSplash && (
                    <View style={StyleSheet.absoluteFill}>
                        <SplashScreen />
                    </View>
                )}
            </View>
        </SafeAreaProvider>
    );
}
