import React, {useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image

}
from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';

import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/contexts/AuthContext';
WebBrowser.maybeCompleteAuthSession();


const LoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();



    const handleLogin = async () => {
        try {
            const res = await fetch('http://192.168.1.3:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                console.log('Login successful:', data);
                login(data); // Store user data
                router.push('/home'); // Navigate to home
            } else {
                alert(data.detail || 'Login failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting to backend');
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <Image style={styles.logoImage} source={require('@/assets/images/app-image.png')} />


            <Text style={styles.subtitle}>“Better habits with better partners.”</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/signup")}>
                <Text style={styles.signUpText}>Sign Up</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>Or continue with</Text>

            <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="google" size={24} color="#DB4437" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialButton}>
                    <Icon name="apple" size={24} color="#000" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: 'FF6FA4',

        alignItems: 'center',
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#00aaff',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 15,
    },
    loginButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    signUpText: {
        color: '#00aaff',
        fontSize: 16,
        marginBottom: 20,
    },
    orText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 10,
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    socialButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 50,
        marginHorizontal: 10,
    },
    logoImage: {
        width: 100,
        height:100,
        marginBottom: 10,
        borderRadius: 50,
        resizeMode: 'contain',
    },
});

export default LoginScreen;