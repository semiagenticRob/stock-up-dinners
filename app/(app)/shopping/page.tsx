import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadActivePantry } from "@/lib/db/pantry";
import { loadPreferences } from "@/lib/db/preferences";
import { loadParOverrides, loadSkusAndMappings } from "@/lib/db/shopping";
import { computeShoppingList } from "@/lib/shopping-list/compute";
import { LiveShoppingChecklist } from "@/components/app/LiveShoppingChecklist";
import "./shopping.css";

export default async function ShoppingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Everything the shopping list compute needs, plus an existing open session
  // (if any) so we can resume a trip in progress.
  const [catalog, pantry, preferences, parOverrides, skuData, sessionRes] = await Promise.all([
    loadCatalog(supabase),
    loadActivePantry(supabase),
    loadPreferences(supabase),
    loadParOverrides(supabase),
    loadSkusAndMappings(supabase),
    supabase
      .from("shopping_sessions")
      .select("id, started_at, committed_at")
      .is("committed_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const shoppingList = computeShoppingList({
    pantry,
    ingredients: catalog.ingredients,
    parOverrides,
    skus: skuData.skus,
    skuMappings: skuData.mappings,
    recipes: catalog.recipes,
    preferences,
  });

  const initialItems = sessionRes.data
    ? (
        await supabase
          .from("shopping_session_items")
          .select("id, ingredient_id, source_sku_id, quantity")
          .eq("session_id", sessionRes.data.id)
          .order("created_at", { ascending: true })
      ).data ?? []
    : [];

  return (
    <LiveShoppingChecklist
      ingredients={catalog.ingredients}
      skus={skuData.skus}
      skuMappings={skuData.mappings}
      shoppingList={shoppingList.items}
      shoppingListGroups={shoppingList.groups}
      initialSessionId={sessionRes.data?.id ?? null}
      initialItems={initialItems}
    />
  );
}
