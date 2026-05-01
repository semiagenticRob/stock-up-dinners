/**
 * Pantry CRUD over Supabase. RLS isolates by user_id automatically.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDate, toPantryLot, type PantryLotRow } from "./mappers";
import type { Ingredient, PantryLot, StorageState } from "@/lib/types";

/** Loads all non-depleted pantry lots for the current user (per RLS). */
export async function loadActivePantry(supabase: SupabaseClient): Promise<PantryLot[]> {
  const { data, error } = await supabase
    .from("pantry_lots")
    .select("*")
    .eq("is_depleted", false)
    .order("expires_on", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as PantryLotRow[]).map(toPantryLot);
}

export interface NewLotInput {
  ingredient_id: string;
  source_sku_id?: string | null;
  quantity_initial: number;
  /** Defaults to quantity_initial. */
  quantity_remaining?: number;
  acquired_on: Date;
  storage_state: StorageState;
  /** If null, computed from acquired_on + ingredient.shelf_life_<storage>_days. */
  expires_on?: Date | null;
  notes?: string | null;
}

/**
 * Inserts a new lot. Computes expires_on from the ingredient's storage-specific
 * shelf life if the caller didn't supply one. RLS sets user_id automatically
 * via the auth context — we pass it explicitly to satisfy the WITH CHECK clause.
 */
export async function insertLot(
  supabase: SupabaseClient,
  user_id: string,
  ingredient: Ingredient,
  input: NewLotInput,
): Promise<PantryLot> {
  const expires =
    input.expires_on === undefined
      ? computeExpires(input.acquired_on, input.storage_state, ingredient)
      : input.expires_on;

  const row = {
    user_id,
    ingredient_id: input.ingredient_id,
    source_sku_id: input.source_sku_id ?? null,
    quantity_initial: input.quantity_initial,
    quantity_remaining: input.quantity_remaining ?? input.quantity_initial,
    acquired_on: formatDate(input.acquired_on),
    storage_state: input.storage_state,
    expires_on: expires ? formatDate(expires) : null,
    is_depleted: false,
    notes: input.notes ?? null,
  };

  const { data, error } = await supabase
    .from("pantry_lots")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return toPantryLot(data as PantryLotRow);
}

export async function deleteLot(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("pantry_lots").delete().eq("id", id);
  if (error) throw error;
}

export interface LotPatch {
  quantity_remaining?: number;
  expires_on?: Date | null;
  storage_state?: StorageState;
  notes?: string | null;
}

export async function updateLot(
  supabase: SupabaseClient,
  id: string,
  patch: LotPatch,
): Promise<PantryLot> {
  const update: Record<string, unknown> = {};
  if (patch.quantity_remaining !== undefined) {
    update.quantity_remaining = patch.quantity_remaining;
    if (patch.quantity_remaining === 0) update.is_depleted = true;
  }
  if (patch.expires_on !== undefined) {
    update.expires_on = patch.expires_on ? formatDate(patch.expires_on) : null;
  }
  if (patch.storage_state !== undefined) update.storage_state = patch.storage_state;
  if (patch.notes !== undefined) update.notes = patch.notes;

  const { data, error } = await supabase
    .from("pantry_lots")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return toPantryLot(data as PantryLotRow);
}

/** Computes expires_on = acquired_on + shelf_life_<storage>_days, or null if not set. */
export function computeExpires(
  acquired_on: Date,
  storage_state: StorageState,
  ingredient: Ingredient,
): Date | null {
  const days =
    storage_state === "frozen"
      ? ingredient.shelf_life_freezer_days
      : storage_state === "refrigerated"
        ? ingredient.shelf_life_fridge_days
        : ingredient.shelf_life_pantry_days;
  if (days == null) return null;
  const out = new Date(acquired_on);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}
