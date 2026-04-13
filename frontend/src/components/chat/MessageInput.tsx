
"use client";

import { useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { generateSmartReplies } from "@/lib/ai/gemini";
import { generateRewrite } from "@/lib/ai/gemini";
import { useCommunicationPrefsStore } from "@/store/communicationPrefsStore";
import { useSettingsStore } from "@/store/settingsStore";

interface MessageInputProps {
  chatId: string;
}

export function MessageInput({ chatId }: MessageInputProps) {
  const userId = useAuthStore((state) => state.userId);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const setTyping = useChatStore((state) => state.setTyping);
  const messagesByChat = useChatStore((state) => state.messagesByChat);
  const replyingToId = useChatStore((state) => state.replyingToId);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const preferredTone = useCommunicationPrefsStore((state) => state.preferredTone);
  const signature = useCommunicationPrefsStore((state) => state.signature);
  const busyReason = useCommunicationPrefsStore((state) => state.busyReason);
  const autoApplyCustomization = useCommunicationPrefsStore((state) => state.autoApplyCustomization);
  const quickTemplates = useCommunicationPrefsStore((state) => state.quickTemplates);
  const setPreferredTone = useCommunicationPrefsStore((state) => state.setPreferredTone);
  const setSignature = useCommunicationPrefsStore((state) => state.setSignature);
  const setBusyReason = useCommunicationPrefsStore((state) => state.setBusyReason);
  const setAutoApplyCustomization = useCommunicationPrefsStore((state) => state.setAutoApplyCustomization);
  const setQuickTemplates = useCommunicationPrefsStore((state) => state.setQuickTemplates);
  const featureSettings = useSettingsStore((state) => state.features);

  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isApplyingCustomization, setIsApplyingCustomization] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const replyingMessage = replyingToId
    ? (messagesByChat[chatId] || []).find(m => m.id === replyingToId)
    : null;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);

    if (!userId) return;

    setTyping(chatId, true, userId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(chatId, false, userId);
    }, 1500);
  };

  const handleSend = async () => {
    if (!value.trim() && !selectedFile) return;
    
    let outgoing = value.trim();
    let mediaUrl = "";

    if (autoApplyCustomization && outgoing) {
      setIsApplyingCustomization(true);
      try {
        outgoing = await generateRewrite(outgoing, preferredTone);
      } catch {
        // Keep original content when rewrite fails.
      } finally {
        setIsApplyingCustomization(false);
      }
    }

    if (signature.trim() && outgoing) {
      outgoing = `${outgoing}\n\n${signature.trim()}`;
    }

    if (selectedFile) {
      const uploadMedia = useChatStore.getState().uploadMedia;
      const ext = selectedFile.name.split('.').pop() || 'png';
      const uploaded = await uploadMedia(selectedFile, ext);
      if (uploaded) mediaUrl = uploaded;
    }

    await sendMessage({
      chatId,
      content: outgoing || (selectedFile ? "Shared an image" : ""),
      mediaUrl: mediaUrl,
      parentId: replyingToId
    });

    setValue("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setSuggestions([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveCurrentAsTemplate = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...quickTemplates].slice(0, 6);
    setQuickTemplates(Array.from(new Set(next)));
  };

  const handleFetchSuggestions = async () => {
    if (!featureSettings.aiSuggestions) return;
    if (isLoadingSuggestions) return;
    setIsLoadingSuggestions(true);
    try {
      const messages = messagesByChat[chatId] || [];
      const context = messages.slice(-5).map(m => m.content).join("\n");
      const suggested = await generateSmartReplies(context);
      setSuggestions(suggested);
    } catch (err) {
      console.error("Suggestion error:", err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const uploadMedia = useChatStore.getState().uploadMedia;
        const audioUrl = await uploadMedia(audioBlob, 'webm');

        if (audioUrl) {
          await sendMessage({
            chatId,
            content: "Voice Message",
            mediaUrl: audioUrl,
            parentId: replyingToId
          });
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Please allow microphone access to record voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="sticky bottom-0 bg-transparent px-4 pb-2 pt-1 z-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*,audio/*"
      />

      {/* Media Preview */}
      {previewUrl && (
        <div className="mx-auto mb-4 flex max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <div className="relative group rounded-[24px] border border-blue-500/30 bg-[var(--navy-deep)] p-2 backdrop-blur-3xl shadow-2xl">
            <div className="relative h-40 w-40 overflow-hidden rounded-[20px] bg-black/20">
               <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase text-white">Pending Upload</span>
               </div>
            </div>
            <button
               onClick={() => { setSelectedFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
               className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-all z-10"
            >
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
                  <path d="M18 6L6 18M6 6l12 12" />
               </svg>
            </button>
          </div>
        </div>
      )}

      {/* Reply Preview */}
      {replyingMessage && (
        <div className="mx-auto mb-4 flex max-w-4xl animate-slide-up items-center justify-between rounded-[18px] border border-white/10 bg-[var(--navy-deep)] p-4 backdrop-blur-[10px] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <div className="flex flex-col pl-4">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">
              Replying to {replyingMessage.sender_id === userId ? "yourself" : "contact"}
            </span>
            <p className="line-clamp-1 text-xs text-slate-400 font-medium">
              {replyingMessage.content || "Media attachment"}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-white/10 hover:text-white transition-all bg-white/5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mx-auto mb-4 flex max-w-4xl flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => {
                setValue(suggestion);
                setSuggestions([]);
              }}
              className="px-4 py-2 rounded-full border border-blue-500/20 bg-blue-600/5 text-[11px] font-black uppercase tracking-wider text-blue-400 hover:bg-blue-600/10 hover:border-blue-500/40 transition-all active:scale-95"
            >
              {suggestion}
            </button>
          ))}
          <button
            onClick={() => setSuggestions([])}
            className="p-2 rounded-full text-slate-600 hover:text-slate-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Communication Studio */}
      {isCustomizationOpen && (
        <div className="mx-auto mb-4 flex max-w-4xl flex-col gap-4 rounded-[24px] border border-white/10 bg-[var(--navy-deep)] p-4 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-300">Communication Studio</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">Set your writing style and auto-reply context</p>
            </div>
            <button
              onClick={() => setIsCustomizationOpen(false)}
              className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:bg-white/5"
              type="button"
            >
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Preferred Tone</span>
              <select
                value={preferredTone}
                onChange={(e) => setPreferredTone(e.target.value as "Professional" | "Friendly" | "Casual")}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 outline-none"
              >
                <option value="Friendly">Friendly</option>
                <option value="Professional">Professional</option>
                <option value="Casual">Casual</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Signature</span>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="- Sent from Jay"
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none"
              />
            </label>

            <label className="flex flex-col gap-1.5 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Busy Status Message (used by auto smart reply)</span>
              <input
                type="text"
                value={busyReason}
                onChange={(e) => setBusyReason(e.target.value)}
                placeholder="I am in deep work mode and will reply soon."
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((template, i) => (
              <button
                key={`${template}-${i}`}
                onClick={() => setValue(template)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300 hover:bg-white/[0.06]"
                type="button"
              >
                {template}
              </button>
            ))}
            <button
              onClick={handleSaveCurrentAsTemplate}
              className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-300 hover:bg-blue-500/20"
              type="button"
            >
              Save Current as Template
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={autoApplyCustomization}
              onChange={(e) => setAutoApplyCustomization(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/[0.04]"
            />
            Auto-apply preferred tone before sending messages
          </label>
        </div>
      )}

      {/* Voice Soundwave Overlay */}
      {isRecording && (
        <div className="mx-auto mb-4 flex max-w-4xl animate-in fade-in zoom-in duration-300 items-center justify-between rounded-[22px] border border-blue-500/30 bg-blue-600/10 p-4 backdrop-blur-xl shadow-2xl relative overflow-hidden ring-1 ring-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="flex gap-1 items-end h-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-400 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.5s'
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Listening...</span>
          </div>
          <button
            onClick={() => setIsRecording(false)}
            className="flex h-9 px-4 items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[9px] font-black uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 max-w-4xl mx-auto backdrop-blur-sm p-1 rounded-[30px]">
        {/* Attachment & Suggest Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleFileClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-slate-500 hover:bg-white/10 hover:text-blue-400 transition-all duration-300 hover:-translate-y-0.5 bg-white/[0.03] border border-white/5 active:scale-90 shadow-lg"
            title="Attach Media"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleFetchSuggestions}
            disabled={isLoadingSuggestions || !featureSettings.aiSuggestions}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-blue-400 hover:bg-blue-400/10 transition-all duration-300 hover:-translate-y-0.5 bg-blue-400/5 border border-blue-400/20 active:scale-90 shadow-lg disabled:opacity-50"
            title="Get AI Suggestions"
          >
            {isLoadingSuggestions ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
          </button>

          {featureSettings.messageCustomization && (
            <button
              type="button"
              onClick={() => setIsCustomizationOpen((prev) => !prev)}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] transition-all duration-300 hover:-translate-y-0.5 border active:scale-90 shadow-lg ${isCustomizationOpen
                ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-300"
                : "bg-white/[0.03] border-white/5 text-slate-500 hover:bg-white/10 hover:text-emerald-300"
                }`}
              title="Communication Studio"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
            </button>
          )}
        </div>

        {/* Floating Input Area */}
        <div className="flex-1 relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-indigo-500/0 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000" />
          <div className="relative flex flex-col bg-white/[0.03] backdrop-blur-[40px] rounded-[24px] border border-white/5 shadow-2xl transition-all duration-500 group-focus-within:border-blue-500/20 group-focus-within:bg-white/[0.05] group-focus-within:shadow-[0_0_30px_rgba(59,130,246,0.1)] overflow-hidden">
            <div className="flex items-center">
              <textarea
                rows={1}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Message Aura..."
                className="w-full resize-none bg-transparent px-6 py-4 text-[14px] font-bold tracking-tight text-white outline-none placeholder:text-slate-600 selection:bg-blue-500/40"
                style={{ minHeight: '52px' }}
              />
            </div>
            {isApplyingCustomization && (
              <div className="border-t border-white/5 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                Applying your message style...
              </div>
            )}
          </div>
        </div>

        {/* Voice & Send */}
        <div className="flex items-center gap-2.5">
          {(!value.trim() && !selectedFile) ? (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={!featureSettings.voiceMessages}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] transition-all duration-300 hover:-translate-y-0.5 border border-white/5 shadow-lg ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-white/[0.03] text-slate-500 hover:bg-white/10 hover:text-blue-400'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Hold to Record"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                <path d="M12 1v10M19 10v2a7 7 0 01-14 0v-2M12 21v-3" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)] transition-all duration-300 hover:scale-110 hover:-translate-y-0.5 active:scale-90 relative overflow-hidden group/send"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/send:translate-y-0 transition-transform duration-500" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 relative z-10"
              >
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
