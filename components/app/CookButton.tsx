"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  recipeId: string;
  defaultServings: number;
  disabled?: boolean;
}

export function CookButton({ recipeId, defaultServings, disabled = false }: Props) {
  const router = useRouter();
  const [servings, setServings] = useState(defaultServings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onCook() {
    if (busy || disabled) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/cook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ servings_cooked: servings }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const body = (await res.json()) as { shortfalls?: Array<{ ingredient_id: string }> };
      if (body.shortfalls && body.shortfalls.length > 0) {
        setInfo(
          `Cooked. We tracked less than the recipe needed for ${body.shortfalls.length} ingredient${body.shortfalls.length > 1 ? "s" : ""} — adjust pantry quantities if needed.`,
        );
      } else {
        setInfo("Cooked. Pantry updated.");
      }
      router.refresh();
      // Bounce back to /recipes after a short delay so the user reads the toast.
      setTimeout(() => router.push("/recipes"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cook failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cook-bar">
      <label className="cook-bar__servings">
        Servings
        <input
          type="number"
          min={1}
          max={99}
          value={servings}
          onChange={(e) => setServings(Math.max(1, Number(e.target.value) || 1))}
          disabled={busy || disabled}
        />
      </label>
      <button
        type="button"
        className="btn"
        onClick={onCook}
        disabled={busy || disabled}
      >
        {busy ? "Cooking…" : disabled ? "Missing ingredients" : "I cooked this"}
      </button>
      {error && <p className="cook-bar__msg cook-bar__msg--err">{error}</p>}
      {info && <p className="cook-bar__msg cook-bar__msg--ok">{info}</p>}
    </div>
  );
}
