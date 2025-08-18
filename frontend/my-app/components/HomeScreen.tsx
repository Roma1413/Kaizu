// HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    TextInput,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Home, ListChecks, ClipboardCheck, Users, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import FriendsList from "./FriendsList"; // adjust path if needed
import Profile from "./profile"; // make sure path is correct


/**
 * IMPORTANT: Set your backend URL
 * - iOS Simulator: http://localhost:8000
 * - Android Emulator: http://10.0.2.2:8000
 * - Physical device: http://YOUR-LAN-IP:8000
 */
const API_URL = "http://localhost:8000";

type Tab = "home" | "habits" | "test" | "friends" | "profile";

interface NavItem {
    label: string;
    value: Tab;
    Icon: any;
}

interface Habit {
    id: number;
    name: string;
    done: boolean;
    updated_at: string;
}

const HomeScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>("home");
    const [userId, setUserId] = useState<number | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const [habits, setHabits] = useState<Habit[]>([]);
    const [newHabit, setNewHabit] = useState("");
    const [loadingHabits, setLoadingHabits] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const router = useRouter();

    // ---- Load userId from AsyncStorage ----
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem("userId");
                if (stored) setUserId(Number(stored));
            } catch (e) {
                console.error("Failed to read userId:", e);
            } finally {
                setLoadingUser(false);
            }
        })();
    }, []);

    // ---- API ----
    const loadHabits = useCallback(async () => {
        if (!userId) return;
        try {
            setLoadingHabits(true);
            const res = await fetch(`${API_URL}/habits?user_id=${userId}`);
            if (!res.ok) {
                const err = await res.text();
                throw new Error(`Failed to load habits: ${res.status} ${err}`);
            }
            const data: Habit[] = await res.json();
            setHabits(data);
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not load habits from the server.");
        } finally {
            setLoadingHabits(false);
        }
    }, [userId]);

    const onRefresh = useCallback(async () => {
        if (!userId) return;
        setRefreshing(true);
        await loadHabits();
        setRefreshing(false);
    }, [userId, loadHabits]);

    useEffect(() => {
        if (userId) {
            loadHabits();
        }
    }, [userId, loadHabits]);

    const requireLogin = (message: string, action?: () => void) => {
        Alert.alert("Please log in", message, [
            { text: "Cancel", style: "cancel" },
            { text: "Log in", onPress: () => router.push("/login") },
        ]);
        if (action) action();
    };

    const addHabit = useCallback(async () => {
        if (!userId) return requireLogin("You need an account to add habits.");
        const name = newHabit.trim();
        if (!name) return;

        const tempId = Date.now();
        const optimistic: Habit = { id: tempId, name, done: false, updated_at: new Date().toISOString() };
        setHabits(prev => [optimistic, ...prev]);
        setNewHabit("");

        try {
            const res = await fetch(`${API_URL}/habits?user_id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error("Failed to add habit");
            await loadHabits();
        } catch (e) {
            setHabits(prev => prev.filter(h => h.id !== tempId));
            Alert.alert("Error", "Could not add habit.");
        }
    }, [newHabit, userId, loadHabits]);

    const toggleHabit = useCallback(
        async (habit: Habit) => {
            if (!userId) return requireLogin("You need an account to mark habits.");
            setHabits(prev => prev.map(h => (h.id === habit.id ? { ...h, done: !h.done } : h)));
            try {
                const res = await fetch(`${API_URL}/habits/${habit.id}?user_id=${userId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ done: !habit.done }),
                });
                if (!res.ok) throw new Error("Failed to toggle habit");
            } catch (e) {
                setHabits(prev => prev.map(h => (h.id === habit.id ? { ...h, done: habit.done } : h)));
                Alert.alert("Error", "Could not update habit.");
            }
        },
        [userId]
    );

    const deleteHabit = useCallback(
        async (id: number) => {
            if (!userId) return requireLogin("You need an account to delete habits.");
            const prev = habits;
            setHabits(prev.filter(h => h.id !== id));
            try {
                const res = await fetch(`${API_URL}/habits/${id}?user_id=${userId}`, {
                    method: "DELETE",
                });
                if (!res.ok) throw new Error("Failed to delete habit");
            } catch (e) {
                setHabits(prev);
                Alert.alert("Error", "Could not delete habit.");
            }
        },
        [habits, userId]
    );

    // ---- Derived ----
    const completedCount = habits.filter(h => h.done).length;

    const navItems: NavItem[] = useMemo(
        () => [
            { label: "Home", value: "home", Icon: Home },
            { label: "Habits", value: "habits", Icon: ListChecks },
            { label: "Test", value: "test", Icon: ClipboardCheck },
            { label: "Friends", value: "friends", Icon: Users },
            { label: "Profile", value: "profile", Icon: User },
        ],
        []
    );

    const HabitRow = ({ item }: { item: Habit }) => (
        <View style={styles.habitItem}>
            <TouchableOpacity
                style={[styles.checkbox, item.done && styles.checkboxDone]}
                onPress={() => toggleHabit(item)}
            >
                {item.done ? <Text style={styles.checkmark}>✓</Text> : null}
            </TouchableOpacity>
            <Text style={[styles.habitText, item.done && styles.habitDone]}>{item.name}</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteHabit(item.id)}>
                <Text style={{ color: "white", fontWeight: "bold" }}>X</Text>
            </TouchableOpacity>
        </View>
    );

    const QuickAction: React.FC<{ title: string; subtitle: string; onPress: () => void }> = ({
                                                                                                 title,
                                                                                                 subtitle,
                                                                                                 onPress,
                                                                                             }) => (
        <TouchableOpacity style={styles.quickCard} onPress={onPress}>
            <Text style={styles.quickTitle}>{title}</Text>
            <Text style={styles.quickSubtitle}>{subtitle}</Text>
        </TouchableOpacity>
    );

    // ---- Tabs ----
    const renderHomeTab = () => (
        <FlatList
            data={habits}
            keyExtractor={(item) => String(item.id)}
            ListHeaderComponent={
                <View>
                    <Text style={styles.h1}>Welcome back 👋</Text>
                    <Text style={styles.subText}>Keep the streak alive. You got this.</Text>

                    <View style={styles.card}>
                        <View>
                            <Text style={styles.cardLabel}>Today's progress</Text>
                            <Text style={styles.cardProgress}>
                                {completedCount}/{habits.length}
                            </Text>
                        </View>
                        <View style={styles.progressCircle}>
                            <Text>
                                {habits.length ? Math.round((completedCount / habits.length) * 100) : 0}%
                            </Text>
                        </View>
                    </View>

                    <View style={styles.quickGrid}>
                        <QuickAction title="Check in" subtitle="Mark today's habits" onPress={() => setActiveTab("habits")} />
                        <QuickAction title="Take Test" subtitle="Know your strengths" onPress={() => setActiveTab("test")} />
                        <QuickAction title="Find friends" subtitle="Accountability partners" onPress={() => setActiveTab("friends")} />
                        <QuickAction title="Edit profile" subtitle="Goals & intent" onPress={() => setActiveTab("profile")} />
                    </View>

                    <Text style={styles.sectionTitle}>Today's habits</Text>
                </View>
            }
            renderItem={({ item }) => <HabitRow item={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
                !loadingHabits ? (
                    <Text style={{ color: "#6b7280", marginTop: 12 }}>
                        {userId ? "No habits yet. Add one in the Habits tab." : "Log in to see your habits."}
                    </Text>
                ) : null
            }
        />
    );

    const renderHabitsTab = () => (
        <View style={{ flex: 1 }}>
            <FlatList
                data={habits}
                keyExtractor={(item) => String(item.id)}
                ListHeaderComponent={
                    <View>
                        <Text style={styles.h1}>All Habits</Text>
                        <Text style={styles.subText}>Tap to toggle completion or delete</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                value={newHabit}
                                onChangeText={setNewHabit}
                                placeholder="New habit..."
                                style={styles.input}
                                onSubmitEditing={addHabit}
                                returnKeyType="done"
                            />
                            <TouchableOpacity style={styles.addBtn} onPress={addHabit}>
                                <Text style={{ color: "white", fontWeight: "600" }}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                renderItem={({ item }) => <HabitRow item={item} />}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loadingHabits ? (
                        <Text style={{ color: "#6b7280", marginTop: 12 }}>
                            {userId ? "No habits yet. Add your first one above." : "Log in to manage habits."}
                        </Text>
                    ) : null
                }
            />
        </View>
    );

    const renderTestTab = () => (
        <View style={styles.centerTab}>
            <Text style={styles.h1}>Strengths Test</Text>
            <Text style={styles.subText}>Discover your growth style.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => {
                if (!userId) return requireLogin("You need an account to take the test.");
                Alert.alert("Test", "Start test flow");
            }}>
                <Text style={styles.actionBtnText}>Start Test</Text>
            </TouchableOpacity>
        </View>
    );

    const renderFriendsTab = () => (
        <View style={{ flex: 1 }}>
            <FriendsList />
        </View>
    );


    const renderProfileTab = () => (
        <View style={{ flex: 1 }}>
            <Profile />
        </View>
    );

    const renderContent = () => {
        if (loadingUser) {
            return (
                <View style={styles.centerTab}>
                    <ActivityIndicator />
                    <Text style={{ marginTop: 8 }}>Loading user…</Text>
                </View>
            );
        }
        switch (activeTab) {
            case "home": return renderHomeTab();
            case "habits": return renderHabitsTab();
            case "test": return renderTestTab();
            case "friends": return renderFriendsTab();
            case "profile": return renderProfileTab();
            default: return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {loadingHabits && userId && (activeTab === "home" || activeTab === "habits") ? (
                <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                    <Text style={{ color: "#6b7280" }}>Syncing…</Text>
                </View>
            ) : null}

            {renderContent()}
            {/* Floating Login/Register button */}
            {!userId && !loadingUser && (
                <View style={styles.floatingAuth}>
                    <TouchableOpacity
                        style={styles.authBtn}
                        onPress={() => router.push("/login")}
                    >
                        <Text style={styles.authText}>Log In / Sign Up</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                {navItems.map(({ label, value, Icon }) => {
                    const active = activeTab === value;
                    return (
                        <TouchableOpacity key={value} style={styles.navButton} onPress={() => setActiveTab(value)}>
                            <Icon color={active ? "#0f172a" : "#6b7280"} size={22} />
                            <Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9fafb" },
    listContent: { padding: 16, paddingBottom: 100 },
    h1: { fontSize: 24, fontWeight: "bold", marginTop: 8 },
    subText: { color: "#6b7280", marginTop: 4 },

    card: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    cardLabel: { fontSize: 12, color: "#6b7280" },
    cardProgress: { fontSize: 28, fontWeight: "600", marginTop: 4 },
    progressCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 8,
        borderColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
    },

    quickGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginTop: 16,
    },
    quickCard: {
        width: "48%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    quickTitle: { fontWeight: "500" },
    quickSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 4 },

    sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 24, marginBottom: 8 },

    habitItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: "#0f172a",
        borderRadius: 6,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxDone: { backgroundColor: "#0f172a" },
    checkmark: { color: "white", fontWeight: "700" },

    habitText: { fontSize: 14, flex: 1 },
    habitDone: { textDecorationLine: "line-through", color: "#9ca3af" },

    deleteBtn: {
        marginLeft: 8,
        backgroundColor: "#ef4444",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },

    inputRow: { flexDirection: "row", marginTop: 16, marginBottom: 16 },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#fff",
    },
    addBtn: {
        marginLeft: 8,
        backgroundColor: "#0f172a",
        paddingHorizontal: 16,
        justifyContent: "center",
        borderRadius: 8,
    },

    centerTab: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },

    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        backgroundColor: "#fff",
    },
    navButton: { alignItems: "center" },
    navText: { fontSize: 11, color: "#6b7280" },
    navTextActive: { color: "#0f172a", fontWeight: "500" },

    actionBtn: {
        backgroundColor: "#0f172a",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 16,
    },

    floatingAuth: {
        position: "absolute",
        bottom: 80,
        right: 20,
    },
    authBtn: {
        backgroundColor: "#0f172a",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    authText: { color: "white", fontWeight: "600" },
    actionBtnText: { color: "white", fontWeight: "600" },
});

export default HomeScreen;