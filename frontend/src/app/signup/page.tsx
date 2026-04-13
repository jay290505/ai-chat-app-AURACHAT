/**
 * app/signup/page.tsx
 * --------------------
 * Premium Sign Up page for Aura Messenger.
 *
 * Features:
 *  • Full Name, Email, Password, Confirm Password fields
 *  • Client-side validation:
 *      – All fields required
 *      – Valid email format
 *      – Password ≥ 8 chars
 *      – Passwords must match
 *  • Show / Hide toggle on both password fields
 *  • Password strength meter
 *  • Loading spinner while API call is in progress
 *  • Google OAuth sign-up
 *  • Success / Error notifications via AuthNotification
 *  • Redirects to /chat on success
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AuthNotificationContainer, type NotificationItem } from "@/components/AuthNotification";

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Derive a 0-4 strength score from a password string */
function passwordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOURS = ["", "bg-rose-500", "bg-amber-500", "bg-yellow-400", "bg-emerald-500"];
const STRENGTH_TEXT_COLOURS = ["", "text-rose-400", "text-amber-400", "text-yellow-400", "text-emerald-400"];

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function AuraLogo() {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30">
        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.75 5.25H19l-4.5 3.25 1.75 5.25L12 13.5l-4.25 3.25 1.75-5.25L5 8.25h5.25z" />
        </svg>
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-zinc-400">
        Aura
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/** Eye-off and Eye icons for show/hide toggles */
function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-.857.107-1.69.308-2.485M6.22 6.22A9.956 9.956 0 0112 5c5.523 0 10 4.477 10 10a9.956 9.956 0 01-1.665 5.556M3 3l18 18" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

/** Inline validation error message */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1 text-xs text-rose-400" role="alert">
      <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      {message}
    </p>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const router = useRouter();

  // Auth store
  const userId = useAuthStore((s) => s.userId);
  const loading = useAuthStore((s) => s.loading);
  const init = useAuthStore((s) => s.init);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Derived
  const pwStrength = passwordStrength(password);

  // Toast notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const pushNotification = useCallback((message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);
  const closeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Init
  useEffect(() => { void init(); }, [init]);
  useEffect(() => { if (userId) router.replace("/chat"); }, [userId, router]);

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const e: FormErrors = {};
    if (!fullName.trim()) e.fullName = "Full name is required.";
    if (!email.trim()) {
      e.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Please enter a valid email address.";
    }
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 8) {
      e.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      e.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      e.confirmPassword = "Passwords do not match.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [fullName, email, password, confirmPassword]);

  useEffect(() => { if (submitted) validate(); }, [fullName, email, password, confirmPassword, submitted, validate]);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) {
      pushNotification("Please fix the errors below before continuing.", "error");
      return;
    }

    // Derive a simple username from full name (lowercased, spaces → underscores)
    const username = fullName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    await signUpWithEmail({ email: email.trim(), password, fullName: fullName.trim(), username });

    const storeState = useAuthStore.getState();
    if (storeState.error) {
      pushNotification(storeState.error, "error");
    } else {
      pushNotification("Account created! Welcome to Aura Messenger 🎉", "success");
      router.replace("/chat");
    }
  };

  const handleGoogle = async () => {
    await signInWithGoogle();
    const err = useAuthStore.getState().error;
    if (err) pushNotification(err, "error");
  };

  // ── Shared input class builder ──────────────────────────────────────────
  const inputBase =
    "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-zinc-50 outline-none ring-0 transition-all duration-200 placeholder:text-zinc-600 focus:bg-white/8 focus:ring-2";

  const inputClass = (field: keyof FormErrors, extra = "") =>
    [
      inputBase,
      errors[field]
        ? "border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/30"
        : "border-white/10 focus:border-indigo-500/60 focus:ring-indigo-500/20",
      extra,
    ].join(" ");

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <AuthNotificationContainer notifications={notifications} onClose={closeNotification} />

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-12">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-purple-900/20 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-900/15 blur-[100px]" />
        </div>

        {/* Card */}
        <div className="relative w-full max-w-md animate-slide-up">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

          <div className="relative rounded-3xl border border-white/8 bg-[var(--navy-light)]/90 p-8 shadow-[0_40px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <AuraLogo />
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-50">
                Create your account
              </h1>
              <p className="mt-1.5 text-sm text-zinc-500">
                Join the Aura experience — free forever
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="signup-fullname" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Full Name
                </label>
                <input
                  id="signup-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className={inputClass("fullName")}
                  aria-describedby={errors.fullName ? "fullname-error" : undefined}
                />
                <FieldError id="fullname-error" message={errors.fullName} />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="signup-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass("email")}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                <FieldError id="email-error" message={errors.email} />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="signup-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={inputClass("password", "pr-12")}
                    aria-describedby={errors.password ? "password-error" : "password-strength"}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <FieldError id="password-error" message={errors.password} />

                {/* Strength meter */}
                {password && (
                  <div id="password-strength" className="mt-2.5 space-y-1.5" aria-label={`Password strength: ${STRENGTH_LABELS[pwStrength]}`}>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={[
                            "h-1 flex-1 rounded-full transition-all duration-500",
                            bar <= pwStrength
                              ? STRENGTH_COLOURS[pwStrength]
                              : "bg-white/10",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                    <p className={["text-xs font-medium", STRENGTH_TEXT_COLOURS[pwStrength]].join(" ")}>
                      {STRENGTH_LABELS[pwStrength]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="signup-confirm" className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="signup-confirm"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={inputClass("confirmPassword", "pr-12")}
                    aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
                <FieldError id="confirm-error" message={errors.confirmPassword} />
              </div>

              {/* Terms notice */}
              <p className="text-xs text-zinc-600 leading-relaxed">
                By creating an account, you agree to our{" "}
                <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</a>.
              </p>

              {/* Submit */}
              <button
                id="signup-submit"
                type="submit"
                disabled={loading}
                className="group relative mt-1 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--navy-light)]"
              >
                {loading ? (
                  <>
                    <Spinner /> Creating your account…
                  </>
                ) : (
                  <>
                    Create free account
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-600">or</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Google */}
              <button
                id="signup-google"
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:text-white active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            </form>

            {/* Footer */}
            <p className="mt-7 text-center text-sm text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
