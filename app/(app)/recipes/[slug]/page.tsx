import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadActivePantry } from "@/lib/db/pantry";
import { loadPreferences } from "@/lib/db/preferences";
import { matchRecipes } from "@/lib/matching/engine";
import { CookButton } from "@/components/app/CookButton";
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

  // Use the matching engine to compute per-ingredient status for THIS recipe.
  const matches = matchRecipes({
    pantry,
    recipes: [recipe],
    ingredients: catalog.ingredients,
    substitutionGroups: catalog.substitutionGroups,
    preferences,
    recentlySuggested: new Map(),
  });
  // matches may be empty if filters exclude the recipe; build a fallback.
  const match = matches[0];

  const ingById = new Map(catalog.ingredients.map((i) => [i.id, i] as const));
  const totalMinutes = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);

  // Build the cookability summary for the cook button.
  const allReady = match
    ? match.tier === "cookable" || match.tier === "substitutable"
    : false;

  return (
    <article className="recipe-detail">
      <header className="recipe-detail__head">
        <p className="eyebrow">
          <Link href="/recipes">← Recipes</Link>
        </p>
        <h1>{recipe.title}</h1>
        {recipe.description && <p className="lede">{recipe.description}</p>}
        <ul className="recipe-detail__meta">
          {totalMinutes > 0 && (
            <li>
              <strong>{totalMinutes} min</strong>{" "}
              {recipe.prep_minutes != null && recipe.cook_minutes != null
                ? `(${recipe.prep_minutes} prep + ${recipe.cook_minutes} cook)`
                : ""}
            </li>
          )}
          <li>
            <strong>{recipe.servings} servings</strong>
          </li>
        </ul>
      </header>

      {recipe.hero_image_url && (
        <div className="recipe-detail__media">
          <Image
            src={recipe.hero_image_url}
            alt=""
            width={1200}
            height={800}
            className="recipe-detail__img"
            priority
          />
        </div>
      )}

      <section className="recipe-detail__section">
        <h2>Ingredients</h2>
        {!match && (
          <p className="recipe-detail__warn">
            This recipe is filtered out by your current preferences (allergens, dietary, blocked).
            Adjust under <Link href="/settings">Settings</Link> to enable cooking.
          </p>
        )}
        <ul className="ingredients-list">
          {recipe.ingredients.map((ri) => {
            const ing = ingById.get(ri.ingredient_id);
            const status = match?.ingredient_status.find(
              (s) => s.recipe_ingredient_id === ri.id,
            );
            const subName = status?.substituted_with_ingredient_id
              ? ingById.get(status.substituted_with_ingredient_id)?.display_name
              : null;
            return (
              <li
                key={ri.id}
                className={`ingredients-list__row ingredients-list__row--${status?.status?.toLowerCase() ?? "unknown"}`}
              >
                <span className="ingredients-list__icon" aria-hidden="true">
                  {iconFor(status?.status)}
                </span>
                <span className="ingredients-list__name">
                  {ing?.display_name ?? "(unknown)"}
                  {ri.is_optional && <span className="ingredients-list__opt"> (optional)</span>}
                </span>
                <span className="ingredients-list__qty">
                  {ri.display_quantity ?? `${ri.quantity} ${ing?.canonical_unit ?? ""}`}
                </span>
                {ri.notes && <span className="ingredients-list__notes">{ri.notes}</span>}
                {subName && (
                  <span className="ingredients-list__sub">substituting {subName}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="recipe-detail__section">
        <h2>Instructions</h2>
        <ol className="instructions">
          {recipe.instructions.map((step) => (
            <li key={step.step}>{step.text}</li>
          ))}
        </ol>
      </section>

      <CookButton recipeId={recipe.id} defaultServings={recipe.servings} disabled={!allReady} />
    </article>
  );
}

function iconFor(status: string | undefined): string {
  switch (status) {
    case "DIRECT":
      return "✅";
    case "ASSUMED":
      return "⭐";
    case "SUBSTITUTED":
      return "🔄";
    case "MISSING":
      return "❌";
    default:
      return "·";
  }
}
