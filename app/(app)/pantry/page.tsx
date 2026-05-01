import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadCatalog } from "@/lib/db/catalog";
import { loadActivePantry } from "@/lib/db/pantry";
import { loadPreferences } from "@/lib/db/preferences";
import { DeleteLotButton } from "@/components/app/DeleteLotButton";
import "./pantry.css";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export default async function PantryPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [catalog, lots, preferences] = await Promise.all([
    loadCatalog(supabase),
    loadActivePantry(supabase),
    loadPreferences(supabase),
  ]);

  const ingById = new Map(catalog.ingredients.map((i) => [i.id, i] as const));

  // Group by ingredient, retain lot order (already sorted by expires_on ASC).
  const grouped = new Map<string, typeof lots>();
  for (const lot of lots) {
    if (!grouped.has(lot.ingredient_id)) grouped.set(lot.ingredient_id, []);
    grouped.get(lot.ingredient_id)!.push(lot);
  }

  // Server-component render: Date.now() is intentional per-request.
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
            {lots.length} {lots.length === 1 ? "lot" : "lots"} across{" "}
            {grouped.size} {grouped.size === 1 ? "ingredient" : "ingredients"}
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
        </div>
      )}

      {lots.length === 0 ? (
        <div className="app-stub">
          <p className="eyebrow">Empty pantry</p>
          <h1>Add your first lot.</h1>
          <p>Manual entry now; live shopping mode and receipt scan land in M4 and v1.1.</p>
          <p style={{ marginTop: 16 }}>
            <Link href="/pantry/add" className="btn">
              Add a lot
            </Link>
          </p>
        </div>
      ) : (
        <ul className="ing-list">
          {[...grouped.entries()]
            .sort((a, b) => {
              const aE = a[1][0].expires_on?.getTime() ?? Number.POSITIVE_INFINITY;
              const bE = b[1][0].expires_on?.getTime() ?? Number.POSITIVE_INFINITY;
              return aE - bE;
            })
            .map(([ingId, ingLots]) => {
              const ing = ingById.get(ingId);
              const total = ingLots.reduce((sum, l) => sum + l.quantity_remaining, 0);
              return (
                <li key={ingId} className="ing-row">
                  <details>
                    <summary className="ing-row__head">
                      <span className="ing-row__name">{ing?.display_name ?? "(unknown)"}</span>
                      <span className="ing-row__qty">
                        {total} {ing?.canonical_unit ?? "units"}
                      </span>
                      <span className="ing-row__count">
                        {ingLots.length} {ingLots.length === 1 ? "lot" : "lots"}
                      </span>
                    </summary>
                    <ul className="lot-list">
                      {ingLots.map((lot) => (
                        <li key={lot.id} className="lot-row">
                          <div>
                            <span className="lot-row__qty">
                              {lot.quantity_remaining} / {lot.quantity_initial}
                            </span>
                            <span className={`storage-chip storage-chip--${lot.storage_state}`}>
                              {lot.storage_state}
                            </span>
                          </div>
                          <div className="lot-row__dates">
                            <span>Acquired {fmtShort(lot.acquired_on)}</span>
                            {lot.expires_on && (
                              <span className={expClass(lot.expires_on, useSoonMs, now)}>
                                Expires {fmtShort(lot.expires_on)}
                              </span>
                            )}
                          </div>
                          <DeleteLotButton id={lot.id} />
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
        </ul>
      )}
    </>
  );
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function expClass(d: Date, useSoonMs: number, now: number): string {
  const remaining = d.getTime() - now;
  if (remaining < 0) return "exp exp--past";
  if (remaining <= useSoonMs) return "exp exp--soon";
  if (remaining <= useSoonMs * 2) return "exp exp--warn";
  return "exp";
}
