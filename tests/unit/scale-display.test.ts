import { describe, it, expect } from "vitest";
import { scaleDisplayQuantity } from "@/lib/scale-display";

describe("scaleDisplayQuantity", () => {
  it("returns the input unchanged at scale 1", () => {
    expect(scaleDisplayQuantity("2 tbsp", 1)).toBe("2 tbsp");
    expect(scaleDisplayQuantity("½ tsp", 1)).toBe("½ tsp");
  });

  it("scales a leading integer with units", () => {
    expect(scaleDisplayQuantity("2 tbsp", 2)).toBe("4 tbsp");
    expect(scaleDisplayQuantity("8 large tortillas", 1.5)).toBe("12 large tortillas");
  });

  it("scales a range, preserving parentheticals", () => {
    expect(scaleDisplayQuantity("5–6 fillets (about 2 lb)", 2)).toBe(
      "10–12 fillets (about 2 lb)",
    );
  });

  it("scales a unicode fraction to whole-number when it lands clean", () => {
    expect(scaleDisplayQuantity("½ tsp", 2)).toBe("1 tsp");
    expect(scaleDisplayQuantity("¼ cup", 4)).toBe("1 cup");
  });

  it("scales an integer down to a fraction", () => {
    expect(scaleDisplayQuantity("2 tbsp", 0.5)).toBe("1 tbsp");
    expect(scaleDisplayQuantity("1 tsp", 0.5)).toBe("½ tsp");
  });

  it("scales a mixed unicode-fraction quantity", () => {
    expect(scaleDisplayQuantity("1½ tsp", 2)).toBe("3 tsp");
  });

  it("scales a single decimal", () => {
    expect(scaleDisplayQuantity("1.5 cups", 2)).toBe("3 cups");
  });

  it("scales a count with descriptor", () => {
    expect(scaleDisplayQuantity("1 can (15 oz), drained", 2)).toBe(
      "2 can (15 oz), drained",
    );
  });

  it("falls back to a scale annotation when no number is parseable", () => {
    expect(scaleDisplayQuantity("a pinch", 2)).toBe("a pinch (×2)");
  });

  it("rounds awkward results to a common cooking fraction", () => {
    // 0.5 × 0.75 = 0.375 → ⅓ (close enough; ⅜ would be technically more precise
    // but isn't a standard measuring increment).
    expect(scaleDisplayQuantity("½ cup", 0.75)).toBe("⅓ cup");
  });

  it("preserves leading-number formatting for non-fraction-y multiplications", () => {
    // 1 × 0.5 = 0.5 → ½
    expect(scaleDisplayQuantity("1 tortilla", 0.5)).toBe("½ tortilla");
  });
});
