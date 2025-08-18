import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, StyleSheet, Alert, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { LineChart } from "react-native-chart-kit";


const API_URL = "http://localhost:8000";
const screenWidth = Dimensions.get("window").width - 32;

export default function FriendProfile() {
    const { id } = useLocalSearchParams(); // friend ID
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<number[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [name, setName] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const statsRes = await fetch(`${API_URL}/users/${id}/stats`);
                const stats = await statsRes.json();
                setWeeklyData(stats.weekly || []);
                setCurrentStreak(stats.current_streak || 0);
                setLongestStreak(stats.longest_streak || 0);

                const userRes = await fetch(`${API_URL}/users/${id}`);
                const user = await userRes.json();
                setName(user.name || "Friend");
            } catch (err) {
                console.error(err);
                Alert.alert("Error", "Could not load profile");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Loading friend profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.h1}>{name}’s Habits</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Streaks</Text>
                    <Text>Current Streak: {currentStreak} days</Text>
                    <Text>Longest Streak: {longestStreak} days</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Weekly Activity</Text>
                    <LineChart
                        data={{
                            labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                            datasets: [{ data: weeklyData }],
                        }}
                        width={screenWidth}
                        height={220}
                        chartConfig={{
                            backgroundGradientFrom: "#fff",
                            backgroundGradientTo: "#fff",
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(15,23,42, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(107,114,128, ${opacity})`,
                        }}
                        bezier
                        style={{ marginVertical: 8, borderRadius: 16 }}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9fafb" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    h1: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
});