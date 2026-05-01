import { describe, it, expect } from "vitest";
import { formatPantryQuantity } from "@/lib/format-quantity";

describe("formatPantryQuantity", () => {
  it("formats grams ≥ 1 lb in pounds", () => {
    expect(formatPantryQuantity(1361, "grams")).toBe("3 lb"); // rotisserie chicken
    expect(formatPantryQuantity(2948, "grams")).toBe("6.5 lb"); // 6.5 lb pack
    expect(formatPantryQuantity(11340, "grams")).toBe("25 lb"); // 25 lb rice
  });

  it("formats grams 1-15 oz in ounces", () => {
    expect(formatPantryQuantity(227, "grams")).toBe("8 oz"); // cheddar block
    expect(formatPantryQuantity(56, "grams")).toBe("2 oz");
  });

  it("formats sub-ounce grams as grams", () => {
    expect(formatPantryQuantity(20, "grams")).toBe("20 g");
  });

  it("formats milliliters ≥ 2 cups in cups", () => {
    expect(formatPantryQuantity(2000, "milliliters")).toBe("8.3 cups"); // olive oil
    expect(formatPantryQuantity(3785, "milliliters")).toBe("15.8 cups"); // milk gallon
  });

  it("formats milliliters in fl oz when between 1 fl oz and 2 cups", () => {
    expect(formatPantryQuantity(118, "milliliters")).toBe("4 fl oz"); // ¼ cup
    expect(formatPantryQuantity(30, "milliliters")).toBe("1 fl oz");
  });

  it("formats sub-fl-oz milliliters as tbsp or ml", () => {
    expect(formatPantryQuantity(15, "milliliters")).toBe("1 tbsp");
    expect(formatPantryQuantity(5, "milliliters")).toBe("5 ml");
  });

  it("formats count as a bare integer", () => {
    expect(formatPantryQuantity(24, "count")).toBe("24");
    expect(formatPantryQuantity(1, "count")).toBe("1");
  });

  it("returns 0 for non-positive quantities", () => {
    expect(formatPantryQuantity(0, "grams")).toBe("0");
  });
});
