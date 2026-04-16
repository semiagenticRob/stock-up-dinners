import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class MealIngredient extends Model {
  static table = 'meal_ingredients';

  static associations = {
    meals: { type: 'belongs_to' as const, key: 'meal_id' },
  };

  @field('meal_id') mealId!: string;
  @field('ingredient_id') ingredientId!: string;
  @field('quantity_per_serving') quantityPerServing!: number;
  @field('is_optional') isOptional!: boolean;
  @field('notes') notes!: string | null;

  @relation('meals', 'meal_id') meal: any;
}
