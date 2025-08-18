// components/FriendsList.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

const API_URL = "http://localhost:8000";

type FriendRow = {
    id: number;
    user_id: number;
    friend_id: number;
    status: string;
    created_at: string;
};

export default function FriendsList() {
    const [pending, setPending] = useState<FriendRow[]>([]);
    const [friends, setFriends] = useState<FriendRow[]>([]);
    const [email, setEmail] = useState("");
    const router = useRouter();
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        AsyncStorage.getItem("userId").then(id => { if (id) setUserId(Number(id)); });
    }, []);

    useEffect(() => {
        if (userId) fetchAll();
    }, [userId]);

    const fetchAll = async () => {
        try {
            const fRes = await fetch(`${API_URL}/friends/list?user_id=${userId}`);
            const pRes = await fetch(`${API_URL}/friends/requests?user_id=${userId}`);
            if (fRes.ok) setFriends(await fRes.json());
            if (pRes.ok) setPending(await pRes.json());
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not load friends.");
        }
    };

    const sendRequest = async () => {
        if (!userId) {
            Alert.alert("Login required", "Please log in to send friend requests.");
            return;
        }
        if (!email.trim()) return;
        try {
            const res = await fetch(`${API_URL}/friends/request?user_id=${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_email: email.trim() }),
            });
            if (!res.ok) {
                const txt = await res.text();
                Alert.alert("Error", txt);
                return;
            }
            Alert.alert("Request sent", "Friend request has been sent.");
            setEmail("");
            fetchAll();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not send request.");
        }
    };

    const acceptRequest = async (friendshipId: number) => {
        if (!userId) return Alert.alert("Login required", "Please log in to accept requests");

        try {
            const res = await fetch(`${API_URL}/friends/accept/${friendshipId}?user_id=${userId}`, {
                method: "POST",
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }
            // refresh friends and pending lists
            fetchAll();
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not accept friend request");
        }
    };

    const openChat = (friendRow: FriendRow) => {
        if (!userId) {
            Alert.alert("Login required", "Please log in to chat");
            return;
        }

        const friendId = friendRow.user_id === userId ? friendRow.friend_id : friendRow.user_id;
        if (!friendId || isNaN(friendId)) {
            Alert.alert("Error", "Invalid friend ID");
            return;
        }

        router.push(`/chat/${friendId}`);
    };

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontWeight: "700", fontSize: 20 }}>Friends</Text>

            <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "600" }}>Add Friend by Email</Text>
                <View style={{ flexDirection: "row", marginTop: 8 }}>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="friend@example.com"
                        style={{ flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8 }}
                    />
                    <TouchableOpacity onPress={sendRequest} style={{ marginLeft: 8, backgroundColor: "#0f172a", padding: 10, borderRadius: 8 }}>
                        <Text style={{ color: "white" }}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ marginTop: 20 }}>
                <Text style={{ fontWeight: "700" }}>Pending Requests</Text>
                <FlatList
                    data={pending}
                    keyExtractor={(i) => String(i.id)}
                    renderItem={({ item }) => (
                        <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
                            <Text style={{ flex: 1 }}>{`Request from user ${item.user_id}`}</Text>
                            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => acceptRequest(item.id)}>
                                <Text style={{ color: "#0f172a" }}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={{ color: "#666", marginTop: 8 }}>No pending requests</Text>}
                />
            </View>

            <View style={{ marginTop: 20, flex: 1 }}>
                <Text style={{ fontWeight: "700" }}>Your Friends</Text>
                <FlatList
                    data={friends}
                    keyExtractor={(i) => String(i.id)}
                    renderItem={({ item }) => {
                        const friendId = item.user_id === userId ? item.friend_id : item.user_id;
                        return (
                            <TouchableOpacity onPress={() => openChat(item)} style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee" }}>
                                <Text>Friend ID: {friendId}</Text>
                                <Text style={{ color: "#666", fontSize: 12 }}>{`Since ${new Date(item.created_at).toLocaleDateString()}`}</Text>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={<Text style={{ color: "#666", marginTop: 8 }}>No friends yet</Text>}
                />
            </View>
        </View>
    );
}