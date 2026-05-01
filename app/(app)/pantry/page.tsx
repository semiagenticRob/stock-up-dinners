import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadActivePantry } from "@/lib/db/pantry";
import { loadPreferences } from "@/lib/db/preferences";
import { loadParOverrides } from "@/lib/db/shopping";
import { PantryTile } from "@/components/app/PantryTile";
import type { Ingredient, PantryLot } from "@/lib/types";
import "./pantry.css";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Display order for category groupings. Mirrors the v1 Costco staple list. */
const CATEGORY_ORDER = [
  "protein",
  "canned",
  "grain",
  "oil_condiment",
  "dairy",
  "frozen",
  "produce",
] as const;
const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins",
  canned: "Canned goods",
  grain: "Grains & pasta",
  oil_condiment: "Oils & seasonings",
  dairy: "Dairy",
  frozen: "Frozen",
  produce: "Produce",
};

interface TileEntry {
  ingredient: Ingredient;
  lots: PantryLot[];
  totalRemaining: number;
  par: number;
  thresholdPct: number;
  earliestExpires: Date | null;
}

export default async function PantryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [catalog, lots, preferences, parOverrides] = await Promise.all([
    loadCatalog(supabase),
    loadActivePantry(supabase),
    loadPreferences(supabase),
    loadParOverrides(supabase),
  ]);

  const ingById = new Map(catalog.ingredients.map((i) => [i.id, i] as const));
  const overrideById = new Map(parOverrides.map((o) => [o.ingredient_id, o]));

  // Group lots by ingredient_id and compute per-tile totals.
  const tiles = new Map<string, TileEntry>();
  for (const lot of lots) {
    const ing = ingById.get(lot.ingredient_id);
    if (!ing) continue;
    let entry = tiles.get(lot.ingredient_id);
    if (!entry) {
      const o = overrideById.get(ing.id);
      entry = {
        ingredient: ing,
        lots: [],
        totalRemaining: 0,
        par: o?.par_quantity ?? ing.default_par ?? 0,
        thresholdPct: o?.threshold_pct ?? preferences.default_threshold_pct,
        earliestExpires: null,
      };
      tiles.set(lot.ingredient_id, entry);
    }
    entry.lots.push(lot);
    entry.totalRemaining += lot.quantity_remaining;
    if (
      lot.expires_on &&
      (entry.earliestExpires == null || lot.expires_on < entry.earliestExpires)
    ) {
      entry.earliestExpires = lot.expires_on;
    }
  }

  // Bucket tiles by category, then within each bucket: expiring soonest first,
  // then alphabetical.
  const byCategory = new Map<string, TileEntry[]>();
  for (const tile of tiles.values()) {
    const key = tile.ingredient.category;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(tile);
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => {
      const aT = a.earliestExpires?.getTime() ?? Number.POSITIVE_INFINITY;
      const bT = b.earliestExpires?.getTime() ?? Number.POSITIVE_INFINITY;
      if (aT !== bT) return aT - bT;
      return a.ingredient.display_name.localeCompare(b.ingredient.display_name);
    });
  }
  const sections = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)).map(
      (c) => [c, byCategory.get(c)!] as const,
    ),
    // Any unrecognized categories tail-appended in alphabetical order.
    ...[...byCategory.keys()]
      .filter((c) => !CATEGORY_ORDER.includes(c as (typeof CATEGORY_ORDER)[number]))
      .sort()
      .map((c) => [c, byCategory.get(c)!] as const),
  ];

  // Server-component render: per-request Date.now() is intentional.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const useSoonMs = preferences.use_soon_threshold_days * MS_PER_DAY;
  const expiringSoon = lots.filter(
    (l) => l.expires_on && l.expires_on.getTime() - now <= useSoonMs,
  );

  return (
    <>
      <div className="pantry-head">
        <div>
          <h1>Pantry</h1>
          <p className="pantry-subtitle">
            {tiles.size} {tiles.size === 1 ? "ingredient" : "ingredients"} ·{" "}
            {lots.length} {lots.length === 1 ? "lot" : "lots"}
          </p>
        </div>
        <Link href="/pantry/add" className="btn">
          Add a lot
        </Link>
      </div>

      {expiringSoon.length > 0 && (
        <div className="use-soon-banner">
          <strong>Use these soon:</strong>{" "}
          {expiringSoon
            .slice(0, 6)
            .map((l) => {
              const ing = ingById.get(l.ingredient_id);
              const days = Math.max(
                0,
                Math.round((l.expires_on!.getTime() - now) / MS_PER_DAY),
              );
              const dayText = days === 0 ? "today" : days === 1 ? "tomorrow" : `${days}d`;
              return `${ing?.display_name ?? "(unknown)"} (${dayText})`;
            })
            .join(" · ")}
          {expiringSoon.length > 6 && ` · and ${expiringSoon.length - 6} more`}
        </div>
      )}

      {tiles.size === 0 ? (
        <div className="app-stub">
          <p className="eyebrow">Empty pantry</p>
          <h1>Add your first lot.</h1>
          <p>
            Manual entry now. Live shopping mode lands what you bought at Costco; receipt scan
            arrives in v1.1.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link href="/pantry/add" className="btn">
              Add a lot
            </Link>
          </p>
        </div>
      ) : (
        sections.map(([cat, list]) => (
          <section key={cat} className="p-section">
            <h2 className="p-section__head">
              {CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ")}
              <span className="p-section__count">
                {list.length} {list.length === 1 ? "item" : "items"}
              </span>
            </h2>
            <div className="p-grid">
              {list.map((entry) => (
                <PantryTile
                  key={entry.ingredient.id}
                  ingredient={entry.ingredient}
                  lots={entry.lots}
                  totalRemaining={entry.totalRemaining}
                  par={entry.par}
                  thresholdPct={entry.thresholdPct}
                  earliestExpires={entry.earliestExpires}
                  useSoonMs={useSoonMs}
                  now={now}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
