import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadActivePantry } from "@/lib/db/pantry";
import { loadPreferences } from "@/lib/db/preferences";
import { matchRecipes, type RecipeMatch } from "@/lib/matching/engine";
import "./recipes.css";

export default async function RecipesPage() {
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

  // Recently-suggested log: last 7 days, latest per recipe.
  // Server-component render: per-request Date.now() is intentional.
  // eslint-disable-next-line react-hooks/purity
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const { data: recentRows } = await supabase
    .from("recipe_suggestions_log")
    .select("recipe_id, suggested_at")
    .gte("suggested_at", sevenDaysAgo.toISOString());
  const recentlySuggested = new Map<string, Date>();
  for (const row of (recentRows ?? []) as Array<{ recipe_id: string; suggested_at: string }>) {
    const at = new Date(row.suggested_at);
    const cur = recentlySuggested.get(row.recipe_id);
    if (!cur || at > cur) recentlySuggested.set(row.recipe_id, at);
  }

  const matches = matchRecipes({
    pantry,
    recipes: catalog.recipes,
    ingredients: catalog.ingredients,
    substitutionGroups: catalog.substitutionGroups,
    preferences,
    recentlySuggested,
  });

  const ingByIdName = new Map(catalog.ingredients.map((i) => [i.id, i.display_name] as const));

  const perishable = matches.filter((m) => m.tier === "cookable" && m.uses_perishable);
  const cookable = matches.filter((m) => m.tier === "cookable" && !m.uses_perishable);
  const substitutable = matches.filter((m) => m.tier === "substitutable");
  const almost = matches.filter((m) => m.tier === "almost");

  return (
    <>
      {pantry.length === 0 ? (
        <EmptyState />
      ) : matches.length === 0 ? (
        <NoMatches />
      ) : (
        <>
          {perishable.length > 0 && (
            <Tier title="Use these soon" subtitle="Pantry items expiring in the next few days." matches={perishable} ingByIdName={ingByIdName} />
          )}
          {cookable.length > 0 && (
            <Tier title="Cook tonight" subtitle="Everything in your pantry covers it." matches={cookable} ingByIdName={ingByIdName} />
          )}
          {substitutable.length > 0 && (
            <Tier
              title="Cook with substitutions"
              subtitle="A swap from your pantry stands in for a recipe ingredient."
              matches={substitutable}
              ingByIdName={ingByIdName}
              collapsibleByDefault
            />
          )}
          {almost.length > 0 && (
            <Tier
              title="Almost there — one item away"
              subtitle="Pick up just one item and these are unlocked."
              matches={almost}
              ingByIdName={ingByIdName}
              collapsibleByDefault
            />
          )}
        </>
      )}
    </>
  );
}

function Tier({
  title,
  subtitle,
  matches,
  ingByIdName,
  collapsibleByDefault = false,
}: {
  title: string;
  subtitle: string;
  matches: RecipeMatch[];
  ingByIdName: Map<string, string>;
  collapsibleByDefault?: boolean;
}) {
  const Wrapper = collapsibleByDefault ? "details" : "section";
  return (
    <Wrapper className="tier" {...(collapsibleByDefault ? {} : {})}>
      {collapsibleByDefault ? (
        <summary className="tier__head tier__head--collapsible">
          <h2>
            {title}{" "}
            <span className="tier__count">
              {matches.length} {matches.length === 1 ? "recipe" : "recipes"}
            </span>
          </h2>
          <p>{subtitle}</p>
        </summary>
      ) : (
        <div className="tier__head">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      )}
      <ul className="card-grid">
        {matches.map((m) => (
          <RecipeCard key={m.recipe.id} match={m} ingByIdName={ingByIdName} />
        ))}
      </ul>
    </Wrapper>
  );
}

function RecipeCard({
  match,
  ingByIdName,
}: {
  match: RecipeMatch;
  ingByIdName: Map<string, string>;
}) {
  const totalMinutes = (match.recipe.prep_minutes ?? 0) + (match.recipe.cook_minutes ?? 0);
  const perishableLabel = match.uses_perishable
    ? perishableBadge(match, ingByIdName)
    : null;
  return (
    <li>
      <Link href={`/recipes/${match.recipe.slug}`} className="recipe-card">
        <div className="recipe-card__media">
          {match.recipe.hero_image_url ? (
            <Image
              src={match.recipe.hero_image_url}
              alt=""
              width={480}
              height={320}
              className="recipe-card__img"
            />
          ) : (
            <div className="recipe-card__placeholder" aria-hidden="true">
              {match.recipe.title.slice(0, 1)}
            </div>
          )}
        </div>
        <div className="recipe-card__body">
          <h3>{match.recipe.title}</h3>
          <p className="recipe-card__meta">
            {totalMinutes > 0 && <span>{totalMinutes} min</span>}
            <span>·</span>
            <span>{match.recipe.servings} servings</span>
          </p>
          {perishableLabel && <p className="recipe-card__badge">{perishableLabel}</p>}
        </div>
      </Link>
    </li>
  );
}

function perishableBadge(m: RecipeMatch, ingByIdName: Map<string, string>): string | null {
  const expDate = m.earliest_expiring_used;
  if (!expDate) return null;
  const nowMs = Date.now();
  const days = Math.max(0, Math.round((expDate.getTime() - nowMs) / (24 * 60 * 60 * 1000)));
  // Find the ingredient with the earliest-expiring lot.
  const first = m.ingredient_status.find(
    (s) =>
      s.earliest_expiring_used &&
      s.earliest_expiring_used.getTime() === expDate.getTime(),
  );
  const ingId = first?.substituted_with_ingredient_id ?? first?.ingredient_id;
  const name = ingId ? ingByIdName.get(ingId) ?? "an ingredient" : "an ingredient";
  if (days <= 0) return `Use today: ${name}`;
  if (days === 1) return `Use by tomorrow: ${name}`;
  return `Use in ${days}d: ${name}`;
}

function EmptyState() {
  return (
    <div className="app-stub">
      <p className="eyebrow">Empty pantry</p>
      <h1>Tell us what&apos;s in your kitchen.</h1>
      <p>
        We&apos;ll start suggesting dinners as soon as the pantry has a few staples. Add items
        manually or kick off a live shopping session at Costco.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/pantry/add" className="btn">
          Add a pantry item
        </Link>
      </p>
    </div>
  );
}

function NoMatches() {
  return (
    <div className="app-stub">
      <p className="eyebrow">No matches yet</p>
      <h1>Nothing to suggest from this pantry — yet.</h1>
      <p>
        Either the pantry doesn&apos;t cover any recipe&apos;s ingredient list, or your dietary
        filters are excluding the matches we found. Adjust under{" "}
        <Link href="/settings">Settings</Link>.
      </p>
    </div>
  );
}
