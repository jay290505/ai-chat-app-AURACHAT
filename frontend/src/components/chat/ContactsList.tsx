import type { Profile } from "@/types/database";

type ContactRelation = "none" | "outgoing" | "incoming" | "connected";

interface ContactsListProps {
  contacts: Profile[];
  activeContactId: string | null;
  relationByContactId?: Record<string, ContactRelation>;
  onMessage: (contactId: string) => void;
  onSendRequest?: (contactId: string) => void;
  onAcceptRequest?: (contactId: string) => void;
}

export function ContactsList({
  contacts,
  activeContactId,
  relationByContactId,
  onMessage,
  onSendRequest,
  onAcceptRequest,
}: ContactsListProps) {
  if (contacts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-slate-500">
        No contacts yet.
      </div>
    );
  }

  return (
    <ul className="space-y-1 py-1">
      {contacts.map((c) => {
        const relation = relationByContactId?.[c.id] ?? "none";
        const initials =
          c.full_name?.charAt(0).toUpperCase() ??
          c.username?.charAt(0).toUpperCase() ??
          "?";

        const canMessage = relation === "connected";
        const isPendingOut = relation === "outgoing";
        const isIncoming = relation === "incoming";

        return (
          <li key={c.id} className="px-1.5 mb-1">
            <div
              className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all duration-500 relative overflow-hidden active:scale-[0.98] ${activeContactId === c.id
                ? "bg-white/[0.05] text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20"
                : "hover:bg-white/[0.03] text-slate-400 hover:text-slate-100 border border-transparent"
                }`}
            >
              {activeContactId === c.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 shadow-[0_0_20px_rgba(59,130,246,0.8)] z-10" />
              )}

              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] bg-gradient-to-br from-slate-700 to-slate-900 text-[15px] font-black text-white/90 shadow-2xl ring-1 ring-white/10 group-hover:scale-110 group-hover:ring-blue-500/40 transition-all duration-500">
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatar_url}
                      alt={c.full_name ?? c.username ?? "Contact"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--navy-deep)] transition-all duration-700 ${c.is_online
                    ? "bg-emerald-500 animate-pulse-green shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    : "bg-slate-600"
                    }`}
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="truncate text-[15px] font-bold tracking-tight leading-none group-hover:translate-x-0.5 transition-transform duration-300">
                    {c.full_name ?? c.username ?? "Unknown User"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <div className={`h-1.5 w-1.5 rounded-full ${c.is_online ? 'bg-emerald-500' : 'bg-slate-600'} opacity-50`} />
                  <span className="truncate text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-400 transition-colors leading-none">
                    {c.is_online ? "Active Now" : "Offline"}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                {canMessage && (
                  <button
                    type="button"
                    onClick={() => onMessage(c.id)}
                    className="rounded-xl border border-blue-500/30 bg-blue-500/20 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-200 hover:bg-blue-500/30 transition-all"
                  >
                    Message
                  </button>
                )}
                {isPendingOut && (
                  <span className="rounded-xl border border-amber-500/30 bg-amber-500/20 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-200 inline-block">
                    Request Sent
                  </span>
                )}
                {isIncoming && (
                  <button
                    type="button"
                    onClick={() => onAcceptRequest?.(c.id)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/20 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-200 hover:bg-emerald-500/30 transition-all"
                  >
                    Accept
                  </button>
                )}
                {!canMessage && !isPendingOut && !isIncoming && (
                  <button
                    type="button"
                    onClick={() => onSendRequest?.(c.id)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 hover:bg-white/10 transition-all"
                  >
                    Send Request
                  </button>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

