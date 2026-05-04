"use client";

import { useState } from "react";
import type { UserPreferences } from "@/lib/types";

const ALLERGEN_OPTIONS = ["dairy", "gluten", "nuts", "shellfish", "egg", "soy"];
const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "gluten_free", label: "Gluten-free" },
];
const MEAT_OPTIONS = ["pork", "beef", "chicken", "turkey", "lamb", "seafood"];

interface ChipGroupState {
  selected: string[];
  noneOfThese: boolean;
}

function toGroup(selected: string[]): ChipGroupState {
  return { selected, noneOfThese: false };
}

export function DietTab({ initial }: { initial: UserPreferences }) {
  const [dietary, setDietary] = useState<ChipGroupState>(toGroup(initial.dietary_filters));
  const [allergens, setAllergens] = useState<ChipGroupState>(toGroup(initial.allergens));
  const [blockedMeats, setBlockedMeats] = useState<ChipGroupState>(toGroup(initial.blocked_meats));
  const [useSoonDays, setUseSoonDays] = useState(initial.use_soon_threshold_days);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function toggleOption(state: ChipGroupState, setter: (s: ChipGroupState) => void, value: string) {
    const isOn = state.selected.includes(value);
    setter({
      noneOfThese: false,
      selected: isOn ? state.selected.filter((v) => v !== value) : [...state.selected, value],
    });
  }

  function toggleNone(state: ChipGroupState, setter: (s: ChipGroupState) => void) {
    setter({ selected: [], noneOfThese: !state.noneOfThese });
  }

  async function save() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dietary_filters: dietary.selected,
          allergens: allergens.selected,
          blocked_meats: blockedMeats.selected,
          use_soon_threshold_days: useSoonDays,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      setInfo("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save preferences");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-tab">
      <h2 className="settings-tab__head">Diet &amp; Preferences</h2>
      <p className="settings-tab__lede">
        We&apos;ll never suggest a recipe that violates these. Pick &ldquo;No restrictions&rdquo; in
        any group to opt out entirely.
      </p>

      <div className="settings-group">
        <h3>Dietary preferences</h3>
        <div className="settings-chips">
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

      <div className="settings-group">
        <h3>Allergens to avoid</h3>
        <div className="settings-chips">
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

      <div className="settings-group">
        <h3>Meats to skip</h3>
        <div className="settings-chips">
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

      <div className="settings-group">
        <h3>Use-soon threshold</h3>
        <p className="settings-group__hint">
          Recipes get a use-soon tag when a pantry lot will expire within this many days.
        </p>
        <div className="settings-slider">
          <input
            type="range"
            min={1}
            max={14}
            step={1}
            value={useSoonDays}
            onChange={(e) => setUseSoonDays(Number(e.target.value))}
            aria-label="Use-soon threshold in days"
          />
          <span className="settings-slider__readout">
            {useSoonDays} {useSoonDays === 1 ? "day" : "days"}
          </span>
        </div>
      </div>

      <div className="settings-actions">
        <button type="button" className="btn" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        {info && <p className="settings-tab__ok">{info}</p>}
        {error && <p className="settings-tab__err">{error}</p>}
      </div>
    </section>
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
