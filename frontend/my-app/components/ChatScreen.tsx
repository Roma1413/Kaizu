// components/ChatScreen.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";

const API_URL = "http://localhost:8000";

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
}

export default function ChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const friendId = Number(params.friendId);

    const [userId, setUserId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const flatListRef = useRef<FlatList>(null);

    // Load logged-in user
    useEffect(() => {
        AsyncStorage.getItem("userId").then((id) => {
            if (id) setUserId(Number(id));
            else Alert.alert("Login required", "Please login to chat.");
        });
    }, []);

    // Load messages from backend
    const loadMessages = useCallback(async () => {
        if (!userId || !friendId) return;
        try {
            const res = await fetch(`${API_URL}/messages?user_id=${userId}&friend_id=${friendId}`);
            if (!res.ok) return;
            const data: Message[] = await res.json();
            setMessages(data);
            // auto-scroll
            flatListRef.current?.scrollToEnd({ animated: true });
        } catch (e) {
            console.error("Failed to load messages:", e);
        }
    }, [userId, friendId]);

    // Polling
    useEffect(() => {
        if (!userId || !friendId) return;

        loadMessages(); // initial load
        pollingRef.current = setInterval(loadMessages, 2000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [userId, friendId, loadMessages]);

    const sendMessage = async () => {
        if (!userId) return router.push("/login");
        if (!text.trim()) return;

        const payload = { receiver_id: friendId, content: text.trim() };
        setText("");

        try {
            const res = await fetch(`${API_URL}/messages?user_id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (res.ok) loadMessages();
            else Alert.alert("Error", "Failed to send message.");
        } catch (e) {
            console.error("Send message error:", e);
            Alert.alert("Error", "Could not send message.");
        }
    };

    const renderItem = ({ item }: { item: Message }) => {
        const mine = item.sender_id === userId;
        return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={{ color: mine ? "white" : "black" }}>{item.content}</Text>
                <Text style={{ fontSize: 10, color: mine ? "#ddd" : "#666", marginTop: 6 }}>
                    {new Date(item.created_at).toLocaleTimeString()}
                </Text>
            </View>
        );
    };

    if (!friendId) {
        return (
            <View style={styles.center}>
                <Text>Invalid chat. No friend selected.</Text>
            </View>
        );
    }

    if (!userId) {
        return (
            <View style={styles.center}>
                <Text>Please log in to chat.</Text>
                <TouchableOpacity style={styles.authBtn} onPress={() => router.push("/login")}>
                    <Text style={styles.authText}>Log In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(m) => String(m.id)}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 12 }}
            />

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Message..."
                    value={text}
                    onChangeText={setText}
                    onSubmitEditing={sendMessage}
                    returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                    <Text style={{ color: "white" }}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
    inputRow: {
        flexDirection: "row",
        padding: 8,
        borderTopWidth: 1,
        borderColor: "#eee",
        backgroundColor: "#fff",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 44,
    },
    sendBtn: {
        marginLeft: 8,
        backgroundColor: "#0f172a",
        paddingHorizontal: 16,
        borderRadius: 20,
        justifyContent: "center",
    },
    bubble: {
        maxWidth: "75%",
        padding: 10,
        borderRadius: 12,
        marginBottom: 8,
    },
    bubbleMine: { backgroundColor: "#0f172a", alignSelf: "flex-end", borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: "#f1f1f1", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
    authBtn: {
        marginTop: 12,
        backgroundColor: "#0f172a",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    authText: { color: "white", fontWeight: "600" },
});