/**
 * Postgres row shape ⇄ lib/types domain shape.
 *
 * Postgres returns:
 *   - `date` columns as ISO date strings ("YYYY-MM-DD")
 *   - `timestamptz` columns as ISO timestamps
 *   - `jsonb` as parsed JSON
 *
 * lib/types expects Date objects. These mappers do the conversion at the
 * data-layer boundary so the pure functions never see raw rows.
 */

import type {
  Ingredient,
  PantryLot,
  Recipe,
  RecipeIngredient,
  StorageState,
  SubstitutionGroup,
} from "@/lib/types";

export type PantryLotRow = {
  id: string;
  user_id: string;
  ingredient_id: string;
  source_sku_id: string | null;
  quantity_initial: number;
  quantity_remaining: number;
  acquired_on: string;
  storage_state: StorageState;
  expires_on: string | null;
  is_depleted: boolean;
  notes: string | null;
};

export function toPantryLot(row: PantryLotRow): PantryLot {
  return {
    id: row.id,
    user_id: row.user_id,
    ingredient_id: row.ingredient_id,
    source_sku_id: row.source_sku_id,
    quantity_initial: row.quantity_initial,
    quantity_remaining: row.quantity_remaining,
    acquired_on: parseDate(row.acquired_on),
    storage_state: row.storage_state,
    expires_on: row.expires_on ? parseDate(row.expires_on) : null,
    is_depleted: row.is_depleted,
    notes: row.notes,
  };
}

export type IngredientRow = Omit<Ingredient, never>;
// Ingredient has no Date fields, so the row shape matches the domain shape.
export function toIngredient(row: IngredientRow): Ingredient {
  return row;
}

export type SubstitutionGroupRow = {
  id: string;
  slug: string;
  display_name: string;
};

/** Builds the SubstitutionGroup with denormalized member_ingredient_ids. */
export function toSubstitutionGroup(
  row: SubstitutionGroupRow,
  members: string[],
): SubstitutionGroup {
  return {
    id: row.id,
    slug: row.slug,
    display_name: row.display_name,
    member_ingredient_ids: members,
  };
}

export type RecipeIngredientRow = {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  display_quantity: string | null;
  allow_substitution: boolean;
  is_optional: boolean;
  notes: string | null;
};

export function toRecipeIngredient(row: RecipeIngredientRow): RecipeIngredient {
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    ingredient_id: row.ingredient_id,
    quantity: row.quantity,
    display_quantity: row.display_quantity,
    allow_substitution: row.allow_substitution,
    is_optional: row.is_optional,
    notes: row.notes,
  };
}

export type RecipeRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  instructions: Array<{ step: number; text: string }> | null;
  hero_image_url: string | null;
  dietary_tags: string[];
  meat_types: string[];
  is_active: boolean;
};

export function toRecipe(row: RecipeRow, ingredients: RecipeIngredient[]): Recipe {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    servings: row.servings,
    prep_minutes: row.prep_minutes,
    cook_minutes: row.cook_minutes,
    instructions: row.instructions ?? [],
    hero_image_url: row.hero_image_url,
    dietary_tags: row.dietary_tags,
    meat_types: row.meat_types,
    is_active: row.is_active,
    ingredients,
  };
}

/** Parse a Postgres `date` ("YYYY-MM-DD") as midnight UTC. */
function parseDate(s: string): Date {
  // Postgres returns date columns as plain "YYYY-MM-DD" strings without
  // timezone. Append T00:00:00Z so JS interprets as UTC midnight rather than
  // local midnight (which causes off-by-one in non-UTC timezones).
  return new Date(`${s}T00:00:00Z`);
}

/** Format a Date as a Postgres `date` literal ("YYYY-MM-DD"). */
export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
