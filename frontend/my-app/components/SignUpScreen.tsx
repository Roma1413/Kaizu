

import React from 'react';
import {

    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView
} from 'react-native';

const SignUpScreen =()=> {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.logo}>SelfSpark</Text>
            <Text style={styles.subtitle}>Join the journey. Build your best self.</Text>

            <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#888" secureTextEntry />

            <TouchableOpacity style={styles.signUpButton}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff',
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
    signUpButton: {
        width: '100%',
        backgroundColor: '#00aaff',
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
});
export default SignUpScreen;