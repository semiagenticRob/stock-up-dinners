import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';

import Ingredient from './models/Ingredient';
import Meal from './models/Meal';
import MealIngredient from './models/MealIngredient';
import UserInventory from './models/UserInventory';
import ShoppingList from './models/ShoppingList';
import ShoppingListItem from './models/ShoppingListItem';
import CookLog from './models/CookLog';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // Use JSI for better performance (requires native build)
  onSetUpError: (error) => {
    console.error('WatermelonDB setup error:', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Ingredient,
    Meal,
    MealIngredient,
    UserInventory,
    ShoppingList,
    ShoppingListItem,
    CookLog,
  ],
});

export {
  Ingredient,
  Meal,
  MealIngredient,
  UserInventory,
  ShoppingList,
  ShoppingListItem,
  CookLog,
};
