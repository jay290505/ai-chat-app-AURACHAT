"use client";

/**
 * Utility for browser-level push notifications
 */
export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const permission = await Notification.requestPermission();
    return permission === "granted";
};

export const sendPushNotification = (title: string, options?: NotificationOptions) => {
    if (!("Notification" in window) || Notification.permission !== "granted" || document.hasFocus()) {
        return;
    }

    try {
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            ...options,
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    } catch (err) {
        console.error('Failed to send push notification:', err);
    }
};
