// app/profile.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { registerForPushNotificationsAsync } from "@/lib/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LineChart } from "react-native-chart-kit";
import { useFocusEffect } from "expo-router";

const API_URL = "http://localhost:8000";
const screenWidth = Dimensions.get("window").width - 32;

interface Badge {
    badge_type: "bronze" | "silver" | "gold";
    habit_id?: number;
    earned_at: string;
}

export default function Profile() {
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [weeklyData, setWeeklyData] = useState<number[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [badges, setBadges] = useState<Badge[]>([]);

    // Load userId from storage on mount
    useEffect(() => {
        (async () => {
            const stored = await AsyncStorage.getItem("userId");
            setUserId(stored ? Number(stored) : null);
        })();
    }, []);

    // Function to fetch stats and badges
    const fetchStats = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            // Fetch streak and weekly completion
            const res = await fetch(`${API_URL}/users/${userId}/stats`);
            const data = await res.json();
            setWeeklyData(data.weekly || []);
            setCurrentStreak(data.current_streak || 0);
            setLongestStreak(data.longest_streak || 0);

            // Fetch badges
            const badgesRes = await fetch(`${API_URL}/users/${userId}/badges`);
            const badgesData = await badgesRes.json();
            setBadges(badgesData);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Fetch stats every time Profile screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [fetchStats])
    );

    // Register for push notifications (only once when userId is ready)
    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await fetch(`${API_URL}/devices/register?user_id=${userId}&token=${token}`, {
                        method: "POST",
                    });
                }
            } catch (e) {
                console.error("Device registration failed", e);
            }
        })();
    }, [userId]);

    // Logout function
    const logout = async () => {
        await AsyncStorage.removeItem("userId");
        setUserId(null);
        Alert.alert("Logged out", "You have been logged out successfully.");
    };

    // If no user logged in
    if (!userId) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.h1}>Please log in</Text>
            </SafeAreaView>
        );
    }

    // While loading
    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={{ marginTop: 8 }}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    // Main render
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.h1}>Profile</Text>

                {/* Streak Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Streaks</Text>
                    <View style={styles.streakRow}>
                        <View style={styles.streakBox}>
                            <Text style={styles.streakNumber}>{currentStreak}</Text>
                            <Text style={styles.streakLabel}>Current Streak</Text>
                        </View>
                        <View style={styles.streakBox}>
                            <Text style={styles.streakNumber}>{longestStreak}</Text>
                            <Text style={styles.streakLabel}>Longest Streak</Text>
                        </View>
                    </View>
                </View>

                {/* Weekly Chart */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Weekly Habit Completion</Text>
                    <LineChart
                        data={{
                            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
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
                            style: { borderRadius: 16 },
                        }}
                        style={{ marginVertical: 8, borderRadius: 16 }}
                        bezier
                    />
                </View>

                {/* Badges */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Badges</Text>
                    <View style={styles.badgesRow}>
                        {badges.length ? (
                            badges.map((b, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.badge,
                                        b.badge_type === "gold" && styles.goldBadge,
                                        b.badge_type === "silver" && styles.silverBadge,
                                        b.badge_type === "bronze" && styles.bronzeBadge,
                                    ]}
                                >
                                    <Text style={styles.badgeText}>{b.badge_type.toUpperCase()}</Text>
                                </View>
                            ))
                        ) : (
                            <Text>No badges earned yet</Text>
                        )}
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9fafb" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    h1: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#0f172a" },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
    streakRow: { flexDirection: "row", justifyContent: "space-between" },
    streakBox: { alignItems: "center", flex: 1 },
    streakNumber: { fontSize: 28, fontWeight: "bold", color: "#0f172a" },
    streakLabel: { fontSize: 12, color: "#6b7280" },
    badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "#e5e7eb",
        marginRight: 8,
        marginBottom: 8,
    },
    goldBadge: { backgroundColor: "#FFD700" },
    silverBadge: { backgroundColor: "#C0C0C0" },
    bronzeBadge: { backgroundColor: "#CD7F32" },
    badgeText: { fontWeight: "600", color: "#0f172a" },
    logoutBtn: {
        marginTop: 16,
        backgroundColor: "#ef4444",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
    },
    logoutText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});