import { describe, it, expect } from "vitest";
import { decrementPantry, type DecrementRequirement } from "@/lib/pantry/decrement";
import type { PantryLot } from "@/lib/types";

const userId = "user-1";
const SALT_ID = "ing-salt"; // assumed staple
const CHICKEN_ID = "ing-chicken";
const RICE_ID = "ing-rice";
const BEEF_ID = "ing-beef";
const TURKEY_ID = "ing-turkey";

function lot(overrides: Partial<PantryLot> & { ingredient_id: string }): PantryLot {
  return {
    id: `lot-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    source_sku_id: null,
    quantity_initial: overrides.quantity_remaining ?? 1000,
    quantity_remaining: 1000,
    acquired_on: new Date("2026-04-01"),
    storage_state: "refrigerated",
    expires_on: new Date("2026-04-15"),
    is_depleted: false,
    notes: null,
    ...overrides,
  };
}

describe("decrementPantry", () => {
  it("draws full quantity from a single lot when it exactly satisfies the need", () => {
    const lots = [lot({ ingredient_id: CHICKEN_ID, quantity_remaining: 500 })];
    const requirements: DecrementRequirement[] = [
      { ingredient_id: CHICKEN_ID, quantity: 500 },
    ];

    const result = decrementPantry(requirements, lots, { assumedStapleIds: new Set() });

    expect(result.consumptions).toHaveLength(1);
    expect(result.consumptions[0]).toMatchObject({
      lot_id: lots[0].id,
      ingredient_id: CHICKEN_ID,
      quantity_consumed: 500,
      was_substitution: false,
    });
    expect(result.updatedLots[0].quantity_remaining).toBe(0);
    expect(result.updatedLots[0].is_depleted).toBe(true);
    expect(result.shortfalls).toEqual([]);
  });

  it("partially consumes a lot when need < remaining", () => {
    const lots = [lot({ ingredient_id: CHICKEN_ID, quantity_remaining: 500 })];
    const requirements: DecrementRequirement[] = [
      { ingredient_id: CHICKEN_ID, quantity: 200 },
    ];

    const result = decrementPantry(requirements, lots, { assumedStapleIds: new Set() });

    expect(result.consumptions[0].quantity_consumed).toBe(200);
    expect(result.updatedLots[0].quantity_remaining).toBe(300);
    expect(result.updatedLots[0].is_depleted).toBe(false);
  });

  it("draws across multiple lots in expiration order (FIFO)", () => {
    const oldExpiring = lot({
      id: "lot-old",
      ingredient_id: CHICKEN_ID,
      quantity_remaining: 300,
      expires_on: new Date("2026-04-10"),
    });
    const newExpiring = lot({
      id: "lot-new",
      ingredient_id: CHICKEN_ID,
      quantity_remaining: 500,
      expires_on: new Date("2026-04-20"),
    });
    // Pass in reverse expiration order to confirm sort works.
    const lots = [newExpiring, oldExpiring];

    const result = decrementPantry(
      [{ ingredient_id: CHICKEN_ID, quantity: 600 }],
      lots,
      { assumedStapleIds: new Set() },
    );

    expect(result.consumptions).toHaveLength(2);
    expect(result.consumptions[0]).toMatchObject({ lot_id: "lot-old", quantity_consumed: 300 });
    expect(result.consumptions[1]).toMatchObject({ lot_id: "lot-new", quantity_consumed: 300 });

    const oldUpdated = result.updatedLots.find((l) => l.id === "lot-old")!;
    const newUpdated = result.updatedLots.find((l) => l.id === "lot-new")!;
    expect(oldUpdated.quantity_remaining).toBe(0);
    expect(oldUpdated.is_depleted).toBe(true);
    expect(newUpdated.quantity_remaining).toBe(200);
    expect(newUpdated.is_depleted).toBe(false);
  });

  it("breaks expiration ties by acquired_on ASC (oldest acquisition first)", () => {
    const earlierAcq = lot({
      id: "lot-earlier-acq",
      ingredient_id: CHICKEN_ID,
      quantity_remaining: 200,
      acquired_on: new Date("2026-03-25"),
      expires_on: new Date("2026-04-10"),
    });
    const laterAcq = lot({
      id: "lot-later-acq",
      ingredient_id: CHICKEN_ID,
      quantity_remaining: 200,
      acquired_on: new Date("2026-04-01"),
      expires_on: new Date("2026-04-10"),
    });
    const lots = [laterAcq, earlierAcq];

    const result = decrementPantry(
      [{ ingredient_id: CHICKEN_ID, quantity: 300 }],
      lots,
      { assumedStapleIds: new Set() },
    );

    expect(result.consumptions[0].lot_id).toBe("lot-earlier-acq");
    expect(result.consumptions[0].quantity_consumed).toBe(200);
    expect(result.consumptions[1].lot_id).toBe("lot-later-acq");
    expect(result.consumptions[1].quantity_consumed).toBe(100);
  });

  it("treats nullable expires_on as 'never expires' (sorts after dated lots)", () => {
    const dated = lot({
      id: "lot-dated",
      ingredient_id: RICE_ID,
      quantity_remaining: 200,
      expires_on: new Date("2026-04-10"),
    });
    const undated = lot({
      id: "lot-undated",
      ingredient_id: RICE_ID,
      quantity_remaining: 200,
      expires_on: null,
    });

    const result = decrementPantry(
      [{ ingredient_id: RICE_ID, quantity: 250 }],
      [undated, dated],
      { assumedStapleIds: new Set() },
    );

    expect(result.consumptions[0].lot_id).toBe("lot-dated");
    expect(result.consumptions[1].lot_id).toBe("lot-undated");
  });

  it("records a shortfall when total available < required", () => {
    const lots = [lot({ ingredient_id: CHICKEN_ID, quantity_remaining: 200 })];
    const result = decrementPantry(
      [{ ingredient_id: CHICKEN_ID, quantity: 500 }],
      lots,
      { assumedStapleIds: new Set() },
    );

    expect(result.consumptions).toHaveLength(1);
    expect(result.consumptions[0].quantity_consumed).toBe(200);
    expect(result.updatedLots[0].quantity_remaining).toBe(0);
    expect(result.updatedLots[0].is_depleted).toBe(true);
    expect(result.shortfalls).toEqual([
      { ingredient_id: CHICKEN_ID, required: 500, drawn: 200 },
    ]);
  });

  it("ignores already-depleted lots", () => {
    const depleted = lot({
      id: "lot-depleted",
      ingredient_id: CHICKEN_ID,
      quantity_remaining: 0,
      is_depleted: true,
    });
    const fresh = lot({
      id: "lot-fresh",
      ingredient_id: CHICKEN_ID,
      quantity_remaining: 500,
    });

    const result = decrementPantry(
      [{ ingredient_id: CHICKEN_ID, quantity: 200 }],
      [depleted, fresh],
      { assumedStapleIds: new Set() },
    );

    expect(result.consumptions).toHaveLength(1);
    expect(result.consumptions[0].lot_id).toBe("lot-fresh");
  });

  it("skips assumed-staple ingredients (no consumption recorded)", () => {
    const lots = [
      lot({ ingredient_id: SALT_ID, quantity_remaining: 1000 }),
      lot({ ingredient_id: CHICKEN_ID, quantity_remaining: 500 }),
    ];

    const result = decrementPantry(
      [
        { ingredient_id: SALT_ID, quantity: 50 },
        { ingredient_id: CHICKEN_ID, quantity: 200 },
      ],
      lots,
      { assumedStapleIds: new Set([SALT_ID]) },
    );

    expect(result.consumptions).toHaveLength(1);
    expect(result.consumptions[0].ingredient_id).toBe(CHICKEN_ID);
    // Salt lot is unchanged.
    expect(result.updatedLots.find((l) => l.ingredient_id === SALT_ID)?.quantity_remaining).toBe(
      1000,
    );
  });

  it("flags was_substitution when actual_ingredient_id differs from required", () => {
    const lots = [lot({ ingredient_id: TURKEY_ID, quantity_remaining: 500 })];

    const result = decrementPantry(
      [
        {
          ingredient_id: BEEF_ID,
          actual_ingredient_id: TURKEY_ID,
          quantity: 200,
          recipe_ingredient_id: "ri-1",
        },
      ],
      lots,
      { assumedStapleIds: new Set() },
    );

    expect(result.consumptions[0]).toMatchObject({
      ingredient_id: TURKEY_ID,
      was_substitution: true,
      recipe_ingredient_id: "ri-1",
    });
  });

  it("handles multiple ingredients in one cook event", () => {
    const lots = [
      lot({ id: "lot-c", ingredient_id: CHICKEN_ID, quantity_remaining: 500 }),
      lot({ id: "lot-r", ingredient_id: RICE_ID, quantity_remaining: 800 }),
    ];

    const result = decrementPantry(
      [
        { ingredient_id: CHICKEN_ID, quantity: 200 },
        { ingredient_id: RICE_ID, quantity: 300 },
      ],
      lots,
      { assumedStapleIds: new Set() },
    );

    expect(result.consumptions).toHaveLength(2);
    const byIng = Object.fromEntries(
      result.consumptions.map((c) => [c.ingredient_id, c.quantity_consumed]),
    );
    expect(byIng[CHICKEN_ID]).toBe(200);
    expect(byIng[RICE_ID]).toBe(300);
  });

  it("treats requirements with quantity <= 0 as no-ops", () => {
    const lots = [lot({ ingredient_id: CHICKEN_ID, quantity_remaining: 500 })];
    const result = decrementPantry(
      [{ ingredient_id: CHICKEN_ID, quantity: 0 }],
      lots,
      { assumedStapleIds: new Set() },
    );
    expect(result.consumptions).toEqual([]);
    expect(result.updatedLots[0].quantity_remaining).toBe(500);
    expect(result.shortfalls).toEqual([]);
  });

  it("returns a deep copy of lots — caller's input is not mutated", () => {
    const lots = [lot({ ingredient_id: CHICKEN_ID, quantity_remaining: 500 })];
    const beforeRemaining = lots[0].quantity_remaining;
    const beforeDepleted = lots[0].is_depleted;
    const result = decrementPantry(
      [{ ingredient_id: CHICKEN_ID, quantity: 200 }],
      lots,
      { assumedStapleIds: new Set() },
    );
    // Original lot unchanged
    expect(lots[0].quantity_remaining).toBe(beforeRemaining);
    expect(lots[0].is_depleted).toBe(beforeDepleted);
    // Returned copy reflects the draw
    expect(result.updatedLots[0].quantity_remaining).toBe(300);
    expect(result.updatedLots[0]).not.toBe(lots[0]);
  });
});
