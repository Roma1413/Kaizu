import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
        console.log("Must use physical device for Push Notifications");
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
    }

    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

    console.log("Expo push token:", token);
    return token;
}


