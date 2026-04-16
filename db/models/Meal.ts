import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';

export default class Meal extends Model {
  static table = 'meals';

  static associations = {
    meal_ingredients: { type: 'has_many' as const, foreignKey: 'meal_id' },
  };

  @field('name') name!: string;
  @field('description') description!: string;
  @field('category') category!: string;
  @field('default_servings') defaultServings!: number;
  @field('prep_time_minutes') prepTimeMinutes!: number;
  @field('cook_time_minutes') cookTimeMinutes!: number;
  @field('total_time_minutes') totalTimeMinutes!: number;
  @field('storage_type') storageType!: string;
  @field('storage_instructions') storageInstructions!: string;
  @field('reheat_instructions') reheatInstructions!: string;
  @field('instructions') instructionsJson!: string; // JSON stringified
  @field('thumbnail_url') thumbnailUrl!: string | null;
  @field('cycle') cycle!: number;
  @field('meal_number') mealNumber!: number;
  @field('is_active') isActive!: boolean;
  @field('seed_version') seedVersion!: number;

  @children('meal_ingredients') mealIngredients: any;

  get instructions() {
    try {
      return JSON.parse(this.instructionsJson);
    } catch {
      return [];
    }
  }
}
