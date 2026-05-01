import { describe, it, expect } from "vitest";
import { computeShoppingList, type ShoppingListInput } from "@/lib/shopping-list/compute";
import type {
  CostcoSKU,
  Ingredient,
  PantryLot,
  PantryParOverride,
  Recipe,
  SkuIngredientMapping,
  UserPreferences,
} from "@/lib/types";

function ing(over: Partial<Ingredient> & { id: string; slug: string }): Ingredient {
  return {
    display_name: over.slug,
    canonical_unit: "grams",
    category: "protein",
    shelf_life_pantry_days: null,
    shelf_life_fridge_days: 7,
    shelf_life_freezer_days: 270,
    default_storage: "refrigerated",
    is_assumed_staple: false,
    substitution_group_id: null,
    allergen_tags: [],
    dietary_tags: [],
    meat_type: null,
    default_par: 1000,
    ...over,
  };
}

function lot(over: Partial<PantryLot> & { id: string; ingredient_id: string }): PantryLot {
  return {
    user_id: "user-1",
    source_sku_id: null,
    quantity_initial: 1000,
    quantity_remaining: 1000,
    acquired_on: new Date("2026-04-25"),
    storage_state: "refrigerated",
    expires_on: new Date("2026-05-15"),
    is_depleted: false,
    notes: null,
    ...over,
  };
}

function defaultPrefs(over: Partial<UserPreferences> = {}): UserPreferences {
  return {
    dietary_filters: [],
    blocked_ingredients: [],
    blocked_meats: [],
    allergens: [],
    use_soon_threshold_days: 3,
    default_threshold_pct: 15,
    ...over,
  };
}

function input(over: Partial<ShoppingListInput> & {
  pantry: PantryLot[];
  ingredients: Ingredient[];
}): ShoppingListInput {
  return {
    parOverrides: [],
    skus: [],
    skuMappings: [],
    recipes: [],
    preferences: defaultPrefs(),
    ...over,
  };
}

const CHICKEN = ing({ id: "i-chicken", slug: "chicken", default_par: 2000 });
const RICE = ing({ id: "i-rice", slug: "rice", default_par: 5000 });
const SALT = ing({ id: "i-salt", slug: "salt", is_assumed_staple: true, default_par: 500 });

describe("computeShoppingList", () => {
  it("returns nothing when current quantity is at or above par × threshold", () => {
    // par 2000, threshold 15% → restock when below 300g.
    // Pantry has 500g → above threshold → no shopping line.
    const result = computeShoppingList(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 })],
        ingredients: [CHICKEN],
      }),
    );
    expect(result.items).toEqual([]);
  });

  it("includes an ingredient that's below threshold of par", () => {
    // par 2000, threshold 15% → restock when below 300g.
    // Pantry has 200g → BELOW threshold.
    const result = computeShoppingList(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 200 })],
        ingredients: [CHICKEN],
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      ingredient_id: CHICKEN.id,
      current_quantity: 200,
      par_quantity: 2000,
      threshold_pct: 15,
      // suggested = par - current = 1800
      suggested_quantity: 1800,
    });
  });

  it("treats no pantry lots as 0 current quantity", () => {
    const result = computeShoppingList(
      input({
        pantry: [],
        ingredients: [CHICKEN],
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].current_quantity).toBe(0);
    expect(result.items[0].suggested_quantity).toBe(2000);
  });

  it("ignores depleted lots when summing", () => {
    const result = computeShoppingList(
      input({
        pantry: [
          lot({ id: "l-c1", ingredient_id: CHICKEN.id, quantity_remaining: 200, is_depleted: true }),
          lot({ id: "l-c2", ingredient_id: CHICKEN.id, quantity_remaining: 100 }),
        ],
        ingredients: [CHICKEN],
      }),
    );
    // Only the 100g lot counts → below threshold of 300.
    expect(result.items).toHaveLength(1);
    expect(result.items[0].current_quantity).toBe(100);
  });

  it("never lists assumed-staple ingredients", () => {
    const result = computeShoppingList(
      input({
        pantry: [], // salt has 0 in pantry but is assumed
        ingredients: [SALT, CHICKEN],
      }),
    );
    // chicken should appear (no pantry, par 2000), salt should not.
    const slugs = result.items.map((it) => it.ingredient_id);
    expect(slugs).toContain(CHICKEN.id);
    expect(slugs).not.toContain(SALT.id);
  });

  it("respects per-ingredient par_quantity override", () => {
    const overrides: PantryParOverride[] = [
      { ingredient_id: CHICKEN.id, par_quantity: 4000, threshold_pct: null },
    ];
    // par 4000, threshold 15% (default) → 600g cutoff.
    // Pantry has 500g → below.
    const result = computeShoppingList(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 })],
        ingredients: [CHICKEN],
        parOverrides: overrides,
      }),
    );
    expect(result.items[0]).toMatchObject({
      par_quantity: 4000,
      threshold_pct: 15,
      suggested_quantity: 3500,
    });
  });

  it("respects per-ingredient threshold_pct override", () => {
    const overrides: PantryParOverride[] = [
      { ingredient_id: CHICKEN.id, par_quantity: null, threshold_pct: 50 },
    ];
    // par 2000 (default), threshold 50% → 1000g cutoff.
    // Pantry has 800g → below.
    const result = computeShoppingList(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 800 })],
        ingredients: [CHICKEN],
        parOverrides: overrides,
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].threshold_pct).toBe(50);
  });

  it("falls back to user.default_threshold_pct when no override", () => {
    const result = computeShoppingList(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 200 })],
        ingredients: [CHICKEN],
        preferences: defaultPrefs({ default_threshold_pct: 25 }),
      }),
    );
    // par 2000, threshold 25% → cutoff 500. 200 is below.
    expect(result.items[0].threshold_pct).toBe(25);
  });

  it("skips ingredients with no default_par AND no override", () => {
    const noPar = ing({ id: "i-x", slug: "weird", default_par: null });
    const result = computeShoppingList(
      input({
        pantry: [],
        ingredients: [noPar],
      }),
    );
    expect(result.items).toEqual([]);
  });

  it("links the cheapest active SKU that contains the ingredient", () => {
    const sku: CostcoSKU = {
      id: "sku-1",
      display_name: "KS Chicken Breast 6.5lb",
      category: "refrigerated",
      is_active: true,
    };
    const mapping: SkuIngredientMapping = {
      sku_id: sku.id,
      ingredient_id: CHICKEN.id,
      quantity: 2948,
    };
    const result = computeShoppingList(
      input({
        pantry: [],
        ingredients: [CHICKEN],
        skus: [sku],
        skuMappings: [mapping],
      }),
    );
    expect(result.items[0].sku_id).toBe(sku.id);
    expect(result.items[0].sku_display_name).toBe("KS Chicken Breast 6.5lb");
  });

  it("groups items by category, preserving deterministic group order", () => {
    const fridgeIng = ing({
      id: "i-fridge",
      slug: "milk",
      category: "dairy",
      default_storage: "refrigerated",
    });
    const pantryIng = ing({
      id: "i-pantry",
      slug: "rice",
      category: "grain",
      default_storage: "pantry",
    });
    const result = computeShoppingList(
      input({
        pantry: [],
        ingredients: [pantryIng, fridgeIng],
      }),
    );
    expect(result.items).toHaveLength(2);
    // groups: returns ordered by storage state (refrigerated, frozen, pantry) by convention
    expect(result.groups.map((g) => g.label)).toEqual(["Refrigerated", "Pantry"]);
  });

  it("excludes blocked ingredients from the shopping list", () => {
    const result = computeShoppingList(
      input({
        pantry: [],
        ingredients: [CHICKEN, RICE],
        preferences: defaultPrefs({ blocked_ingredients: [CHICKEN.id] }),
      }),
    );
    expect(result.items.map((i) => i.ingredient_id)).toEqual([RICE.id]);
  });

  it("populates 'why' with threshold context when below par", () => {
    const result = computeShoppingList(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 100 })],
        ingredients: [CHICKEN],
      }),
    );
    expect(result.items[0].why).toMatch(/below threshold/i);
    expect(result.items[0].why).toContain("100");
    expect(result.items[0].why).toContain("2000");
  });

  it("includes an ingredient that's referenced by a recipe even if never stocked", () => {
    const r: Recipe = {
      id: "r-1",
      slug: "chicken-rice",
      title: "Chicken Rice",
      description: null,
      servings: 4,
      prep_minutes: null,
      cook_minutes: null,
      instructions: [],
      hero_image_url: null,
      dietary_tags: [],
      meat_types: ["chicken"],
      is_active: true,
      ingredients: [
        {
          id: "ri-1",
          recipe_id: "r-1",
          ingredient_id: CHICKEN.id,
          quantity: 500,
          display_quantity: null,
          allow_substitution: true,
          is_optional: false,
        },
      ],
    };
    const result = computeShoppingList(
      input({
        pantry: [],
        ingredients: [CHICKEN],
        recipes: [r],
      }),
    );
    expect(result.items.map((i) => i.ingredient_id)).toEqual([CHICKEN.id]);
  });
});
