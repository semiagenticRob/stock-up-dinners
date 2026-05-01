import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CostcoSKU,
  PantryParOverride,
  SkuIngredientMapping,
} from "@/lib/types";

export async function loadParOverrides(
  supabase: SupabaseClient,
): Promise<PantryParOverride[]> {
  const { data, error } = await supabase
    .from("pantry_par_overrides")
    .select("ingredient_id, par_quantity, threshold_pct");
  if (error) throw error;
  return (data ?? []) as PantryParOverride[];
}

export async function loadSkusAndMappings(
  supabase: SupabaseClient,
): Promise<{ skus: CostcoSKU[]; mappings: SkuIngredientMapping[] }> {
  const [skuRes, mapRes] = await Promise.all([
    supabase.from("costco_skus").select("id, display_name, category, is_active").eq("is_active", true),
    supabase.from("sku_ingredient_mappings").select("sku_id, ingredient_id, quantity"),
  ]);
  if (skuRes.error) throw skuRes.error;
  if (mapRes.error) throw mapRes.error;
  return {
    skus: (skuRes.data ?? []) as CostcoSKU[],
    mappings: (mapRes.data ?? []) as SkuIngredientMapping[],
  };
}
