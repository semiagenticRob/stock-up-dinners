/**
 * Shared domain types for the v2 product. These mirror the database schema
 * defined in supabase/migrations/0001_v2_initial.sql, with two simplifications
 * for use by the pure-function layer (matching engine, FIFO decrement,
 * shopping list compute):
 *
 * 1. Foreign keys are opaque string IDs (UUIDs as strings) — the pure layer
 *    doesn't care about the actual UUID format.
 * 2. Dates are JS `Date` objects, not ISO strings. The data-access layer
 *    converts between Postgres `date` / `timestamptz` and `Date`.
 *
 * Nothing in this file imports Supabase or any framework. Tests can build
 * fixtures by hand without any I/O.
 */

export type CanonicalUnit = "grams" | "milliliters" | "count";
export type StorageState = "pantry" | "refrigerated" | "frozen";

export interface SubstitutionGroup {
  id: string;
  slug: string;
  display_name: string;
  /** Ingredient IDs in this group. Populated by the data layer. */
  member_ingredient_ids: string[];
}

export interface Ingredient {
  id: string;
  slug: string;
  display_name: string;
  canonical_unit: CanonicalUnit;
  category: string;
  shelf_life_pantry_days: number | null;
  shelf_life_fridge_days: number | null;
  shelf_life_freezer_days: number | null;
  default_storage: StorageState;
  is_assumed_staple: boolean;
  substitution_group_id: string | null;
  allergen_tags: string[];
  dietary_tags: string[];
  meat_type: string | null;
  default_par: number | null;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  display_quantity: string | null;
  allow_substitution: boolean;
  is_optional: boolean;
  notes?: string | null;
}

export interface Recipe {
  id: string;
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
  ingredients: RecipeIngredient[];
}

export interface PantryLot {
  id: string;
  user_id: string;
  ingredient_id: string;
  source_sku_id: string | null;
  quantity_initial: number;
  quantity_remaining: number;
  acquired_on: Date;
  storage_state: StorageState;
  expires_on: Date | null;
  is_depleted: boolean;
  notes?: string | null;
}

export interface PantryParOverride {
  ingredient_id: string;
  par_quantity: number | null;
  threshold_pct: number | null;
}

export interface UserPreferences {
  dietary_filters: string[];
  blocked_ingredients: string[];
  blocked_meats: string[];
  allergens: string[];
  use_soon_threshold_days: number;
  default_threshold_pct: number;
}

export interface CostcoSKU {
  id: string;
  display_name: string;
  category: string;
  is_active: boolean;
}

export interface SkuIngredientMapping {
  sku_id: string;
  ingredient_id: string;
  quantity: number;
}
