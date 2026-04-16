import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class UserInventory extends Model {
  static table = 'user_inventory';

  @field('user_id') userId!: string;
  @field('ingredient_id') ingredientId!: string;
  @field('quantity') quantity!: number;
  @date('purchased_at') purchasedAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
