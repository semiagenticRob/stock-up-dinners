"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient, StorageState } from "@/lib/types";

interface Props {
  ingredients: Ingredient[];
}

export function AddLotForm({ ingredients }: Props) {
  const router = useRouter();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [acquired, setAcquired] = useState(today);
  const [storageState, setStorageState] = useState<StorageState | "">("");
  const [overrideExpires, setOverrideExpires] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ingredient = useMemo(
    () => ingredients.find((i) => i.id === ingredientId),
    [ingredients, ingredientId],
  );

  // Storage default mirrors the ingredient's default_storage when the user
  // hasn't explicitly chosen one.
  const effectiveStorage: StorageState = (storageState || ingredient?.default_storage || "pantry");

  const computedExpiry = useMemo(() => {
    if (!ingredient || !acquired) return null;
    const days =
      effectiveStorage === "frozen"
        ? ingredient.shelf_life_freezer_days
        : effectiveStorage === "refrigerated"
          ? ingredient.shelf_life_fridge_days
          : ingredient.shelf_life_pantry_days;
    if (days == null) return null;
    const d = new Date(acquired);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }, [ingredient, acquired, effectiveStorage]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ingredientId) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        ingredient_id: ingredientId,
        quantity_initial: Number(quantity),
        acquired_on: acquired,
        storage_state: effectiveStorage,
        notes: notes || null,
      };
      if (overrideExpires) body.expires_on = overrideExpires;
      const res = await fetch("/api/pantry/lots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      router.push("/pantry");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="add-lot-form" onSubmit={onSubmit}>
      {error && <div className="auth-error">{error}</div>}
      <label>
        Ingredient
        <select
          required
          value={ingredientId}
          onChange={(e) => setIngredientId(e.target.value)}
        >
          {ingredients.map((i) => (
            <option key={i.id} value={i.id}>
              {i.display_name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Quantity ({ingredient?.canonical_unit ?? "units"})
        <input
          type="number"
          min={1}
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={ingredient?.canonical_unit === "grams" ? "e.g. 1361 (3 lb)" : ""}
        />
      </label>

      <label>
        Acquired on
        <input type="date" required value={acquired} onChange={(e) => setAcquired(e.target.value)} />
      </label>

      <label>
        Storage
        <select
          value={storageState || (ingredient?.default_storage ?? "pantry")}
          onChange={(e) => setStorageState(e.target.value as StorageState)}
        >
          <option value="pantry">Pantry</option>
          <option value="refrigerated">Refrigerated</option>
          <option value="frozen">Frozen</option>
        </select>
      </label>

      <label>
        Expires on{" "}
        <span className="add-lot-form__hint">
          {computedExpiry
            ? `Default: ${computedExpiry} (from shelf life)`
            : "No default — set one if you want to track expiration"}
        </span>
        <input
          type="date"
          value={overrideExpires}
          onChange={(e) => setOverrideExpires(e.target.value)}
          placeholder={computedExpiry ?? ""}
        />
      </label>

      <label>
        Notes <span className="add-lot-form__hint">(optional)</span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="anything to remember about this lot"
        />
      </label>

      <button type="submit" className="btn" disabled={busy}>
        {busy ? "Saving…" : "Save lot"}
      </button>
    </form>
  );
}
