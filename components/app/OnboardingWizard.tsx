"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient, StorageState } from "@/lib/types";

interface Props {
  ingredients: Ingredient[];
}

const ALLERGEN_OPTIONS = ["dairy", "gluten", "nuts", "shellfish", "egg", "soy"];
const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "gluten_free", label: "Gluten-free" },
];
const MEAT_OPTIONS = ["pork", "beef", "chicken", "turkey", "lamb", "seafood"];

const STEPS = ["Welcome", "Diet", "Pantry", "Done"] as const;

export function OnboardingWizard({ ingredients }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diet & filters state.
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [blockedMeats, setBlockedMeats] = useState<string[]>([]);

  // Pantry seed state: ingredient_id → quantity.
  const [seed, setSeed] = useState<Record<string, number>>({});

  const ingredientsByCategory = useMemo(() => {
    const m = new Map<string, Ingredient[]>();
    for (const ing of ingredients) {
      if (ing.is_assumed_staple) continue;
      if (!m.has(ing.category)) m.set(ing.category, []);
      m.get(ing.category)!.push(ing);
    }
    for (const list of m.values()) {
      list.sort((a, b) => a.display_name.localeCompare(b.display_name));
    }
    return m;
  }, [ingredients]);

  function toggle<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  async function finalize() {
    setBusy(true);
    setError(null);
    try {
      const pantry_seed = Object.entries(seed)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => {
          const ing = ingredients.find((i) => i.id === id);
          const storage_state: StorageState | undefined = ing?.default_storage;
          return { ingredient_id: id, quantity_initial: q, storage_state };
        });

      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preferences: {
            dietary_filters: dietary,
            allergens,
            blocked_meats: blockedMeats,
            blocked_ingredients: [],
          },
          pantry_seed,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      // Onboarding complete → middleware will route to /pricing if no
      // active subscription, else to /recipes. router.refresh() picks up
      // the new server-side state.
      router.refresh();
      router.push("/recipes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finalize onboarding");
      setBusy(false);
    }
  }

  return (
    <div className="ob">
      <div className="ob__steps">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`ob__step ${
              i === step ? "ob__step--current" : i < step ? "ob__step--done" : ""
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {step === 0 && (
        <>
          <h1>Welcome to Stock Up Dinners.</h1>
          <p className="ob__lede">
            Two minutes to set things up: tell us what you avoid, and let us know what&apos;s
            already in your kitchen. After that, we&apos;ll start suggesting dinners.
          </p>
          <div className="ob__nav">
            <span />
            <button className="btn" onClick={() => setStep(1)}>Get started →</button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1>Diet, allergens, blocked meats.</h1>
          <p className="ob__lede">
            All optional. Tap to toggle. We&apos;ll never suggest a recipe that violates these.
          </p>

          <div className="ob__group">
            <h3>Dietary preferences</h3>
            <div className="ob__chips">
              {DIETARY_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  className={`ob__chip ${dietary.includes(d.id) ? "ob__chip--on" : ""}`}
                  onClick={() => setDietary(toggle(dietary, d.id))}
                  type="button"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ob__group">
            <h3>Allergens to avoid</h3>
            <div className="ob__chips">
              {ALLERGEN_OPTIONS.map((a) => (
                <button
                  key={a}
                  className={`ob__chip ${allergens.includes(a) ? "ob__chip--on" : ""}`}
                  onClick={() => setAllergens(toggle(allergens, a))}
                  type="button"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="ob__group">
            <h3>Meats to skip</h3>
            <div className="ob__chips">
              {MEAT_OPTIONS.map((m) => (
                <button
                  key={m}
                  className={`ob__chip ${blockedMeats.includes(m) ? "ob__chip--on" : ""}`}
                  onClick={() => setBlockedMeats(toggle(blockedMeats, m))}
                  type="button"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="ob__nav">
            <button className="btn btn--secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn" onClick={() => setStep(2)}>Continue →</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1>What&apos;s already in your kitchen?</h1>
          <p className="ob__lede">
            Tap to add an item; type a rough quantity. Skip the ones you don&apos;t have or
            don&apos;t feel like measuring — you can always add more from the Pantry tab later.
          </p>

          {[...ingredientsByCategory.entries()].map(([cat, items]) => (
            <div key={cat} className="ob__group">
              <h3>{cat.replace(/_/g, " ")}</h3>
              <div className="ob__pick-grid">
                {items.map((i) => {
                  const on = (seed[i.id] ?? 0) > 0;
                  return (
                    <label key={i.id} className={`ob__pick ${on ? "ob__pick--on" : ""}`}>
                      <span className="ob__pick__name">{i.display_name}</span>
                      <input
                        type="number"
                        min={0}
                        placeholder={i.canonical_unit}
                        value={seed[i.id] ?? ""}
                        onChange={(e) =>
                          setSeed((s) => ({
                            ...s,
                            [i.id]: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="ob__nav">
            <button className="btn btn--secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn" onClick={() => setStep(3)}>Continue →</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1>You&apos;re all set.</h1>
          <p className="ob__lede">
            We saved your preferences and {Object.values(seed).filter((v) => v > 0).length} pantry
            items. If you haven&apos;t subscribed yet, we&apos;ll bounce you through pricing — your
            work is already saved.
          </p>
          <div className="ob__nav">
            <button className="btn btn--secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn" onClick={finalize} disabled={busy}>
              {busy ? "Saving…" : "Open my kitchen →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
