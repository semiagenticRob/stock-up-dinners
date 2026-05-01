/**
 * User preferences read/write. The handle_new_user trigger guarantees a
 * row exists for every authenticated user, so this never returns null.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserPreferences } from "@/lib/types";

const DEFAULTS: UserPreferences = {
  dietary_filters: [],
  blocked_ingredients: [],
  blocked_meats: [],
  allergens: [],
  use_soon_threshold_days: 3,
  default_threshold_pct: 15,
};

export async function loadPreferences(supabase: SupabaseClient): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("dietary_filters, blocked_ingredients, blocked_meats, allergens, use_soon_threshold_days, default_threshold_pct")
    .single();
  if (error) {
    // RLS will return PGRST116 (no rows) if the trigger raced; fall back to defaults.
    if (error.code === "PGRST116") return { ...DEFAULTS };
    throw error;
  }
  return data as UserPreferences;
}
