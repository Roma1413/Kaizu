
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/components/LoginScreen';
import SignUpScreen from '@/components/SignUpScreen';
import HomeScreen from '@/components/HomeScreen';



const Stack = createNativeStackNavigator();

export default function Index() {
    return (

            <Stack.Navigator initialRouteName="/">
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
            </Stack.Navigator>

    );
}

