"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CostcoSKU, Ingredient, SkuIngredientMapping } from "@/lib/types";

interface SessionItem {
  id: string;
  ingredient_id: string;
  source_sku_id: string | null;
  quantity: number;
}

interface Props {
  ingredients: Ingredient[];
  skus: CostcoSKU[];
  skuMappings: SkuIngredientMapping[];
  initialSessionId: string | null;
  initialItems: SessionItem[];
}

export function LiveShopping({
  ingredients,
  skus,
  skuMappings,
  initialSessionId,
  initialItems,
}: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [items, setItems] = useState<SessionItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ingById = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i] as const)),
    [ingredients],
  );
  const skuById = useMemo(() => new Map(skus.map((s) => [s.id, s] as const)), [skus]);

  // Index SKUs by primary ingredient (largest pack quantity wins).
  const primarySkuByIngredient = useMemo(() => {
    const m = new Map<string, { sku: CostcoSKU; quantity: number }>();
    for (const map of skuMappings) {
      const sku = skuById.get(map.sku_id);
      if (!sku || !sku.is_active) continue;
      const cur = m.get(map.ingredient_id);
      if (!cur || map.quantity > cur.quantity) {
        m.set(map.ingredient_id, { sku, quantity: map.quantity });
      }
    }
    return m;
  }, [skuMappings, skuById]);

  const searchLower = search.toLowerCase().trim();
  const results = useMemo(() => {
    if (!searchLower) return [];
    return ingredients
      .filter((i) => !i.is_assumed_staple)
      .filter((i) => i.display_name.toLowerCase().includes(searchLower))
      .slice(0, 12);
  }, [ingredients, searchLower]);

  // Quick-tap: top-12 most "shoppable" staples = first 12 by display_name with a SKU mapping.
  const quick = useMemo(
    () =>
      ingredients
        .filter((i) => !i.is_assumed_staple && primarySkuByIngredient.has(i.id))
        .sort((a, b) => a.display_name.localeCompare(b.display_name))
        .slice(0, 12),
    [ingredients, primarySkuByIngredient],
  );

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/shopping/sessions", { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    const body = (await res.json()) as { session_id: string };
    setSessionId(body.session_id);
    return body.session_id;
  }

  async function addItem(ingredient: Ingredient) {
    setBusy(true);
    setError(null);
    try {
      const sid = await ensureSession();
      const sku = primarySkuByIngredient.get(ingredient.id);
      const quantity = sku ? sku.quantity : 1;
      const res = await fetch(`/api/shopping/sessions/${sid}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ingredient_id: ingredient.id,
          source_sku_id: sku?.sku.id ?? null,
          quantity,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as { item: SessionItem };
      setItems((prev) => {
        const ix = prev.findIndex((i) => i.id === body.item.id);
        if (ix >= 0) {
          const next = [...prev];
          next[ix] = body.item;
          return next;
        }
        return [...prev, body.item];
      });
      setSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  async function setQty(item: SessionItem, q: number) {
    if (!sessionId) return;
    if (q <= 0) {
      await removeItem(item);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping/sessions/${sessionId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quantity: q }),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as { item: SessionItem };
      setItems((prev) => prev.map((it) => (it.id === item.id ? body.item : it)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(item: SessionItem) {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping/sessions/${sessionId}/items/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!sessionId || items.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping/sessions/${sessionId}/commit`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/pantry");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
      setBusy(false);
    }
  }

  // Keep document.title aware of pending state for tab visibility while shopping.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.title;
    if (items.length > 0) document.title = `(${items.length}) Live shopping — Stock Up Dinners`;
    return () => {
      document.title = original;
    };
  }, [items.length]);

  return (
    <div className="live-shop">
      <div className="live-shop__head">
        <div>
          <h1>Live shopping</h1>
          <p className="live-shop__sub">
            {items.length} {items.length === 1 ? "item" : "items"} ·{" "}
            {sessionId ? "Resuming session" : "New session"}
          </p>
        </div>
      </div>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="live-shop__search">
        <input
          type="search"
          placeholder="What did you grab?"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {results.length > 0 && (
        <ul className="live-shop__results" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {results.map((i) => {
            const sku = primarySkuByIngredient.get(i.id);
            return (
              <li key={i.id} className="live-shop__result" onClick={() => addItem(i)}>
                <div>
                  <div className="live-shop__result__name">{i.display_name}</div>
                  {sku && (
                    <div className="live-shop__result__sub">
                      {sku.sku.display_name} ({sku.quantity} {i.canonical_unit}/pack)
                    </div>
                  )}
                </div>
                <span className="live-shop__result__add">Add +</span>
              </li>
            );
          })}
        </ul>
      )}

      {!searchLower && quick.length > 0 && (
        <>
          <h3
            style={{
              fontFamily: "var(--f-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--c-muted)",
              margin: "0 0 8px",
            }}
          >
            Quick add
          </h3>
          <div className="live-shop__quick">
            {quick.map((i) => {
              const sku = primarySkuByIngredient.get(i.id);
              return (
                <button key={i.id} type="button" onClick={() => addItem(i)} disabled={busy}>
                  {i.display_name}
                  {sku && (
                    <span className="live-shop__quick__sub">
                      {sku.quantity} {i.canonical_unit}/pack
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="live-shop__cart">
        <h2>This trip</h2>
        {items.length === 0 ? (
          <div className="live-shop__cart-empty">Search or tap a quick-add to start.</div>
        ) : (
          items.map((item) => {
            const ing = ingById.get(item.ingredient_id);
            const sku = item.source_sku_id ? skuById.get(item.source_sku_id) : null;
            const packQty = sku
              ? skuMappings.find(
                  (m) => m.sku_id === sku.id && m.ingredient_id === item.ingredient_id,
                )?.quantity ?? null
              : null;
            const packCount = packQty ? Math.round(item.quantity / packQty) : null;
            return (
              <div key={item.id} className="live-shop__line">
                <div>
                  <div className="live-shop__line__name">
                    {sku?.display_name ?? ing?.display_name ?? "(unknown)"}
                  </div>
                  <div className="live-shop__line__sub">
                    {item.quantity} {ing?.canonical_unit}
                    {packCount && packQty ? ` · ${packCount} pack${packCount > 1 ? "s" : ""}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className="live-shop__step"
                  aria-label="Decrease"
                  disabled={busy}
                  onClick={() => setQty(item, item.quantity - (packQty ?? 1))}
                >
                  −
                </button>
                <span className="live-shop__line__qty">
                  {packCount ?? item.quantity}
                </span>
                <button
                  type="button"
                  className="live-shop__step"
                  aria-label="Increase"
                  disabled={busy}
                  onClick={() => setQty(item, item.quantity + (packQty ?? 1))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="live-shop__line__remove"
                  aria-label="Remove"
                  disabled={busy}
                  onClick={() => removeItem(item)}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="live-shop__commit">
        <button
          type="button"
          className="btn"
          disabled={busy || items.length === 0}
          onClick={commit}
        >
          {busy ? "Saving…" : `Done — add ${items.length} to pantry`}
        </button>
      </div>
    </div>
  );
}
