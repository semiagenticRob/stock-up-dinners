/**
 * Shopping list compute (spec § 6.3).
 *
 * Pure function. No I/O. Computed live every time the user opens
 * /shopping-list — no persistence.
 *
 * Algorithm:
 *   For each catalog ingredient that has a par level (default or override),
 *   isn't an assumed staple, and isn't blocked by user preferences:
 *     1. par = override.par_quantity ?? ingredient.default_par. If neither, skip.
 *     2. threshold_pct = override.threshold_pct ?? prefs.default_threshold_pct
 *     3. current = sum of quantity_remaining across non-depleted lots
 *     4. If current < par × (threshold_pct / 100):
 *        emit a line with suggested_quantity = par - current,
 *        link the cheapest/most-recent SKU that contains the ingredient
 *   Group by storage_state (Refrigerated → Frozen → Pantry by default).
 */

import type {
  CostcoSKU,
  Ingredient,
  PantryLot,
  PantryParOverride,
  Recipe,
  SkuIngredientMapping,
  StorageState,
  UserPreferences,
} from "@/lib/types";

export interface ShoppingListInput {
  pantry: PantryLot[];
  ingredients: Ingredient[];
  parOverrides: PantryParOverride[];
  skus: CostcoSKU[];
  skuMappings: SkuIngredientMapping[];
  recipes: Recipe[];
  preferences: UserPreferences;
}

export interface ShoppingListItem {
  ingredient_id: string;
  ingredient_slug: string;
  ingredient_display_name: string;
  current_quantity: number;
  par_quantity: number;
  threshold_pct: number;
  suggested_quantity: number;
  storage_state: StorageState;
  category: string;
  sku_id?: string;
  sku_display_name?: string;
  why: string;
}

export interface ShoppingListGroup {
  /** Stable key (e.g. "refrigerated") for client-side grouping. */
  key: StorageState;
  /** Human-friendly label (e.g. "Refrigerated"). */
  label: string;
  items: ShoppingListItem[];
}

export interface ShoppingListResult {
  items: ShoppingListItem[];
  groups: ShoppingListGroup[];
}

const STORAGE_GROUP_ORDER: StorageState[] = ["refrigerated", "frozen", "pantry"];
const STORAGE_LABELS: Record<StorageState, string> = {
  refrigerated: "Refrigerated",
  frozen: "Frozen",
  pantry: "Pantry",
};

export function computeShoppingList(input: ShoppingListInput): ShoppingListResult {
  const ingById = new Map(input.ingredients.map((i) => [i.id, i]));
  const overrideById = new Map(input.parOverrides.map((o) => [o.ingredient_id, o]));

  // Sum non-depleted lot quantities by ingredient.
  const stockById = new Map<string, number>();
  for (const lot of input.pantry) {
    if (lot.is_depleted) continue;
    stockById.set(lot.ingredient_id, (stockById.get(lot.ingredient_id) ?? 0) + lot.quantity_remaining);
  }

  // SKU lookup: ingredient_id → first matching active SKU.
  // We pick the SKU with the largest quantity-per-pack as a proxy for "best
  // value at Costco" — Costco's edge is bulk pack sizes.
  const skusById = new Map(input.skus.map((s) => [s.id, s]));
  const skuByIngredient = new Map<string, { sku: CostcoSKU; quantity: number }>();
  for (const m of input.skuMappings) {
    const sku = skusById.get(m.sku_id);
    if (!sku || !sku.is_active) continue;
    const cur = skuByIngredient.get(m.ingredient_id);
    if (!cur || m.quantity > cur.quantity) {
      skuByIngredient.set(m.ingredient_id, { sku, quantity: m.quantity });
    }
  }

  const items: ShoppingListItem[] = [];

  for (const ing of input.ingredients) {
    if (ing.is_assumed_staple) continue;
    if (input.preferences.blocked_ingredients.includes(ing.id)) continue;
    if (isBlockedByPreferences(ing, input.preferences)) continue;

    const override = overrideById.get(ing.id);
    const par = override?.par_quantity ?? ing.default_par;
    if (par == null) continue;

    const thresholdPct =
      override?.threshold_pct ?? input.preferences.default_threshold_pct;
    const current = stockById.get(ing.id) ?? 0;
    const cutoff = (par * thresholdPct) / 100;

    if (current >= cutoff) continue;

    const suggested = Math.max(par - current, 0);
    const sku = skuByIngredient.get(ing.id)?.sku;
    items.push({
      ingredient_id: ing.id,
      ingredient_slug: ing.slug,
      ingredient_display_name: ing.display_name,
      current_quantity: current,
      par_quantity: par,
      threshold_pct: thresholdPct,
      suggested_quantity: suggested,
      storage_state: ing.default_storage,
      category: ing.category,
      ...(sku ? { sku_id: sku.id, sku_display_name: sku.display_name } : {}),
      why: `Below threshold (${current} / ${par} ${ing.canonical_unit})`,
    });
  }

  // Suppress the unused warning on ingById — kept available for future use.
  void ingById;

  // Group by storage state in fixed display order.
  const groups: ShoppingListGroup[] = [];
  for (const key of STORAGE_GROUP_ORDER) {
    const groupItems = items.filter((it) => it.storage_state === key);
    if (groupItems.length === 0) continue;
    groups.push({ key, label: STORAGE_LABELS[key], items: groupItems });
  }

  return { items, groups };
}

/**
 * Mirrors the recipe-level filters in lib/matching/engine.ts so a user's
 * blocked_meats / allergens / dietary_filters preferences also keep
 * disallowed ingredients off the shopping list.
 */
function isBlockedByPreferences(ing: Ingredient, prefs: UserPreferences): boolean {
  // Meats explicitly skipped (e.g. "pork" → bacon + pork tenderloin).
  if (ing.meat_type && prefs.blocked_meats.includes(ing.meat_type)) return true;

  // Allergens: any tag overlap excludes the ingredient.
  if (prefs.allergens.length > 0) {
    for (const a of ing.allergen_tags) {
      if (prefs.allergens.includes(a)) return true;
    }
  }

  // Dietary filters. Each filter is a positive-tag the ingredient must
  // satisfy to remain. "vegetarian" excludes any ingredient with meat_type;
  // "pescatarian" allows seafood but excludes other meats; "gluten_free"
  // requires the ingredient not to carry the "gluten" allergen tag.
  for (const d of prefs.dietary_filters) {
    if (d === "vegetarian" && ing.meat_type != null) return true;
    if (d === "pescatarian" && ing.meat_type != null && ing.meat_type !== "seafood") return true;
    if (d === "gluten_free" && ing.allergen_tags.includes("gluten")) return true;
  }

  return false;
}
