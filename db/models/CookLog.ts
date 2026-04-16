import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class CookLog extends Model {
  static table = 'cook_log';

  @field('user_id') userId!: string;
  @field('meal_id') mealId!: string;
  @field('servings_cooked') servingsCooked!: number;
  @date('cooked_at') cookedAt!: Date;
}
