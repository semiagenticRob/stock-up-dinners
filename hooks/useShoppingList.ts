import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  ShoppingList,
  ShoppingListItem,
  ShoppingListItemWithIngredient,
  Ingredient,
} from '@/types/database';
import { packagesNeeded } from '@/utils/units';

export function useShoppingList() {
  const { user } = useAuth();
  const [activeList, setActiveList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingListItemWithIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchList = useCallback(async () => {
    if (!user) return;

    // Get active list
    const { data: lists } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const list = lists?.[0] ?? null;
    setActiveList(list);

    if (!list) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    // Get items with ingredients
    const { data: listItems, error } = await supabase
      .from('shopping_list_items')
      .select('*, ingredient:ingredients(*)')
      .eq('shopping_list_id', list.id)
      .order('is_checked', { ascending: true });

    if (error) {
      console.error('Error fetching shopping list items:', error);
    }

    const enriched: ShoppingListItemWithIngredient[] = (listItems ?? []).map(
      (row) => ({
        ...row,
        ingredient: row.ingredient as Ingredient,
      })
    );

    // Sort by aisle, then by checked status
    enriched.sort((a, b) => {
      if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1;
      return a.ingredient.shopping_aisle - b.ingredient.shopping_aisle;
    });

    setItems(enriched);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Create a new shopping list
  const createList = useCallback(
    async (name: string = 'Costco Run') => {
      if (!user) return null;

      // Deactivate existing lists
      await supabase
        .from('shopping_lists')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert({ user_id: user.id, name, is_active: true })
        .select()
        .single();

      if (error) {
        console.error('Error creating shopping list:', error);
        return null;
      }

      await fetchList();
      return data;
    },
    [user, fetchList]
  );

  // Add ingredient to shopping list
  const addItem = useCallback(
    async (ingredientId: string, quantityNeeded: number, packageSize: number) => {
      if (!activeList) return;

      const pkgs = packagesNeeded(quantityNeeded, packageSize);

      const { error } = await supabase.from('shopping_list_items').insert({
        shopping_list_id: activeList.id,
        ingredient_id: ingredientId,
        quantity_needed: quantityNeeded,
        packages_to_buy: pkgs,
      });

      if (error) console.error('Error adding shopping list item:', error);
      await fetchList();
    },
    [activeList, fetchList]
  );

  // Add all missing ingredients for a meal
  const addMealIngredients = useCallback(
    async (
      mealIngredients: { ingredientId: string; needed: number; packageSize: number }[]
    ) => {
      if (!activeList) return;

      const inserts = mealIngredients.map((mi) => ({
        shopping_list_id: activeList.id,
        ingredient_id: mi.ingredientId,
        quantity_needed: mi.needed,
        packages_to_buy: packagesNeeded(mi.needed, mi.packageSize),
      }));

      const { error } = await supabase
        .from('shopping_list_items')
        .insert(inserts);

      if (error) console.error('Error adding meal ingredients:', error);
      await fetchList();
    },
    [activeList, fetchList]
  );

  // Check off item → add to inventory
  const checkOffItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: true, checked_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) console.error('Error checking off item:', error);
      await fetchList();
    },
    [fetchList]
  );

  // Uncheck item
  const uncheckItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: false, checked_at: null })
        .eq('id', itemId);

      if (error) console.error('Error unchecking item:', error);
      await fetchList();
    },
    [fetchList]
  );

  // Remove item from list
  const removeItem = useCallback(
    async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId);

      if (error) console.error('Error removing item:', error);
      await fetchList();
    },
    [fetchList]
  );

  return {
    activeList,
    items,
    isLoading,
    createList,
    addItem,
    addMealIngredients,
    checkOffItem,
    uncheckItem,
    removeItem,
    refetch: fetchList,
  };
}
