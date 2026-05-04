"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Props {
  email: string;
  displayName: string;
}

export function ProfileTab({ email, displayName }: Props) {
  const router = useRouter();
  const getSupabase = () => createSupabaseBrowserClient();

  // ----- Display name -----
  const [name, setName] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [nameInfo, setNameInfo] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  async function saveName() {
    setSavingName(true);
    setNameInfo(null);
    setNameError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ display_name: name.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNameInfo("Saved.");
      router.refresh();
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSavingName(false);
    }
  }

  // ----- Email change -----
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function changeEmail() {
    if (!newEmail || newEmail === email) {
      setEmailError("Enter a different email address.");
      return;
    }
    setSavingEmail(true);
    setEmailInfo(null);
    setEmailError(null);
    try {
      const { error } = await getSupabase().auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailInfo(
        "We sent a confirmation link to your new email. The change won't take effect until you confirm.",
      );
      setNewEmail("");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Could not request email change");
    } finally {
      setSavingEmail(false);
    }
  }

  // ----- Password reset -----
  const [sendingReset, setSendingReset] = useState(false);
  const [resetInfo, setResetInfo] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  async function sendPasswordReset() {
    setSendingReset(true);
    setResetInfo(null);
    setResetError(null);
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });
      if (error) throw error;
      setResetInfo(`Reset link sent to ${email}. Click it to set a new password.`);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not send reset link");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <section className="settings-tab">
      <h2 className="settings-tab__head">Profile</h2>

      <div className="settings-group">
        <h3>Display name</h3>
        <p className="settings-group__hint">Optional. Shown in the top nav and welcome emails.</p>
        <div className="settings-input-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={120}
          />
          <button
            type="button"
            className="btn"
            onClick={saveName}
            disabled={savingName || name.trim() === displayName}
          >
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>
        {nameInfo && <p className="settings-tab__ok">{nameInfo}</p>}
        {nameError && <p className="settings-tab__err">{nameError}</p>}
      </div>

      <div className="settings-group">
        <h3>Email</h3>
        <p className="settings-group__hint">
          Current address: <strong>{email}</strong>. Changing it sends a confirmation link to the
          new address; the change won&apos;t take effect until you click that link.
        </p>
        <div className="settings-input-row">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
            autoComplete="email"
          />
          <button
            type="button"
            className="btn"
            onClick={changeEmail}
            disabled={savingEmail || !newEmail || newEmail === email}
          >
            {savingEmail ? "Sending…" : "Change email"}
          </button>
        </div>
        {emailInfo && <p className="settings-tab__ok">{emailInfo}</p>}
        {emailError && <p className="settings-tab__err">{emailError}</p>}
      </div>

      <div className="settings-group">
        <h3>Password</h3>
        <p className="settings-group__hint">
          We&apos;ll email you a link to set a new password.
        </p>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={sendPasswordReset}
          disabled={sendingReset}
        >
          {sendingReset ? "Sending…" : "Send password-reset link"}
        </button>
        {resetInfo && <p className="settings-tab__ok">{resetInfo}</p>}
        {resetError && <p className="settings-tab__err">{resetError}</p>}
      </div>
    </section>
  );
}
