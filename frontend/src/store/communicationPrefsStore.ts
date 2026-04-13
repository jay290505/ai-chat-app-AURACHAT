import { create } from "zustand";

export type MessageTone = "Professional" | "Friendly" | "Casual";

interface CommunicationPrefsState {
  busyMode: boolean;
  autoSmartReply: boolean;
  autoApplyCustomization: boolean;
  preferredTone: MessageTone;
  signature: string;
  busyReason: string;
  quickTemplates: string[];
  autoReplyCooldownSeconds: number;
  hydratedUserId: string | null;
  hydrate: (userId: string) => void;
  setBusyMode: (value: boolean) => void;
  setAutoSmartReply: (value: boolean) => void;
  setAutoApplyCustomization: (value: boolean) => void;
  setPreferredTone: (tone: MessageTone) => void;
  setSignature: (signature: string) => void;
  setBusyReason: (reason: string) => void;
  setAutoReplyCooldownSeconds: (seconds: number) => void;
  setQuickTemplates: (templates: string[]) => void;
}

const DEFAULT_TEMPLATES = [
  "I saw this, will reply soon.",
  "In a meeting right now, will get back shortly.",
  "Thanks for the message. I will respond after I finish this task.",
];

function getStorageKey(userId: string) {
  return `chat-communication-prefs:${userId}`;
}

function safeParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value) as Partial<CommunicationPrefsState>;
  } catch {
    return null;
  }
}

function persist(userId: string, state: CommunicationPrefsState) {
  if (typeof window === "undefined") return;
  const payload = {
    busyMode: state.busyMode,
    autoSmartReply: state.autoSmartReply,
    autoApplyCustomization: state.autoApplyCustomization,
    preferredTone: state.preferredTone,
    signature: state.signature,
    busyReason: state.busyReason,
    quickTemplates: state.quickTemplates,
    autoReplyCooldownSeconds: state.autoReplyCooldownSeconds,
  };
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(payload));
}

export const useCommunicationPrefsStore = create<CommunicationPrefsState>()((set, get) => ({
  busyMode: false,
  autoSmartReply: false,
  autoApplyCustomization: false,
  preferredTone: "Friendly",
  signature: "",
  busyReason: "I am currently focused on work and may reply a bit later.",
  quickTemplates: DEFAULT_TEMPLATES,
  autoReplyCooldownSeconds: 180,
  hydratedUserId: null,

  hydrate: (userId: string) => {
    const parsed = typeof window === "undefined" ? null : safeParse(window.localStorage.getItem(getStorageKey(userId)));
    const next = {
      busyMode: parsed?.busyMode ?? false,
      autoSmartReply: parsed?.autoSmartReply ?? false,
      autoApplyCustomization: parsed?.autoApplyCustomization ?? false,
      preferredTone: parsed?.preferredTone ?? "Friendly",
      signature: parsed?.signature ?? "",
      busyReason: parsed?.busyReason ?? "I am currently focused on work and may reply a bit later.",
      quickTemplates:
        parsed?.quickTemplates && parsed.quickTemplates.length > 0
          ? parsed.quickTemplates.slice(0, 6)
          : DEFAULT_TEMPLATES,
      autoReplyCooldownSeconds: Math.min(Math.max(parsed?.autoReplyCooldownSeconds ?? 180, 60), 1800),
      hydratedUserId: userId,
    } satisfies Partial<CommunicationPrefsState>;

    set(next);
  },

  setBusyMode: (value: boolean) => {
    set({ busyMode: value });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setAutoSmartReply: (value: boolean) => {
    set({ autoSmartReply: value });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setAutoApplyCustomization: (value: boolean) => {
    set({ autoApplyCustomization: value });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setPreferredTone: (tone: MessageTone) => {
    set({ preferredTone: tone });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setSignature: (signature: string) => {
    set({ signature: signature.slice(0, 140) });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setBusyReason: (reason: string) => {
    set({ busyReason: reason.slice(0, 180) });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setAutoReplyCooldownSeconds: (seconds: number) => {
    set({ autoReplyCooldownSeconds: Math.min(Math.max(seconds, 60), 1800) });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },

  setQuickTemplates: (templates: string[]) => {
    const sanitized = templates.map((t) => t.trim()).filter(Boolean).slice(0, 6);
    set({ quickTemplates: sanitized.length > 0 ? sanitized : DEFAULT_TEMPLATES });
    const userId = get().hydratedUserId;
    if (userId) persist(userId, get());
  },
}));
