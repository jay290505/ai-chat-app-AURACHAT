"use client";

import { useState } from "react";
import type { Profile } from "@/types/database";

interface ProfileModalProps {
    profile: Profile;
    isOpen: boolean;
    onClose: () => void;
    isOwnProfile?: boolean;
}

export function ProfileModal({
    profile,
    isOpen,
    onClose,
    isOwnProfile = false,
}: ProfileModalProps) {
    const [username, setUsername] = useState(profile.username || "");
    const [fullName, setFullName] = useState(profile.full_name || "");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--navy-deep)]/60 backdrop-blur-[10px] px-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white/[0.03] border border-white/10 backdrop-blur-[20px] rounded-[24px] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-8 right-8 h-10 w-10 flex items-center justify-center rounded-[14px] bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white transition-all active:scale-90"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-4 w-4">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col items-center">
                    {/* Avatar Section */}
                    <div className="relative mb-8 group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative h-32 w-32 rounded-[32px] bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-800 p-1 shadow-2xl transition-transform duration-500 group-hover:scale-105">
                            <div className="h-full w-full rounded-[28px] bg-[var(--navy-deep)] flex items-center justify-center overflow-hidden">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.full_name || "Profile"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-4xl font-black text-white">{profile.username?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            {isOwnProfile && (
                                <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-[var(--navy-deep)] shadow-xl hover:scale-110 active:scale-95 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="w-full space-y-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-white tracking-tight mb-1">{isOwnProfile ? "Profile Settings" : profile.full_name}</h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Identity Verified</p>
                        </div>

                        {/* User ID (WhatsApp style) */}
                        <div className="bg-white/5 rounded-2xl border border-white/5 p-5 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/5 translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                            <div className="relative z-10">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Account ID</p>
                                <div className="flex items-center justify-between">
                                    <code className="text-sm font-bold text-slate-200 tracking-wider">
                                        {profile.id.substring(0, 8)}...{profile.id.substring(profile.id.length - 4)}
                                    </code>
                                    <button className="text-blue-400 hover:text-blue-300 transition-colors uppercase text-[10px] font-black tracking-widest">Copy</button>
                                </div>
                            </div>
                        </div>

                        {isOwnProfile && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Identity</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/30 focus:bg-white/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-4">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500/30 focus:bg-white/10 transition-all"
                                    />
                                </div>

                                <button
                                    className="w-full py-4 mt-4 rounded-[18px] bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-900/40 active:scale-95 hover:-translate-y-0.5"
                                >
                                    Apply Updates
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
