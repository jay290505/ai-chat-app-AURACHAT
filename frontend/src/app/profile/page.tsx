"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { isSupabaseConfigured, supabaseClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export default function ProfilePage() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const error = useAuthStore((state) => state.error);
  const init = useAuthStore((state) => state.init);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const [form, setForm] = useState<Partial<Profile>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (initialized && !userId) {
      router.replace("/signin");
    }
  }, [userId, initialized, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        username: profile.username,
        bio: profile.bio,
      });
    }
  }, [profile]);

  const handleChange =
    (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploading(true);

      // Demo mode: show the picked image immediately (no upload)
      if (!isSupabaseConfigured || !supabaseClient) {
        const localUrl = URL.createObjectURL(file);
        await updateProfile({ avatar_url: localUrl });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `avatars/${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        return;
      }

      const { data: publicUrlData } = supabaseClient.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      await updateProfile({ avatar_url: avatarUrl });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(form);
  };

  if (!initialized || (initialized && userId && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-slate-200">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
      </div>
    );
  }

  if (!userId || !profile) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-slate-50 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-slate-950/50 px-6 py-4 backdrop-blur-2xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-slate-100 active:scale-90"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[15px] font-bold tracking-tight text-slate-100">
          Profile Settings
        </h1>
        <div className="w-9" />
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-10 px-6 py-10">
        <section className="flex flex-col items-center gap-6">
          <div className="group relative">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-2xl shadow-blue-900/40 transition-transform duration-500 group-hover:scale-105">
              <div className="h-full w-full rounded-full bg-[var(--background)] flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name ?? profile.username ?? "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold tracking-tighter">
                    {(profile.full_name ?? profile.username ?? "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            <label className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-[var(--background)] transition-all hover:bg-blue-500 hover:scale-110 active:scale-95">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </label>
          </div>

          <div className="text-center">
            {uploading && (
              <p className="animate-pulse text-[10px] font-bold uppercase tracking-widest text-blue-400">
                Changing photo...
              </p>
            )}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1">
                Display Name
              </label>
              <div className="glass-card rounded-2xl p-1 shadow-inner ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-blue-500/40 transition-all">
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name ?? ""}
                  onChange={handleChange("full_name")}
                  className="w-full bg-transparent px-4 py-3 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600"
                  placeholder="e.g. Alex Johnson"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1">
                Unique Username
              </label>
              <div className="glass-card rounded-2xl p-1 shadow-inner ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-blue-500/40 transition-all">
                <input
                  id="username"
                  type="text"
                  value={form.username ?? ""}
                  onChange={handleChange("username")}
                  className="w-full bg-transparent px-4 py-3 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600"
                  placeholder="e.g. alexj"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bio" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1">
                Personal Bio
              </label>
              <div className="glass-card rounded-2xl p-1 shadow-inner ring-1 ring-white/5 focus-within:ring-2 focus-within:ring-blue-500/40 transition-all">
                <textarea
                  id="bio"
                  rows={4}
                  value={form.bio ?? ""}
                  onChange={handleChange("bio")}
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm font-medium text-slate-100 outline-none placeholder:text-slate-600"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">User ID</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <code className="truncate text-xs font-mono text-slate-400 block p-2 bg-black/20 rounded-lg flex-1">
                {profile.id}
              </code>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(profile.id);
                  } catch { /* ignore */ }
                }}
                className="h-8 rounded-lg px-3 text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 transition-all"
              >
                Copy
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400 uppercase tracking-wide">
              {error}
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-blue-600 text-white text-xs font-bold uppercase tracking-[0.2em] transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale shadow-2xl shadow-blue-900/40 ring-1 ring-blue-400/30"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

