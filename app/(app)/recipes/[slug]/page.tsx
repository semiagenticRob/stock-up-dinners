import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadActivePantry } from "@/lib/db/pantry";
import { loadPreferences } from "@/lib/db/preferences";
import { matchRecipes } from "@/lib/matching/engine";
import { RecipeCookView } from "@/components/app/RecipeCookView";
import "./recipe-detail.css";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [catalog, pantry, preferences] = await Promise.all([
    loadCatalog(supabase),
    loadActivePantry(supabase),
    loadPreferences(supabase),
  ]);

  const recipe = catalog.recipes.find((r) => r.slug === slug);
  if (!recipe) notFound();

  const matches = matchRecipes({
    pantry,
    recipes: [recipe],
    ingredients: catalog.ingredients,
    substitutionGroups: catalog.substitutionGroups,
    preferences,
    recentlySuggested: new Map(),
  });
  const match = matches[0];

  // Build per-ingredient substitution candidates: any ingredient currently in
  // the user's pantry that's the same category as the recipe ingredient (and
  // not the ingredient itself), where the recipe row allows substitution.
  const ingById = new Map(catalog.ingredients.map((i) => [i.id, i]));
  const pantryIngIds = new Set(pantry.map((l) => l.ingredient_id));
  const candidatesByRi: Record<string, Array<{ id: string; display_name: string }>> = {};
  for (const ri of recipe.ingredients) {
    if (!ri.allow_substitution || ri.is_optional) continue;
    const recipeIng = ingById.get(ri.ingredient_id);
    if (!recipeIng || recipeIng.is_assumed_staple) continue;
    candidatesByRi[ri.id] = catalog.ingredients
      .filter(
        (i) =>
          i.id !== ri.ingredient_id &&
          i.category === recipeIng.category &&
          !i.is_assumed_staple &&
          pantryIngIds.has(i.id),
      )
      .map((i) => ({ id: i.id, display_name: i.display_name }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }

  const allReady = match
    ? match.tier === "cookable" || match.tier === "substitutable"
    : false;

  return (
    <RecipeCookView
      recipe={recipe}
      match={match}
      ingredients={catalog.ingredients}
      candidatesByRi={candidatesByRi}
      allReady={allReady}
    />
  );
}
