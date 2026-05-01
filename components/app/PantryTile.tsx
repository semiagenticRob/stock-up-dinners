"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Ingredient, PantryLot } from "@/lib/types";
import { formatPantryQuantity } from "@/lib/format-quantity";

interface Props {
  ingredient: Ingredient;
  lots: PantryLot[];
  totalRemaining: number;
  par: number;
  thresholdPct: number;
  earliestExpires: Date | null;
  useSoonMs: number;
  now: number;
}

export function PantryTile({
  ingredient,
  lots,
  totalRemaining,
  par,
  thresholdPct,
  earliestExpires,
  useSoonMs,
  now,
}: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [busyLotId, setBusyLotId] = useState<string | null>(null);
  const [adjustingLotId, setAdjustingLotId] = useState<string | null>(null);
  const [adjustValue, setAdjustValue] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  const pct = par > 0 ? Math.min(100, Math.round((totalRemaining / par) * 100)) : 0;
  const belowThreshold = par > 0 && totalRemaining / par < thresholdPct / 100;
  const soonMs = earliestExpires ? earliestExpires.getTime() - now : Infinity;
  const expiringSoon = soonMs <= useSoonMs;
  const expired = soonMs < 0;

  const tileClass = [
    "p-tile",
    belowThreshold && "p-tile--low",
    expiringSoon && !expired && "p-tile--soon",
    expired && "p-tile--expired",
  ]
    .filter(Boolean)
    .join(" ");

  async function deleteLot(id: string) {
    if (busyLotId) return;
    if (!confirm("Delete this lot?")) return;
    setBusyLotId(id);
    try {
      const res = await fetch(`/api/pantry/lots/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        alert(`Delete failed: ${text || res.statusText}`);
        return;
      }
      router.refresh();
      // If we just deleted the last lot for this ingredient, the dialog
      // contents will disappear on the next render — close it gracefully.
      if (lots.length === 1) setOpen(false);
    } finally {
      setBusyLotId(null);
    }
  }

  function startAdjust(lot: PantryLot) {
    setAdjustingLotId(lot.id);
    setAdjustValue(lot.quantity_remaining);
  }

  async function commitAdjust(lot: PantryLot) {
    if (busyLotId) return;
    if (adjustValue === lot.quantity_remaining) {
      setAdjustingLotId(null);
      return;
    }
    setBusyLotId(lot.id);
    try {
      const res = await fetch(`/api/pantry/lots/${lot.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity_remaining: adjustValue }),
      });
      if (!res.ok) {
        alert(`Adjust failed: ${await res.text()}`);
        return;
      }
      setAdjustingLotId(null);
      // If the lot was zeroed out, it'll disappear from the active pantry
      // query on next render. The user is left looking at the dialog with
      // one fewer lot — that's fine.
      router.refresh();
    } finally {
      setBusyLotId(null);
    }
  }

  return (
    <>
      <button type="button" className={tileClass} onClick={() => setOpen(true)}>
        <div
          className={`p-tile__media p-tile__media--${ingredient.category}`}
          aria-hidden="true"
          style={{ backgroundImage: `url(/images/ingredients/${ingredient.slug}.jpg)` }}
        />

        <div className="p-tile__body">
          <h3 className="p-tile__name">{ingredient.display_name}</h3>
          <div
            className="p-tile__bar"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="p-tile__bar-fill" style={{ width: `${pct}%` }} />
            <div
              className="p-tile__bar-threshold"
              style={{ left: `${thresholdPct}%` }}
              aria-label={`Repurchase threshold ${thresholdPct}%`}
            />
          </div>
          <div className="p-tile__meta">
            <span className="p-tile__qty">
              {formatPantryQuantity(totalRemaining, ingredient.canonical_unit)}
            </span>
            <span className="p-tile__pct">{pct}%</span>
          </div>
          {expiringSoon && earliestExpires && (
            <p className="p-tile__expires">
              {expired ? "Expired " : "Expires "}
              {formatExpires(earliestExpires, now)}
            </p>
          )}
        </div>
      </button>

      <dialog
        ref={dialogRef}
        className="p-tile-dlg"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Backdrop click → close (the panel stops propagation).
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div
          className="p-tile-dlg__panel"
          role="document"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="p-tile-dlg__head">
            <div>
              <h2>{ingredient.display_name}</h2>
              <p className="p-tile-dlg__subtitle">
                {lots.length} {lots.length === 1 ? "lot" : "lots"}
                {par > 0 && (
                  <>
                    {" · Par "}
                    <strong>{formatPantryQuantity(par, ingredient.canonical_unit)}</strong>
                    {" · Threshold "}
                    {thresholdPct}%
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              className="p-tile-dlg__close"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <div className="p-tile-dlg__summary">
            <div className="p-tile__bar p-tile__bar--lg">
              <div className="p-tile__bar-fill" style={{ width: `${pct}%` }} />
              <div
                className="p-tile__bar-threshold"
                style={{ left: `${thresholdPct}%` }}
                aria-hidden="true"
              />
            </div>
            <div className="p-tile-dlg__totals">
              <span className="p-tile-dlg__total-qty">
                {formatPantryQuantity(totalRemaining, ingredient.canonical_unit)}
              </span>
              <span className="p-tile-dlg__total-pct">{pct}% of par</span>
            </div>
          </div>

          <h3 className="p-tile-dlg__section-head">Lots</h3>
          <ul className="p-tile-dlg__lots">
            {lots.map((lot) => {
              const isAdjusting = adjustingLotId === lot.id;
              const isAnotherAdjusting =
                adjustingLotId !== null && adjustingLotId !== lot.id;
              const displayQty = isAdjusting ? adjustValue : lot.quantity_remaining;
              return (
                <li key={lot.id} className={`p-tile-dlg__lot ${isAdjusting ? "p-tile-dlg__lot--adjusting" : ""}`}>
                  <div className="p-tile-dlg__lot-main">
                    <span className="p-tile-dlg__lot-qty">
                      {formatPantryQuantity(displayQty, ingredient.canonical_unit)}
                      {lot.quantity_initial !== displayQty && (
                        <span className="p-tile-dlg__lot-of">
                          {" / "}
                          {formatPantryQuantity(lot.quantity_initial, ingredient.canonical_unit)}
                        </span>
                      )}
                    </span>
                    <span className={`storage-chip storage-chip--${lot.storage_state}`}>
                      {lot.storage_state}
                    </span>
                  </div>
                  <div className="p-tile-dlg__lot-meta">
                    <span>Acquired {fmtShort(lot.acquired_on)}</span>
                    {lot.expires_on && (
                      <span className={expClass(lot.expires_on, useSoonMs, now)}>
                        Expires {fmtShort(lot.expires_on)}
                      </span>
                    )}
                  </div>
                  <div className="p-tile-dlg__lot-actions">
                    {isAdjusting ? (
                      <button
                        type="button"
                        className="btn-pill btn-pill--accent"
                        disabled={busyLotId === lot.id}
                        onClick={() => commitAdjust(lot)}
                      >
                        {busyLotId === lot.id ? "…" : "Done"}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-pill"
                          disabled={isAnotherAdjusting || busyLotId === lot.id}
                          onClick={() => startAdjust(lot)}
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          className="lot-delete"
                          disabled={isAnotherAdjusting || busyLotId === lot.id}
                          onClick={() => deleteLot(lot.id)}
                        >
                          {busyLotId === lot.id ? "…" : "Delete"}
                        </button>
                      </>
                    )}
                  </div>
                  {isAdjusting && (
                    <div className="p-tile-dlg__lot-slider">
                      <input
                        type="range"
                        min={0}
                        max={lot.quantity_initial}
                        step={sliderStep(ingredient.canonical_unit, lot.quantity_initial)}
                        value={adjustValue}
                        onChange={(e) => setAdjustValue(Number(e.target.value))}
                        aria-label={`Adjust ${ingredient.display_name}`}
                        style={{
                          ["--pct" as string]:
                            lot.quantity_initial > 0
                              ? Math.round((adjustValue / lot.quantity_initial) * 100)
                              : 0,
                        }}
                      />
                      <span className="p-tile-dlg__slider-readout">
                        {formatPantryQuantity(adjustValue, ingredient.canonical_unit)}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </>
  );
}

/**
 * Pick a slider step that gives ~100 detents along the range, snapping to
 * a sensible cooking-unit increment.
 */
function sliderStep(unit: "grams" | "milliliters" | "count", initial: number): number {
  if (unit === "count") return 1;
  // Aim for roughly 1% of total but never finer than these floors.
  const target = Math.max(1, Math.round(initial / 100));
  if (unit === "grams") {
    if (target >= 50) return 50; // ~50g ≈ 0.1 lb
    if (target >= 14) return 14; // ~½ oz
    if (target >= 5) return 5;
    return 1;
  }
  if (unit === "milliliters") {
    if (target >= 30) return 30; // ~1 fl oz
    if (target >= 15) return 15; // ~1 tbsp
    if (target >= 5) return 5;
    return 1;
  }
  return 1;
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

function formatExpires(d: Date, now: number): string {
  const days = Math.round((d.getTime() - now) / (24 * 60 * 60 * 1000));
  if (days < 0) return Math.abs(days) === 1 ? "yesterday" : `${Math.abs(days)} days ago`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}
