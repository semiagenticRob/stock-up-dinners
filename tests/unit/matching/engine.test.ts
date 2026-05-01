import { describe, it, expect } from "vitest";
import { matchRecipes, type MatchInput } from "@/lib/matching/engine";
import type {
  Ingredient,
  PantryLot,
  Recipe,
  RecipeIngredient,
  SubstitutionGroup,
  UserPreferences,
} from "@/lib/types";

// ---- Fixture helpers ----

const NOW = new Date("2026-05-01T12:00:00Z");

function ing(overrides: Partial<Ingredient> & { id: string; slug: string }): Ingredient {
  return {
    display_name: overrides.slug,
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
    default_par: null,
    ...overrides,
  };
}

function lot(overrides: Partial<PantryLot> & { id: string; ingredient_id: string }): PantryLot {
  return {
    user_id: "user-1",
    source_sku_id: null,
    quantity_initial: 1000,
    quantity_remaining: 1000,
    acquired_on: new Date("2026-04-25"),
    storage_state: "refrigerated",
    expires_on: new Date("2026-05-15"), // safely beyond 3-day use-soon by default
    is_depleted: false,
    notes: null,
    ...overrides,
  };
}

function ri(overrides: Partial<RecipeIngredient> & { id: string; ingredient_id: string }): RecipeIngredient {
  return {
    recipe_id: "r-default",
    quantity: 100,
    display_quantity: null,
    allow_substitution: true,
    is_optional: false,
    ...overrides,
  };
}

function recipe(overrides: Partial<Recipe> & { id: string; slug: string; ingredients: RecipeIngredient[] }): Recipe {
  return {
    title: overrides.slug,
    description: null,
    servings: 4,
    prep_minutes: null,
    cook_minutes: null,
    instructions: [],
    hero_image_url: null,
    dietary_tags: [],
    meat_types: [],
    is_active: true,
    ...overrides,
    ingredients: overrides.ingredients.map((rin) => ({ ...rin, recipe_id: overrides.id })),
  };
}

function defaultPrefs(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    dietary_filters: [],
    blocked_ingredients: [],
    blocked_meats: [],
    allergens: [],
    use_soon_threshold_days: 3,
    default_threshold_pct: 15,
    ...overrides,
  };
}

function input(over: Partial<MatchInput> & {
  pantry: PantryLot[];
  recipes: Recipe[];
  ingredients: Ingredient[];
}): MatchInput {
  return {
    substitutionGroups: [],
    preferences: defaultPrefs(),
    recentlySuggested: new Map(),
    now: NOW,
    ...over,
  };
}

// ---- Common ingredient + recipe fixtures ----

const CHICKEN = ing({ id: "i-chicken", slug: "chicken", meat_type: "chicken" });
const TURKEY = ing({ id: "i-turkey", slug: "turkey", meat_type: "turkey" });
const BEEF = ing({ id: "i-beef", slug: "beef", meat_type: "beef" });
const RICE = ing({ id: "i-rice", slug: "rice", category: "grain" });
const SALT = ing({ id: "i-salt", slug: "salt", category: "oil_condiment", is_assumed_staple: true });
const SHRIMP = ing({
  id: "i-shrimp",
  slug: "shrimp",
  category: "protein",
  meat_type: "seafood",
  allergen_tags: ["shellfish"],
});

// ---- Tests ----

describe("matchRecipes — basic tiering", () => {
  it("marks a recipe with all ingredients in pantry as cookable", () => {
    const r = recipe({
      id: "r-1",
      slug: "chicken-rice",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [
          lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 }),
          lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 400 }),
        ],
        recipes: [r],
        ingredients: [CHICKEN, RICE],
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe("cookable");
    expect(result[0].ingredient_status.every((s) => s.status === "DIRECT")).toBe(true);
  });

  it("treats assumed staples as ASSUMED, not MISSING", () => {
    const r = recipe({
      id: "r-1",
      slug: "chicken-salt",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: SALT.id, quantity: 5 }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 })],
        recipes: [r],
        ingredients: [CHICKEN, SALT],
      }),
    );
    expect(result[0].tier).toBe("cookable");
    const saltStatus = result[0].ingredient_status.find((s) => s.ingredient_id === SALT.id)!;
    expect(saltStatus.status).toBe("ASSUMED");
  });

  it("marks recipe with insufficient quantity as MISSING for that ingredient", () => {
    const r = recipe({
      id: "r-1",
      slug: "chicken-rice",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 1000 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [
          lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 }), // only 500g, need 1000g
          lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 400 }),
        ],
        recipes: [r],
        ingredients: [CHICKEN, RICE],
      }),
    );
    // Only 1 missing → "almost"
    expect(result).toHaveLength(1);
    expect(result[0].tier).toBe("almost");
    const cStatus = result[0].ingredient_status.find((s) => s.ingredient_id === CHICKEN.id)!;
    expect(cStatus.status).toBe("MISSING");
  });

  it("excludes a recipe with more than one missing ingredient", () => {
    const r = recipe({
      id: "r-1",
      slug: "everything-missing",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [],
        recipes: [r],
        ingredients: [CHICKEN, RICE],
      }),
    );
    expect(result).toHaveLength(0);
  });

  it("ignores optional missing ingredients when tiering", () => {
    const r = recipe({
      id: "r-1",
      slug: "chicken-with-optional",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400, is_optional: true }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 })],
        recipes: [r],
        ingredients: [CHICKEN, RICE],
      }),
    );
    expect(result[0].tier).toBe("cookable");
  });
});

describe("matchRecipes — substitutions", () => {
  const groundMeatGroup: SubstitutionGroup = {
    id: "sg-ground-meat",
    slug: "ground_meat_red",
    display_name: "Ground Red Meat",
    member_ingredient_ids: [BEEF.id, TURKEY.id],
  };
  const BEEF_IN_GROUP = { ...BEEF, substitution_group_id: groundMeatGroup.id };
  const TURKEY_IN_GROUP = { ...TURKEY, substitution_group_id: groundMeatGroup.id };

  it("marks substituted as SUBSTITUTED when allow_substitution=true and pantry has a group peer", () => {
    const r = recipe({
      id: "r-1",
      slug: "beef-bowl",
      ingredients: [ri({ id: "ri-1", ingredient_id: BEEF.id, quantity: 500 })],
    });
    const result = matchRecipes(
      input({
        pantry: [lot({ id: "l-t", ingredient_id: TURKEY.id, quantity_remaining: 500 })],
        recipes: [r],
        ingredients: [BEEF_IN_GROUP, TURKEY_IN_GROUP],
        substitutionGroups: [groundMeatGroup],
      }),
    );
    expect(result[0].tier).toBe("substitutable");
    expect(result[0].ingredient_status[0]).toMatchObject({
      status: "SUBSTITUTED",
      substituted_with_ingredient_id: TURKEY.id,
    });
  });

  it("does NOT substitute when allow_substitution=false (treats as MISSING)", () => {
    const r = recipe({
      id: "r-1",
      slug: "must-be-beef",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: BEEF.id, quantity: 500, allow_substitution: false }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [lot({ id: "l-t", ingredient_id: TURKEY.id, quantity_remaining: 500 })],
        recipes: [r],
        ingredients: [BEEF_IN_GROUP, TURKEY_IN_GROUP],
        substitutionGroups: [groundMeatGroup],
      }),
    );
    // Only one missing ingredient → "almost"
    expect(result[0].tier).toBe("almost");
  });

  it("prefers DIRECT over SUBSTITUTED when both exist", () => {
    const r = recipe({
      id: "r-1",
      slug: "beef-bowl",
      ingredients: [ri({ id: "ri-1", ingredient_id: BEEF.id, quantity: 500 })],
    });
    const result = matchRecipes(
      input({
        pantry: [
          lot({ id: "l-b", ingredient_id: BEEF.id, quantity_remaining: 500 }),
          lot({ id: "l-t", ingredient_id: TURKEY.id, quantity_remaining: 500 }),
        ],
        recipes: [r],
        ingredients: [BEEF_IN_GROUP, TURKEY_IN_GROUP],
        substitutionGroups: [groundMeatGroup],
      }),
    );
    expect(result[0].tier).toBe("cookable");
    expect(result[0].ingredient_status[0].status).toBe("DIRECT");
  });
});

describe("matchRecipes — preferences (filters)", () => {
  it("excludes recipes whose meat_types intersect blocked_meats", () => {
    const r = recipe({
      id: "r-1",
      slug: "chicken-rice",
      meat_types: ["chicken"],
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [
          lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 }),
          lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 400 }),
        ],
        recipes: [r],
        ingredients: [CHICKEN, RICE],
        preferences: defaultPrefs({ blocked_meats: ["chicken"] }),
      }),
    );
    expect(result).toHaveLength(0);
  });

  it("excludes recipes containing a blocked ingredient", () => {
    const r = recipe({
      id: "r-1",
      slug: "shrimp-rice",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: SHRIMP.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [
          lot({ id: "l-s", ingredient_id: SHRIMP.id, quantity_remaining: 500 }),
          lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 400 }),
        ],
        recipes: [r],
        ingredients: [SHRIMP, RICE],
        preferences: defaultPrefs({ blocked_ingredients: [SHRIMP.id] }),
      }),
    );
    expect(result).toHaveLength(0);
  });

  it("excludes recipes whose ingredients carry a blocked allergen", () => {
    const r = recipe({
      id: "r-1",
      slug: "shrimp-rice",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: SHRIMP.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const result = matchRecipes(
      input({
        pantry: [
          lot({ id: "l-s", ingredient_id: SHRIMP.id, quantity_remaining: 500 }),
          lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 400 }),
        ],
        recipes: [r],
        ingredients: [SHRIMP, RICE],
        preferences: defaultPrefs({ allergens: ["shellfish"] }),
      }),
    );
    expect(result).toHaveLength(0);
  });

  it("excludes recipes that don't satisfy a positive dietary filter", () => {
    const VEGGIE = ing({ id: "i-veg", slug: "broccoli", dietary_tags: ["vegetarian"] });
    const meatRecipe = recipe({
      id: "r-1",
      slug: "chicken-rice",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const veggieRecipe = recipe({
      id: "r-2",
      slug: "broccoli-rice",
      ingredients: [
        ri({ id: "ri-3", ingredient_id: VEGGIE.id, quantity: 500 }),
        ri({ id: "ri-4", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const RICE_VEG = { ...RICE, dietary_tags: ["vegetarian"] };
    const result = matchRecipes(
      input({
        pantry: [
          lot({ id: "l-c", ingredient_id: CHICKEN.id, quantity_remaining: 500 }),
          lot({ id: "l-v", ingredient_id: VEGGIE.id, quantity_remaining: 500 }),
          lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 400 }),
        ],
        recipes: [meatRecipe, veggieRecipe],
        ingredients: [CHICKEN, VEGGIE, RICE_VEG],
        preferences: defaultPrefs({ dietary_filters: ["vegetarian"] }),
      }),
    );
    expect(result.map((m) => m.recipe.slug)).toEqual(["broccoli-rice"]);
  });
});

describe("matchRecipes — perishable priority + sort order", () => {
  it("flags uses_perishable when ingredient has lot expiring within use_soon_threshold_days", () => {
    const r = recipe({
      id: "r-1",
      slug: "chicken-rice",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const result = matchRecipes(
      input({
        // Chicken expires in 2 days from NOW=2026-05-01 → 2026-05-03; use_soon_threshold_days=3
        pantry: [
          lot({
            id: "l-c",
            ingredient_id: CHICKEN.id,
            quantity_remaining: 500,
            expires_on: new Date("2026-05-03"),
          }),
          lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 400 }),
        ],
        recipes: [r],
        ingredients: [CHICKEN, RICE],
      }),
    );
    expect(result[0].uses_perishable).toBe(true);
    expect(result[0].earliest_expiring_used).toEqual(new Date("2026-05-03"));
  });

  it("does NOT flag uses_perishable when nearest expiry is beyond threshold", () => {
    const r = recipe({
      id: "r-1",
      slug: "chicken-rice",
      ingredients: [ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 })],
    });
    const result = matchRecipes(
      input({
        pantry: [
          lot({
            id: "l-c",
            ingredient_id: CHICKEN.id,
            quantity_remaining: 500,
            expires_on: new Date("2026-05-15"),
          }),
        ],
        recipes: [r],
        ingredients: [CHICKEN],
      }),
    );
    expect(result[0].uses_perishable).toBe(false);
  });

  it("sorts perishable cookable first, then plain cookable, then substitutable, then almost", () => {
    const groundMeatGroup: SubstitutionGroup = {
      id: "sg-1",
      slug: "ground_meat_red",
      display_name: "Ground Red Meat",
      member_ingredient_ids: [BEEF.id, TURKEY.id],
    };
    const BEEF_G = { ...BEEF, substitution_group_id: groundMeatGroup.id };
    const TURKEY_G = { ...TURKEY, substitution_group_id: groundMeatGroup.id };

    const cookablePerishable = recipe({
      id: "r-perishable",
      slug: "chicken-rice",
      ingredients: [
        ri({ id: "ri-1", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    const cookablePlain = recipe({
      id: "r-plain-cookable",
      slug: "rice-only", // uses only rice (non-perishable)
      ingredients: [ri({ id: "ri-3", ingredient_id: RICE.id, quantity: 200 })],
    });
    const substitutable = recipe({
      id: "r-sub",
      slug: "beef-bowl",
      ingredients: [
        ri({ id: "ri-4", ingredient_id: BEEF.id, quantity: 500 }),
        ri({ id: "ri-5", ingredient_id: RICE.id, quantity: 400 }),
      ],
    });
    // "almost" recipe: chicken + assumed salt + beef (not in pantry; substitution disabled)
    const almost = recipe({
      id: "r-almost",
      slug: "missing-beef",
      ingredients: [
        ri({ id: "ri-6", ingredient_id: CHICKEN.id, quantity: 500 }),
        ri({ id: "ri-7", ingredient_id: SALT.id, quantity: 5 }),
        ri({ id: "ri-8", ingredient_id: BEEF.id, quantity: 200, allow_substitution: false }),
      ],
    });

    const result = matchRecipes(
      input({
        pantry: [
          // Chicken expiring soon
          lot({
            id: "l-c",
            ingredient_id: CHICKEN.id,
            quantity_remaining: 1000,
            expires_on: new Date("2026-05-03"),
          }),
          lot({
            id: "l-r",
            ingredient_id: RICE.id,
            quantity_remaining: 1000,
            expires_on: null,
          }),
          // Turkey only — substitution candidate for beef recipe
          lot({
            id: "l-t",
            ingredient_id: TURKEY.id,
            quantity_remaining: 500,
            expires_on: new Date("2026-05-20"),
          }),
        ],
        recipes: [almost, substitutable, cookablePlain, cookablePerishable], // intentional reverse order
        ingredients: [CHICKEN, RICE, BEEF_G, TURKEY_G, SALT],
        substitutionGroups: [groundMeatGroup],
      }),
    );

    expect(result.map((m) => m.recipe.slug)).toEqual([
      "chicken-rice", // cookable + perishable
      "rice-only", // cookable
      "beef-bowl", // substitutable
      "missing-beef", // almost
    ]);
  });
});

describe("matchRecipes — variety + cap", () => {
  it("demotes a recipe within its tier if suggested in the last 48h", () => {
    const r1 = recipe({
      id: "r-1",
      slug: "rice-old",
      ingredients: [ri({ id: "ri-1", ingredient_id: RICE.id, quantity: 100 })],
    });
    const r2 = recipe({
      id: "r-2",
      slug: "rice-fresh",
      ingredients: [ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 100 })],
    });

    const recentlySuggested = new Map<string, Date>([
      // r-1 was suggested 1 hour ago — should be demoted
      ["r-1", new Date(NOW.getTime() - 60 * 60 * 1000)],
      // r-2 was suggested 5 days ago — fine
      ["r-2", new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000)],
    ]);

    const result = matchRecipes(
      input({
        pantry: [lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 1000 })],
        recipes: [r1, r2],
        ingredients: [RICE],
        recentlySuggested,
      }),
    );

    expect(result.map((m) => m.recipe.slug)).toEqual(["rice-fresh", "rice-old"]);
  });

  it("caps results at 30", () => {
    const ingredients: Ingredient[] = [RICE];
    const recipes: Recipe[] = Array.from({ length: 50 }, (_, i) =>
      recipe({
        id: `r-${i}`,
        slug: `rice-${i.toString().padStart(2, "0")}`,
        ingredients: [ri({ id: `ri-${i}`, ingredient_id: RICE.id, quantity: 50 })],
      }),
    );
    const result = matchRecipes(
      input({
        pantry: [lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 5000 })],
        recipes,
        ingredients,
      }),
    );
    expect(result).toHaveLength(30);
  });

  it("only considers active recipes", () => {
    const active = recipe({
      id: "r-active",
      slug: "active",
      ingredients: [ri({ id: "ri-1", ingredient_id: RICE.id, quantity: 100 })],
    });
    const inactive = recipe({
      id: "r-inactive",
      slug: "inactive",
      is_active: false,
      ingredients: [ri({ id: "ri-2", ingredient_id: RICE.id, quantity: 100 })],
    });
    const result = matchRecipes(
      input({
        pantry: [lot({ id: "l-r", ingredient_id: RICE.id, quantity_remaining: 1000 })],
        recipes: [active, inactive],
        ingredients: [RICE],
      }),
    );
    expect(result.map((m) => m.recipe.slug)).toEqual(["active"]);
  });
});
