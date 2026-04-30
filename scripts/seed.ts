/**
 * Idempotent catalog seeder.
 *
 * Reads the versioned JSON catalog under content/ and upserts it into a
 * Supabase Postgres database via the service-role client.
 *
 * Run order matches FK dependencies:
 *   1. substitution_groups            (no deps)
 *   2. ingredients                    (depends on substitution_groups by slug)
 *   3. costco_skus                    (no deps)
 *   4. sku_ingredient_mappings        (depends on skus + ingredients)
 *   5. recipes                        (no deps)
 *   6. recipe_ingredients             (depends on recipes + ingredients)
 *
 * Re-runnable. For tables with a stable slug key, uses upsert. For
 * recipe_ingredients (no natural key beyond recipe_id + ingredient_id +
 * ordinal) we delete by recipe_id and re-insert so edits in JSON
 * propagate cleanly.
 *
 * Usage:
 *   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
 *
 * Required env:
 *   SUPABASE_URL                  — your project's URL
 *   SUPABASE_SERVICE_ROLE_KEY     — bypasses RLS; never commit
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ---------- types matching content/*.json ----------

type CanonicalUnit = "grams" | "milliliters" | "count";
type StorageState = "pantry" | "refrigerated" | "frozen";

interface IngredientJson {
  slug: string;
  display_name: string;
  canonical_unit: CanonicalUnit;
  category: string;
  shelf_life_pantry_days: number | null;
  shelf_life_fridge_days: number | null;
  shelf_life_freezer_days: number | null;
  default_storage: StorageState;
  is_assumed_staple: boolean;
  substitution_group_slug: string | null;
  allergen_tags: string[];
  dietary_tags: string[];
  meat_type: string | null;
  default_par: number | null;
  _v1_legacy?: unknown;
}

interface SubstitutionGroupJson {
  slug: string;
  display_name: string;
}

interface SkuMappingJson {
  ingredient_slug: string;
  quantity: number;
}

interface SkuJson {
  slug: string; // required for idempotent upsert; new field beyond spec
  display_name: string;
  receipt_aliases: string[];
  category: string;
  sku_code?: string | null;
  is_active?: boolean;
  mappings: SkuMappingJson[];
}

interface RecipeIngredientJson {
  ingredient_slug: string;
  quantity: number;
  display_quantity: string | null;
  allow_substitution: boolean;
  is_optional: boolean;
  notes: string | null;
  _v1_legacy?: unknown;
}

interface RecipeJson {
  slug: string;
  title: string;
  description: string | null;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  instructions: Array<{ step: number; text: string }>;
  hero_image_url: string | null;
  dietary_tags: string[];
  meat_types: string[];
  is_active: boolean;
  ingredients: RecipeIngredientJson[];
  _v1_legacy?: unknown;
}

// ---------- io ----------

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readJson<T>(relPath: string): T {
  return JSON.parse(readFileSync(resolve(repoRoot, relPath), "utf8")) as T;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

// ---------- main ----------

async function main() {
  const supabase: SupabaseClient = createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );

  const groups = readJson<SubstitutionGroupJson[]>("content/substitution_groups.json");
  const ingredients = readJson<IngredientJson[]>("content/ingredients.json");
  const skus = readJson<SkuJson[]>("content/skus.json");
  const recipes = readJson<RecipeJson[]>("content/recipes.json");

  console.log(
    `Seeding: ${groups.length} groups, ${ingredients.length} ingredients, ` +
      `${skus.length} SKUs, ${recipes.length} recipes`,
  );

  // 1. substitution_groups
  if (groups.length > 0) {
    const { error } = await supabase
      .from("substitution_groups")
      .upsert(groups, { onConflict: "slug" });
    if (error) throw error;
    console.log(`✓ Upserted ${groups.length} substitution_groups`);
  }

  // Build slug → id maps for FK resolution.
  const groupBySlug = await fetchSlugIdMap(supabase, "substitution_groups");

  // 2. ingredients
  const ingredientRows = ingredients.map((ing) => ({
    slug: ing.slug,
    display_name: ing.display_name,
    canonical_unit: ing.canonical_unit,
    category: ing.category,
    shelf_life_pantry_days: ing.shelf_life_pantry_days,
    shelf_life_fridge_days: ing.shelf_life_fridge_days,
    shelf_life_freezer_days: ing.shelf_life_freezer_days,
    default_storage: ing.default_storage,
    is_assumed_staple: ing.is_assumed_staple,
    substitution_group_id: ing.substitution_group_slug
      ? groupBySlug.get(ing.substitution_group_slug) ?? null
      : null,
    allergen_tags: ing.allergen_tags,
    dietary_tags: ing.dietary_tags,
    meat_type: ing.meat_type,
    default_par: ing.default_par,
  }));
  if (ingredientRows.length > 0) {
    const { error } = await supabase
      .from("ingredients")
      .upsert(ingredientRows, { onConflict: "slug" });
    if (error) throw error;
    console.log(`✓ Upserted ${ingredientRows.length} ingredients`);
  }

  const ingredientBySlug = await fetchSlugIdMap(supabase, "ingredients");

  // 3. costco_skus + 4. sku_ingredient_mappings
  if (skus.length > 0) {
    // Reset mappings for the SKUs we're seeding by deleting+reinserting.
    // Upsert SKUs first.
    const skuRows = skus.map((s) => ({
      sku_code: s.sku_code ?? null,
      display_name: s.display_name,
      receipt_aliases: s.receipt_aliases,
      category: s.category,
      is_active: s.is_active ?? true,
    }));
    // costco_skus has no unique slug column in migration v1; we rely on
    // display_name uniqueness for this idempotent dance. If duplicate
    // display_names ever land in content/skus.json we'll catch them here.
    const { error: skuErr } = await supabase
      .from("costco_skus")
      .upsert(skuRows, { onConflict: "display_name", ignoreDuplicates: false });
    if (skuErr) {
      // display_name isn't UNIQUE in the migration — fall back to delete+insert.
      console.warn(
        "costco_skus upsert by display_name failed; clearing and reinserting all SKUs.",
      );
      const { error: clrErr } = await supabase.from("costco_skus").delete().gte(
        "created_at",
        "1900-01-01",
      );
      if (clrErr) throw clrErr;
      const { error: insErr } = await supabase.from("costco_skus").insert(skuRows);
      if (insErr) throw insErr;
    }
    console.log(`✓ Upserted ${skuRows.length} costco_skus`);

    // Build SKU display_name → id map for the join inserts.
    const skuByName = await fetchNameIdMap(
      supabase,
      "costco_skus",
      "display_name",
    );

    // Delete existing mappings for these SKUs and re-insert from JSON.
    const skuIds = Array.from(skuByName.values());
    if (skuIds.length > 0) {
      const { error: delErr } = await supabase
        .from("sku_ingredient_mappings")
        .delete()
        .in("sku_id", skuIds);
      if (delErr) throw delErr;
    }

    const mappingRows = skus.flatMap((s) => {
      const skuId = skuByName.get(s.display_name);
      if (!skuId) return [];
      return s.mappings.map((m) => {
        const ingId = ingredientBySlug.get(m.ingredient_slug);
        if (!ingId) {
          throw new Error(
            `SKU "${s.display_name}" maps to unknown ingredient "${m.ingredient_slug}"`,
          );
        }
        return { sku_id: skuId, ingredient_id: ingId, quantity: m.quantity };
      });
    });
    if (mappingRows.length > 0) {
      const { error } = await supabase.from("sku_ingredient_mappings").insert(mappingRows);
      if (error) throw error;
      console.log(`✓ Inserted ${mappingRows.length} sku_ingredient_mappings`);
    }
  }

  // 5. recipes
  const recipeRows = recipes.map((r) => ({
    slug: r.slug,
    title: r.title,
    description: r.description,
    servings: r.servings,
    prep_minutes: r.prep_minutes,
    cook_minutes: r.cook_minutes,
    instructions: r.instructions,
    hero_image_url: r.hero_image_url,
    dietary_tags: r.dietary_tags,
    meat_types: r.meat_types,
    is_active: r.is_active,
  }));
  if (recipeRows.length > 0) {
    const { error } = await supabase
      .from("recipes")
      .upsert(recipeRows, { onConflict: "slug" });
    if (error) throw error;
    console.log(`✓ Upserted ${recipeRows.length} recipes`);
  }

  const recipeBySlug = await fetchSlugIdMap(supabase, "recipes");

  // 6. recipe_ingredients — delete existing per-recipe and reinsert.
  let totalRiInserted = 0;
  for (const r of recipes) {
    const recipeId = recipeBySlug.get(r.slug);
    if (!recipeId) {
      throw new Error(`Recipe slug not found after upsert: ${r.slug}`);
    }
    const { error: delErr } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", recipeId);
    if (delErr) throw delErr;

    const rows = r.ingredients.map((ri) => {
      const ingId = ingredientBySlug.get(ri.ingredient_slug);
      if (!ingId) {
        throw new Error(
          `Recipe "${r.slug}" references unknown ingredient "${ri.ingredient_slug}"`,
        );
      }
      return {
        recipe_id: recipeId,
        ingredient_id: ingId,
        quantity: ri.quantity,
        display_quantity: ri.display_quantity,
        allow_substitution: ri.allow_substitution,
        is_optional: ri.is_optional,
        notes: ri.notes,
      };
    });
    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from("recipe_ingredients")
        .insert(rows);
      if (insErr) throw insErr;
      totalRiInserted += rows.length;
    }
  }
  console.log(`✓ Inserted ${totalRiInserted} recipe_ingredients`);

  console.log("\nDone. Catalog is in sync with content/*.json.");
}

async function fetchSlugIdMap(
  supabase: SupabaseClient,
  table: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabase.from(table).select("id, slug");
  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set((row as { slug: string }).slug, (row as { id: string }).id);
  }
  return map;
}

async function fetchNameIdMap(
  supabase: SupabaseClient,
  table: string,
  nameCol: string,
): Promise<Map<string, string>> {
  // The Supabase JS template-literal types don't generalize over a runtime
  // column name; cast through unknown so we can build the projection
  // dynamically. Safe because we're owning both ends of the call.
  const { data, error } = await supabase.from(table).select(`id, ${nameCol}`);
  if (error) throw error;
  const map = new Map<string, string>();
  for (const row of (data ?? []) as unknown as Array<Record<string, string>>) {
    map.set(row[nameCol], row.id);
  }
  return map;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
