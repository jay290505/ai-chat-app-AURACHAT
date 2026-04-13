"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { isSupabaseConfigured, supabaseClient } from "@/lib/supabase/client";

export default function DiagnosticsPage() {
  const [status, setStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((state) => state.userId);
  const uploadMedia = useChatStore((state) => state.uploadMedia);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: Record<string, any> = {};

    // 1. Connectivity
    results.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing";
    results.supabase_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing";

    // 2. Auth State
    results.auth_user = userId ? `✅ Logged In (${userId})` : "❌ Not Logged In";

    // 3. Database Tables
    try {
      if (!isSupabaseConfigured || !supabaseClient) {
        results.table_profiles = "ℹ️ Demo mode (skipped)";
        results.table_chats = "ℹ️ Demo mode (skipped)";
        results.table_messages = "ℹ️ Demo mode (skipped)";
      } else {
        const { error: pErr } = await supabaseClient
          .from("profiles")
          .select("*")
          .limit(1);
        results.table_profiles = pErr ? `❌ ${pErr.message}` : "✅ Working";

        const { error: cErr } = await supabaseClient
          .from("chats")
          .select("*")
          .limit(1);
        results.table_chats = cErr ? `❌ ${cErr.message}` : "✅ Working";

        const { error: mErr } = await supabaseClient
          .from("messages")
          .select("*")
          .limit(1);
        results.table_messages = mErr ? `❌ ${mErr.message}` : "✅ Working";
      }
    } catch (e) {
      results.tables_global = "❌ Connection Refused";
    }

    // 4. Storage
    try {
      if (!isSupabaseConfigured || !supabaseClient) {
        results.storage_access = "ℹ️ Demo mode (skipped)";
      } else {
        const { data: buckets, error: bErr } =
          await supabaseClient.storage.listBuckets();
        if (bErr) {
          results.storage_access = `❌ ${bErr.message}`;
        } else {
          const bucketNames = buckets.map((b) => b.name);
          results.existing_buckets = bucketNames.join(", ") || "None";
          results.chat_media_bucket = bucketNames.includes("chat-media")
            ? "✅ Found 'chat-media'"
            : "❌ 'chat-media' NOT found (Check for typos like 'caht')";
        }
      }
    } catch (e) {
      results.storage_global = "❌ Storage Service Unavailable";
    }

    setStatus(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 font-mono">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-4">
          <h1 className="text-2xl font-bold text-blue-400">Aura System Diagnostics</h1>
          <p className="text-slate-500 text-sm">Testing live Supabase integration status...</p>
        </header>

        <div className="grid gap-4">
          {Object.entries(status).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
              <span className="text-slate-400 text-sm uppercase tracking-wider">{key.replace(/_/g, " ")}</span>
              <span className={`text-sm font-bold ${value.includes("✅") ? "text-emerald-400" : "text-rose-400"}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            onClick={runDiagnostics}
            className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold transition-all active:scale-95"
          >
            Re-run Tests
          </button>
          <a 
            href="/chat"
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-center rounded-2xl font-bold transition-all"
          >
            Back to Chat
          </a>
        </div>

        {!userId && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs leading-relaxed">
            ⚠️ Some tests require you to be logged in. Please sign in to the app first to verify protected tables and storage permissions.
          </div>
        )}
      </div>
    </div>
  );
}
