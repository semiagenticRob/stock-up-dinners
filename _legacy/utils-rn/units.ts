import { IngredientUnit } from '@/types/database';

// Conversion factors to a base unit (oz for weight, fl_oz for volume)
// 'count' and 'can' are not convertible — they stay as-is

type WeightUnit = 'lb' | 'oz';
type VolumeUnit = 'fl_oz';
type DiscreteUnit = 'count' | 'can';

const WEIGHT_TO_OZ: Record<WeightUnit, number> = {
  oz: 1,
  lb: 16,
};

// Check if a unit is a weight unit
function isWeightUnit(unit: IngredientUnit): unit is WeightUnit {
  return unit === 'lb' || unit === 'oz';
}

// Check if units are compatible (same dimension)
function areCompatible(a: IngredientUnit, b: IngredientUnit): boolean {
  if (a === b) return true;
  if (isWeightUnit(a) && isWeightUnit(b)) return true;
  return false;
}

/**
 * Convert a quantity from one unit to another.
 * Only works for compatible units (weight↔weight).
 * Throws if units are incompatible.
 */
export function convertUnit(
  quantity: number,
  fromUnit: IngredientUnit,
  toUnit: IngredientUnit
): number {
  if (fromUnit === toUnit) return quantity;

  if (isWeightUnit(fromUnit) && isWeightUnit(toUnit)) {
    const inOz = quantity * WEIGHT_TO_OZ[fromUnit];
    return inOz / WEIGHT_TO_OZ[toUnit];
  }

  throw new Error(
    `Cannot convert between incompatible units: ${fromUnit} → ${toUnit}`
  );
}

/**
 * Normalize a recipe quantity to the ingredient's default unit.
 * Used at seed time to ensure all meal_ingredients.quantity_per_serving
 * values are in the same unit as their ingredient's default_unit.
 */
export function normalizeToDefaultUnit(
  quantity: number,
  recipeUnit: IngredientUnit,
  defaultUnit: IngredientUnit
): number {
  if (recipeUnit === defaultUnit) return quantity;

  if (!areCompatible(recipeUnit, defaultUnit)) {
    throw new Error(
      `Recipe unit "${recipeUnit}" is not compatible with ingredient default unit "${defaultUnit}". ` +
        `Manual conversion needed.`
    );
  }

  return convertUnit(quantity, recipeUnit, defaultUnit);
}

/**
 * Format a quantity for display in human-friendly units.
 * E.g., 0.125 lb → "2 oz", 6.5 lb → "6.5 lb", 1 can → "1 can"
 *
 * Rules:
 * - Weights < 1 lb display in oz
 * - Weights >= 1 lb display in lb
 * - Discrete units (count, can) display as-is
 * - fl_oz displays as-is
 */
export function formatQuantity(
  quantity: number,
  unit: IngredientUnit
): string {
  if (unit === 'count') {
    return `${formatNumber(quantity)}`;
  }

  if (unit === 'can') {
    const label = quantity === 1 ? 'can' : 'cans';
    return `${formatNumber(quantity)} ${label}`;
  }

  if (unit === 'fl_oz') {
    return `${formatNumber(quantity)} fl oz`;
  }

  if (unit === 'lb') {
    if (quantity < 0.125) {
      // Very small — show in oz
      const oz = quantity * 16;
      return `${formatNumber(oz)} oz`;
    }
    if (quantity < 1) {
      // Less than a pound — show in oz for clarity
      const oz = quantity * 16;
      // If it's a clean oz number, show oz. Otherwise show lb.
      if (oz === Math.round(oz)) {
        return `${formatNumber(oz)} oz`;
      }
      return `${formatNumber(quantity)} lb`;
    }
    return `${formatNumber(quantity)} lb`;
  }

  if (unit === 'oz') {
    if (quantity >= 16) {
      const lb = quantity / 16;
      return `${formatNumber(lb)} lb`;
    }
    return `${formatNumber(quantity)} oz`;
  }

  return `${formatNumber(quantity)} ${unit}`;
}

/**
 * Scale a recipe's ingredient quantity by serving count.
 * quantity_per_serving × servings
 */
export function scaleForServings(
  quantityPerServing: number,
  servings: number
): number {
  return quantityPerServing * servings;
}

/**
 * Calculate how many Costco packages to buy.
 * ceil(needed / package_size)
 */
export function packagesNeeded(
  quantityNeeded: number,
  packageSize: number
): number {
  if (quantityNeeded <= 0) return 0;
  return Math.ceil(quantityNeeded / packageSize);
}

/**
 * Format a number for display: remove trailing zeros, max 2 decimal places.
 */
function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString();

  // Round to 2 decimal places
  const rounded = Math.round(n * 100) / 100;
  // Remove trailing zeros
  return rounded.toString();
}
