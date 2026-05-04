"use client";

import { useMemo, useState } from "react";
import type { Ingredient, PantryParOverride, UserPreferences } from "@/lib/types";
import { formatPantryQuantity } from "@/lib/format-quantity";

interface Props {
  preferences: UserPreferences;
  ingredients: Ingredient[];
  initialOverrides: PantryParOverride[];
}

export function PantryDefaultsTab({ preferences, ingredients, initialOverrides }: Props) {
  // Default threshold: edited locally, saved via /api/preferences.
  const [thresholdPct, setThresholdPct] = useState(preferences.default_threshold_pct);
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [thresholdInfo, setThresholdInfo] = useState<string | null>(null);
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  const overrideById = useMemo(() => {
    const m = new Map<string, PantryParOverride>();
    for (const o of initialOverrides) m.set(o.ingredient_id, o);
    return m;
  }, [initialOverrides]);

  const sortedIngredients = useMemo(
    () =>
      [...ingredients]
        .filter((i) => !i.is_assumed_staple)
        .sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.display_name.localeCompare(b.display_name);
        }),
    [ingredients],
  );

  async function saveThreshold() {
    setSavingThreshold(true);
    setThresholdInfo(null);
    setThresholdError(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ default_threshold_pct: thresholdPct }),
      });
      if (!res.ok) throw new Error(await res.text());
      setThresholdInfo("Saved.");
    } catch (err) {
      setThresholdError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSavingThreshold(false);
    }
  }

  return (
    <section className="settings-tab">
      <h2 className="settings-tab__head">Pantry Defaults</h2>
      <p className="settings-tab__lede">
        Par level is how much of an item you want to keep on hand. The threshold is the percentage
        of par that triggers re-buy. Both can be overridden per ingredient below.
      </p>

      <div className="settings-group">
        <h3>Default threshold</h3>
        <p className="settings-group__hint">
          When you have less than this percentage of an ingredient&apos;s par level, it lands on the
          shopping list.
        </p>
        <div className="settings-slider">
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={thresholdPct}
            onChange={(e) => setThresholdPct(Number(e.target.value))}
            aria-label="Default re-buy threshold percentage"
          />
          <span className="settings-slider__readout">{thresholdPct}%</span>
        </div>
        <div className="settings-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn"
            onClick={saveThreshold}
            disabled={savingThreshold || thresholdPct === preferences.default_threshold_pct}
          >
            {savingThreshold ? "Saving…" : "Save threshold"}
          </button>
          {thresholdInfo && <p className="settings-tab__ok">{thresholdInfo}</p>}
          {thresholdError && <p className="settings-tab__err">{thresholdError}</p>}
        </div>
      </div>

      <div className="settings-group">
        <h3>Per-ingredient overrides</h3>
        <p className="settings-group__hint">
          Override par level (default = the catalog&apos;s suggested pack size) and threshold per
          ingredient. Empty fields use defaults.
        </p>
        <ul className="par-rows">
          {sortedIngredients.map((ing) => (
            <ParRow
              key={ing.id}
              ingredient={ing}
              initialOverride={overrideById.get(ing.id) ?? null}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ParRow({
  ingredient,
  initialOverride,
}: {
  ingredient: Ingredient;
  initialOverride: PantryParOverride | null;
}) {
  const [par, setPar] = useState<string>(
    initialOverride?.par_quantity != null ? String(initialOverride.par_quantity) : "",
  );
  const [thresh, setThresh] = useState<string>(
    initialOverride?.threshold_pct != null ? String(initialOverride.threshold_pct) : "",
  );
  const [busy, setBusy] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function flashSaved() {
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  }

  const baselinePar = ingredient.default_par;
  const hasOverride = par.trim() !== "" || thresh.trim() !== "";
  const isDirty =
    (par.trim() !== "" ? Number(par) : null) !== (initialOverride?.par_quantity ?? null) ||
    (thresh.trim() !== "" ? Number(thresh) : null) !== (initialOverride?.threshold_pct ?? null);

  async function save() {
    setBusy(true);
    try {
      const parNum = par.trim() === "" ? null : Number(par);
      const threshNum = thresh.trim() === "" ? null : Number(thresh);
      if (parNum === null && threshNum === null) {
        const res = await fetch(`/api/par-overrides/${ingredient.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`/api/par-overrides/${ingredient.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ par_quantity: parNum, threshold_pct: threshNum }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      flashSaved();
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  async function clearRow() {
    if (!confirm(`Clear override for ${ingredient.display_name}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/par-overrides/${ingredient.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setPar("");
      setThresh("");
      flashSaved();
    } catch (err) {
      alert(`Clear failed: ${err instanceof Error ? err.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="par-row">
      <div className="par-row__name">
        <span>{ingredient.display_name}</span>
        {baselinePar != null && (
          <span className="par-row__baseline">
            default par {formatPantryQuantity(baselinePar, ingredient.canonical_unit)}
          </span>
        )}
      </div>
      <label className="par-row__field">
        <span>Par</span>
        <input
          type="number"
          min={1}
          inputMode="numeric"
          placeholder={String(baselinePar ?? "")}
          value={par}
          onChange={(e) => setPar(e.target.value)}
        />
        <small>{ingredient.canonical_unit}</small>
      </label>
      <label className="par-row__field">
        <span>Threshold</span>
        <input
          type="number"
          min={1}
          max={100}
          inputMode="numeric"
          placeholder="default"
          value={thresh}
          onChange={(e) => setThresh(e.target.value)}
        />
        <small>%</small>
      </label>
      <div className="par-row__actions">
        <button type="button" className="btn-pill" disabled={busy || !isDirty} onClick={save}>
          {busy ? "…" : justSaved ? "Saved ✓" : "Save"}
        </button>
        {hasOverride && (
          <button type="button" className="btn-pill" disabled={busy} onClick={clearRow}>
            Clear
          </button>
        )}
      </div>
    </li>
  );
}
