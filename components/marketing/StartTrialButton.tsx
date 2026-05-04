"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Props {
  plan: "monthly" | "annual";
  className?: string;
  children?: React.ReactNode;
}

export function StartTrialButton({ plan, className = "btn", children = "Start free trial" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/signup?plan=${plan}`);
        return;
      }

      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Checkout failed (${res.status})`);
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={onClick} disabled={busy}>
        {busy ? "…" : children}
      </button>
      {error && <p style={{ color: "var(--c-accent)", fontSize: 13, marginTop: 8 }}>{error}</p>}
    </>
  );
}
