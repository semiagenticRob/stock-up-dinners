/**
 * Build the FIFO decrement requirements from a recipe + the user's chosen
 * servings + their substitution choices.
 *
 * Pure function. Lives separately from the API route so the scale math can
 * be unit-tested independently of Supabase/Next.
 */

import type { Recipe } from "@/lib/types";
import type { DecrementRequirement } from "./decrement";

export interface BuildRequirementsInput {
  recipe: Recipe;
  servingsCooked: number;
  /** recipe_ingredient_id → ingredient_id the user picked instead of the default */
  substitutions: Record<string, string>;
  /**
   * recipe_ingredient_id → user-overridden quantity in canonical units.
   * When present this wins over the servings-scaled default for that line.
   * Treated as an absolute amount, not a multiplier — adjusting servings
   * after overriding does NOT re-scale the override.
   */
  overrides?: Record<string, number>;
  /** Set of ingredient IDs known to the catalog (for sanity-checking substitutions). */
  knownIngredientIds: Set<string>;
}

export function buildRequirements({
  recipe,
  servingsCooked,
  substitutions,
  overrides,
  knownIngredientIds,
}: BuildRequirementsInput): DecrementRequirement[] {
  if (recipe.servings <= 0) throw new Error("recipe.servings must be > 0");
  const scale = servingsCooked / recipe.servings;

  return recipe.ingredients
    .filter((ri) => !ri.is_optional)
    .map((ri) => {
      const required = ri.ingredient_id;
      const actual = substitutions[ri.id] ?? required;
      if (!knownIngredientIds.has(actual)) {
        throw new Error(`Unknown substitute ingredient ${actual}`);
      }
      const override = overrides?.[ri.id];
      // Always at least 1 in canonical units — DB constraint rejects 0.
      const qty =
        override != null
          ? Math.max(1, Math.round(override))
          : Math.max(1, Math.round(ri.quantity * scale));
      return {
        ingredient_id: required,
        actual_ingredient_id: actual === required ? undefined : actual,
        quantity: qty,
        recipe_ingredient_id: ri.id,
      };
    });
}
