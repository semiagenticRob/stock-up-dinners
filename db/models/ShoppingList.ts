import { Model } from '@nozbe/watermelondb';
import { field, date, children } from '@nozbe/watermelondb/decorators';

export default class ShoppingList extends Model {
  static table = 'shopping_lists';

  static associations = {
    shopping_list_items: { type: 'has_many' as const, foreignKey: 'shopping_list_id' },
  };

  @field('user_id') userId!: string;
  @field('name') name!: string;
  @date('created_at') createdAt!: Date;
  @field('is_active') isActive!: boolean;

  @children('shopping_list_items') items: any;
}
