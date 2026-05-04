"use client";

import { useState } from "react";

interface ProfileRow {
  subscription_status: string | null;
  subscription_period_end: string | null;
  stripe_customer_id: string | null;
}

interface Props {
  profile: ProfileRow | null;
}

const STATUS_LABELS: Record<string, { label: string; tone: "ok" | "warn" | "bad" | "muted" }> = {
  active: { label: "Active", tone: "ok" },
  trialing: { label: "Free trial", tone: "ok" },
  past_due: { label: "Past due", tone: "warn" },
  canceled: { label: "Canceled", tone: "bad" },
  none: { label: "Not subscribed", tone: "muted" },
};

export function SubscriptionTab({ profile }: Props) {
  const status = profile?.subscription_status ?? "none";
  const meta = STATUS_LABELS[status] ?? STATUS_LABELS.none;
  const periodEnd = profile?.subscription_period_end
    ? new Date(profile.subscription_period_end)
    : null;
  const hasCustomer = !!profile?.stripe_customer_id;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-portal", { method: "POST" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const body = (await res.json()) as { url: string };
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the billing portal");
      setBusy(false);
    }
  }

  return (
    <section className="settings-tab">
      <h2 className="settings-tab__head">Subscription</h2>

      <dl className="settings-kv">
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`settings-pill settings-pill--${meta.tone}`}>{meta.label}</span>
          </dd>
        </div>
        {periodEnd && (
          <div>
            <dt>{status === "canceled" ? "Ends" : "Renews"}</dt>
            <dd>
              {periodEnd.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </dd>
          </div>
        )}
      </dl>

      {hasCustomer ? (
        <>
          <p className="settings-tab__lede">
            Update your card, change plans, download invoices, or cancel anytime via Stripe&apos;s
            customer portal.
          </p>
          <button type="button" className="btn" disabled={busy} onClick={openPortal}>
            {busy ? "Opening…" : "Manage subscription in Stripe"}
          </button>
          {error && <p className="settings-tab__err">{error}</p>}
        </>
      ) : (
        <>
          <p className="settings-tab__lede">
            You&apos;re not subscribed yet. Pick a plan to start your free trial.
          </p>
          <a href="/pricing" className="btn">
            See pricing
          </a>
        </>
      )}
    </section>
  );
}
