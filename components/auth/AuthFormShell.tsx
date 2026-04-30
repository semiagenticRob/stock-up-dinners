"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "login" | "signup" | "forgot";

interface Props {
  mode: Mode;
}

const HEADINGS: Record<Mode, { title: string; lede: string; cta: string }> = {
  login: {
    title: "Welcome back",
    lede: "Sign in to your Stock Up Dinners account.",
    cta: "Sign in",
  },
  signup: {
    title: "Create your account",
    lede: "Start a 7-day free trial. No card needed yet.",
    cta: "Create account",
  },
  forgot: {
    title: "Reset your password",
    lede: "We'll email you a link to set a new one.",
    cta: "Send reset link",
  },
};

export function AuthFormShell({ mode }: Props) {
  // Lazy: only construct the client on first use. Avoids the env-var read
  // during the static-prerender pass for /login, /signup, /forgot-password.
  const getSupabase = () => createSupabaseBrowserClient();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/recipes";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);

    try {
      const supabase = getSupabase();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setInfo("Check your inbox for a confirmation link to finish creating your account.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
        });
        if (error) throw error;
        setInfo("If an account exists for that email, a reset link is on its way.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setBusy(false);
    }
  }

  const h = HEADINGS[mode];

  return (
    <div className="auth-card">
      <h1>{h.title}</h1>
      <p className="lede">{h.lede}</p>

      {error && <div className="auth-error">{error}</div>}
      {info && <div className="auth-success">{info}</div>}

      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        {mode !== "forgot" && (
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "8+ characters" : ""}
            />
          </label>
        )}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "…" : h.cta}
        </button>
      </form>

      {mode !== "forgot" && (
        <>
          <div className="auth-divider">or</div>
          <button type="button" className="auth-google" onClick={onGoogle} disabled={busy}>
            Continue with Google
          </button>
        </>
      )}

      <div className="auth-foot">
        {mode === "login" && (
          <>
            New here? <Link href="/signup">Create an account</Link> ·{" "}
            <Link href="/forgot-password">Forgot password?</Link>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        )}
        {mode === "forgot" && (
          <>
            Remembered it? <Link href="/login">Sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}
