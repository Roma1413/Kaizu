import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function HomeScreen() {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.welcome}>Welcome back, Ramazan 👋</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Today's Progress</Text>
                <Text style={styles.cardContent}>✅ 3/5 goals completed</Text>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>View Goals</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.quoteBox}>
                <Text style={styles.quote}>
                    “Discipline is choosing between what you want now and what you want most.”
                </Text>
                <Text style={styles.author}>– Abraham Lincoln</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionText}>🔍 Explore Partners</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionText}>📊 Strength Report</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#fefefe',
        flexGrow: 1,
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#e0f7fa',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    cardContent: {
        fontSize: 16,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    quoteBox: {
        padding: 16,
        backgroundColor: '#fff8e1',
        borderRadius: 12,
        marginBottom: 20,
    },
    quote: {
        fontStyle: 'italic',
        fontSize: 16,
        marginBottom: 8,
        color: '#444',
    },
    author: {
        textAlign: 'right',
        fontWeight: '500',
        color: '#666',
    },
    actions: {
        flexDirection: 'column',
        gap: 12,
    },
    actionButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 16,
        fontWeight: '500',
    },
});