import { create } from "zustand";
import { useSettingsStore } from "./settingsStore";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "message" | "group" | "system";
  isRead: boolean;
}

interface NotificationState {
  notifications: Notification[];
  showToast: (title: string, message: string, type: Notification["type"]) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  showToast: (title, message, type) => {
    const notificationSettings = useSettingsStore.getState().notifications;
    if (type === "message" && !notificationSettings.message) return;
    if (type === "group" && !notificationSettings.group) return;
    if (type === "system" && !notificationSettings.system) return;

    const id = Math.random().toString(36).substring(7);
    const newNotification: Notification = { id, title, message, type, isRead: false };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 5), // Keep last 5
    }));

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
