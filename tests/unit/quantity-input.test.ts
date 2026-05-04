import { describe, it, expect } from "vitest";
import { pickQuantityInput } from "@/lib/quantity-input";
import type { Ingredient } from "@/lib/types";

function ing(over: Partial<Ingredient> & Pick<Ingredient, "canonical_unit">): Ingredient {
  return {
    id: "i",
    slug: "x",
    display_name: "x",
    category: "x",
    shelf_life_pantry_days: null,
    shelf_life_fridge_days: null,
    shelf_life_freezer_days: null,
    default_storage: "pantry",
    is_assumed_staple: false,
    substitution_group_id: null,
    allergen_tags: [],
    dietary_tags: [],
    meat_type: null,
    default_par: null,
    ...over,
  };
}

describe("pickQuantityInput", () => {
  it("apples (2268g default_par) → 5 lb default, 0.5 lb step", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "grams", default_par: 2268 }));
    expect(spec.unitLabel).toBe("lb");
    expect(spec.defaultDisplay).toBe(5);
    expect(spec.step).toBe(0.5);
    expect(spec.toCanonical(5)).toBe(2268);
  });

  it("rotisserie chicken (1361g) → 3 lb", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "grams", default_par: 1361 }));
    expect(spec.unitLabel).toBe("lb");
    expect(spec.defaultDisplay).toBe(3);
    expect(spec.toCanonical(3)).toBeCloseTo(1361, -1);
  });

  it("small grams ingredient (e.g. 200g) → oz", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "grams", default_par: 200 }));
    expect(spec.unitLabel).toBe("oz");
    expect(spec.toCanonical(7)).toBeCloseTo(198, 0);
  });

  it("milliliters with 2L par → cups", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "milliliters", default_par: 2000 }));
    expect(spec.unitLabel).toBe("cup");
    expect(spec.toCanonical(8.3)).toBeCloseTo(1992, 0);
  });

  it("milliliters with 60mL par → tbsp", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "milliliters", default_par: 60 }));
    expect(spec.unitLabel).toBe("fl oz");
  });

  it("count → ct, integer step", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "count", default_par: 24 }));
    expect(spec.unitLabel).toBe("ct");
    expect(spec.defaultDisplay).toBe(24);
    expect(spec.step).toBe(1);
  });

  it("formatDisplay strips trailing zeros for fractional steps", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "grams", default_par: 2268 }));
    expect(spec.formatDisplay(1.5)).toBe("1.5");
    expect(spec.formatDisplay(2)).toBe("2");
  });

  it("toCanonical clamps to >= 1 to satisfy DB constraint", () => {
    const spec = pickQuantityInput(ing({ canonical_unit: "grams", default_par: 1361 }));
    expect(spec.toCanonical(0)).toBe(1);
    expect(spec.toCanonical(-1)).toBe(1);
  });
});
