"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, AURA_BOT_ID } from "@/store/chatStore";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { generateSummary } from "@/lib/ai/gemini";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { ContactsList } from "@/components/chat/ContactsList";
import { ChatList } from "@/components/chat/ChatList";
import { CreateGroupModal } from "@/components/chat/CreateGroupModal";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { useState } from "react";
import { useCommunicationPrefsStore } from "@/store/communicationPrefsStore";
import { useSettingsStore, type ChatBackgroundTemplate } from "@/store/settingsStore";
import { requestNotificationPermission, sendPushNotification } from "@/lib/notifications";
import type { Message, Profile as ProfileType } from "@/types/database";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const profile = useAuthStore((state) => state.profile);
  const init = useAuthStore((state) => state.init);
  const signOut = useAuthStore((state) => state.signOut);
  const initialized = useAuthStore((state) => state.initialized);
  const authError = useAuthStore((state) => state.error);

  const chats = useChatStore((state) => state.chats);
  const contacts = useChatStore((state) => state.contacts);
  const contactRelations = useChatStore((state) => state.contactRelations);
  const incomingRequests = useChatStore((state) => state.incomingRequests);
  const messagesByChat = useChatStore((state) => state.messagesByChat);
  const selectedChatId = useChatStore((state) => state.selectedChatId);
  const selectChat = useChatStore((state) => state.selectChat);
  const [chatSummary, setChatSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const activeContactId = useChatStore((state) => state.activeContactId);
  const typingByUser = useChatStore((state) => state.typingByUser);
  const loadingChats = useChatStore((state) => state.loadingChats);
  const loadingContacts = useChatStore((state) => state.loadingContacts);
  const loadingMessages = useChatStore((state) => state.loadingMessages);
  const error = useChatStore((state) => state.error);
  const initRealtime = useChatStore((state) => state.initRealtime);
  const fetchChats = useChatStore((state) => state.fetchChats);
  const fetchContacts = useChatStore((state) => state.fetchContacts);
  const fetchContactRequests = useChatStore((state) => state.fetchContactRequests);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const openDmWithContact = useChatStore((state) => state.openDmWithContact);
  const sendContactRequest = useChatStore((state) => state.sendContactRequest);
  const acceptContactRequest = useChatStore((state) => state.acceptContactRequest);
  const updateMessageStatus = useChatStore((state) => state.updateMessageStatus);
  const generateAiResponse = useChatStore((state) => state.generateAiResponse);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const busyMode = useCommunicationPrefsStore((state) => state.busyMode);
  const autoSmartReply = useCommunicationPrefsStore((state) => state.autoSmartReply);
  const setBusyMode = useCommunicationPrefsStore((state) => state.setBusyMode);
  const setAutoSmartReply = useCommunicationPrefsStore((state) => state.setAutoSmartReply);
  const hydrateCommunicationPrefs = useCommunicationPrefsStore((state) => state.hydrate);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const brightness = useSettingsStore((state) => state.brightness);
  const chatBackgroundTemplate = useSettingsStore((state) => state.chatBackgroundTemplate);
  const notificationSettings = useSettingsStore((state) => state.notifications);
  const featureSettings = useSettingsStore((state) => state.features);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const setBrightness = useSettingsStore((state) => state.setBrightness);
  const setChatBackgroundTemplate = useSettingsStore((state) => state.setChatBackgroundTemplate);
  const setNotificationSetting = useSettingsStore((state) => state.setNotificationSetting);
  const setFeatureSetting = useSettingsStore((state) => state.setFeatureSetting);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [modalProfile, setModalProfile] = useState<any>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!userId) return;
    fetchChats(userId).catch(() => undefined);
    fetchContacts(userId).catch(() => undefined);
    fetchContactRequests(userId).catch(() => undefined);
    initRealtime(userId);
    hydrateCommunicationPrefs(userId);
    hydrateSettings(userId);
    
    // Request notification permissions
    requestNotificationPermission().catch(console.error);
  }, [userId, fetchChats, fetchContacts, fetchContactRequests, initRealtime, hydrateCommunicationPrefs, hydrateSettings]);

  useEffect(() => {
    if (!userId) return;
    fetchContactRequests(userId).catch(() => undefined);
  }, [userId, chats, fetchContactRequests]);

  // Handle new messages for push notifications
  useEffect(() => {
    if (!selectedChatId || !userId) return;
    const messages = messagesByChat[selectedChatId] || [];
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.sender_id !== userId && lastMessage.status === 'sent') {
      const sender = contacts.find(c => c.id === lastMessage.sender_id);
      sendPushNotification(`New message from ${sender?.full_name || 'Aura User'}`, {
        body: lastMessage.content || "Media attachment",
      });
    }
  }, [messagesByChat, selectedChatId, userId, contacts]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  const chatBackgroundStyleByTemplate: Record<ChatBackgroundTemplate, string> = themeMode === "light"
    ? {
        aurora:
          "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.12), transparent 40%), radial-gradient(circle at 80% 10%, rgba(59,130,246,0.10), transparent 35%), linear-gradient(180deg, #eef2ff 0%, #f0f4ff 100%)",
        "midnight-grid":
          "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(180deg, #f0f4ff 0%, #e8f0fe 100%)",
        sunrise:
          "radial-gradient(circle at 20% 10%, rgba(251,191,36,0.18), transparent 35%), radial-gradient(circle at 80% 20%, rgba(244,114,182,0.15), transparent 30%), linear-gradient(180deg, #fefce8 0%, #fdf4ff 100%)",
        "ocean-mist":
          "radial-gradient(circle at 15% 20%, rgba(34,211,238,0.14), transparent 35%), radial-gradient(circle at 75% 25%, rgba(56,189,248,0.12), transparent 30%), linear-gradient(180deg, #ecfeff 0%, #f0f9ff 100%)",
        clean: "linear-gradient(180deg, #f8faff 0%, #f0f4ff 100%)",
      }
    : {
        aurora:
          "radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 40%), radial-gradient(circle at 80% 10%, rgba(99,102,241,0.16), transparent 35%), linear-gradient(180deg, #020617 0%, #0a1328 100%)",
        "midnight-grid":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(180deg, #020617 0%, #0a1020 100%)",
        sunrise:
          "radial-gradient(circle at 20% 10%, rgba(251,191,36,0.25), transparent 35%), radial-gradient(circle at 80% 20%, rgba(244,114,182,0.2), transparent 30%), linear-gradient(180deg, #1f2937 0%, #0f172a 100%)",
        "ocean-mist":
          "radial-gradient(circle at 15% 20%, rgba(34,211,238,0.2), transparent 35%), radial-gradient(circle at 75% 25%, rgba(56,189,248,0.18), transparent 30%), linear-gradient(180deg, #0b1324 0%, #0c1e33 100%)",
        clean: "linear-gradient(180deg, #0b1220 0%, #0f172a 100%)",
      };

  const currentMessages = selectedChatId
    ? messagesByChat[selectedChatId] ?? []
    : [];

  // Auto-scroll when new messages arrive — only if already near the bottom
  useEffect(() => {
    if (!currentMessages.length) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) scrollToBottom("smooth");
  }, [currentMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom instantly when switching chats
  useEffect(() => {
    if (selectedChatId) setTimeout(() => scrollToBottom("instant" as ScrollBehavior), 50);
  }, [selectedChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeChat = useMemo(() => chats.find(c => c.id === selectedChatId) || null, [chats, selectedChatId]);

  const activeContact = useMemo(() => {
    // 1. If we have a selected chat, find the partner
    if (activeChat?.type === 'private') {
      const otherMember = activeChat.members?.find((m: any) => (m.profile?.id || m.user_id) !== userId);
      const partnerProfile = otherMember?.profile || contacts.find(c => c.id === otherMember?.user_id);
      if (partnerProfile) return partnerProfile;
    }
    // 2. Fallback to activeContactId (from direct contact click)
    if (activeContactId) {
      return contacts.find((c) => c.id === activeContactId) ?? null;
    }
    return null;
  }, [activeContactId, activeChat, contacts, userId, selectedChatId]);


  useEffect(() => {
    if (initialized && !userId) {
      router.replace("/signin");
    }
  }, [initialized, userId, router]);

  useEffect(() => {
    if (selectedChatId) {
      fetchMessages(selectedChatId).catch(() => undefined);
    }
  }, [selectedChatId, fetchMessages]);

  useEffect(() => {
    if (!selectedChatId || !userId) return;
    const messages = messagesByChat[selectedChatId] || [];
    
    // Find messages sent by others that are not 'seen'
    const unreadIds = messages
      .filter(m => m.sender_id !== userId && m.status !== 'seen')
      .map(m => m.id);

    unreadIds.forEach(id => {
      void updateMessageStatus(id, "seen");
    });
  }, [selectedChatId, userId, messagesByChat, updateMessageStatus]);

  // Aura Auto-Reply Service: Monitors stalling conversations with human contacts
  useEffect(() => {
    if (!selectedChatId || !userId || !activeContact || activeContact.id === AURA_BOT_ID) return;
    
    if (currentMessages.length === 0) return;
    const lastMsg = currentMessages[currentMessages.length - 1];
    
    // Condition: User sent the last message and the partner is offline/slow
    if (lastMsg.sender_id !== userId) return;

    const timer = setTimeout(() => {
      if (!activeContact.is_online) {
        const nudgeContent = `AURA_AI_REPLY:::${activeContact.full_name} is currently offline. I am Aura, your assistant. While you wait, would you like me to summarize this chat or help you with something else?`;
        
        // Inject system-level assistance message directly to help the user
        // We only trigger if the user hasn't sent another message in the last 20s
        void generateAiResponse(selectedChatId, nudgeContent);
      }
    }, 25000); // 25s threshold for "stalled" conversation
    
    return () => clearTimeout(timer);
  }, [selectedChatId, currentMessages, userId, activeContact, generateAiResponse]);

  const typingSomeone =
    selectedChatId &&
    Object.entries(typingByUser).some(
      ([key, value]) => value && (key === `${selectedChatId}:${activeContactId}` || key.startsWith(`${selectedChatId}:`))
    );

  const getSenderProfile = (senderId: string) => {
    if (senderId === userId) return profile;
    return contacts.find(c => c.id === senderId) || null;
  };

  const getUnreadCount = (chatId: string) => {
    const msgs = messagesByChat[chatId] || [];
    return msgs.filter(m => m.sender_id !== userId && m.status !== 'seen').length;
  };

  const handleSendRequest = async (contactId: string) => {
    if (!userId) return;
    await sendContactRequest({ currentUserId: userId, contactId });
  };

  const handleAcceptRequest = async (contactId: string) => {
    if (!userId) return;
    const incoming = incomingRequests.find((request) => request.requester_id === contactId);
    if (!incoming) return;
    await acceptContactRequest({
      currentUserId: userId,
      requestId: incoming.id,
      requesterId: contactId,
    });
  };

  const handleSummarize = async () => {
    if (!selectedChatId) return;
    setIsSummarizing(true);
    try {
      const messages = messagesByChat[selectedChatId] || [];
      const context = messages.map(m => `${m.sender_id === userId ? 'Me' : 'Them'}: ${m.content}`).join('\n');
      const summary = await generateSummary(context);
      setChatSummary(summary);
    } catch (err) {
      console.error("Summarization failed", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChatId) return;
    await deleteChat(selectedChatId);
    setIsOptionsOpen(false);
    setIsConfirmingDelete(false);
  };

  if (!initialized || (initialized && userId && !profile && !authError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
          <p className="text-sm font-medium text-slate-400 tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError && !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-slate-200">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6 border border-white/5 bg-white/5 rounded-3xl">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-bold text-white text-lg">Failed to load profile</p>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{authError}</p>
          <button
            onClick={() => { signOut(); router.replace("/signin"); }}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // If initialized and no userId/profile, the useEffect above will redirect,
  // but we should avoid rendering the main UI.
  if (!userId || !profile) return null;

  return (
    <div
      className={`flex h-screen font-sans selection:bg-blue-500/30 overflow-hidden relative ${themeMode === "light" ? "text-slate-800" : "text-slate-50"}`}
      style={{
        backgroundImage: chatBackgroundStyleByTemplate[chatBackgroundTemplate],
        backgroundSize: chatBackgroundTemplate === "midnight-grid" ? "24px 24px, 24px 24px, auto" : "cover",
      }}
    >
      {/* Enhanced Multi-Layered Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-violet-600/5 blur-[100px] rounded-full animate-pulse [animation-delay:4s]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>

      {/* Desktop / tablet layout */}
      <div className={`hidden h-screen w-full max-w-[320px] flex-col border-r ${themeMode === 'light' ? 'border-black/7 bg-white/80' : 'border-white/5 bg-white/[0.01]'} backdrop-blur-3xl md:flex z-10`}>
        <header className="flex flex-col gap-6 px-6 py-8">
          {/* Profile Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                onClick={() => {
                  setModalProfile(profile);
                  setIsOwnProfile(true);
                  setIsProfileModalOpen(true);
                }}
                className="relative group cursor-pointer transition-transform hover:scale-105"
              >
                <ProfileAvatar profile={profile} isOwnProfile size="md" />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-[#020617] rounded-full animate-pulse-green shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-black text-white tracking-tight leading-none mb-1.5 hover:text-blue-400 transition-colors cursor-pointer" onClick={() => { setModalProfile(profile); setIsOwnProfile(true); setIsProfileModalOpen(true); }}>
                  {profile.full_name ?? "Aura User"}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Active Status
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              type="button"
              title="Aura Settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '40px',
                width: '40px',
                borderRadius: '12px',
                border: themeMode === 'light' ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.15)',
                background: themeMode === 'light' ? '#eef2ff' : 'rgba(255,255,255,0.05)',
                color: themeMode === 'light' ? '#4f46e5' : '#94a3b8',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 20.6a1.7 1.7 0 0 0-1 .4 1.7 1.7 0 0 0-.5.9 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1.5-1.3 1.7 1.7 0 0 0-1 .4l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.4-1 1.7 1.7 0 0 0-.9-.5 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.3-1.5 1.7 1.7 0 0 0-.4-1l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.4 1.7 1.7 0 0 0 .5-.9 2 2 0 1 1 4 0 1.7 1.7 0 0 0 1.5 1.3 1.7 1.7 0 0 0 1-.4l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.33.34.71.4 1.1a2 2 0 1 1 0 4c-.39.06-.77.2-1.1.4z" />
              </svg>
            </button>
          </div>



          {/* Create Group Button */}
          <button
            type="button"
            onClick={() => setIsGroupModalOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 group relative overflow-hidden h-12 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-300 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-0.5 active:scale-95"
          >
            <div className="flex items-center justify-center p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 group-hover:text-slate-200 transition-colors">Create Group</span>
          </button>
        </header>

        {/* Search Bar */}
        <div className="px-6 mb-8 mt-2">
          <div className="relative group">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-white/5 bg-white/[0.02] px-11 py-3.5 text-xs font-black tracking-widest text-slate-100 placeholder:text-slate-600 transition-all focus:bg-white/[0.04] focus:border-blue-500/30 focus:outline-none focus:ring-4 focus:ring-blue-500/5 glow-border"
            />
            <div className="absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-20">
          <div className="mb-8 px-2">
            <button
              onClick={() => openDmWithContact({ currentUserId: userId, contactId: AURA_BOT_ID })}
              className="group relative w-full overflow-hidden rounded-2xl p-px transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 opacity-80" />
              <div className="relative flex items-center gap-4 bg-navy-deep/40 px-5 py-4 backdrop-blur-3xl transition-colors group-hover:bg-transparent">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-black uppercase tracking-widest text-white">Aura AI Assistant</span>
                  <span className="text-[9px] font-bold text-blue-200/60 uppercase tracking-widest">Always Online</span>
                </div>
              </div>
            </button>
          </div>

          {loadingChats || loadingContacts ? (
            <div className="flex flex-col gap-6 py-10 items-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500/10 border-t-blue-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Syncing Aura...</span>
            </div>
          ) : (
            <div className="space-y-6">
              <ChatList
                chats={chats.filter(c =>
                  c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.type === 'private' && searchQuery === "")
                )}
                selectedChatId={selectedChatId}
                onSelect={(chatId) => selectChat(chatId)}
                getUnreadCount={getUnreadCount}
              />

              <div className="px-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">
                  {searchQuery ? "Found Contacts" : "People"}
                </h3>
                <ContactsList
                  contacts={(() => {
                    const activePartnerIds = chats
                      .filter(c => c.type === 'private')
                      .flatMap(c => (c.members || []).map(m => m.profile?.id || m.user_id))
                      .filter(id => id && id !== userId);

                    return contacts.filter(c => {
                      if (activePartnerIds.includes(c.id)) return false;
                      if (!searchQuery) return true;
                      return (
                        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.username?.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                    });
                  })()}
                  activeContactId={activeContactId}
                  relationByContactId={contactRelations}
                  onMessage={(contactId) => {
                    setSearchQuery("");
                    void openDmWithContact({ currentUserId: userId, contactId });
                  }}
                  onSendRequest={(contactId) => {
                    setSearchQuery("");
                    void handleSendRequest(contactId);
                  }}
                  onAcceptRequest={(contactId) => {
                    setSearchQuery("");
                    void handleAcceptRequest(contactId);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <footer className="p-6 mt-auto">
          <div className="relative group/logout">
            <div className="absolute inset-0 bg-red-500/0 blur-2xl rounded-2xl group-hover/logout:bg-red-500/5 transition-all duration-700" />
            <button
              type="button"
              onClick={() => signOut().then(() => router.replace("/signin"))}
              className="relative flex w-full items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 active:scale-95 overflow-hidden"
            >
              <svg className="w-4 h-4 transition-transform group-hover/logout:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout Session
            </button>
          </div>
        </footer>
      </div>

      {/* Right panel / main chat */}
      {/* Right panel / main chat */}
      <div className="flex h-full flex-1 flex-col bg-transparent relative overflow-hidden min-h-0">
        <header className={`flex-none h-[72px] flex items-center justify-between px-8 backdrop-blur-3xl z-10 border-b ${themeMode === 'light' ? 'border-black/7 bg-white/70' : 'border-white/5'}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              {selectedChatId && activeContact && (
                <div className="relative">
                  <div
                    className="relative cursor-pointer group"
                    onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
                  >
                    <ProfileAvatar profile={activeContact} size="md" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-navy-deep ${activeContact.is_online ? 'bg-emerald-500 animate-pulse-green' : 'bg-slate-600'}`} />
                  </div>

                  {/* Header Dropdown */}
                  {isHeaderDropdownOpen && (
                    <div className="absolute top-14 left-0 w-56 rounded-2xl border border-white/10 bg-navy-deep/95 p-2 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                      <button
                        onClick={() => {
                          setModalProfile(activeContact);
                          setIsOwnProfile(false);
                          setIsProfileModalOpen(true);
                          setIsHeaderDropdownOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        View Profile
                      </button>
                      <button
                        onClick={() => setIsHeaderDropdownOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Mute Chat
                      </button>
                      <div className="my-1 h-px bg-white/5 mx-2" />
                      <button
                        onClick={() => setIsHeaderDropdownOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Block User
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white tracking-tight">
                  {selectedChatId
                    ? activeChat?.type === 'group' 
                      ? activeChat.name 
                      : activeContact?.full_name ?? activeContact?.username ?? "Chat"
                    : "Messages"}
                </span>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider">
                  {typingSomeone ? (
                    <div className="flex items-center gap-1">
                      <span className="text-blue-400">Typing</span>
                      <div className="flex gap-1 mt-1">
                        <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 rounded-full bg-blue-400 animate-bounce" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500">
                      {selectedChatId
                        ? (activeContact?.is_online ? "Active Now" : "Offline")
                        : "Select a chat to begin"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {selectedChatId && (
              <div className="hidden items-center gap-2 sm:flex">
                <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-slate-400 transition-all hover:bg-white/[0.05] hover:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-slate-400 transition-all hover:bg-white/[0.05] hover:text-blue-400 active:scale-90"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {isOptionsOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => { setIsOptionsOpen(false); setIsConfirmingDelete(false); }} 
                      />
                      <div className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 bg-navy-deep/95 p-2 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        {isConfirmingDelete ? (
                          <div className="px-3 py-2">
                            <p className="text-[11px] font-black uppercase tracking-wider text-zinc-300 mb-3">Are you sure?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={handleDeleteChat}
                                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 transition-all active:scale-95"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setIsConfirmingDelete(false)}
                                className="flex-1 rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wider text-slate-300 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { setIsOptionsOpen(false); void handleSummarize(); }}
                              disabled={isSummarizing}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-50"
                            >
                              {isSummarizing ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent mx-auto shrink-0" />
                              ) : (
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                              )}
                              {isSummarizing ? "Running..." : "Summarize Chat"}
                            </button>
                            <div className="my-1 h-px bg-white/5 mx-2" />
                            <button
                              onClick={() => setIsConfirmingDelete(true)}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete Chat
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile: contacts screen when no chat selected */}
        {!selectedChatId && (
          <div className="flex-1 overflow-y-auto md:hidden scroll-smooth custom-scrollbar px-6 pt-10 pb-10">
            <header className="flex items-center justify-between mb-10 px-2 transition-all duration-700">
              <div className="flex items-center gap-5">
                <div
                  onClick={() => {
                    setModalProfile(profile);
                    setIsOwnProfile(true);
                    setIsProfileModalOpen(true);
                  }}
                  className="relative group cursor-pointer ring-offset-4 ring-offset-navy-deep hover:ring-2 ring-white/10 rounded-full transition-all"
                >
                  <ProfileAvatar profile={profile} isOwnProfile size="md" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-navy-deep rounded-full animate-pulse-green shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-white tracking-tight leading-none mb-1.5">{profile.full_name ?? "Me"}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none opacity-60">My Profile</span>
                </div>
              </div>
            </header>

            <div className="mb-10 px-2">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search Aura..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[24px] border border-white/5 bg-white/[0.03] px-12 py-4.5 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 focus:bg-white/[0.05] transition-all duration-300 shadow-2xl"
                />
                <div className="absolute left-5 top-5 text-slate-600 group-focus-within:text-blue-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {/* Mobile Active Chats */}
              <section>
                <ChatList
                  chats={chats.filter(c =>
                    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  )}
                  selectedChatId={selectedChatId}
                  onSelect={(chatId) => selectChat(chatId)}
                  getUnreadCount={getUnreadCount}
                />
              </section>

              {/* Mobile Contact List */}
              <section className="px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-5 pl-2">Available Contacts</h3>
                {loadingContacts ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
                  </div>
                ) : (
                  <ContactsList
                    contacts={(() => {
                      const activePartnerIds = chats
                        .filter(c => c.type === 'private')
                        .flatMap(c => (c.members || []).map(m => m.user_id))
                        .filter(id => id !== userId);
                      
                      return contacts.filter(c => 
                        !activePartnerIds.includes(c.id) &&
                        (c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.username?.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                    })()}
                    activeContactId={activeContactId}
                    relationByContactId={contactRelations}
                    onMessage={(contactId) => {
                      void openDmWithContact({ currentUserId: userId, contactId });
                    }}
                    onSendRequest={(contactId) => {
                      void handleSendRequest(contactId);
                    }}
                    onAcceptRequest={(contactId) => {
                      void handleAcceptRequest(contactId);
                    }}
                  />
                )}
              </section>
            </div>
          </div>
        )}

        {/* Message Content Area */}
        {selectedChatId ? (
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 pb-10 scroll-smooth custom-scrollbar relative"
            >
              {loadingMessages ? (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500/10 border-t-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Loading History...</span>
                </div>
              ) : currentMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-8 text-center px-8">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative h-32 w-32 rounded-[40px] bg-white/[0.03] backdrop-blur-2xl flex items-center justify-center text-5xl shadow-2xl border border-white/10 ring-1 ring-white/20">
                      ✨
                    </div>
                  </motion.div>
                  <div className="max-w-xs space-y-3">
                    <p className="text-2xl font-black text-white tracking-tight">Your Direct Portal</p>
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] opacity-80">Aura Encrypted Socket</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold uppercase tracking-widest opacity-60 pt-4">Send a secure message to initiate sync.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 mx-auto max-w-4xl pb-10 w-full">
                  {currentMessages.map((m, idx) => {
                    const prevMsg = currentMessages[idx - 1];
                    const nextMsg = currentMessages[idx + 1];
                    const showDate = !prevMsg ||
                      new Date(m.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
                    
                    const isLastInGroup = !nextMsg || nextMsg.sender_id !== m.sender_id;
                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== m.sender_id;

                    return (
                      <div key={m.id} className={`${isFirstInGroup ? 'mt-2' : 'mt-0.5'} animate-fade-in`} style={{ animationDelay: `${idx * 10}ms` }}>
                        {showDate && (
                          <div className="flex items-center my-2 gap-6">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="px-5 py-2 rounded-full bg-white/[0.03] border border-white/5 backdrop-blur-md shadow-2xl">
                              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 whitespace-nowrap">
                                {new Date(m.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                          </div>
                        )}
                        <MessageBubble
                          message={m}
                          isOwn={m.sender_id === userId}
                          sender={getSenderProfile(m.sender_id)}
                          parentMessage={m.parent_id ? currentMessages.find(pm => pm.id === m.parent_id) : null}
                          showAvatar={isLastInGroup && m.sender_id !== userId}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Typing Indicator */}
                  {typingSomeone && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-4 py-2 mt-2"
                    >
                      <div className="flex gap-1.5 p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/5 ring-1 ring-white/10">
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-bounce" />
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">
                           {activeContact?.full_name || 'Someone'} is typing...
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Scroll bottom button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-24 right-8 z-20 h-11 w-11 rounded-2xl bg-white/10 text-white backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 13l-7 7-7-7" />
                </svg>
              </button>
            )}

            <div className="flex-none">
              <MessageInput chatId={selectedChatId!} />
            </div>
          </div>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center gap-8 text-center md:flex bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">

            <div className="relative group">
              <div className="absolute inset-0 blur-[60px] bg-blue-500/10 rounded-full group-hover:bg-blue-500/15 transition-all duration-700" />
              <div className="relative h-28 w-28 rounded-[2rem] glass-card flex items-center justify-center text-5xl shadow-2xl border-white/10 transition-transform duration-500 hover:scale-105">
                <span className="drop-shadow-lg">📡</span>
              </div>
            </div>
            <div className="space-y-3 px-12 max-w-md">
              <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">Your Messages</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Stay connected with your friends and team in real-time.
              </p>
            </div>

          </div>
        )}

        {error && (
          <div className="fixed bottom-24 right-4 max-w-sm rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 backdrop-blur-md shadow-2xl animate-in slide-in-from-right-8 duration-300">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-rose-950 shrink-0">!</div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-widest">Connection Error</span>
                <span className="text-xs text-rose-200/80 leading-relaxed">{error}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {modalProfile && (
        <ProfileModal
          profile={modalProfile as ProfileType}
          isOpen={isProfileModalOpen}
          isOwnProfile={isOwnProfile}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        contacts={contacts}
      />

      {isSettingsOpen && (
        <div className={`fixed inset-0 z-[70] backdrop-blur-md p-4 sm:p-8 ${themeMode === 'light' ? 'bg-indigo-900/10' : 'bg-[#020617]/80'}`}>
          <div className={`mx-auto h-full w-full max-w-4xl overflow-y-auto rounded-[28px] border shadow-2xl p-6 ${themeMode === 'light' ? 'border-black/8 bg-white/97' : 'border-white/10 bg-navy-deep/95'}`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-white">Chat Settings</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Notifications, features, theme, and backgrounds</p>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${themeMode === 'light' ? 'border-indigo-100 text-slate-800 hover:bg-slate-100' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
                type="button"
              >
                Close
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-blue-300">Notification Settings</h4>
                <div className="space-y-3">
                  {[
                    ["message", "Message notifications"],
                    ["group", "Group notifications"],
                    ["system", "System alerts"],
                    ["sound", "Notification sound"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <span className="text-sm text-slate-200">{label}</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings[key as "message" | "group" | "system" | "sound"]}
                        onChange={(e) => setNotificationSetting(key as "message" | "group" | "system" | "sound", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Feature Toggles</h4>
                <div className="space-y-3">
                  {[
                    ["aiSuggestions", "AI smart suggestions"],
                    ["voiceMessages", "Voice messages"],
                    ["autoSmartReply", "Auto smart reply"],
                    ["messageCustomization", "Message customization"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
                      <span className="text-sm text-slate-200">{label}</span>
                      <input
                        type="checkbox"
                        checked={featureSettings[key as "aiSuggestions" | "voiceMessages" | "autoSmartReply" | "messageCustomization"]}
                        onChange={(e) => setFeatureSetting(key as "aiSuggestions" | "voiceMessages" | "autoSmartReply" | "messageCustomization", e.target.checked)}
                        className="h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:col-span-2">
                <h4 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-amber-300">Theme and Brightness</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Mode</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setThemeMode("dark")}
                        className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wider ${themeMode === "dark" ? "border-blue-400/40 bg-blue-500/10 text-blue-300" : "border-white/10 text-slate-300"}`}
                        type="button"
                      >
                        Dark
                      </button>
                      <button
                        onClick={() => setThemeMode("light")}
                        className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wider ${themeMode === "light" ? "border-amber-400/40 bg-amber-500/10 text-amber-300" : "border-white/10 text-slate-300"}`}
                        type="button"
                      >
                        Light
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 p-4" style={{ background: chatBackgroundStyleByTemplate[chatBackgroundTemplate] }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-3">Profile Theme Preview</p>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.15] p-3 backdrop-blur-md">
                      <ProfileAvatar profile={profile} size="md" />
                      <div>
                        <p className="text-sm font-bold text-white">{profile.full_name ?? "Aura User"}</p>
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-200">{themeMode === "light" ? "Light Surface" : "Dark Surface"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:col-span-2">
                <h4 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300">Chat Background Templates</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {([
                    ["aurora", "Aurora"],
                    ["midnight-grid", "Midnight Grid"],
                    ["sunrise", "Sunrise"],
                    ["ocean-mist", "Ocean Mist"],
                    ["clean", "Clean"],
                  ] as [ChatBackgroundTemplate, string][]).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setChatBackgroundTemplate(value)}
                      className={`rounded-2xl border p-2 text-left transition-all ${chatBackgroundTemplate === value ? "border-blue-400/50 ring-2 ring-blue-500/20" : "border-white/10"}`}
                      type="button"
                    >
                      <div className="h-20 rounded-xl" style={{ backgroundImage: chatBackgroundStyleByTemplate[value], backgroundSize: value === "midnight-grid" ? "18px 18px, 18px 18px, auto" : "cover" }} />
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-300">{label}</p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      {/* Summary Modal */}
      {chatSummary && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020617]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-navy-deep/90 p-8 shadow-2xl relative overflow-hidden ring-1 ring-blue-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Chat Insights</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Gemini AI Model</p>
              </div>
            </div>

            <div className="relative bg-white/[0.03] rounded-3xl p-6 border border-white/5 mb-8">
               <p className="text-slate-300 leading-relaxed text-[15px] font-medium italic">
                "{chatSummary}"
               </p>
            </div>

            <button
              onClick={() => setChatSummary(null)}
              className="w-full rounded-2xl bg-white text-[#020617] py-4 text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
            >
              Back to Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

