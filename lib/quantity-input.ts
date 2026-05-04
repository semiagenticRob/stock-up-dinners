/**
 * Pick a natural display unit for entering pantry quantities.
 *
 * The DB stores everything in canonical units (grams / milliliters / count),
 * but no human shopping at Costco thinks "I just bought 2268 grams of apples."
 * They think "5 lb." This helper picks a sensible display unit per ingredient
 * and gives both directions of conversion plus a default quantity and step.
 */

import type { CanonicalUnit, Ingredient } from "@/lib/types";

const G_PER_LB = 453.592;
const G_PER_OZ = 28.3495;
const ML_PER_CUP = 240;
const ML_PER_FL_OZ = 29.5735;
const ML_PER_TBSP = 14.7868;

export interface QuantityInputSpec {
  /** Short label shown next to the stepper, e.g. "lb" or "ct". */
  unitLabel: string;
  /** Default value shown in the input on first open, in display units. */
  defaultDisplay: number;
  /** Increment for a single +/- click, in display units. */
  step: number;
  /** Convert a display-unit number back to canonical for storage. */
  toCanonical: (n: number) => number;
  /** Render a display-unit number for the stepper input. */
  formatDisplay: (n: number) => string;
}

export function pickQuantityInput(ing: Ingredient): QuantityInputSpec {
  const par = ing.default_par;
  const unit = ing.canonical_unit;

  if (unit === "count") {
    return {
      unitLabel: "ct",
      defaultDisplay: par && par > 0 ? par : 1,
      step: 1,
      toCanonical: (n) => Math.max(1, Math.round(n)),
      formatDisplay: (n) => String(Math.round(n)),
    };
  }

  if (unit === "grams") {
    // ≥1 lb → think in pounds; below that → ounces.
    const usePounds = (par ?? G_PER_LB) >= G_PER_LB;
    if (usePounds) {
      const defaultLb = par ? round(par / G_PER_LB, 1) : 1;
      return {
        unitLabel: "lb",
        defaultDisplay: defaultLb,
        step: 0.5,
        toCanonical: (n) => Math.max(1, Math.round(n * G_PER_LB)),
        formatDisplay: trimZeros,
      };
    }
    return {
      unitLabel: "oz",
      defaultDisplay: par ? round(par / G_PER_OZ, 0) : 8,
      step: 1,
      toCanonical: (n) => Math.max(1, Math.round(n * G_PER_OZ)),
      formatDisplay: (n) => String(Math.round(n)),
    };
  }

  if (unit === "milliliters") {
    // ≥2 cups → cups; ≥1 fl oz → fl oz; else tbsp.
    if ((par ?? ML_PER_CUP * 2) >= ML_PER_CUP * 2) {
      const defaultCups = par ? round(par / ML_PER_CUP, 1) : 2;
      return {
        unitLabel: "cup",
        defaultDisplay: defaultCups,
        step: 0.5,
        toCanonical: (n) => Math.max(1, Math.round(n * ML_PER_CUP)),
        formatDisplay: trimZeros,
      };
    }
    if ((par ?? ML_PER_FL_OZ) >= ML_PER_FL_OZ) {
      return {
        unitLabel: "fl oz",
        defaultDisplay: par ? round(par / ML_PER_FL_OZ, 0) : 8,
        step: 1,
        toCanonical: (n) => Math.max(1, Math.round(n * ML_PER_FL_OZ)),
        formatDisplay: (n) => String(Math.round(n)),
      };
    }
    return {
      unitLabel: "tbsp",
      defaultDisplay: par ? round(par / ML_PER_TBSP, 0) : 1,
      step: 1,
      toCanonical: (n) => Math.max(1, Math.round(n * ML_PER_TBSP)),
      formatDisplay: (n) => String(Math.round(n)),
    };
  }

  return fallback(unit);
}

function fallback(unit: CanonicalUnit): QuantityInputSpec {
  return {
    unitLabel: unit,
    defaultDisplay: 1,
    step: 1,
    toCanonical: (n) => Math.max(1, Math.round(n)),
    formatDisplay: (n) => String(Math.round(n)),
  };
}

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function trimZeros(n: number): string {
  return n.toFixed(2).replace(/\.?0+$/, "");
}
