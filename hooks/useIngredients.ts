import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ingredient, IngredientCategory } from '@/types/database';

const CATEGORY_ORDER: IngredientCategory[] = [
  'protein',
  'canned',
  'grain',
  'oil_condiment',
  'dairy',
  'frozen',
  'produce',
];

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIngredients();
  }, []);

  async function fetchIngredients() {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('shopping_aisle', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching ingredients:', error);
    } else {
      setIngredients(data ?? []);
    }
    setIsLoading(false);
  }

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: ingredients.filter((i) => i.category === cat),
  })).filter((group) => group.items.length > 0);

  return { ingredients, byCategory, isLoading, refetch: fetchIngredients };
}

export function useIngredientMap() {
  const { ingredients, isLoading } = useIngredients();
  const map = new Map<string, Ingredient>();
  for (const ing of ingredients) {
    map.set(ing.id, ing);
  }
  return { ingredientMap: map, isLoading };
}
