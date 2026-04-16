import { Model } from '@nozbe/watermelondb';
import { field, readonly } from '@nozbe/watermelondb/decorators';

export default class Ingredient extends Model {
  static table = 'ingredients';

  @field('name') name!: string;
  @field('category') category!: string;
  @field('default_unit') defaultUnit!: string;
  @field('package_size') packageSize!: number;
  @field('package_unit') packageUnit!: string;
  @field('is_perishable') isPerishable!: boolean;
  @field('shelf_life_days') shelfLifeDays!: number | null;
  @field('shopping_aisle') shoppingAisle!: number;
  @field('costco_link') costcoLink!: string | null;
  @field('notes') notes!: string | null;
  @field('seed_version') seedVersion!: number;
}
