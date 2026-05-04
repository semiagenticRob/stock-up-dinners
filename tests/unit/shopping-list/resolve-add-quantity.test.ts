import { describe, expect, it } from "vitest";
import {
  resolveAddQuantity,
  ResolveAddQuantityError,
} from "@/lib/shopping-list/resolve-add-quantity";

const ing = {
  id: "i-beef",
  display_name: "Ground Beef",
  default_par: 2268, // 5 lb pack
};

describe("resolveAddQuantity", () => {
  it("uses the SKU pack quantity when a SKU is provided", () => {
    expect(
      resolveAddQuantity(ing, { ingredient_id: ing.id, suggested_quantity: 999 }, { quantity: 2948 }),
    ).toEqual({ quantity: 2948, source: "sku" });
  });

  it("falls back to the shopping list's suggested_quantity when no SKU", () => {
    expect(
      resolveAddQuantity(ing, { ingredient_id: ing.id, suggested_quantity: 1500 }, undefined),
    ).toEqual({ quantity: 1500, source: "suggested" });
  });

  it("falls back to the ingredient's default_par when no SKU and no list item", () => {
    expect(resolveAddQuantity(ing, undefined, undefined)).toEqual({
      quantity: 2268,
      source: "default_par",
    });
  });

  it("uses default_par when the listItem suggested_quantity is non-positive", () => {
    // Edge case: pantry is already over par → suggested_quantity could be 0 or negative.
    expect(
      resolveAddQuantity(ing, { ingredient_id: ing.id, suggested_quantity: 0 }, undefined),
    ).toEqual({ quantity: 2268, source: "default_par" });
  });

  it("uses default_par when the SKU quantity is non-positive (defensive)", () => {
    expect(resolveAddQuantity(ing, undefined, { quantity: 0 })).toEqual({
      quantity: 2268,
      source: "default_par",
    });
  });

  it("throws when nothing can be resolved", () => {
    const orphan = { id: "i-x", display_name: "Mystery", default_par: null };
    expect(() => resolveAddQuantity(orphan, undefined, undefined)).toThrow(
      ResolveAddQuantityError,
    );
  });

  it("throws when default_par is zero (avoids the silent-1 trap)", () => {
    const orphan = { id: "i-x", display_name: "Mystery", default_par: 0 };
    expect(() => resolveAddQuantity(orphan, undefined, undefined)).toThrow(
      ResolveAddQuantityError,
    );
  });
});
