import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadActivePantry } from "@/lib/db/pantry";
import { loadPreferences } from "@/lib/db/preferences";
import { loadParOverrides, loadSkusAndMappings } from "@/lib/db/shopping";
import { computeShoppingList } from "@/lib/shopping-list/compute";
import "./shopping-list.css";

export default async function ShoppingListPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [catalog, pantry, preferences, parOverrides, skuData] = await Promise.all([
    loadCatalog(supabase),
    loadActivePantry(supabase),
    loadPreferences(supabase),
    loadParOverrides(supabase),
    loadSkusAndMappings(supabase),
  ]);

  const result = computeShoppingList({
    pantry,
    ingredients: catalog.ingredients,
    parOverrides,
    skus: skuData.skus,
    skuMappings: skuData.mappings,
    recipes: catalog.recipes,
    preferences,
  });

  return (
    <>
      <div className="pantry-head">
        <div>
          <h1>Shopping list</h1>
          <p className="pantry-subtitle">
            Auto-updated. {result.items.length}{" "}
            {result.items.length === 1 ? "item" : "items"} below threshold.
          </p>
        </div>
        <Link href="/shopping" className="btn">
          Start live shopping
        </Link>
      </div>

      {result.items.length === 0 ? (
        <div className="app-stub">
          <p className="eyebrow">Nothing to buy</p>
          <h1>Pantry is well-stocked.</h1>
          <p>
            Your shopping list is computed live from current pantry levels and your par/threshold
            settings. When a staple drops below threshold, it&apos;ll show up here automatically.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link href="/settings">Adjust par levels in Settings →</Link>
          </p>
        </div>
      ) : (
        result.groups.map((group) => (
          <section key={group.key} className="shop-group">
            <h2>{group.label}</h2>
            <ul className="shop-list">
              {group.items.map((it) => (
                <li key={it.ingredient_id} className="shop-row">
                  <div className="shop-row__main">
                    <h3>{it.sku_display_name ?? it.ingredient_display_name}</h3>
                    {it.sku_display_name && (
                      <p className="shop-row__sub">for {it.ingredient_display_name}</p>
                    )}
                    <p className="shop-row__why">{it.why}</p>
                  </div>
                  <p className="shop-row__qty">
                    +{it.suggested_quantity}{" "}
                    <span className="shop-row__unit">
                      {catalog.ingredients.find((i) => i.id === it.ingredient_id)?.canonical_unit ??
                        ""}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
