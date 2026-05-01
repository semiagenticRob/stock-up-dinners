/**
 * Catalog queries: ingredients, recipes, substitution groups, SKUs.
 *
 * All catalog reads are cheap and infrequently changed. We pull the entire
 * active catalog on each authenticated server-component render — at v1 sizes
 * (~150 ingredients, ~48 recipes, ~75 SKUs) the round-trip is well under
 * 100ms. If that becomes a bottleneck we can layer in TanStack Query or a
 * Postgres VIEW; not warranted yet.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  toIngredient,
  toRecipe,
  toRecipeIngredient,
  toSubstitutionGroup,
  type IngredientRow,
  type RecipeIngredientRow,
  type RecipeRow,
  type SubstitutionGroupRow,
} from "./mappers";
import type { Ingredient, Recipe, SubstitutionGroup } from "@/lib/types";

export interface Catalog {
  ingredients: Ingredient[];
  recipes: Recipe[];
  substitutionGroups: SubstitutionGroup[];
}

/** Loads the entire active catalog. */
export async function loadCatalog(supabase: SupabaseClient): Promise<Catalog> {
  const [ingredientsResult, recipesResult, recipeIngsResult, groupsResult] = await Promise.all([
    supabase.from("ingredients").select("*"),
    supabase.from("recipes").select("*").eq("is_active", true),
    supabase.from("recipe_ingredients").select("*"),
    supabase.from("substitution_groups").select("*"),
  ]);

  if (ingredientsResult.error) throw ingredientsResult.error;
  if (recipesResult.error) throw recipesResult.error;
  if (recipeIngsResult.error) throw recipeIngsResult.error;
  if (groupsResult.error) throw groupsResult.error;

  const ingredients = (ingredientsResult.data as IngredientRow[]).map(toIngredient);

  // Index recipe_ingredients by recipe_id.
  const ingsByRecipe = new Map<string, RecipeIngredientRow[]>();
  for (const row of (recipeIngsResult.data ?? []) as RecipeIngredientRow[]) {
    if (!ingsByRecipe.has(row.recipe_id)) ingsByRecipe.set(row.recipe_id, []);
    ingsByRecipe.get(row.recipe_id)!.push(row);
  }

  const recipes = ((recipesResult.data ?? []) as RecipeRow[]).map((r) =>
    toRecipe(
      r,
      (ingsByRecipe.get(r.id) ?? []).map(toRecipeIngredient),
    ),
  );

  // Group members: any ingredient whose substitution_group_id matches.
  const membersByGroup = new Map<string, string[]>();
  for (const ing of ingredients) {
    if (!ing.substitution_group_id) continue;
    if (!membersByGroup.has(ing.substitution_group_id)) {
      membersByGroup.set(ing.substitution_group_id, []);
    }
    membersByGroup.get(ing.substitution_group_id)!.push(ing.id);
  }

  const substitutionGroups = ((groupsResult.data ?? []) as SubstitutionGroupRow[]).map((g) =>
    toSubstitutionGroup(g, membersByGroup.get(g.id) ?? []),
  );

  return { ingredients, recipes, substitutionGroups };
}
