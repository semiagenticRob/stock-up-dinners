/**
 * Convert a canonical-unit quantity into a cooking-friendly readout.
 *
 * Rules:
 *   - grams: ≥1 lb → "X.X lb"; ≥1 oz → "X oz"; else "X g"
 *   - milliliters: ≥1 cup → "X cups"; ≥1 fl oz → "X fl oz";
 *                  ≥1 tbsp → "X tbsp"; else "X ml"
 *   - count: bare number
 *
 * Tunes precision so values read naturally at the eyeball level.
 */

import type { CanonicalUnit } from "@/lib/types";

const G_PER_LB = 453.592;
const G_PER_OZ = 28.3495;
const ML_PER_CUP = 240;
const ML_PER_FL_OZ = 29.5735;
const ML_PER_TBSP = 14.7868;

export function formatPantryQuantity(quantity: number, unit: CanonicalUnit): string {
  if (quantity <= 0) return "0";

  if (unit === "count") {
    return String(Math.round(quantity));
  }

  if (unit === "grams") {
    if (quantity >= G_PER_LB) {
      const lb = quantity / G_PER_LB;
      // <2 lb → 2 decimals (e.g. "1.25 lb"); 2-9.9 lb → 1 decimal; ≥10 lb → integer
      if (lb < 2) return `${trimZeros(lb.toFixed(2))} lb`;
      if (lb < 10) return `${trimZeros(lb.toFixed(1))} lb`;
      return `${Math.round(lb)} lb`;
    }
    if (quantity >= G_PER_OZ) {
      const oz = quantity / G_PER_OZ;
      return `${trimZeros(oz.toFixed(1))} oz`;
    }
    return `${Math.round(quantity)} g`;
  }

  if (unit === "milliliters") {
    if (quantity >= ML_PER_CUP * 2) {
      const cups = quantity / ML_PER_CUP;
      return `${trimZeros(cups.toFixed(1))} cups`;
    }
    if (quantity >= ML_PER_FL_OZ) {
      const fl = quantity / ML_PER_FL_OZ;
      return `${trimZeros(fl.toFixed(1))} fl oz`;
    }
    if (quantity >= ML_PER_TBSP) {
      const tbsp = quantity / ML_PER_TBSP;
      return `${Math.round(tbsp)} tbsp`;
    }
    return `${Math.round(quantity)} ml`;
  }

  return String(quantity);
}

function trimZeros(s: string): string {
  return s.replace(/\.?0+$/, "");
}
