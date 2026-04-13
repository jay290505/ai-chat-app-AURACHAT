import { useState } from "react";
import type { Message, Profile } from "@/types/database";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { detectMessageVibe } from "@/lib/ai/gemini";
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  sender?: Profile | null;
  parentMessage?: Message | null;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwn, sender, parentMessage, showAvatar }: MessageBubbleProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const currentUserId = useAuthStore((state) => state.userId);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const addReaction = useChatStore((state) => state.addReaction);
  const [vibe, setVibe] = useState<{ label: string; score: number } | null>(null);

  // Detect AI-generated replies stored with the AURA_AI_REPLY::: prefix
  const isAiReply = message.content?.startsWith("AURA_AI_REPLY:::") ?? false;
  const displayContent = isAiReply ? message.content!.replace("AURA_AI_REPLY:::", "") : message.content;
  const isAutoBusyReply =
    !isAiReply && (displayContent?.toLowerCase().startsWith("auto-reply:") ?? false);
  const cleanContent = isAutoBusyReply
    ? displayContent?.replace(/^auto-reply:\s*/i, "")
    : displayContent;
  const effectiveIsOwn = isAiReply ? false : isOwn; // AI replies always show on the left

  useEffect(() => {
    if (displayContent && displayContent.length > 5 && !vibe) {
      detectMessageVibe(displayContent)
        .then((res) => {
          if (res && res[0]) {
            setVibe(res[0]);
          }
        })
        .catch(() => {
          // Ignore vibe detection failures so chat rendering remains stable.
        });
    }
  }, [displayContent, vibe]);

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const reactions = message.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  return (
    <div className={`flex w-full ${effectiveIsOwn ? "justify-end" : "justify-start"} mb-1 px-4 animate-slide-up`}>
      {!effectiveIsOwn && (
        <div className="w-10 flex-shrink-0 mr-2 flex flex-col justify-end">
          {showAvatar && (
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg">
                <div className="h-full w-full rounded-full bg-[var(--navy-deep)] overflow-hidden flex items-center justify-center">
                    {sender?.avatar_url ? (
                        <img src={sender.avatar_url} alt="A" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-xs font-black text-white">{sender?.username?.charAt(0).toUpperCase() || "U"}</span>
                    )}
                </div>
            </div>
          )}
        </div>
      )}
      <div className={`group relative flex flex-col ${effectiveIsOwn ? "items-end" : "items-start"} max-w-[80%]`}>

        {/* Hover Actions Bar */}
        <div className={`absolute -top-10 z-20 flex opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto items-center gap-1 rounded-[15px] bg-[var(--navy-deep)] p-1.5 border border-white/10 backdrop-blur-3xl shadow-2xl transition-all duration-300 transform translate-y-3 group-hover:translate-y-0 ${isOwn ? "right-0" : "left-0"}`}>
          <div className="flex gap-1 border-r border-white/10 pr-1.5 mr-1.5">
            {quickEmojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => currentUserId && addReaction(message.id, emoji, currentUserId)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all text-sm"
              >
                {emoji}
              </button>
            ))}
          </div>



          <button
            onClick={() => setReplyingTo(message.id)}
            className="flex h-8 px-3 items-center justify-center rounded-lg hover:bg-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-all"
          >
            Reply
          </button>

          {vibe && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 shadow-inner ml-1`}>
              <div className={`h-1.5 w-1.5 rounded-full ${vibe.label === 'POSITIVE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                {vibe.label === 'POSITIVE' ? 'High Vibe' : 'Low Vibe'}
              </span>
            </div>
          )}
        </div>

        <div
          className={`relative rounded-[22px] px-7 py-5 transition-all duration-500 shadow-2xl ${effectiveIsOwn
            ? "rounded-tr-none bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 text-white border border-white/20 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.5)] active:scale-[0.99]"
            : "rounded-tl-none bg-white/[0.04] backdrop-blur-[30px] text-slate-100 border border-white/10 ring-1 ring-inset ring-white/10 active:scale-[0.99] group-hover:bg-white/[0.06]"
            }`}
        >


          {/* Quote / Parent Message */}
          {parentMessage && (
            <div className={`mb-3 cursor-pointer rounded-xl border-l-[3px] bg-black/20 p-3 text-sm transition-colors hover:bg-black/30 ${isOwn ? "border-blue-300/40" : "border-blue-500/40"}`}>
              <p className="mb-1 font-bold text-blue-400/90 text-[11px] uppercase tracking-wider">
                {parentMessage.sender_id === currentUserId ? "You" : "Contact"}
              </p>
              <p className="truncate opacity-60 italic text-xs">
                {parentMessage.content || "Media attachment"}
              </p>
            </div>
          )}

          {isAiReply && (
            <p className="mb-1.5 text-[11px] font-bold tracking-[0.15em] text-purple-600 dark:text-purple-400 uppercase">
              ✨ Aura AI
            </p>
          )}

          {isAutoBusyReply && (
            <p className="mb-1.5 text-[10px] font-black tracking-[0.2em] text-amber-300 uppercase">
              Busy Auto Reply
            </p>
          )}

          {sender && !effectiveIsOwn && !isAiReply && (
            <p className="mb-1.5 text-[11px] font-bold tracking-[0.15em] text-blue-400 uppercase">
              {sender.full_name ?? sender.username ?? "Unknown"}
            </p>
          )}

          {cleanContent && (
            <div className="leading-relaxed whitespace-pre-wrap break-words font-medium text-[16px] text-white/95 [&>p]:mb-3 [&>p:last-child]:mb-0 [&_strong]:font-black [&_strong]:text-[1.05em] [&_strong]:tracking-wide [&_strong]:text-current [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_li]:mb-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3">
               <ReactMarkdown>{cleanContent}</ReactMarkdown>
            </div>
          )}

          {message.media_url && (
            <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-black/20">
              {message.content === "Voice Message" || message.media_url.includes(".webm") || message.media_url.includes(".mp3") || message.media_url.startsWith("blob:") ? (
                <div className="p-4 flex flex-col gap-3 min-w-[240px]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                        <path d="M12 1v10M19 10v2a7 7 0 01-14 0v-2M12 21v-3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-1/3 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      </div>
                    </div>
                  </div>
                  <audio
                    src={message.media_url}
                    controls
                    className="w-full h-8 opacity-90 contrast-125 invert brightness-200"
                  />
                </div>
              ) : (
                <div 
                   onClick={() => setIsLightboxOpen(true)}
                   className="relative group/media overflow-hidden cursor-zoom-in"
                >
                  <img
                    src={message.media_url}
                    alt="Attachment"
                    className="max-h-96 w-full object-cover transition-transform duration-1000 group-hover/media:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                     <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                     </svg>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lightbox / Preview */}
          {isLightboxOpen && message.media_url && (
            <div 
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-300"
              onClick={() => setIsLightboxOpen(false)}
            >
               <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
               </button>
               <img 
                 src={message.media_url} 
                 alt="Preview" 
                 className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-500"
               />
            </div>
          )}

          <div className={`mt-2.5 flex items-center justify-end gap-2 text-[10px] font-black tracking-[0.1em] ${effectiveIsOwn ? "text-blue-100/60" : "text-slate-500"
            }`}>
            <span className="tabular-nums uppercase">{time}</span>
            {effectiveIsOwn && (
              <span className="flex items-center gap-0.5 ml-1">
                {message.status === 'sent' && (
                  <svg className="h-3 w-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {message.status === 'delivered' && (
                  <div className="flex -space-x-1.5 opacity-60">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
                {message.status === 'seen' && (
                  <div className="flex -space-x-1.5 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions Display */}
        {hasReactions && (
          <div className={`mt-2 flex flex-wrap gap-1.5 ${effectiveIsOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => currentUserId && addReaction(message.id, emoji, currentUserId)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black transition-all border backdrop-blur-md ${users.includes(currentUserId || "")
                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                  : "bg-white/[0.03] border-white/5 text-slate-400 hover:border-white/10"
                  }`}
              >
                <span>{emoji}</span>
                {users.length > 1 && <span>{users.length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

