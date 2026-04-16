import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class ShoppingListItem extends Model {
  static table = 'shopping_list_items';

  static associations = {
    shopping_lists: { type: 'belongs_to' as const, key: 'shopping_list_id' },
  };

  @field('shopping_list_id') shoppingListId!: string;
  @field('ingredient_id') ingredientId!: string;
  @field('quantity_needed') quantityNeeded!: number;
  @field('packages_to_buy') packagesToBuy!: number;
  @field('is_checked') isChecked!: boolean;
  @date('checked_at') checkedAt!: Date | null;

  @relation('shopping_lists', 'shopping_list_id') shoppingList: any;
}
