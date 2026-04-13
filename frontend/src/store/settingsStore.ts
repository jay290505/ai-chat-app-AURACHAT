import { create } from "zustand";

export type ThemeMode = "dark" | "light";
export type ChatBackgroundTemplate =
  | "aurora"
  | "midnight-grid"
  | "sunrise"
  | "ocean-mist"
  | "clean";

interface NotificationSettings {
  message: boolean;
  group: boolean;
  system: boolean;
  sound: boolean;
}

interface FeatureSettings {
  aiSuggestions: boolean;
  voiceMessages: boolean;
  autoSmartReply: boolean;
  messageCustomization: boolean;
}

interface SettingsState {
  hydratedUserId: string | null;
  themeMode: ThemeMode;
  brightness: number;
  chatBackgroundTemplate: ChatBackgroundTemplate;
  notifications: NotificationSettings;
  features: FeatureSettings;
  hydrate: (userId?: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBrightness: (value: number) => void;
  setChatBackgroundTemplate: (value: ChatBackgroundTemplate) => void;
  setNotificationSetting: (key: keyof NotificationSettings, value: boolean) => void;
  setFeatureSetting: (key: keyof FeatureSettings, value: boolean) => void;
}

interface PersistedSettings {
  themeMode: ThemeMode;
  brightness: number;
  chatBackgroundTemplate: ChatBackgroundTemplate;
  notifications: NotificationSettings;
  features: FeatureSettings;
}

const defaultSettings: PersistedSettings = {
  themeMode: "dark",
  brightness: 100,
  chatBackgroundTemplate: "aurora",
  notifications: {
    message: true,
    group: true,
    system: true,
    sound: false,
  },
  features: {
    aiSuggestions: true,
    voiceMessages: true,
    autoSmartReply: true,
    messageCustomization: true,
  },
};

function getStorageKey(userId: string) {
  return `chat-ui-settings:${userId}`;
}

function clampBrightness(value: number) {
  return Math.min(Math.max(value, 70), 130);
}

function persist(userId: string, state: SettingsState) {
  if (typeof window === "undefined") return;
  const payload: PersistedSettings = {
    themeMode: state.themeMode,
    brightness: state.brightness,
    chatBackgroundTemplate: state.chatBackgroundTemplate,
    notifications: state.notifications,
    features: state.features,
  };
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(payload));
}

function parsePersisted(raw: string | null): PersistedSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    if (!parsed) return null;

    return {
      themeMode: parsed.themeMode === "light" ? "light" : "dark",
      brightness: clampBrightness(Number(parsed.brightness ?? 100)),
      chatBackgroundTemplate:
        parsed.chatBackgroundTemplate === "midnight-grid" ||
        parsed.chatBackgroundTemplate === "sunrise" ||
        parsed.chatBackgroundTemplate === "ocean-mist" ||
        parsed.chatBackgroundTemplate === "clean"
          ? parsed.chatBackgroundTemplate
          : "aurora",
      notifications: {
        message: parsed.notifications?.message ?? true,
        group: parsed.notifications?.group ?? true,
        system: parsed.notifications?.system ?? true,
        sound: parsed.notifications?.sound ?? false,
      },
      features: {
        aiSuggestions: parsed.features?.aiSuggestions ?? true,
        voiceMessages: parsed.features?.voiceMessages ?? true,
        autoSmartReply: parsed.features?.autoSmartReply ?? true,
        messageCustomization: parsed.features?.messageCustomization ?? true,
      },
    };
  } catch {
    return null;
  }
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  hydratedUserId: null,
  themeMode: defaultSettings.themeMode,
  brightness: defaultSettings.brightness,
  chatBackgroundTemplate: defaultSettings.chatBackgroundTemplate,
  notifications: defaultSettings.notifications,
  features: defaultSettings.features,

  hydrate: (userId?: string) => {
    if (typeof window === "undefined") return;
    
    // Always try to load global theme first
    const globalTheme = window.localStorage.getItem("aura-theme") as ThemeMode | null;
    if (globalTheme) {
      set({ themeMode: globalTheme });
    }

    if (userId) {
      const parsed = parsePersisted(window.localStorage.getItem(getStorageKey(userId)));
      if (parsed) {
        set({
          hydratedUserId: userId,
          ...parsed,
        });
      }
    }
  },

  setThemeMode: (mode: ThemeMode) => {
    set({ themeMode: mode });
    if (typeof window !== "undefined") {
      window.localStorage.setItem("aura-theme", mode);
    }
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setBrightness: (value: number) => {
    set({ brightness: clampBrightness(value) });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setChatBackgroundTemplate: (value: ChatBackgroundTemplate) => {
    set({ chatBackgroundTemplate: value });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setNotificationSetting: (key, value) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        [key]: value,
      },
    }));
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setFeatureSetting: (key, value) => {
    set((state) => ({
      features: {
        ...state.features,
        [key]: value,
      },
    }));
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },
}));
