"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";

export function ThemeSync() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const hydratedUserId = useSettingsStore((s) => s.hydratedUserId);
  const userId = useAuthStore((s) => s.userId);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  // Initial check on mount (even without userId)
  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  // Sync when userId becomes available
  useEffect(() => {
    if (userId && !hydratedUserId) {
      hydrateSettings(userId);
    }
  }, [userId, hydratedUserId, hydrateSettings]);

  // Optional: Listen for storage changes from other tabs
  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key === "aura-theme" && e.newValue) {
        useSettingsStore.setState({ themeMode: e.newValue as any });
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Global theme class toggle
  useEffect(() => {
    if (typeof document === "undefined") return;
    const isLight = themeMode === "light";
    document.documentElement.classList.toggle("theme-light", isLight);
    document.documentElement.classList.toggle("theme-dark", !isLight);
  }, [themeMode]);

  return null;
}
