import { IngredientCategory } from '@/types/database';

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  protein: 'Proteins',
  canned: 'Canned Goods',
  grain: 'Grains & Pasta',
  oil_condiment: 'Oils & Seasonings',
  dairy: 'Dairy',
  frozen: 'Frozen',
  produce: 'Produce',
};

export const CATEGORY_ORDER: IngredientCategory[] = [
  'protein',
  'canned',
  'grain',
  'oil_condiment',
  'dairy',
  'frozen',
  'produce',
];

export const AISLE_LABELS: Record<number, string> = {
  1: 'Produce',
  2: 'Meat & Seafood',
  3: 'Dairy',
  4: 'Frozen',
  5: 'Canned Goods',
  6: 'Grains & Pasta',
  7: 'Oils & Seasonings',
};
