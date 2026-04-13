import { create } from "zustand";
import { supabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useNotificationStore } from "./notificationStore";
import { useAuthStore } from "./authStore";
import { useSettingsStore } from "./settingsStore";
import { generateAssistantReply } from "@/lib/ai/gemini";
import type {
  Chat,
  ChatMember,
  ContactRequest,
  Message,
  MessageStatus,
  Profile,
} from "@/types/database";

type TypingState = Record<string, boolean>; // userId -> typing

interface ChatWithMeta extends Chat {
  last_message?: Message | null;
  unread_count?: number;
  members?: (ChatMember & { profile: Profile })[];
}

type ContactRelation = "none" | "outgoing" | "incoming" | "connected";

interface ChatState {
  chats: ChatWithMeta[];
  contacts: Profile[];
  contactRelations: Record<string, ContactRelation>;
  incomingRequests: ContactRequest[];
  messagesByChat: Record<string, Message[]>;
  selectedChatId: string | null;
  activeContactId: string | null;
  typingByUser: TypingState;
  onlineByUser: Record<string, boolean>;
  replyingToId: string | null;
  loadingChats: boolean;
  loadingContacts: boolean;
  loadingMessages: boolean;
  error: string | null;
  initRealtime: (userId: string) => void;
  fetchChats: (userId: string) => Promise<void>;
  fetchContacts: (currentUserId: string) => Promise<void>;
  fetchContactRequests: (currentUserId: string) => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendContactRequest: (payload: {
    currentUserId: string;
    contactId: string;
  }) => Promise<void>;
  acceptContactRequest: (payload: {
    currentUserId: string;
    requestId: string;
    requesterId: string;
  }) => Promise<void>;
  selectChat: (chatId: string | null) => void;
  setReplyingTo: (messageId: string | null) => void;
  openDmWithContact: (payload: {
    currentUserId: string;
    contactId: string;
  }) => Promise<void>;
  sendMessage: (payload: {
    chatId: string;
    content: string;
    mediaUrl?: string | null;
    parentId?: string | null;
  }) => Promise<void>;
  addReaction: (messageId: string, emoji: string, userId: string) => Promise<void>;
  updateMessageStatus: (messageId: string, status: MessageStatus) => Promise<void>;
  uploadMedia: (file: File | Blob, ext: string) => Promise<string | null>;
  setTyping: (chatId: string, isTyping: boolean, userId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  generateAiResponse: (chatId: string, content: string) => Promise<void>;
  createGroup: (payload: {
    name: string;
    userIds: string[];
    ownerId: string;
  }) => Promise<string | null>;
  searchUsers: (query: string) => Promise<Profile[]>;
}

export const AURA_BOT_ID = "ee86820a-89f0-4f84-af6b-48c3f68ec1dd"; // Aura Friend profile

let typingBroadcastChannel: any = null;
let contactRequestsAvailable = true;
let contactRequestsLastCheckAt = 0;
const dmLookupByPair: Record<string, string> = {};
const messageFetchInFlight = new Map<string, Promise<void>>();
const messageFetchedAt: Record<string, number> = {};

const CONTACT_REQUESTS_RECHECK_MS = 30000;
const MESSAGE_CACHE_TTL_MS = 15000;

const getDmPairKey = (firstUserId: string, secondUserId: string) =>
  [firstUserId, secondUserId].sort().join(":");

const cacheDmPair = (firstUserId: string, secondUserId: string, chatId: string) => {
  dmLookupByPair[getDmPairKey(firstUserId, secondUserId)] = chatId;
};

const buildConnectedRelations = (contacts: Profile[]): Record<string, ContactRelation> => {
  const nextRelations: Record<string, ContactRelation> = {};
  contacts.forEach((contact) => {
    nextRelations[contact.id] = "connected";
  });
  nextRelations[AURA_BOT_ID] = "connected";
  return nextRelations;
};

const isMissingContactRequestsTableError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("public.contact_requests") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
};

export const useChatStore = create<ChatState>()((set, get) => ({
  chats: [],
  contacts: [],
  contactRelations: {},
  incomingRequests: [],
  messagesByChat: {},
  selectedChatId: null,
  activeContactId: null,
  typingByUser: {},
  onlineByUser: {},
  replyingToId: null,
  loadingChats: false,
  loadingContacts: false,
  loadingMessages: false,
  error: null,

  initRealtime: (userId: string) => {
    if (!isSupabaseConfigured) {
      // Demo mode: skip realtime wiring
      return;
    }

    // Messages realtime
    const messageChannel = supabaseClient!
      .channel("realtime:messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
            if (payload.eventType === "INSERT") {
              const newMessage = payload.new as Message;
              set((state) => {
                const chatMessages = state.messagesByChat[newMessage.chat_id] ?? [];
                // Prevent duplicates from optimistic inserts
                if (chatMessages.some(m => m.id === newMessage.id)) return state;
                return {
                  messagesByChat: {
                    ...state.messagesByChat,
                    [newMessage.chat_id]: [...chatMessages, newMessage],
                  },
                };
              });

              // Notification for new incoming message
              if (newMessage.sender_id !== userId) {
                const { chats } = get();
                const chat = chats.find(c => c.id === newMessage.chat_id);
                useNotificationStore.getState().showToast(
                  chat?.name || "New Message",
                  newMessage.content || "Media attachment",
                  "message"
                );
              }
            }
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Message;
            set((state) => {
              const chatMessages = state.messagesByChat[updated.chat_id] ?? [];
              return {
                messagesByChat: {
                  ...state.messagesByChat,
                  [updated.chat_id]: chatMessages.map((m) =>
                    m.id === updated.id ? updated : m,
                  ),
                },
              };
            });
          }
          if (payload.eventType === "DELETE") {
            const old = payload.old as Message;
            set((state) => {
              const chatMessages = state.messagesByChat[old.chat_id] ?? [];
              return {
                messagesByChat: {
                  ...state.messagesByChat,
                  [old.chat_id]: chatMessages.filter((m) => m.id !== old.id),
                },
              };
            });
          }
        },
      )
      .subscribe();

    // Online presence via profiles table
    const presenceChannel = supabaseClient!
      .channel("realtime:profiles")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const profile = payload.new as Profile;
          set((state) => ({
            onlineByUser: {
              ...state.onlineByUser,
              [profile.id]: profile.is_online,
            },
          }));
        },
      )
      .subscribe();

    // Typing indicator via broadcast channel per user
    const typingChannel = supabaseClient!
      .channel("realtime:typing", {
        config: {
          broadcast: { self: false },
        },
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { chatId, fromUserId, isTyping } = payload as {
          chatId: string;
          fromUserId: string;
          isTyping: boolean;
        };
        if (fromUserId === userId) return;
        const key = `${chatId}:${fromUserId}`;
        set((state) => ({
          typingByUser: {
            ...state.typingByUser,
            [key]: isTyping,
          },
        }));
      })
      .subscribe();

    typingBroadcastChannel = typingChannel;
      
    // Chat list realtime (when added to a new chat)
    const chatMemberChannel = supabaseClient!
      .channel("realtime:chat_members")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_members",
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refresh the whole chat list when we are added to a new chat
          get().fetchChats(userId);
          useNotificationStore.getState().showToast(
            "Aura Messenger",
            "You were added to a new group chat!",
            "group"
          );
        }
      )
      .subscribe();

    const incomingRequestChannel = contactRequestsAvailable ? supabaseClient!
      .channel("realtime:contact_requests:incoming")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_requests",
          filter: `target_id=eq.${userId}`,
        },
        (payload) => {
          void get().fetchContactRequests(userId);
          if (payload.eventType === "INSERT") {
            useNotificationStore.getState().showToast(
              "New Contact Request",
              "Someone wants to start chatting with you.",
              "message",
            );
          }
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as ContactRequest;
            if (updated.status === "accepted") {
              void get().fetchChats(userId);
            }
          }
        },
      )
      .subscribe() : null;

    const outgoingRequestChannel = contactRequestsAvailable ? supabaseClient!
      .channel("realtime:contact_requests:outgoing")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_requests",
          filter: `requester_id=eq.${userId}`,
        },
        (payload) => {
          void get().fetchContactRequests(userId);
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as ContactRequest;
            if (updated.status === "accepted") {
              useNotificationStore.getState().showToast(
                "Request Accepted",
                "You can now start messaging.",
                "message",
              );
              void get().fetchChats(userId);
            }
          }
        },
      )
      .subscribe() : null;

    // Store channels on window for cleanup if needed
    if (typeof window !== "undefined") {
      (window as any).__chat_channels__ = {
        messageChannel,
        presenceChannel,
        typingChannel,
        chatMemberChannel,
        incomingRequestChannel,
        outgoingRequestChannel,
      };
    }
  },

  fetchChats: async (currentUserId: string) => {
    if (!isSupabaseConfigured) {
      // Demo chats
      const now = new Date().toISOString();
      const demoChats: ChatWithMeta[] = [
        {
          id: "demo-chat-1",
          type: "private",
          name: null,
          avatar_url: null,
          created_at: now,
          is_group: false,
        },
        {
          id: "demo-chat-2",
          type: "group",
          name: "Design Team",
          avatar_url: null,
          created_at: now,
          is_group: true,
        },
      ];
      set({ chats: demoChats, loadingChats: false, error: null });
      return;
    }

    set({ loadingChats: true, error: null });
    
    // 1. Get IDs of chats user is a member of
    const { data: membershipData, error: memberError } = await supabaseClient!
      .from("chat_members")
      .select("chat_id")
      .eq("user_id", currentUserId);

    if (memberError) {
      set({ loadingChats: false, error: memberError.message });
      return;
    }

    const chatIds = (membershipData as any[] || []).map(m => m.chat_id);
    if (chatIds.length === 0) {
      set({ chats: [], loadingChats: false });
      return;
    }

    // 2. Fetch those specific chats with members and profiles
    const { data, error } = await supabaseClient!
      .from("chats")
      .select(`
        *,
        members:chat_members(
          *,
          profile:profiles(*)
        )
      `)
      .in("id", chatIds)
      .order("created_at", { ascending: false });

    if (error) {
      set({ loadingChats: false, error: error.message });
      return;
    }

    const chatsWithNames = (data ?? []).map((chat: any) => {
      if (chat.type === 'private') {
        const otherMember = chat.members?.find((m: any) => (m.profile?.id || m.user_id) !== currentUserId);
        const fallbackName = chat.name || 'Chat Participant';
        const name = (otherMember?.profile?.id === AURA_BOT_ID || otherMember?.user_id === AURA_BOT_ID) 
          ? "Aura AI Assistant" 
          : (otherMember?.profile?.full_name || otherMember?.profile?.username || fallbackName);
        
        return {
          ...chat,
          name,
          avatar_url:
            otherMember?.profile?.avatar_url ||
            (otherMember?.user_id === AURA_BOT_ID
              ? "https://api.dicebear.com/7.x/bottts/svg?seed=Aura"
              : (chat.avatar_url || null))
        };
      }
      return chat.type === 'group' && !chat.name ? { ...chat, name: 'Untitled Group' } : chat;
    });

    // Final deduplication by chatId to prevent UI duplicates
    const chatMap = new Map();
    chatsWithNames.forEach((c) => {
      if (!chatMap.has(c.id)) chatMap.set(c.id, c);
    });
    const uniqueChats = Array.from(chatMap.values());

    (uniqueChats as any[])
      .filter((chat) => chat.type === "private" && Array.isArray(chat.members))
      .forEach((chat) => {
        const memberIds = Array.from(
          new Set(
            (chat.members as any[])
              .map((member) => member?.profile?.id || member?.user_id)
              .filter(Boolean),
          ),
        );

        if (memberIds.length === 2) {
          cacheDmPair(memberIds[0], memberIds[1], chat.id);
        }
      });

    set({ chats: uniqueChats as ChatWithMeta[], loadingChats: false });
    void get().fetchContactRequests(currentUserId);
  },

  fetchContacts: async (currentUserId: string) => {
    if (!isSupabaseConfigured) {
      const now = new Date().toISOString();
      const demoContacts: Profile[] = [
        {
          id: "demo-other-user",
          username: "alex",
          full_name: "Alex Johnson",
          avatar_url: null,
          bio: "Available",
          created_at: now,
          last_seen: now,
          is_online: true,
        },
        {
          id: "demo-other-user-2",
          username: "sara",
          full_name: "Sara Lee",
          avatar_url: null,
          bio: "At work",
          created_at: now,
          last_seen: now,
          is_online: false,
        },
        {
          id: "demo-other-user-3",
          username: "groupies",
          full_name: "Design Team",
          avatar_url: null,
          bio: "Group chat demo",
          created_at: now,
          last_seen: now,
          is_online: true,
        },
      ];
      set({ contacts: demoContacts, loadingContacts: false, error: null });
      return;
    }

    set({ loadingContacts: true, error: null });
    const { data, error } = await supabaseClient!
      .from("profiles")
      .select("*")
      .neq("id", currentUserId)
      .order("is_online", { ascending: false })
      .limit(50);

    if (error) {
      set({ loadingContacts: false, error: error.message });
      return;
    }

    const profiles = (data ?? []) as Profile[];
    const filteredProfiles = profiles.filter(p => p.id !== AURA_BOT_ID);
    
    const auraBot: Profile = {
      id: AURA_BOT_ID,
      username: "aura",
      full_name: "Aura AI Assistant",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Aura",
      bio: "Your intelligent AI companion. Ask me anything!",
      created_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      is_online: true
    };

    const merged = [auraBot, ...filteredProfiles];
    
    // Strict ID-based deduplication
    const contactMap = new Map();
    merged.forEach(c => {
      if (!contactMap.has(c.id)) contactMap.set(c.id, c);
    });
    const uniqueContacts = Array.from(contactMap.values());

    set({ contacts: uniqueContacts as Profile[], loadingContacts: false });
    void get().fetchContactRequests(currentUserId);
  },

  fetchContactRequests: async (currentUserId: string) => {
    if (!contactRequestsAvailable) {
      const shouldRecheck = Date.now() - contactRequestsLastCheckAt >= CONTACT_REQUESTS_RECHECK_MS;
      if (!shouldRecheck) {
        set({
          contactRelations: buildConnectedRelations(get().contacts),
          incomingRequests: [],
          error: null,
        });
        return;
      }
    }

    if (!isSupabaseConfigured) {
      // Demo mode: keep all contacts directly available.
      set({
        contactRelations: buildConnectedRelations(get().contacts),
        incomingRequests: [],
      });
      return;
    }

    contactRequestsLastCheckAt = Date.now();

    const { data, error } = await (supabaseClient as any)
      .from("contact_requests")
      .select("*")
      .or(`requester_id.eq.${currentUserId},target_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingContactRequestsTableError(error)) {
        contactRequestsAvailable = false;
        set({
          contactRelations: buildConnectedRelations(get().contacts),
          incomingRequests: [],
          error: null, // suppress — table just hasn't been migrated yet
        });
        return;
      }
      // For any other error, don't surface it as a blocking UI error
      set({ error: null });
      return;
    }

    const relations: Record<string, ContactRelation> = {};

    // Existing private chats are always connected.
    get()
      .chats.filter((chat) => chat.type === "private")
      .forEach((chat) => {
        const otherMember = chat.members?.find(
          (member: any) => (member.profile?.id || member.user_id) !== currentUserId,
        );
        const otherId = otherMember?.profile?.id || otherMember?.user_id;
        if (otherId) relations[otherId] = "connected";
      });

    const requests = (data ?? []) as ContactRequest[];
    const incomingPending: ContactRequest[] = [];

    requests.forEach((request) => {
      const otherId =
        request.requester_id === currentUserId
          ? request.target_id
          : request.requester_id;

      if (!otherId || relations[otherId] === "connected") return;

      if (request.status === "accepted") {
        relations[otherId] = "connected";
        return;
      }

      if (request.status !== "pending") return;

      if (request.requester_id === currentUserId) {
        relations[otherId] = "outgoing";
      } else {
        relations[otherId] = "incoming";
        incomingPending.push(request);
      }
    });

    relations[AURA_BOT_ID] = "connected";
    contactRequestsAvailable = true;

    set({ contactRelations: relations, incomingRequests: incomingPending, error: null });
  },

  fetchMessages: async (chatId: string) => {
    if (!isSupabaseConfigured) {
      // Demo messages
      const demoMessages: Message[] = [
        {
          id: `${chatId}-m1`,
          chat_id: chatId,
          sender_id: "demo-user-id",
          content: "Hey there! This is a demo chat.",
          media_url: null,
          created_at: new Date().toISOString(),
          status: "seen",
        },
        {
          id: `${chatId}-m2`,
          chat_id: chatId,
          sender_id: "demo-other-user",
          content: "Supabase is not configured, but the UI still works.",
          media_url: null,
          created_at: new Date().toISOString(),
          status: "delivered",
        },
      ];
      set((state) => ({
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: demoMessages,
        },
        loadingMessages: false,
      }));
      return;
    }

    const cachedMessages = get().messagesByChat[chatId];
    const now = Date.now();
    const hasFreshCache =
      Array.isArray(cachedMessages) &&
      cachedMessages.length > 0 &&
      now - (messageFetchedAt[chatId] ?? 0) < MESSAGE_CACHE_TTL_MS;

    if (hasFreshCache) {
      set({ loadingMessages: false, error: null });
      return;
    }

    const inFlight = messageFetchInFlight.get(chatId);
    if (inFlight) {
      await inFlight;
      return;
    }

    if (!cachedMessages || cachedMessages.length === 0) {
      set({ loadingMessages: true, error: null });
    } else {
      set({ loadingMessages: false, error: null });
    }

    const fetchPromise = (async () => {
      const { data, error } = await supabaseClient!
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) {
        set({ loadingMessages: false, error: error.message });
        return;
      }

      messageFetchedAt[chatId] = Date.now();
      set((state) => ({
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: (data ?? []) as Message[],
        },
        loadingMessages: false,
      }));
    })();

    messageFetchInFlight.set(chatId, fetchPromise);
    try {
      await fetchPromise;
    } finally {
      messageFetchInFlight.delete(chatId);
    }
  },

  sendContactRequest: async ({ currentUserId, contactId }) => {
    if (currentUserId === contactId || contactId === AURA_BOT_ID) return;

    if (!isSupabaseConfigured) {
      set((state) => ({
        contactRelations: {
          ...state.contactRelations,
          [contactId]: "outgoing",
        },
      }));
      return;
    }

    if (!contactRequestsAvailable) {
      await get().openDmWithContact({ currentUserId, contactId });
      return;
    }

    const relation = get().contactRelations[contactId];
    if (relation === "connected" || relation === "outgoing") return;

    const { error } = await (supabaseClient as any)
      .from("contact_requests")
      .upsert(
        {
          requester_id: currentUserId,
          target_id: contactId,
          status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "requester_id,target_id" },
      );

    if (error) {
      if (isMissingContactRequestsTableError(error)) {
        contactRequestsAvailable = false;
        await get().openDmWithContact({ currentUserId, contactId });
        return;
      }
      set({ error: error.message });
      return;
    }

    set((state) => ({
      contactRelations: {
        ...state.contactRelations,
        [contactId]: "outgoing",
      },
    }));
  },

  acceptContactRequest: async ({ currentUserId, requestId, requesterId }) => {
    if (!isSupabaseConfigured) {
      set((state) => ({
        contactRelations: {
          ...state.contactRelations,
          [requesterId]: "connected",
        },
        incomingRequests: state.incomingRequests.filter((request) => request.id !== requestId),
      }));
      await get().openDmWithContact({ currentUserId, contactId: requesterId });
      return;
    }

    if (!contactRequestsAvailable) {
      await get().openDmWithContact({ currentUserId, contactId: requesterId });
      return;
    }

    const { error } = await (supabaseClient as any)
      .from("contact_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("target_id", currentUserId)
      .eq("status", "pending");

    if (error) {
      if (isMissingContactRequestsTableError(error)) {
        contactRequestsAvailable = false;
        await get().openDmWithContact({ currentUserId, contactId: requesterId });
        return;
      }
      set({ error: error.message });
      return;
    }

    set((state) => ({
      contactRelations: {
        ...state.contactRelations,
        [requesterId]: "connected",
      },
      incomingRequests: state.incomingRequests.filter((request) => request.id !== requestId),
    }));

    await get().openDmWithContact({ currentUserId, contactId: requesterId });
  },

  selectChat: (chatId: string | null) => {
    set({ selectedChatId: chatId, replyingToId: null });
  },

  setReplyingTo: (messageId: string | null) => {
    set({ replyingToId: messageId });
  },

  openDmWithContact: async ({ currentUserId, contactId }) => {
    // Demo mode: create a deterministic DM chat id and seed messages
    if (!isSupabaseConfigured) {
      const ids = [currentUserId, contactId].sort();
      const dmId = `dm-${ids.join("-")}`;
      const now = new Date().toISOString();

      // ensure chat exists
      const existing = get().chats.find((c) => c.id === dmId);
      if (!existing) {
        set((state) => ({
          chats: [
            {
              id: dmId,
              type: "private" as const,
              name: null,
              avatar_url: null,
              created_at: now,
              is_group: false,
            } as ChatWithMeta,
            ...state.chats,
          ],
        }));
      }

      set({ selectedChatId: dmId, activeContactId: contactId });

      if (!get().messagesByChat[dmId]) {
        const seeded: Message[] = [
          {
            id: `${dmId}-seed-1`,
            chat_id: dmId,
            sender_id: contactId,
            content: "Hey! This is the contacts → chat layout demo.",
            media_url: null,
            created_at: now,
            status: "delivered",
          },
          {
            id: `${dmId}-seed-2`,
            chat_id: dmId,
            sender_id: currentUserId,
            content:
              "Nice — contacts are on the left, chat is on the right.",
            media_url: null,
            created_at: now,
            status: "seen",
          },
        ];
        set((state) => ({
          messagesByChat: { ...state.messagesByChat, [dmId]: seeded },
        }));
      }
      return;
    }

    if (currentUserId === contactId) return; // Don't chat with yourself

    if (contactId !== AURA_BOT_ID && contactRequestsAvailable) {
      const relation = get().contactRelations[contactId];
      if (relation !== "connected") {
        set({
          error:
            relation === "outgoing"
              ? "Request pending. Wait for acceptance before messaging."
              : "Send a chat request first.",
          activeContactId: contactId,
        });
        return;
      }
    }

    const cachedDmId = dmLookupByPair[getDmPairKey(currentUserId, contactId)];
    if (cachedDmId) {
      set({ selectedChatId: cachedDmId, activeContactId: contactId, error: null });
      void get().fetchMessages(cachedDmId);
      return;
    }

    // Supabase-backed: requires chat creation + membership logic
    try {
      if (contactId === AURA_BOT_ID) {
        const localAuraChat = get().chats.find(
          (chat) => chat.type === "private" && chat.name === "Aura AI Assistant",
        );
        if (localAuraChat) {
          set({ selectedChatId: localAuraChat.id, activeContactId: contactId, error: null });
          void get().fetchMessages(localAuraChat.id);
          return;
        }

        // For fresh projects, Aura bot profile might not exist in `profiles` yet.
        // We keep Aura chats user-owned so opening AI chat never fails on FK checks.
        const { data: existingAuraChat } = await (supabaseClient as any)
          .from("chat_members")
          .select("chat_id, chats!inner(type, name)")
          .eq("user_id", currentUserId)
          .eq("chats.type", "private")
          .eq("chats.name", "Aura AI Assistant")
          .limit(1);

        let auraChatId: string | null = null;
        if (existingAuraChat && existingAuraChat.length > 0) {
          auraChatId = existingAuraChat[0].chat_id;
        }

        if (!auraChatId) {
          const { data: chat, error: cErr } = await (supabaseClient as any)
            .from("chats")
            .insert({
              type: "private",
              name: "Aura AI Assistant",
              avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Aura",
            })
            .select()
            .single();

          if (cErr) throw cErr;
          auraChatId = chat.id;

          const { error: memErr } = await (supabaseClient as any)
            .from("chat_members")
            .insert([{ chat_id: auraChatId, user_id: currentUserId, role: "owner" }]);

          if (memErr) throw memErr;
        }

        cacheDmPair(currentUserId, contactId, auraChatId!);
        set({ selectedChatId: auraChatId, activeContactId: contactId, error: null });
        get().fetchChats(currentUserId);
        get().fetchMessages(auraChatId!);
        return;
      }

      // 1. Fetch all private chats for current user
      const { data: myChats } = await supabaseClient!
        .from("chat_members")
        .select("chat_id, chats!inner(type)")
        .eq("user_id", currentUserId)
        .eq("chats.type", "private");

      // 2. Check if any of those chats also have the contactId
      let chatId: string | null = null;
      if (myChats && (myChats as any[]).length > 0) {
        const chatIds = (myChats as any[]).map(c => c.chat_id);
        const { data: shared } = await supabaseClient!
          .from("chat_members")
          .select("chat_id")
          .in("chat_id", chatIds)
          .eq("user_id", contactId)
          .limit(1); // Pick any if multiple exist
        
        if (shared && shared.length > 0) chatId = (shared[0] as any).chat_id;
      }

      if (!chatId) {
        // Create new private chat
        const { data: chat, error: cErr } = await (supabaseClient as any)
          .from("chats")
          .insert({ type: "private" })
          .select()
          .single();
        if (cErr) throw cErr;
        chatId = chat.id;

        // Add both members
        await (supabaseClient as any).from("chat_members").insert([
          { chat_id: chatId, user_id: currentUserId, role: "owner" },
          { chat_id: chatId, user_id: contactId, role: "member" }
        ]);
      }

      cacheDmPair(currentUserId, contactId, chatId!);
      set({ selectedChatId: chatId, activeContactId: contactId });
      get().fetchChats(currentUserId);
      get().fetchMessages(chatId!);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  sendMessage: async ({ chatId, content, mediaUrl, parentId }) => {
    if (!content && !mediaUrl) return;

    if (!isSupabaseConfigured) {
      // Demo: push message into local state only
      const now = new Date().toISOString();
      const newMessage: Message = {
        id: `${chatId}-${now}`,
        chat_id: chatId,
        sender_id: "demo-user-id",
        content: content || null,
        media_url: mediaUrl ?? null,
        created_at: now,
        status: "sent",
        parent_id: parentId,
      };
      set((state) => {
        const chatMessages = state.messagesByChat[chatId] ?? [];
        return {
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: [...chatMessages, newMessage],
          },
          replyingToId: null,
        };
      });
      return;
    }

    const currentUserId = useAuthStore.getState().userId;
    if (!currentUserId) return;

    const optimisticMessageId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const optimisticMessage: Message = {
      id: optimisticMessageId,
      chat_id: chatId,
      sender_id: currentUserId,
      content: content || null,
      media_url: mediaUrl ?? null,
      parent_id: parentId ?? null,
      created_at: new Date().toISOString(),
      status: "sent",
    };

    set((state) => ({
      replyingToId: null,
      error: null,
      messagesByChat: {
        ...state.messagesByChat,
        [chatId]: [...(state.messagesByChat[chatId] || []), optimisticMessage],
      },
    }));

    const { data, error } = await (supabaseClient as any).from("messages").insert({
      chat_id: chatId,
      sender_id: currentUserId,
      content: content || null,
      media_url: mediaUrl ?? null,
      parent_id: parentId,
    }).select().single();

    if (error) {
      set((state) => ({
        error: error.message,
        messagesByChat: {
          ...state.messagesByChat,
          [chatId]: (state.messagesByChat[chatId] || []).filter(
            (message) => message.id !== optimisticMessageId,
          ),
        },
      }));
    } else {
      set((state) => {
        const replaced = (state.messagesByChat[chatId] || []).map((message) =>
          message.id === optimisticMessageId ? (data as Message) : message,
        );
        const deduped = Array.from(new Map(replaced.map((message) => [message.id, message])).values());

        return {
          replyingToId: null,
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: deduped,
          },
        };
      });
      
      // Check if we are chatting with Aura Bot
      const { activeContactId } = get();
      if (activeContactId === AURA_BOT_ID) {
        void get().generateAiResponse(chatId, content || "");
      }
    }
  },

  generateAiResponse: async (chatId, content) => {
    // AURA_AI_REPLY::: check for direct system messages
    if (content.startsWith("AURA_AI_REPLY:::")) {
      const currentUserId = useAuthStore.getState().userId;
      if (!currentUserId) return;
      await (supabaseClient as any).from("messages").insert({
        chat_id: chatId,
        sender_id: currentUserId,
        content: content
      });
      return;
    }

    // 1. Show typing status
    const { profile } = useAuthStore.getState();
    if (!profile) return;
    
    // Simulate thinking time
    setTimeout(() => {
        get().setTyping(chatId, true, AURA_BOT_ID);
    }, 500);

    try {

        // Fetch up to the last 10 messages for context
        const messages = get().messagesByChat[chatId] || [];
        const validMsgs = messages.filter(m => m.content).slice(-10);
        
        const history: { role: "user" | "assistant" | "system", content: string }[] = validMsgs.map(m => {
            const isBotResponse = m.sender_id === AURA_BOT_ID || m.content!.startsWith("AURA_AI_REPLY:::");
            return {
               role: isBotResponse ? "assistant" : "user",
               content: m.content!.replace("AURA_AI_REPLY:::", "")
            };
        });
        
        // Ensure current prompt is included if state hasn't synced
        if (history.length === 0 || history[history.length - 1].content !== content) {
            history.push({ role: "user", content });
        }

        const response = await generateAssistantReply(history);
        if (response) {
            const currentUserId = useAuthStore.getState().userId;
            const finalPayload = `AURA_AI_REPLY:::${response}`;

            // Save to Supabase — the realtime listener will pick this up and render it once.
            // Do NOT also inject into local state, that causes duplicate messages.
            const { data: savedMsg } = await (supabaseClient as any).from("messages").insert({
                chat_id: chatId,
                sender_id: currentUserId, 
                content: finalPayload
            }).select().single();

            // If realtime is not connected (edge case), fall back to manually injecting
            if (savedMsg) {
                const existing = get().messagesByChat[chatId] || [];
                const alreadyRendered = existing.some((m: any) => m.id === savedMsg.id);
                if (!alreadyRendered) {
                    set((state) => ({
                        messagesByChat: {
                            ...state.messagesByChat,
                            [chatId]: [...(state.messagesByChat[chatId] || []), savedMsg]
                        }
                    }));
                }
            }
        }
    } catch (err) {
        console.error("AI Assistant Error:", err);
    } finally {
        get().setTyping(chatId, false, AURA_BOT_ID);
    }
  },

  addReaction: async (messageId, emoji, userId) => {
    // In demo mode or if Supabase is configured, we update local state for reactions
    set((state) => {
      const updatedByChat: Record<string, Message[]> = {};
      for (const [chatId, messages] of Object.entries(state.messagesByChat)) {
        updatedByChat[chatId] = messages.map((m) => {
          if (m.id !== messageId) return m;

          const reactions = { ...(m.reactions || {}) };
          const users = [...(reactions[emoji] || [])];

          if (users.includes(userId)) {
            // Remove reaction if already reacted
            reactions[emoji] = users.filter((u) => u !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            // Add reaction
            reactions[emoji] = [...users, userId];
          }

          return { ...m, reactions };
        });
      }
      return { messagesByChat: updatedByChat };
    });

    if (isSupabaseConfigured) {
      // In a real app, we'd update the DB. 
      // This usually needs a specialized RPC or complex JSONB update.
      // For now, we update local state which is reflected by realtime handler if other users react.
    }
  },

  updateMessageStatus: async (messageId, status) => {
    set((state) => {
      const updatedByChat: Record<string, Message[]> = {};
      for (const [chatId, messages] of Object.entries(state.messagesByChat)) {
        updatedByChat[chatId] = messages.map((m) =>
          m.id === messageId ? { ...m, status } : m,
        );
      }
      return { messagesByChat: updatedByChat };
    });

    if (isSupabaseConfigured) {
      await (supabaseClient as any).from("messages").update({ status }).eq("id", messageId);
    }
  },

  deleteChat: async (chatId) => {
    // Optimistic UI: remove from state immediately
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      selectedChatId: state.selectedChatId === chatId ? null : state.selectedChatId,
      messagesByChat: (() => {
        const copy = { ...state.messagesByChat };
        delete copy[chatId];
        return copy;
      })(),
    }));

    if (isSupabaseConfigured) {
      try {
        // Delete messages first, then the chat (cascade should handle this but being explicit)
        await supabaseClient!.from("messages").delete().eq("chat_id", chatId);
        await supabaseClient!.from("chat_members").delete().eq("chat_id", chatId);
        await supabaseClient!.from("chats").delete().eq("id", chatId);
      } catch (err: any) {
        console.error("Delete chat error:", err);
      }
    }
  },

  uploadMedia: async (file, ext) => {
    if (!isSupabaseConfigured) {
      return URL.createObjectURL(file);
    }
    
    // Determine content-type
    let contentType = 'application/octet-stream';
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') contentType = 'image/png'; // simplified
    if (ext === 'webm' || ext === 'mp3') contentType = 'audio/webm';
    
    if (file instanceof Blob && file.type) {
      contentType = file.type;
    }

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { data, error } = await supabaseClient!.storage
      .from("chat-media")
      .upload(fileName, file, { contentType });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: { publicUrl } } = supabaseClient!.storage.from("chat-media").getPublicUrl(data.path);
    return publicUrl;
  },

  setTyping: (chatId, isTyping, userId) => {
    const typingKey = `${chatId}:${userId}`;
    set((state) => ({
      typingByUser: {
        ...state.typingByUser,
        [typingKey]: isTyping,
      },
    }));

    if (isSupabaseConfigured) {
      typingBroadcastChannel?.send({
        type: "broadcast",
        event: "typing",
        payload: {
          chatId,
          fromUserId: userId,
          isTyping,
        },
      });
    }
  },
  createGroup: async ({ name, userIds, ownerId }) => {
    if (!isSupabaseConfigured) {
      const gId = `group-${Date.now()}`;
      set((state) => ({
        chats: [
          {
            id: gId,
            type: "group" as const,
            name,
            avatar_url: null,
            created_at: new Date().toISOString(),
            is_group: true,
          } as ChatWithMeta,
          ...state.chats,
        ],
      }));
      return gId;
    }

    try {
      // 1. Create chat
      const { data: chat, error: chatErr } = await (supabaseClient as any)
        .from("chats")
        .insert({ type: "group", name })
        .select()
        .single();

      if (chatErr) throw chatErr;

      // 2. Add members
      const allMembers = [ownerId, ...userIds].map(uid => ({
        chat_id: chat.id,
        user_id: uid,
        role: uid === ownerId ? "owner" : "member"
      }));

      const { error: memErr } = await (supabaseClient as any)
        .from("chat_members")
        .insert(allMembers);

      if (memErr) throw memErr;

      return chat.id;
    } catch (err: any) {
      console.error("Group creation error:", err);
      // Ensure we get a string message
      const errorMsg = err.message || JSON.stringify(err) || "Unknown error";
      set({ error: errorMsg });
    }
  },
  searchUsers: async (query: string) => {
    if (!query || query.length < 3) return [];
    if (!isSupabaseConfigured) return [];

    const { data, error } = await supabaseClient!
      .from("profiles")
      .select("*")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error("Search Error:", error);
      return [];
    }
    return (data ?? []) as Profile[];
  },
}));

