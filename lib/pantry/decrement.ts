/**
 * FIFO pantry decrement (spec § 6.2).
 *
 * Pure function. No I/O. The data layer wraps a call to this in a Postgres
 * transaction and writes the resulting consumptions + updated lots.
 *
 * Algorithm:
 *   For each requirement (ingredient_id + quantity needed):
 *     1. Skip if the ingredient is an assumed staple (salt, oil, pepper, etc).
 *     2. Identify candidate lots: same ingredient (or its substitute, if
 *        actual_ingredient_id is set), is_depleted = false, quantity_remaining > 0.
 *     3. Sort candidates by expires_on ASC (NULL last), then acquired_on ASC.
 *     4. Walk candidates drawing min(remaining, still_needed) until the need
 *        is satisfied or candidates are exhausted.
 *     5. If candidates run out before the need, emit a shortfall record so the
 *        caller can warn the user.
 *
 * Returns:
 *   - consumptions: rows for cook_event_consumptions
 *   - updatedLots: lots with their new quantity_remaining and is_depleted
 *   - shortfalls: per-ingredient gaps where we couldn't draw the full requirement
 */

import type { PantryLot } from "@/lib/types";

export interface DecrementRequirement {
  /** Ingredient the recipe asked for. Used for shortfall tracking + substitution detection. */
  ingredient_id: string;
  /** If the user picked a substitute at cook time, this is the lot's ingredient. */
  actual_ingredient_id?: string;
  /** Total quantity needed in the canonical unit, scaled for actual servings cooked. */
  quantity: number;
  /** Optional FK back to the recipe_ingredients row this requirement came from. */
  recipe_ingredient_id?: string;
}

export interface DecrementOptions {
  /** Set of ingredient IDs flagged as `is_assumed_staple`. */
  assumedStapleIds: Set<string>;
}

export interface DecrementConsumption {
  lot_id: string;
  ingredient_id: string;
  quantity_consumed: number;
  was_substitution: boolean;
  recipe_ingredient_id?: string;
}

export interface DecrementShortfall {
  ingredient_id: string;
  required: number;
  drawn: number;
}

export interface DecrementResult {
  consumptions: DecrementConsumption[];
  updatedLots: PantryLot[];
  shortfalls: DecrementShortfall[];
}

export function decrementPantry(
  requirements: DecrementRequirement[],
  lots: PantryLot[],
  options: DecrementOptions,
): DecrementResult {
  // Deep-clone lots so callers can rely on immutability of their inputs.
  const workingLots: PantryLot[] = lots.map((l) => ({ ...l }));
  const lotById = new Map<string, PantryLot>();
  for (const l of workingLots) lotById.set(l.id, l);

  const consumptions: DecrementConsumption[] = [];
  const shortfalls: DecrementShortfall[] = [];

  for (const req of requirements) {
    if (req.quantity <= 0) continue;
    if (options.assumedStapleIds.has(req.ingredient_id)) continue;

    const drawFrom = req.actual_ingredient_id ?? req.ingredient_id;
    const wasSubstitution = drawFrom !== req.ingredient_id;

    const candidates = workingLots
      .filter((l) => l.ingredient_id === drawFrom && !l.is_depleted && l.quantity_remaining > 0)
      .sort(compareLotsForFifo);

    let stillNeeded = req.quantity;
    let drawn = 0;

    for (const lot of candidates) {
      if (stillNeeded <= 0) break;
      const draw = Math.min(lot.quantity_remaining, stillNeeded);
      lot.quantity_remaining -= draw;
      if (lot.quantity_remaining === 0) lot.is_depleted = true;
      consumptions.push({
        lot_id: lot.id,
        ingredient_id: lot.ingredient_id,
        quantity_consumed: draw,
        was_substitution: wasSubstitution,
        ...(req.recipe_ingredient_id ? { recipe_ingredient_id: req.recipe_ingredient_id } : {}),
      });
      stillNeeded -= draw;
      drawn += draw;
    }

    if (stillNeeded > 0) {
      shortfalls.push({
        ingredient_id: req.ingredient_id,
        required: req.quantity,
        drawn,
      });
    }
  }

  return { consumptions, updatedLots: workingLots, shortfalls };
}

/** Sort: earliest expires_on first; null/undated lots last; ties broken by acquired_on ASC. */
function compareLotsForFifo(a: PantryLot, b: PantryLot): number {
  const aExp = a.expires_on?.getTime() ?? Number.POSITIVE_INFINITY;
  const bExp = b.expires_on?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aExp !== bExp) return aExp - bExp;
  return a.acquired_on.getTime() - b.acquired_on.getTime();
}
