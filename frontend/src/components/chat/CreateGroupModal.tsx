"use client";

import { useState } from "react";
import type { Profile } from "@/types/database";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { Users, X, Check, Search } from "lucide-react";

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    contacts: Profile[];
}

export function CreateGroupModal({ isOpen, onClose, contacts }: CreateGroupModalProps) {
    const currentUserId = useAuthStore((state) => state.userId);
    const createGroup = useChatStore((state) => state.createGroup);

    const [name, setName] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const searchUsers = useChatStore((state) => state.searchUsers);

    if (!isOpen) return null;

    // Use search results if searching, otherwise use recent contacts
    const displayedContacts = search.length >= 3 ? searchResults : contacts.filter(c =>
        c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.username?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSearch = async (query: string) => {
        setSearch(query);
        if (query.length >= 3) {
            setIsSearching(true);
            const results = await searchUsers(query);
            setSearchResults(results);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreate = async () => {
        if (!name || selectedIds.length === 0 || !currentUserId) return;
        try {
            setIsSubmitting(true);
            const chatId = await createGroup({
                name,
                userIds: selectedIds,
                ownerId: currentUserId
            });
            if (chatId) {
                useChatStore.getState().selectChat(chatId);
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[var(--navy-deep)] shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                                <Users className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight text-white uppercase">Create Group</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Group Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Project X Team"
                                className="w-full rounded-2xl border border-white/5 bg-white/[0.03] px-6 py-4 text-sm text-white focus:border-blue-500/40 focus:outline-none focus:bg-white/[0.05] transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Add Members ({selectedIds.length})</label>
                            <div className="relative mb-4">
                                <Search className={`absolute left-4 top-3.5 h-4 w-4 ${isSearching ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search by name or username..."
                                    className="w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-11 pr-6 py-3.5 text-xs text-white focus:outline-none transition-all"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                                {displayedContacts.length === 0 && search.length >= 3 && !isSearching && (
                                    <p className="text-center py-4 text-xs text-slate-500">No users found matching "{search}"</p>
                                )}
                                {displayedContacts.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => toggleSelect(c.id)}
                                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all ${selectedIds.includes(c.id) ? 'bg-blue-600/10' : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white">
                                                {c.full_name?.charAt(0) || c.username?.charAt(0) || '?'}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-white leading-none mb-1">{c.full_name || c.username}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">@{c.username}</p>
                                            </div>
                                        </div>
                                        <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${selectedIds.includes(c.id) ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/10'
                                            }`}>
                                            {selectedIds.includes(c.id) && <Check className="h-3.5 w-3.5 stroke-[4]" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleCreate}
                            disabled={isSubmitting || !name || selectedIds.length === 0}
                            className="w-full py-4 rounded-2xl bg-blue-600 text-[11px] font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isSubmitting ? "Generating Group..." : "Create Aura Group"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
