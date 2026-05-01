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
  /** Set of ingredient IDs known to the catalog (for sanity-checking substitutions). */
  knownIngredientIds: Set<string>;
}

export function buildRequirements({
  recipe,
  servingsCooked,
  substitutions,
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
      return {
        ingredient_id: required,
        actual_ingredient_id: actual === required ? undefined : actual,
        // Always at least 1 in canonical units — a recipe can't ask for 0 of an
        // ingredient unless the user is cooking 0 servings (which zod rejects).
        quantity: Math.max(1, Math.round(ri.quantity * scale)),
        recipe_ingredient_id: ri.id,
      };
    });
}
