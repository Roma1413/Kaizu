import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/components/LoginScreen';
import SignUpScreen from '@/components/SignUpScreen';
import HomeScreen from '@/components/HomeScreen';
import FriendsList from '@/components/FriendsList';
import ChatScreen from '@/components/ChatScreen';

const Stack = createNativeStackNavigator();

export default function Index() {
    return (
        <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Friends" component={FriendsList} />
            <Stack.Screen name="Chat" component={ChatScreen} />
        </Stack.Navigator>
    );
}