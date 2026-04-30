import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import {
  Ingredient,
  UserInventory,
  InventoryItemWithIngredient,
} from '@/types/database';

function computeDaysRemaining(
  purchasedAt: string,
  shelfLifeDays: number | null
): number | null {
  if (shelfLifeDays === null) return null;
  const purchased = new Date(purchasedAt);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - purchased.getTime()) / (1000 * 60 * 60 * 24)
  );
  return shelfLifeDays - daysSince;
}

export function useInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItemWithIngredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_inventory')
      .select('*, ingredient:ingredients(*)')
      .eq('user_id', user.id)
      .gt('quantity', 0);

    if (error) {
      console.error('Error fetching inventory:', error);
      setIsLoading(false);
      return;
    }

    const enriched: InventoryItemWithIngredient[] = (data ?? []).map((row) => ({
      ...row,
      ingredient: row.ingredient as Ingredient,
      days_remaining: computeDaysRemaining(
        row.purchased_at,
        (row.ingredient as Ingredient).shelf_life_days
      ),
    }));

    setItems(enriched);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Add or update inventory item
  const upsertItem = useCallback(
    async (ingredientId: string, quantity: number, purchasedAt?: Date) => {
      if (!user) return;

      // Check if item exists
      const { data: existing } = await supabase
        .from('user_inventory')
        .select('id, quantity, purchased_at')
        .eq('user_id', user.id)
        .eq('ingredient_id', ingredientId)
        .single();

      if (existing) {
        // Pessimistic purchased_at: keep the earlier date
        const existingDate = new Date(existing.purchased_at);
        const newDate = purchasedAt ?? new Date();
        const keepDate = existingDate < newDate ? existingDate : newDate;

        const { error } = await supabase
          .from('user_inventory')
          .update({
            quantity: existing.quantity + quantity,
            purchased_at: keepDate.toISOString(),
          })
          .eq('id', existing.id);

        if (error) console.error('Error updating inventory:', error);
      } else {
        const { error } = await supabase.from('user_inventory').insert({
          user_id: user.id,
          ingredient_id: ingredientId,
          quantity,
          purchased_at: (purchasedAt ?? new Date()).toISOString(),
        });

        if (error) console.error('Error inserting inventory:', error);
      }

      await fetchInventory();
    },
    [user, fetchInventory]
  );

  // Set absolute quantity (for manual adjustments)
  const setQuantity = useCallback(
    async (ingredientId: string, quantity: number) => {
      if (!user) return;

      if (quantity <= 0) {
        // Remove item
        await supabase
          .from('user_inventory')
          .delete()
          .eq('user_id', user.id)
          .eq('ingredient_id', ingredientId);
      } else {
        const { data: existing } = await supabase
          .from('user_inventory')
          .select('id')
          .eq('user_id', user.id)
          .eq('ingredient_id', ingredientId)
          .single();

        if (existing) {
          await supabase
            .from('user_inventory')
            .update({ quantity })
            .eq('id', existing.id);
        } else {
          await supabase.from('user_inventory').insert({
            user_id: user.id,
            ingredient_id: ingredientId,
            quantity,
            purchased_at: new Date().toISOString(),
          });
        }
      }

      await fetchInventory();
    },
    [user, fetchInventory]
  );

  // Decrement inventory for cooking a meal
  const decrementForMeal = useCallback(
    async (
      ingredientAmounts: { ingredientId: string; amount: number }[]
    ) => {
      if (!user) return;

      for (const { ingredientId, amount } of ingredientAmounts) {
        const { data: existing } = await supabase
          .from('user_inventory')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('ingredient_id', ingredientId)
          .single();

        if (existing) {
          const newQty = Math.max(0, existing.quantity - amount);
          if (newQty <= 0) {
            await supabase
              .from('user_inventory')
              .delete()
              .eq('id', existing.id);
          } else {
            await supabase
              .from('user_inventory')
              .update({ quantity: newQty })
              .eq('id', existing.id);
          }
        }
      }

      await fetchInventory();
    },
    [user, fetchInventory]
  );

  // Sorted views
  const perishables = items
    .filter((i) => i.ingredient.is_perishable && i.days_remaining !== null)
    .sort((a, b) => (a.days_remaining ?? 999) - (b.days_remaining ?? 999));

  const byCategory = [
    'protein',
    'canned',
    'grain',
    'oil_condiment',
    'dairy',
    'frozen',
    'produce',
  ].map((cat) => ({
    category: cat,
    items: items.filter((i) => i.ingredient.category === cat),
  })).filter((g) => g.items.length > 0);

  return {
    items,
    perishables,
    byCategory,
    isLoading,
    upsertItem,
    setQuantity,
    decrementForMeal,
    refetch: fetchInventory,
  };
}
