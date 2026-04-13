import type { Chat } from "@/types/database";
import { Users, User } from "lucide-react";

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelect: (chatId: string) => void;
  getUnreadCount: (chatId: string) => number;
}

export function ChatList({ chats, selectedChatId, onSelect, getUnreadCount }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center px-4 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1">No Active Threads</p>
        <p className="text-[9px] font-bold text-slate-700 max-w-[120px]">Start a message or create a group to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 py-2">
      <div className="px-4 mb-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Active Conversations</h3>
      </div>
      <ul className="space-y-1">
        {chats.filter((c, i, a) => a.findIndex(t => t.id === c.id) === i).map((chat) => (
          <li key={`chat-${chat.id}`} className="px-2">
            <button
              type="button"
              onClick={() => onSelect(chat.id)}
              className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all duration-500 relative overflow-hidden active:scale-[0.98] ${selectedChatId === chat.id
                  ? "bg-white/[0.05] text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20"
                  : "hover:bg-white/[0.03] text-slate-400 hover:text-slate-100 border border-transparent"
                }`}
            >
              {selectedChatId === chat.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10" />
              )}

              <div className="shrink-0 relative">
                <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] shadow-2xl ring-1 ring-white/10 transition-all duration-700 group-hover:scale-105 ${chat.type === "group"
                    ? "bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700"
                    : "bg-gradient-to-br from-slate-700 to-slate-900"
                  }`}>
                  {chat.type === "group" ? (
                    <Users className="h-5 w-5 text-white/90" />
                  ) : (
                    <User className="h-5 w-5 text-white/90" />
                  )}
                </div>
                {chat.type === "group" && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-[var(--navy-deep)] flex items-center justify-center shadow-lg">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="truncate text-[15px] font-bold tracking-tight leading-none group-hover:translate-x-0.5 transition-transform duration-300">
                    {chat.name || (chat.type === "group" ? "New Group" : "Direct Message")}
                  </span>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest shrink-0 ml-2">
                    {new Date(chat.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1.5 overflow-hidden">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`h-1.5 w-1.5 rounded-full ${chat.type === "group" ? 'bg-indigo-500' : 'bg-blue-500'} opacity-50`} />
                    <span className={`truncate text-[9px] font-black uppercase tracking-[0.2em] leading-none ${selectedChatId === chat.id ? 'text-blue-400' : 'text-slate-500'
                      }`}>
                      {chat.type === "group" ? "Team Group" : "Direct Message"}
                    </span>
                  </div>
                  {getUnreadCount(chat.id) > 0 && (
                     <div className="shrink-0 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 border border-rose-500/50 shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                        <span className="text-[9px] font-black text-white">{getUnreadCount(chat.id)}</span>
                     </div>
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

