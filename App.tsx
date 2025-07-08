import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ChatScreen from './src/screens/ChatScreen.tsx';
import SettingsScreen from './src/screens/SettingsScreen';
import {SafeAreaProvider} from "react-native-safe-area-context";

import type {RootStackParamList} from './src/navigation/types';
import {TouchableOpacity} from "react-native";
import Icon from "@react-native-vector-icons/material-design-icons";

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Chat">
                    <Stack.Screen
                        name="Chat"
                        component={ChatScreen}
                        options={({navigation}) => ({
                            title: 'Chat', // Set custom title here
                            headerRight: () => (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Settings')}
                                >
                                    <Icon name="cog" size={34} color="#0b43d6"/>
                                </TouchableOpacity>
                            ),
                        })}
                    />

                    <Stack.Screen name="Settings" component={SettingsScreen}/>
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

export default App;
