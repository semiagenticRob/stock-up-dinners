import { describe, it, expect } from "vitest";
import { buildRequirements } from "@/lib/pantry/build-requirements";
import type { Recipe } from "@/lib/types";

const RECIPE: Recipe = {
  id: "r-1",
  slug: "fish-tacos",
  title: "Fish Tacos",
  description: null,
  servings: 4,
  prep_minutes: 15,
  cook_minutes: 15,
  instructions: [],
  hero_image_url: null,
  dietary_tags: [],
  meat_types: ["seafood"],
  is_active: true,
  ingredients: [
    {
      id: "ri-cod",
      recipe_id: "r-1",
      ingredient_id: "i-cod",
      quantity: 907, // canonical grams for 4 servings
      display_quantity: "5–6 fillets (about 2 lb)",
      allow_substitution: true,
      is_optional: false,
    },
    {
      id: "ri-tortillas",
      recipe_id: "r-1",
      ingredient_id: "i-tortillas",
      quantity: 8, // count
      display_quantity: "8 large tortillas",
      allow_substitution: false,
      is_optional: false,
    },
    {
      id: "ri-spinach",
      recipe_id: "r-1",
      ingredient_id: "i-spinach",
      quantity: 113,
      display_quantity: "2 large handfuls",
      allow_substitution: true,
      is_optional: true,
    },
  ],
};

const knownIds = new Set(["i-cod", "i-tortillas", "i-spinach", "i-salmon"]);

describe("buildRequirements", () => {
  it("returns recipe-default quantities when servings_cooked === recipe.servings", () => {
    const reqs = buildRequirements({
      recipe: RECIPE,
      servingsCooked: 4,
      substitutions: {},
      knownIngredientIds: knownIds,
    });
    // Optional spinach is excluded.
    expect(reqs).toHaveLength(2);
    expect(reqs.find((r) => r.ingredient_id === "i-cod")?.quantity).toBe(907);
    expect(reqs.find((r) => r.ingredient_id === "i-tortillas")?.quantity).toBe(8);
  });

  it("doubles each quantity when servings_cooked is 2× recipe.servings", () => {
    const reqs = buildRequirements({
      recipe: RECIPE,
      servingsCooked: 8,
      substitutions: {},
      knownIngredientIds: knownIds,
    });
    expect(reqs.find((r) => r.ingredient_id === "i-cod")?.quantity).toBe(1814);
    expect(reqs.find((r) => r.ingredient_id === "i-tortillas")?.quantity).toBe(16);
  });

  it("halves each quantity when servings_cooked is half of recipe.servings", () => {
    const reqs = buildRequirements({
      recipe: RECIPE,
      servingsCooked: 2,
      substitutions: {},
      knownIngredientIds: knownIds,
    });
    expect(reqs.find((r) => r.ingredient_id === "i-cod")?.quantity).toBe(454); // round(453.5)
    expect(reqs.find((r) => r.ingredient_id === "i-tortillas")?.quantity).toBe(4);
  });

  it("clamps to a minimum of 1 even when scale rounds to zero", () => {
    const tinyRecipe: Recipe = {
      ...RECIPE,
      ingredients: [
        {
          ...RECIPE.ingredients[1],
          id: "ri-tiny",
          ingredient_id: "i-tiny",
          quantity: 1,
        },
      ],
    };
    const reqs = buildRequirements({
      recipe: tinyRecipe,
      servingsCooked: 1, // 1/4 of 4-serving recipe → 0.25, rounds to 0
      substitutions: {},
      knownIngredientIds: new Set(["i-tiny"]),
    });
    expect(reqs[0].quantity).toBe(1);
  });

  it("excludes optional ingredients", () => {
    const reqs = buildRequirements({
      recipe: RECIPE,
      servingsCooked: 4,
      substitutions: {},
      knownIngredientIds: knownIds,
    });
    expect(reqs.find((r) => r.ingredient_id === "i-spinach")).toBeUndefined();
  });

  it("respects user-picked substitutions", () => {
    const reqs = buildRequirements({
      recipe: RECIPE,
      servingsCooked: 4,
      substitutions: { "ri-cod": "i-salmon" },
      knownIngredientIds: knownIds,
    });
    const cod = reqs.find((r) => r.recipe_ingredient_id === "ri-cod")!;
    expect(cod.ingredient_id).toBe("i-cod"); // recipe still asks for cod
    expect(cod.actual_ingredient_id).toBe("i-salmon"); // but pantry draws salmon
  });

  it("scales the substitution draw, not just the original ingredient", () => {
    const reqs = buildRequirements({
      recipe: RECIPE,
      servingsCooked: 8, // 2x scale
      substitutions: { "ri-cod": "i-salmon" },
      knownIngredientIds: knownIds,
    });
    const cod = reqs.find((r) => r.recipe_ingredient_id === "ri-cod")!;
    expect(cod.actual_ingredient_id).toBe("i-salmon");
    expect(cod.quantity).toBe(1814); // 907 × 2
  });

  it("throws if a substitution names an unknown ingredient", () => {
    expect(() =>
      buildRequirements({
        recipe: RECIPE,
        servingsCooked: 4,
        substitutions: { "ri-cod": "i-not-real" },
        knownIngredientIds: knownIds,
      }),
    ).toThrow(/Unknown substitute/);
  });
});
