/**
 * hooks/useAuth.ts
 * ----------------
 * Thin wrapper around the existing Zustand authStore that also exposes
 * a convenience imperative `push` for auth-specific toast notifications.
 *
 * Usage:
 *   const { user, profile, loading, signIn, signUp, signOut, notifications, pushNotification, closeNotification } = useAuth();
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import type { NotificationItem } from "@/components/AuthNotification";

// ── Types ──────────────────────────────────────────────────────────────────

export interface SignInPayload {
  email: string;
  password: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
  const router = useRouter();

  // Auth state from global Zustand store
  const userId = useAuthStore((s) => s.userId);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const storeError = useAuthStore((s) => s.error);
  const init = useAuthStore((s) => s.init);
  const _signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const _signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const _signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const _signOut = useAuthStore((s) => s.signOut);

  // Local notification queue for toast popups
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  /** Push a new success or error notification */
  const pushNotification = useCallback((message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  /** Remove a notification by id (called by the toast's onClose) */
  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // ── Auth actions ────────────────────────────────────────────────────────

  /**
   * Sign in with email/password.
   * Shows a success toast + redirects to /chat, or shows an error toast.
   */
  const signIn = useCallback(
    async (payload: SignInPayload) => {
      await _signInWithEmail(payload);
      const err = useAuthStore.getState().error;
      if (err) {
        pushNotification(err, "error");
      } else {
        pushNotification("Welcome back! You've signed in successfully.", "success");
        router.replace("/chat");
      }
    },
    [_signInWithEmail, pushNotification, router]
  );

  /**
   * Sign up with email/password + full name + username.
   * Shows a success toast + redirects to /chat, or shows an error toast.
   */
  const signUp = useCallback(
    async (payload: SignUpPayload) => {
      await _signUpWithEmail(payload);
      const err = useAuthStore.getState().error;
      if (err) {
        pushNotification(err, "error");
      } else {
        pushNotification("Account created! Welcome to Aura Messenger 🎉", "success");
        router.replace("/chat");
      }
    },
    [_signUpWithEmail, pushNotification, router]
  );

  /** Sign in with Google OAuth */
  const signInWithGoogle = useCallback(async () => {
    await _signInWithGoogle();
    const err = useAuthStore.getState().error;
    if (err) pushNotification(err, "error");
  }, [_signInWithGoogle, pushNotification]);

  /** Sign out and redirect to /signin */
  const signOut = useCallback(async () => {
    await _signOut();
    router.replace("/signin");
  }, [_signOut, router]);

  return {
    /** Supabase user ID (null when not authenticated) */
    userId,
    /** Full profile row from the `profiles` table */
    profile,
    /** True while an async auth operation is in progress */
    loading,
    /** Raw error message from the last auth operation (also shown via toast) */
    storeError,
    /** Initialise auth from persisted session (call once on mount) */
    init,
    /** Sign in with email + password */
    signIn,
    /** Create a new account */
    signUp,
    /** Google OAuth sign-in */
    signInWithGoogle,
    /** Sign out the current user */
    signOut,
    // ── Notification helpers ───────────────────────────────────────────────
    notifications,
    pushNotification,
    closeNotification,
  };
}
