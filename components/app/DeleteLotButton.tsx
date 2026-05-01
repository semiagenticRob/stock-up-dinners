"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteLotButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (busy) return;
    if (!confirm("Delete this lot?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/pantry/lots/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.text();
        alert(`Delete failed: ${body || res.statusText}`);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      className="lot-delete"
      aria-label="Delete lot"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}
