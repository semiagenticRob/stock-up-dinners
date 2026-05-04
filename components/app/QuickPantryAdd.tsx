"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@/lib/types";

interface Props {
  ingredients: Ingredient[];
}

interface PendingState {
  quantity: number;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

const UNIT_LABEL: Record<string, string> = {
  grams: "g",
  milliliters: "mL",
  count: "ct",
};

export function QuickPantryAdd({ ingredients }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, PendingState>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = ingredients.filter((i) => !i.is_assumed_staple);
    if (!q) return list;
    return list.filter((i) => i.display_name.toLowerCase().includes(q));
  }, [ingredients, search]);

  function defaultQuantity(ing: Ingredient): number {
    if (ing.default_par && ing.default_par > 0) return ing.default_par;
    if (ing.canonical_unit === "grams") return 454;
    if (ing.canonical_unit === "milliliters") return 500;
    return 1;
  }

  function startEdit(ing: Ingredient) {
    setActiveId(ing.id);
    setPending((prev) => ({
      ...prev,
      [ing.id]: prev[ing.id] ?? {
        quantity: defaultQuantity(ing),
        saving: false,
        saved: false,
        error: null,
      },
    }));
  }

  function setQuantity(id: string, q: number) {
    setPending((prev) => ({ ...prev, [id]: { ...prev[id], quantity: q } }));
  }

  async function add(ing: Ingredient) {
    const cur = pending[ing.id];
    if (!cur || cur.quantity <= 0) return;
    setPending((prev) => ({ ...prev, [ing.id]: { ...cur, saving: true, error: null } }));
    try {
      const res = await fetch("/api/pantry/lots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ingredient_id: ing.id,
          quantity_initial: cur.quantity,
          acquired_on: new Date().toISOString().slice(0, 10),
          storage_state: ing.default_storage,
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Save failed");
      setPending((prev) => ({
        ...prev,
        [ing.id]: { quantity: defaultQuantity(ing), saving: false, saved: true, error: null },
      }));
      setActiveId(null);
      router.refresh();
      // Clear the "saved" tick after a moment.
      setTimeout(() => {
        setPending((prev) => {
          const next = { ...prev };
          if (next[ing.id]) next[ing.id] = { ...next[ing.id], saved: false };
          return next;
        });
      }, 1500);
    } catch (err) {
      setPending((prev) => ({
        ...prev,
        [ing.id]: {
          ...cur,
          saving: false,
          error: err instanceof Error ? err.message : "Save failed",
        },
      }));
    }
  }

  return (
    <div className="qpa">
      <div className="qpa__search">
        <input
          type="search"
          placeholder="Search ingredients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="qpa__grid">
        {filtered.map((ing) => {
          const state = pending[ing.id];
          const isActive = activeId === ing.id;
          const unit = UNIT_LABEL[ing.canonical_unit] ?? ing.canonical_unit;
          return (
            <div key={ing.id} className={`qpa-card ${isActive ? "qpa-card--active" : ""}`}>
              <button
                type="button"
                className="qpa-card__media"
                style={{ backgroundImage: `url(/images/ingredients/${ing.slug}.jpg)` }}
                onClick={() => startEdit(ing)}
                aria-label={`Add ${ing.display_name}`}
              >
                {state?.saved && <span className="qpa-card__check">✓ Added</span>}
              </button>
              <div className="qpa-card__body">
                <div className="qpa-card__name">{ing.display_name}</div>
                {isActive ? (
                  <div className="qpa-card__edit">
                    <div className="qpa-stepper">
                      <button
                        type="button"
                        onClick={() => setQuantity(ing.id, Math.max(1, (state?.quantity ?? 1) - stepFor(ing)))}
                        disabled={state?.saving}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={state?.quantity ?? defaultQuantity(ing)}
                        onChange={(e) => setQuantity(ing.id, Number(e.target.value) || 0)}
                      />
                      <span className="qpa-stepper__unit">{unit}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(ing.id, (state?.quantity ?? 0) + stepFor(ing))}
                        disabled={state?.saving}
                      >
                        +
                      </button>
                    </div>
                    <div className="qpa-card__actions">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => add(ing)}
                        disabled={state?.saving || (state?.quantity ?? 0) <= 0}
                      >
                        {state?.saving ? "Adding…" : "Add to pantry"}
                      </button>
                      <button
                        type="button"
                        className="qpa-card__cancel"
                        onClick={() => setActiveId(null)}
                        disabled={state?.saving}
                      >
                        Cancel
                      </button>
                    </div>
                    {state?.error && <p className="qpa-card__error">{state.error}</p>}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="qpa-card__add"
                    onClick={() => startEdit(ing)}
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="qpa__empty">No ingredients match &ldquo;{search}&rdquo;.</p>
      )}
    </div>
  );
}

function stepFor(ing: Ingredient): number {
  if (ing.canonical_unit === "grams") return 100;
  if (ing.canonical_unit === "milliliters") return 100;
  return 1;
}
