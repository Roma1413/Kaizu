import React, { useState } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const SignUpScreen = () => {
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [nameError, setNameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const handleSignUp = async () => {
        let isValid = true;

        setNameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');

        if (!name.trim()) {
            setNameError('Name is required');
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Enter a valid email address');
            isValid = false;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setPasswordError('Password must be 8+ chars, with upper/lowercase, number, and special character');
            isValid = false;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError('Passwords do not match');
            isValid = false;
        }

        if (!isValid) return;

        try {
            const res = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                console.log('Sign up successful:', data);
                router.push('/login');
            } else {
                setEmailError(data.detail || 'Sign up failed');
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
                    source={require('@/assets/images/app-image.png')}
                    style={styles.logoImage}
                />
                <Text style={styles.subtitle}>“Join the journey. Build your best self.”</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#888"
                    value={name}
                    onChangeText={setName}
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
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

                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

                <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
                    <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/login")}>
                    <Text style={styles.loginText}>Already have an account? Log In</Text>
                </TouchableOpacity>
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
        alignItems: 'center',
        backgroundColor: 'transparent',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    errorText: {
        width: '100%',
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
        paddingHorizontal: 5,
    },
    signUpButton: {
        width: '100%',
        backgroundColor: '#ff6fa4',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 15,
    },
    signUpButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    loginText: {
        color: '#ff6fa4',
        fontSize: 16,
        textAlign: 'center',
    },
});

export default SignUpScreen;