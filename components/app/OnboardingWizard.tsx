"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ALLERGEN_OPTIONS = ["dairy", "gluten", "nuts", "shellfish", "egg", "soy"];
const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "gluten_free", label: "Gluten-free" },
];
const MEAT_OPTIONS = ["pork", "beef", "chicken", "turkey", "lamb", "seafood"];

const STEPS = ["Welcome", "Diet", "Done"] as const;

/**
 * Tri-state preference group: a list of options + an explicit "No restrictions"
 * toggle that mutually-excludes with the rest. Picking any option clears the
 * "No restrictions" flag; picking "No restrictions" clears every option.
 */
interface ChipGroupState {
  selected: string[];
  noneOfThese: boolean;
}

const EMPTY_GROUP: ChipGroupState = { selected: [], noneOfThese: false };

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dietary, setDietary] = useState<ChipGroupState>(EMPTY_GROUP);
  const [allergens, setAllergens] = useState<ChipGroupState>(EMPTY_GROUP);
  const [blockedMeats, setBlockedMeats] = useState<ChipGroupState>(EMPTY_GROUP);

  function toggleOption(
    state: ChipGroupState,
    setter: (s: ChipGroupState) => void,
    value: string,
  ) {
    const isOn = state.selected.includes(value);
    setter({
      noneOfThese: false,
      selected: isOn
        ? state.selected.filter((v) => v !== value)
        : [...state.selected, value],
    });
  }

  function toggleNone(state: ChipGroupState, setter: (s: ChipGroupState) => void) {
    setter({ selected: [], noneOfThese: !state.noneOfThese });
  }

  async function finalize() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preferences: {
            dietary_filters: dietary.selected,
            allergens: allergens.selected,
            blocked_meats: blockedMeats.selected,
            blocked_ingredients: [],
          },
          pantry_seed: [],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
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
            Three minutes to set things up: tell us what you avoid. After that, we&apos;ll start
            suggesting dinners.
          </p>
          <div className="ob__nav">
            <span />
            <button className="btn" onClick={() => setStep(1)}>
              Get started →
            </button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1>Diet, allergens, blocked meats.</h1>
          <p className="ob__lede">
            All optional. Tap to toggle, or pick &ldquo;No restrictions&rdquo;. We&apos;ll never
            suggest a recipe that violates these.
          </p>

          <div className="ob__group">
            <h3>Dietary preferences</h3>
            <div className="ob__chips">
              <NoneChip state={dietary} onToggle={() => toggleNone(dietary, setDietary)} />
              {DIETARY_OPTIONS.map((d) => (
                <Chip
                  key={d.id}
                  label={d.label}
                  on={dietary.selected.includes(d.id)}
                  disabled={dietary.noneOfThese}
                  onClick={() => toggleOption(dietary, setDietary, d.id)}
                />
              ))}
            </div>
          </div>

          <div className="ob__group">
            <h3>Allergens to avoid</h3>
            <div className="ob__chips">
              <NoneChip state={allergens} onToggle={() => toggleNone(allergens, setAllergens)} />
              {ALLERGEN_OPTIONS.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  on={allergens.selected.includes(a)}
                  disabled={allergens.noneOfThese}
                  onClick={() => toggleOption(allergens, setAllergens, a)}
                />
              ))}
            </div>
          </div>

          <div className="ob__group">
            <h3>Meats to skip</h3>
            <div className="ob__chips">
              <NoneChip
                state={blockedMeats}
                onToggle={() => toggleNone(blockedMeats, setBlockedMeats)}
              />
              {MEAT_OPTIONS.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  on={blockedMeats.selected.includes(m)}
                  disabled={blockedMeats.noneOfThese}
                  onClick={() => toggleOption(blockedMeats, setBlockedMeats, m)}
                />
              ))}
            </div>
          </div>

          <div className="ob__nav">
            <button className="btn btn--secondary" onClick={() => setStep(0)}>
              ← Back
            </button>
            <button className="btn" onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1>You&apos;re all set.</h1>
          <p className="ob__lede">
            Your preferences are saved. Add what&apos;s in your pantry from the Pantry tab whenever
            you&apos;ve got a minute, or kick off a live shopping session at Costco — we&apos;ll
            track everything from there.
          </p>
          <div className="ob__nav">
            <button className="btn btn--secondary" onClick={() => setStep(1)}>
              ← Back
            </button>
            <button className="btn" onClick={finalize} disabled={busy}>
              {busy ? "Saving…" : "Open my kitchen →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  label,
  on,
  disabled = false,
  onClick,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`ob__chip ${on ? "ob__chip--on" : ""} ${disabled ? "ob__chip--disabled" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function NoneChip({
  state,
  onToggle,
}: {
  state: ChipGroupState;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`ob__chip ob__chip--none ${state.noneOfThese ? "ob__chip--on" : ""}`}
      onClick={onToggle}
    >
      No restrictions
    </button>
  );
}
