// Database types matching Supabase schema

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled';

export type IngredientCategory =
  | 'protein'
  | 'canned'
  | 'grain'
  | 'oil_condiment'
  | 'dairy'
  | 'frozen'
  | 'produce';

export type IngredientUnit = 'lb' | 'oz' | 'fl_oz' | 'count' | 'can';

export type StorageType = 'PAN' | '2-PAN' | 'BAG' | 'COMBO';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
}

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  default_unit: IngredientUnit;
  package_size: number;
  package_unit: IngredientUnit;
  is_perishable: boolean;
  shelf_life_days: number | null;
  shopping_aisle: number;
  costco_link: string | null;
  notes: string | null;
  seed_version: number;
}

export interface UserInventory {
  id: string;
  user_id: string;
  ingredient_id: string;
  quantity: number;
  purchased_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  default_servings: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  storage_type: StorageType;
  storage_instructions: string;
  reheat_instructions: string;
  instructions: MealStep[];
  thumbnail_url: string | null;
  cycle: number;
  meal_number: number;
  is_active: boolean;
  seed_version: number;
}

export interface MealStep {
  step: number;
  text: string;
}

export interface MealIngredient {
  id: string;
  meal_id: string;
  ingredient_id: string;
  quantity_per_serving: number;
  is_optional: boolean;
  notes: string | null;
}

export interface CookLog {
  id: string;
  user_id: string;
  meal_id: string;
  servings_cooked: number;
  cooked_at: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  is_active: boolean;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  ingredient_id: string;
  quantity_needed: number;
  packages_to_buy: number;
  is_checked: boolean;
  checked_at: string | null;
}

// Joined types for UI convenience
export interface InventoryItemWithIngredient extends UserInventory {
  ingredient: Ingredient;
  days_remaining: number | null; // computed: shelf_life_days - days_since(purchased_at)
}

export interface MealWithAvailability extends Meal {
  available_count: number;
  total_required: number;
  missing_ingredients: string[];
  urgency_score: number;
  can_cook: boolean;
  almost_can_cook: boolean;
}

export interface ShoppingListItemWithIngredient extends ShoppingListItem {
  ingredient: Ingredient;
}
