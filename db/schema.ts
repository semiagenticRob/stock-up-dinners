import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    // Read-only seed data (cached locally)
    tableSchema({
      name: 'ingredients',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'default_unit', type: 'string' },
        { name: 'package_size', type: 'number' },
        { name: 'package_unit', type: 'string' },
        { name: 'is_perishable', type: 'boolean' },
        { name: 'shelf_life_days', type: 'number', isOptional: true },
        { name: 'shopping_aisle', type: 'number' },
        { name: 'costco_link', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'seed_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'meals',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'default_servings', type: 'number' },
        { name: 'prep_time_minutes', type: 'number' },
        { name: 'cook_time_minutes', type: 'number' },
        { name: 'total_time_minutes', type: 'number' },
        { name: 'storage_type', type: 'string' },
        { name: 'storage_instructions', type: 'string' },
        { name: 'reheat_instructions', type: 'string' },
        { name: 'instructions', type: 'string' }, // JSON stringified
        { name: 'thumbnail_url', type: 'string', isOptional: true },
        { name: 'cycle', type: 'number' },
        { name: 'meal_number', type: 'number' },
        { name: 'is_active', type: 'boolean' },
        { name: 'seed_version', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'meal_ingredients',
      columns: [
        { name: 'meal_id', type: 'string', isIndexed: true },
        { name: 'ingredient_id', type: 'string' },
        { name: 'quantity_per_serving', type: 'number' },
        { name: 'is_optional', type: 'boolean' },
        { name: 'notes', type: 'string', isOptional: true },
      ],
    }),
    // User-owned data (synced bidirectionally)
    tableSchema({
      name: 'user_inventory',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'ingredient_id', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'purchased_at', type: 'number' }, // timestamp
        { name: 'updated_at', type: 'number' }, // timestamp
      ],
    }),
    tableSchema({
      name: 'shopping_lists',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'created_at', type: 'number' }, // timestamp
        { name: 'is_active', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'shopping_list_items',
      columns: [
        { name: 'shopping_list_id', type: 'string', isIndexed: true },
        { name: 'ingredient_id', type: 'string' },
        { name: 'quantity_needed', type: 'number' },
        { name: 'packages_to_buy', type: 'number' },
        { name: 'is_checked', type: 'boolean' },
        { name: 'checked_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: 'cook_log',
      columns: [
        { name: 'user_id', type: 'string' },
        { name: 'meal_id', type: 'string' },
        { name: 'servings_cooked', type: 'number' },
        { name: 'cooked_at', type: 'number' }, // timestamp
      ],
    }),
  ],
});
