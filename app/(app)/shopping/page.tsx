import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadSkusAndMappings } from "@/lib/db/shopping";
import { LiveShopping } from "@/components/app/LiveShopping";
import "./shopping.css";

export default async function ShoppingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Pre-load: catalog (for ingredient names + SKU display), SKUs + mappings,
  // and the user's existing open session if any.
  const [catalog, skuData, sessionRes] = await Promise.all([
    loadCatalog(supabase),
    loadSkusAndMappings(supabase),
    supabase
      .from("shopping_sessions")
      .select("id, started_at, committed_at")
      .is("committed_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

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
    <LiveShopping
      ingredients={catalog.ingredients}
      skus={skuData.skus}
      skuMappings={skuData.mappings}
      initialSessionId={sessionRes.data?.id ?? null}
      initialItems={initialItems}
    />
  );
}
