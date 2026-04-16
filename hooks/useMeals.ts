import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Meal,
  MealIngredient,
  MealWithAvailability,
  InventoryItemWithIngredient,
} from '@/types/database';

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealIngredients, setMealIngredients] = useState<MealIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMeals();
  }, []);

  async function fetchMeals() {
    const [mealsRes, ingredientsRes] = await Promise.all([
      supabase
        .from('meals')
        .select('*')
        .eq('is_active', true)
        .order('cycle')
        .order('meal_number'),
      supabase.from('meal_ingredients').select('*'),
    ]);

    if (mealsRes.error) console.error('Error fetching meals:', mealsRes.error);
    if (ingredientsRes.error)
      console.error('Error fetching meal ingredients:', ingredientsRes.error);

    setMeals(mealsRes.data ?? []);
    setMealIngredients(ingredientsRes.data ?? []);
    setIsLoading(false);
  }

  return { meals, mealIngredients, isLoading, refetch: fetchMeals };
}

/**
 * Given meals, their ingredients, and the user's inventory,
 * compute which meals can be cooked and their urgency scores.
 */
export function computeMealAvailability(
  meals: Meal[],
  mealIngredients: MealIngredient[],
  inventory: InventoryItemWithIngredient[],
  servings: number = 4
): MealWithAvailability[] {
  // Build inventory lookup: ingredient_id → { quantity, days_remaining }
  const invMap = new Map<
    string,
    { quantity: number; days_remaining: number | null }
  >();
  for (const item of inventory) {
    invMap.set(item.ingredient_id, {
      quantity: item.quantity,
      days_remaining: item.days_remaining,
    });
  }

  return meals.map((meal) => {
    const ingredients = mealIngredients.filter(
      (mi) => mi.meal_id === meal.id
    );
    const required = ingredients.filter((mi) => !mi.is_optional);

    let availableCount = 0;
    let minDaysRemaining = 999;
    const missingIngredients: string[] = [];

    for (const mi of required) {
      const inv = invMap.get(mi.ingredient_id);
      const needed = mi.quantity_per_serving * servings;

      if (inv && inv.quantity >= needed) {
        availableCount++;
        // Track perishable urgency
        if (inv.days_remaining !== null && inv.days_remaining < minDaysRemaining) {
          minDaysRemaining = inv.days_remaining;
        }
      } else {
        missingIngredients.push(mi.ingredient_id);
      }
    }

    const totalRequired = required.length;
    const canCook = availableCount === totalRequired;
    const almostCanCook =
      !canCook &&
      totalRequired - availableCount <= 2 &&
      availableCount >= totalRequired * 0.8;

    return {
      ...meal,
      available_count: availableCount,
      total_required: totalRequired,
      missing_ingredients: missingIngredients,
      urgency_score: minDaysRemaining,
      can_cook: canCook,
      almost_can_cook: almostCanCook,
    };
  });
}
