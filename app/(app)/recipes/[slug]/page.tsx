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

  // Build per-ingredient substitution candidates: pantry ingredients that are
  // a sensible kind-match for the recipe ingredient.
  //   - Meaty recipe ingredients (anything with meat_type set) accept any
  //     other meaty pantry item OR a category=protein item (e.g. tofu) —
  //     this lets canned chicken sub for fresh chicken across categories.
  //   - Non-meat ingredients restrict to the same category, so rice only
  //     subs for grains and apples only sub for produce.
  const ingById = new Map(catalog.ingredients.map((i) => [i.id, i]));
  const pantryIngIds = new Set(pantry.map((l) => l.ingredient_id));
  const candidatesByRi: Record<string, Array<{ id: string; display_name: string }>> = {};
  for (const ri of recipe.ingredients) {
    if (!ri.allow_substitution || ri.is_optional) continue;
    const recipeIng = ingById.get(ri.ingredient_id);
    if (!recipeIng || recipeIng.is_assumed_staple) continue;
    candidatesByRi[ri.id] = catalog.ingredients
      .filter((i) => {
        if (i.id === ri.ingredient_id) return false;
        if (i.is_assumed_staple) return false;
        if (!pantryIngIds.has(i.id)) return false;
        if (recipeIng.meat_type) {
          return i.meat_type !== null || i.category === "protein";
        }
        return i.category === recipeIng.category;
      })
      .map((i) => ({ id: i.id, display_name: i.display_name }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));
  }

  // Whether the cook button should start enabled. Client-side state in
  // RecipeCookView refines this once the user picks substitutions: a recipe
  // in "almost" tier (one missing ingredient) becomes cookable as soon as
  // the user subs that ingredient with something from the pantry.
  const startsReady = match
    ? match.tier === "cookable" || match.tier === "substitutable"
    : false;

  return (
    <RecipeCookView
      recipe={recipe}
      match={match}
      ingredients={catalog.ingredients}
      candidatesByRi={candidatesByRi}
      startsReady={startsReady}
    />
  );
}
