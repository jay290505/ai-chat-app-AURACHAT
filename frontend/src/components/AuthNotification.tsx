"use client";

/**
 * AuthNotification.tsx
 * ---------------------
 * Reusable success/error notification popup for auth flows.
 *
 * Props:
 *   message  – text to display
 *   type     – "success" | "error"
 *   onClose  – callback fired when the notification is dismissed
 *
 * Behaviour:
 *   • Appears in the top-right corner with a smooth slide-in + fade animation
 *   • Auto-dismisses after 3 seconds
 *   • Has a manual ✕ close button
 */

import { useEffect, useState } from "react";

export interface AuthNotificationProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function AuthNotification({ message, type, onClose }: AuthNotificationProps) {
  // Controls the CSS animation state (enter → visible → exit)
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    // Transition to "visible" on next frame so the enter animation plays
    const enterTimer = requestAnimationFrame(() => setPhase("visible"));

    // Begin exit animation at 2.6 s → component unmounts at 3 s
    const exitTimer = setTimeout(() => setPhase("exit"), 2600);
    const closeTimer = setTimeout(() => onClose(), 3000);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const handleClose = () => {
    setPhase("exit");
    setTimeout(onClose, 400);
  };

  // ── Style maps ─────────────────────────────────────────────────────────────
  const isSuccess = type === "success";

  const containerClasses = [
    // Base
    "pointer-events-auto relative flex w-[340px] max-w-[calc(100vw-2rem)] items-start gap-3",
    "rounded-2xl border p-4 shadow-2xl backdrop-blur-xl",
    // Colour
    isSuccess
      ? "border-emerald-500/30 bg-emerald-950/80"
      : "border-rose-500/30 bg-rose-950/80",
    // Animation phases
    phase === "enter"
      ? "opacity-0 translate-x-12"
      : phase === "visible"
      ? "opacity-100 translate-x-0"
      : "opacity-0 translate-x-12",
    "transition-all duration-500 ease-[cubic-bezier(0.2,1,0.2,1)]",
  ].join(" ");

  return (
    <div className={containerClasses} role="alert" aria-live="assertive">
      {/* Coloured left accent bar */}
      <div
        className={[
          "absolute inset-y-0 left-0 w-1 rounded-l-2xl",
          isSuccess
            ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
            : "bg-rose-400 shadow-[0_0_12px_rgba(248,113,113,0.5)]",
        ].join(" ")}
      />

      {/* Icon */}
      <div
        className={[
          "mt-0.5 ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isSuccess ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400",
        ].join(" ")}
      >
        {isSuccess ? (
          /* Checkmark */
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          /* X circle */
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            "text-[10px] font-black uppercase tracking-[0.18em] mb-0.5",
            isSuccess ? "text-emerald-400" : "text-rose-400",
          ].join(" ")}
        >
          {isSuccess ? "Success" : "Error"}
        </p>
        <p className="text-sm font-medium leading-snug text-white/90 break-words">{message}</p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        aria-label="Dismiss notification"
        className="ml-1 mt-0.5 shrink-0 text-white/30 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md p-0.5"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        className={[
          "absolute bottom-0 left-0 h-[2px] rounded-b-2xl",
          isSuccess ? "bg-emerald-400/50" : "bg-rose-400/50",
          phase === "visible" ? "animate-shrink-x" : "",
        ].join(" ")}
        style={{ width: "100%", transformOrigin: "left" }}
      />
    </div>
  );
}

/**
 * AuthNotificationContainer
 * --------------------------
 * Global fixed container that stacks multiple <AuthNotification> toasts.
 * Place this once in your layout; individual pages push items via the
 * useAuthNotification hook supplied separately.
 */

export interface NotificationItem {
  id: string;
  message: string;
  type: "success" | "error";
}

interface AuthNotificationContainerProps {
  notifications: NotificationItem[];
  onClose: (id: string) => void;
}

export function AuthNotificationContainer({
  notifications,
  onClose,
}: AuthNotificationContainerProps) {
  return (
    <div
      className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none"
      aria-label="Notification area"
    >
      {notifications.map((n) => (
        <AuthNotification
          key={n.id}
          message={n.message}
          type={n.type}
          onClose={() => onClose(n.id)}
        />
      ))}
    </div>
  );
}
