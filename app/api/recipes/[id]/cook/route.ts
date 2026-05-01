/**
 * POST /api/recipes/:id/cook
 *
 * Body: { servings_cooked: number, substitutions?: { [recipe_ingredient_id]: ingredient_id } }
 *
 * Computes the FIFO consumption plan in TypeScript via decrementPantry(),
 * then applies it atomically in Postgres via the cook_recipe() RPC function.
 *
 * Returns the new cook_event id and any shortfalls so the UI can warn the
 * user that we tracked less than the recipe needed.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadActivePantry } from "@/lib/db/pantry";
import { decrementPantry, type DecrementRequirement } from "@/lib/pantry/decrement";
import {
  toIngredient,
  toRecipe,
  toRecipeIngredient,
  type IngredientRow,
  type RecipeIngredientRow,
  type RecipeRow,
} from "@/lib/db/mappers";

const Body = z.object({
  servings_cooked: z.number().int().positive(),
  substitutions: z.record(z.string().uuid(), z.string().uuid()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: recipeId } = await params;
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Load recipe (with ingredients), all ingredients (for is_assumed_staple),
  // and the user's active pantry — in parallel.
  const [recipeRes, recipeIngsRes, ingsRes, pantry] = await Promise.all([
    supabase.from("recipes").select("*").eq("id", recipeId).eq("is_active", true).single(),
    supabase.from("recipe_ingredients").select("*").eq("recipe_id", recipeId),
    supabase.from("ingredients").select("*"),
    loadActivePantry(supabase),
  ]);
  if (recipeRes.error || !recipeRes.data) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }
  if (recipeIngsRes.error) throw recipeIngsRes.error;
  if (ingsRes.error) throw ingsRes.error;

  const ingredients = (ingsRes.data as IngredientRow[]).map(toIngredient);
  const ingById = new Map(ingredients.map((i) => [i.id, i] as const));
  const recipeIngs = (recipeIngsRes.data as RecipeIngredientRow[]).map(toRecipeIngredient);
  const recipe = toRecipe(recipeRes.data as RecipeRow, recipeIngs);

  const assumedIds = new Set(ingredients.filter((i) => i.is_assumed_staple).map((i) => i.id));
  const subs = parsed.data.substitutions ?? {};
  const scale = parsed.data.servings_cooked / recipe.servings;

  const requirements: DecrementRequirement[] = recipeIngs
    .filter((ri) => !ri.is_optional)
    .map((ri) => {
      const required = ri.ingredient_id;
      const actual = subs[ri.id] ?? required;
      // Sanity: substitution target must actually exist in the catalog.
      if (!ingById.has(actual)) {
        throw new Error(`Unknown substitute ingredient ${actual}`);
      }
      return {
        ingredient_id: required,
        actual_ingredient_id: actual === required ? undefined : actual,
        quantity: Math.max(1, Math.round(ri.quantity * scale)),
        recipe_ingredient_id: ri.id,
      };
    });

  const plan = decrementPantry(requirements, pantry, { assumedStapleIds: assumedIds });

  // Hand off to the atomic SQL function.
  const { data: cookEventId, error: rpcErr } = await supabase.rpc("cook_recipe", {
    p_user_id: user.id,
    p_recipe_id: recipe.id,
    p_servings_cooked: parsed.data.servings_cooked,
    p_consumptions: plan.consumptions.map((c) => ({
      pantry_lot_id: c.lot_id,
      ingredient_id: c.ingredient_id,
      quantity: c.quantity_consumed,
      was_substitution: c.was_substitution,
      recipe_ingredient_id: c.recipe_ingredient_id ?? null,
    })),
  });
  if (rpcErr) {
    console.error("cook_recipe rpc failed", rpcErr);
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  // Log a suggestion entry so the variety pass on /recipes accounts for this.
  await supabase.from("recipe_suggestions_log").insert({
    user_id: user.id,
    recipe_id: recipe.id,
    suggestion_tier: "cookable",
  });

  return NextResponse.json({
    cook_event_id: cookEventId,
    shortfalls: plan.shortfalls,
  });
}
