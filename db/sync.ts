import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from './index';
import { supabase } from '@/lib/supabase';

// Tables that sync bidirectionally (user-owned data)
const SYNCABLE_TABLES = [
  'user_inventory',
  'shopping_lists',
  'shopping_list_items',
  'cook_log',
];

// Tables that are read-only seed data (pulled from server, never pushed)
const SEED_TABLES = ['ingredients', 'meals', 'meal_ingredients'];

/**
 * Sync WatermelonDB with Supabase.
 * - Seed tables: pull-only (server → local)
 * - Syncable tables: bidirectional (push local changes, pull remote changes)
 */
export async function syncWithSupabase(userId: string) {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const timestamp = lastPulledAt ?? 0;
      const since = new Date(timestamp).toISOString();

      const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {};

      // Pull seed data (read-only tables)
      for (const table of SEED_TABLES) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error pulling ${table}:`, error);
          changes[table] = { created: [], updated: [], deleted: [] };
          continue;
        }

        if (lastPulledAt === null) {
          // First sync — everything is "created"
          changes[table] = {
            created: (data ?? []).map(mapSupabaseToWatermelon(table)),
            updated: [],
            deleted: [],
          };
        } else {
          // Subsequent syncs — for seed data, treat all as updated
          // (simple approach; seed data rarely changes)
          changes[table] = {
            created: [],
            updated: (data ?? []).map(mapSupabaseToWatermelon(table)),
            deleted: [],
          };
        }
      }

      // Pull user-owned data
      for (const table of SYNCABLE_TABLES) {
        let query = supabase.from(table).select('*');

        // Filter by user
        if (table === 'shopping_list_items') {
          // Items are filtered via their parent shopping list
          const { data: lists } = await supabase
            .from('shopping_lists')
            .select('id')
            .eq('user_id', userId);
          const listIds = (lists ?? []).map((l) => l.id);
          if (listIds.length > 0) {
            query = query.in('shopping_list_id', listIds);
          } else {
            changes[table] = { created: [], updated: [], deleted: [] };
            continue;
          }
        } else {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error pulling ${table}:`, error);
          changes[table] = { created: [], updated: [], deleted: [] };
          continue;
        }

        if (lastPulledAt === null) {
          changes[table] = {
            created: (data ?? []).map(mapSupabaseToWatermelon(table)),
            updated: [],
            deleted: [],
          };
        } else {
          // For simplicity in V1: treat all rows as updates on subsequent syncs
          // WatermelonDB handles deduplication
          changes[table] = {
            created: [],
            updated: (data ?? []).map(mapSupabaseToWatermelon(table)),
            deleted: [],
          };
        }
      }

      return {
        changes,
        timestamp: Date.now(),
      };
    },

    pushChanges: async ({ changes }) => {
      // Only push user-owned tables (not seed data)
      for (const table of SYNCABLE_TABLES) {
        const tableChanges = (changes as any)[table];
        if (!tableChanges) continue;

        // Handle creates
        for (const record of tableChanges.created) {
          const mapped = mapWatermelonToSupabase(table, record);
          const { error } = await supabase.from(table).upsert(mapped);
          if (error) console.error(`Error pushing create to ${table}:`, error);
        }

        // Handle updates
        for (const record of tableChanges.updated) {
          const mapped = mapWatermelonToSupabase(table, record);
          const { error } = await supabase
            .from(table)
            .upsert(mapped);
          if (error) console.error(`Error pushing update to ${table}:`, error);
        }

        // Handle deletes
        for (const id of tableChanges.deleted) {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
          if (error) console.error(`Error pushing delete to ${table}:`, error);
        }
      }
    },

    migrationsEnabledAtVersion: 1,
  });
}

/**
 * Map Supabase row → WatermelonDB record format.
 * WatermelonDB expects timestamps as milliseconds, and JSON as strings.
 */
function mapSupabaseToWatermelon(table: string) {
  return (row: any) => {
    const mapped: any = { ...row };

    // Convert ISO timestamps to milliseconds
    if (mapped.purchased_at) mapped.purchased_at = new Date(mapped.purchased_at).getTime();
    if (mapped.updated_at) mapped.updated_at = new Date(mapped.updated_at).getTime();
    if (mapped.created_at) mapped.created_at = new Date(mapped.created_at).getTime();
    if (mapped.cooked_at) mapped.cooked_at = new Date(mapped.cooked_at).getTime();
    if (mapped.checked_at) mapped.checked_at = mapped.checked_at ? new Date(mapped.checked_at).getTime() : null;

    // Convert JSON objects to strings for WatermelonDB
    if (table === 'meals' && mapped.instructions && typeof mapped.instructions !== 'string') {
      mapped.instructions = JSON.stringify(mapped.instructions);
    }

    return mapped;
  };
}

/**
 * Map WatermelonDB record → Supabase row format.
 * Convert timestamps back to ISO strings.
 */
function mapWatermelonToSupabase(table: string, record: any): any {
  const mapped: any = { ...record };

  // Remove WatermelonDB internal fields
  delete mapped._status;
  delete mapped._changed;

  // Convert millisecond timestamps to ISO strings
  if (mapped.purchased_at && typeof mapped.purchased_at === 'number') {
    mapped.purchased_at = new Date(mapped.purchased_at).toISOString();
  }
  if (mapped.updated_at && typeof mapped.updated_at === 'number') {
    mapped.updated_at = new Date(mapped.updated_at).toISOString();
  }
  if (mapped.created_at && typeof mapped.created_at === 'number') {
    mapped.created_at = new Date(mapped.created_at).toISOString();
  }
  if (mapped.cooked_at && typeof mapped.cooked_at === 'number') {
    mapped.cooked_at = new Date(mapped.cooked_at).toISOString();
  }
  if (mapped.checked_at && typeof mapped.checked_at === 'number') {
    mapped.checked_at = new Date(mapped.checked_at).toISOString();
  }

  return mapped;
}
