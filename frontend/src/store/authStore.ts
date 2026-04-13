import { create } from "zustand";
import { supabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Profile, Database } from "@/types/database";

interface AuthState {
  userId: string | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  init: () => Promise<void>;
  resetInit: () => void;
  signInWithEmail: (payload: { email: string; password: string }) => Promise<void>;
  signUpWithEmail: (payload: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  userId: null,
  profile: null,
  loading: false,
  initialized: false,
  error: null,

  resetInit: () => {
    set({ initialized: false });
  },

  init: async () => {
    if (get().initialized) return;

    // Demo mode: no Supabase configured, just hydrate a fake user/profile
    if (!isSupabaseConfigured) {
      const demoUserId = "demo-user-id";
      const demoProfile: Profile = {
        id: demoUserId,
        username: "demo_user",
        full_name: "Demo User",
        avatar_url: null,
        bio: "This is a demo profile. Supabase is not configured.",
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_online: true,
      };
      set({
        userId: demoUserId,
        profile: demoProfile,
        loading: false,
        initialized: true,
        error: null,
      });
      return;
    }

    set({ loading: true, error: null });

    // Get the current session (works for both email/password and OAuth PKCE)
    const {
      data: { session },
      error,
    } = await supabaseClient!.auth.getSession();

    if (error) {
      set({ loading: false, initialized: true, error: error.message });
      return;
    }

    const userId = session?.user?.id ?? null;
    if (!userId) {
      set({ userId: null, profile: null, loading: false, initialized: true });
      // Still attach the listener — user may sign in later in this tab
      supabaseClient!.auth.onAuthStateChange(async (event, newSession) => {
        const newUserId = newSession?.user?.id ?? null;
        if (!newUserId) {
          set({ userId: null, profile: null });
          return;
        }
        const { data: updatedProfile } = await supabaseClient!
          .from("profiles")
          .select("*")
          .eq("id", newUserId)
          .single();
        set({ userId: newUserId, profile: updatedProfile ?? null });
      });
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient!
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      set({
        userId,
        profile: null,
        loading: false,
        initialized: true,
        error: profileError.message,
      });
      return;
    }

    set({
      userId,
      profile: profile ?? null,
      loading: false,
      initialized: true,
      error: null,
    });

    // Listen for auth state changes (token refresh, sign-out from another tab, etc.)
    supabaseClient!.auth.onAuthStateChange(async (event, session) => {
      const newUserId = session?.user?.id ?? null;
      if (!newUserId) {
        set({ userId: null, profile: null });
        return;
      }
      if (newUserId === get().userId) return; // already up to date
      const { data: updatedProfile } = await supabaseClient!
        .from("profiles")
        .select("*")
        .eq("id", newUserId)
        .single();
      set({ userId: newUserId, profile: updatedProfile ?? null });
    });
  },

  signInWithEmail: async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      // Demo: just mark as "logged in" with demo profile
      const demoUserId = "demo-user-id";
      const demoProfile: Profile = {
        id: demoUserId,
        username: "demo_user",
        full_name: "Demo User",
        avatar_url: null,
        bio: "This is a demo profile. Supabase is not configured.",
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_online: true,
      };
      set({
        userId: demoUserId,
        profile: demoProfile,
        loading: false,
        error: null,
      });
      return;
    }

    set({ loading: true, error: null });
    const { data, error } = await supabaseClient!.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    const userId = data.user?.id ?? null;
    if (!userId) {
      set({
        userId: null,
        profile: null,
        loading: false,
        error: "No user ID returned from Supabase.",
      });
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient!
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    set({
      userId,
      profile: profile ?? null,
      loading: false,
      error: profileError?.message ?? null,
    });
  },

  signUpWithEmail: async ({ email, password, fullName, username }) => {
    if (!isSupabaseConfigured) {
      const demoUserId = "demo-user-id";
      const demoProfile: Profile = {
        id: demoUserId,
        username,
        full_name: fullName,
        avatar_url: null,
        bio: "This is a demo profile. Supabase is not configured.",
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_online: true,
      };
      set({
        userId: demoUserId,
        profile: demoProfile,
        loading: false,
        error: null,
      });
      return;
    }

    set({ loading: true, error: null });
    const { data, error } = await supabaseClient!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
        },
      },
    });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    const userId = data.user?.id ?? null;
    if (!userId) {
      set({
        userId: null,
        profile: null,
        loading: false,
        error: "No user ID returned from Supabase.",
      });
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient!
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    set({
      userId,
      profile: profile ?? null,
      loading: false,
      error: profileError?.message ?? null,
    });
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      const demoUserId = "demo-user-google";
      const demoProfile: Profile = {
        id: demoUserId,
        username: "google_user",
        full_name: "Google Demo User",
        avatar_url: null,
        bio: "Demo Google user. Supabase not configured.",
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_online: true,
      };
      set({
        userId: demoUserId,
        profile: demoProfile,
        loading: false,
        error: null,
      });
      return;
    }

    set({ loading: true, error: null });
    const { error } = await supabaseClient!.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    // OAuth redirect is now in-flight — browser navigates away to Google.
    // Keep loading: true so the button stays in its loading state until the
    // page unloads. The Route Handler at /auth/callback completes the exchange.
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      set({ userId: null, profile: null, loading: false, error: null });
      return;
    }

    set({ loading: true, error: null });
    const { error } = await supabaseClient!.auth.signOut();
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    set({ userId: null, profile: null, loading: false });
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { userId, profile } = get();
    if (!userId || !profile) return;

    if (!isSupabaseConfigured) {
      set({
        profile: { ...profile, ...updates },
        loading: false,
        error: null,
      });
      return;
    }

    set({ loading: true, error: null });

    // Strip immutable fields — the Update type excludes id and created_at.
    // Cast to `object` to work around a known supabase-js issue where the
    // .update() argument resolves to `never` with certain Database generics.
    const { id: _id, created_at: _ca, ...payload } = { ...profile, ...updates };

    const { data: updatedProfile, error } = await supabaseClient!
      .from("profiles")
      .update(payload as never)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({ profile: updatedProfile ?? null, loading: false });
  },
}));

