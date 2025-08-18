import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/contexts/AuthContext';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import { Platform } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const { login } = useAuth();

    const redirectUri = makeRedirectUri({ scheme: 'com.kaizu.myapp'});
    console.log("Redirect URI:", redirectUri);
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '555722341429-28idvbpsv3o9mfenmtivrtf7rou78l0g.apps.googleusercontent.com', // Web client ID
        iosClientId: '555722341429-09lbd32po0mdkutvar7p5q97a66b0lce.apps.googleusercontent.com', // iOS client ID
        redirectUri,
        responseType: ResponseType.IdToken,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            console.log('✅ Google Login Success. Token:', id_token);
            login({ token: id_token });
            router.push('/home');
        } else if (response?.type === 'error') {
            console.error('❌ Google Login Error:', response.error);
            Alert.alert(
                'Google Login Error',
                'Failed to authenticate with Google. Please try again.',
                [{ text: 'OK' }]
            );
        }
        setIsGoogleLoading(false);
    }, [response]);

    const handleGoogleLogin = async () => {
        try {
            setIsGoogleLoading(true);
            console.log('🔗 Redirect URI:', makeRedirectUri({
                scheme: 'com.kaizu.myapp',
            }));
            await promptAsync();
        } catch (error) {
            console.error('❌ Google Login Error:', error);
            Alert.alert(
                'Google Login Error',
                'Failed to start Google authentication. Please try again.',
                [{ text: 'OK' }]
            );
            setIsGoogleLoading(false);
        }
    };

    const handleLogin = async () => {
        setEmailError('');
        setPasswordError('');
        let isValid = true;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            isValid = false;
        }

        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            isValid = false;
        }

        if (!isValid) return;

        try {
            const res = await fetch('http://localhost:8000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (res.ok) {
                console.log('Login successful:', data);

                // 🔑 Save user_id to AsyncStorage
                if (data.user_id) {
                    await AsyncStorage.setItem("userId", String(data.user_id));
                    console.log("Saved userId:", data.user_id);
                } else {
                    console.warn("No user_id returned from backend!");
                }

                login(data); // your AuthContext
                router.push('/home');
            } else {
                setPasswordError(data.detail || 'Invalid credentials');
            }
        } catch (error) {
            console.error(error);
            setEmailError('Could not connect to backend');
        }
    };

    return (
        <LinearGradient colors={['#FFDEE9', '#B5FFFC']} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <Image
                    style={styles.logoImage}
                    source={require('@/assets/images/app-image.png')}
                />

                <Text style={styles.subtitle}>"Better habits with better partners."</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push('/signup')}>
                    <Text style={styles.signUpText}>Sign Up</Text>
                </TouchableOpacity>

                <Text style={styles.orText}>Or continue with</Text>

                <View style={styles.socialContainer}>
                    <TouchableOpacity 
                        style={[styles.socialButton, isGoogleLoading && styles.socialButtonDisabled]} 
                        onPress={handleGoogleLogin}
                        disabled={isGoogleLoading}
                    >
                        <Icon name="google" size={24} color="#DB4437" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.socialButton}>
                        <Icon name="apple" size={24} color="#000" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: 'transparent',
        alignItems: 'center',
        gap: 10,
    },
    logoImage: {
        width: 100,
        height: 100,
        marginBottom: 10,
        borderRadius: 50,
        resizeMode: 'contain',
    },
    subtitle: {
        fontSize: 16,
        color: '#444',
        marginBottom: 30,
        textAlign: 'center',
        fontWeight: '600',
    },
    input: {
        width: '100%',
        height: 50,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        paddingHorizontal: 15,
        marginBottom: 5,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    errorText: {
        width: '100%',
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    loginButton: {
        width: '100%',
        backgroundColor: '#ff6fa4',
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
        color: '#ff6fa4',
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
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    socialButtonDisabled: {
        opacity: 0.6,
    },
});

export default LoginScreen;