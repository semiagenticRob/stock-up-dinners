/**
 * Resolve the canonical-unit quantity to add to a live shopping session
 * when a user checks an item / taps to add an ingredient.
 *
 * Resolution order:
 *   1. SKU's pack quantity (the most accurate — "I grabbed one pack of X")
 *   2. The shopping list's `suggested_quantity` (par - current, how much to
 *      refill to par). This is what the user is here to buy.
 *   3. The ingredient's `default_par` (one full pack worth, by definition).
 *   4. Throw — we refuse to silently write a phantom 1.
 *
 * Pure function. Tested in lib/shopping-list/__tests__/resolve-add-quantity.test.ts.
 */

interface ShoppingListLite {
  ingredient_id: string;
  suggested_quantity: number;
}

interface SkuLite {
  /** Quantity of the ingredient in one pack of this SKU, in canonical units. */
  quantity: number;
}

interface IngredientLite {
  id: string;
  display_name: string;
  default_par: number | null;
}

export interface ResolvedQuantity {
  quantity: number;
  source: "sku" | "suggested" | "default_par";
}

export function resolveAddQuantity(
  ingredient: IngredientLite,
  listItem: ShoppingListLite | undefined,
  sku: SkuLite | undefined,
): ResolvedQuantity {
  if (sku && sku.quantity > 0) return { quantity: sku.quantity, source: "sku" };
  if (listItem && listItem.suggested_quantity > 0) {
    return { quantity: listItem.suggested_quantity, source: "suggested" };
  }
  if (ingredient.default_par != null && ingredient.default_par > 0) {
    return { quantity: ingredient.default_par, source: "default_par" };
  }
  // Refuse to silently write a phantom 1. Caller decides how to surface this.
  throw new ResolveAddQuantityError(
    `Cannot resolve quantity for ${ingredient.display_name} (id=${ingredient.id}): ` +
      `no SKU pack mapping, no shopping-list suggestion, and no default_par on the ingredient.`,
  );
}

export class ResolveAddQuantityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResolveAddQuantityError";
  }
}
