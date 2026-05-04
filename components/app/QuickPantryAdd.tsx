"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient } from "@/lib/types";
import { pickQuantityInput, type QuantityInputSpec } from "@/lib/quantity-input";

interface Props {
  ingredients: Ingredient[];
}

interface PendingState {
  display: number;
  saving: boolean;
  saved: boolean;
  error: string | null;
}

export function QuickPantryAdd({ ingredients }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, PendingState>>({});

  // Cache the per-ingredient input spec so we don't re-pick on every keystroke.
  const specById = useMemo(() => {
    const m = new Map<string, QuantityInputSpec>();
    for (const ing of ingredients) m.set(ing.id, pickQuantityInput(ing));
    return m;
  }, [ingredients]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = ingredients.filter((i) => !i.is_assumed_staple);
    if (!q) return list;
    return list.filter((i) => i.display_name.toLowerCase().includes(q));
  }, [ingredients, search]);

  function startEdit(ing: Ingredient) {
    const spec = specById.get(ing.id)!;
    setActiveId(ing.id);
    setPending((prev) => ({
      ...prev,
      [ing.id]: prev[ing.id] ?? {
        display: spec.defaultDisplay,
        saving: false,
        saved: false,
        error: null,
      },
    }));
  }

  function setDisplay(id: string, n: number) {
    setPending((prev) => ({ ...prev, [id]: { ...prev[id], display: n } }));
  }

  async function add(ing: Ingredient) {
    const cur = pending[ing.id];
    const spec = specById.get(ing.id)!;
    if (!cur || cur.display <= 0) return;
    setPending((prev) => ({ ...prev, [ing.id]: { ...cur, saving: true, error: null } }));
    try {
      const canonical = spec.toCanonical(cur.display);
      const res = await fetch("/api/pantry/lots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ingredient_id: ing.id,
          quantity_initial: canonical,
          acquired_on: new Date().toISOString().slice(0, 10),
          storage_state: ing.default_storage,
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Save failed");
      setPending((prev) => ({
        ...prev,
        [ing.id]: { display: spec.defaultDisplay, saving: false, saved: true, error: null },
      }));
      setActiveId(null);
      router.refresh();
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
          const spec = specById.get(ing.id)!;
          const state = pending[ing.id];
          const isActive = activeId === ing.id;
          const display = state?.display ?? spec.defaultDisplay;
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
                        onClick={() => setDisplay(ing.id, Math.max(spec.step, round(display - spec.step)))}
                        disabled={state?.saving}
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="qpa-stepper__value">
                        {spec.formatDisplay(display)}
                      </span>
                      <span className="qpa-stepper__unit">{spec.unitLabel}</span>
                      <button
                        type="button"
                        onClick={() => setDisplay(ing.id, round(display + spec.step))}
                        disabled={state?.saving}
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                    <div className="qpa-card__actions">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => add(ing)}
                        disabled={state?.saving || display <= 0}
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

function round(n: number): number {
  // Avoid float drift on 0.5 + 0.5 + 0.5 = 1.4999...
  return Math.round(n * 100) / 100;
}
