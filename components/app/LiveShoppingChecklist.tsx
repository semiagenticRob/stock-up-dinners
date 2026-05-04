"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CostcoSKU, Ingredient, SkuIngredientMapping, StorageState } from "@/lib/types";
import type { ShoppingListGroup, ShoppingListItem } from "@/lib/shopping-list/compute";
import {
  resolveAddQuantity,
  ResolveAddQuantityError,
} from "@/lib/shopping-list/resolve-add-quantity";

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
  shoppingList: ShoppingListItem[];
  shoppingListGroups: ShoppingListGroup[];
  initialSessionId: string | null;
  initialItems: SessionItem[];
}

const CATEGORY_LABELS: Record<StorageState, string> = {
  refrigerated: "Refrigerated",
  frozen: "Frozen",
  pantry: "Pantry",
};

export function LiveShoppingChecklist({
  ingredients,
  skus,
  skuMappings,
  shoppingList,
  shoppingListGroups,
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

  // Largest pack per ingredient.
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

  // Index session items by ingredient_id for quick checked-state lookup.
  const sessionByIngredient = useMemo(() => {
    const m = new Map<string, SessionItem>();
    for (const i of items) m.set(i.ingredient_id, i);
    return m;
  }, [items]);

  // Set of ingredient IDs that are on the shopping list.
  const onListIngredientIds = useMemo(
    () => new Set(shoppingList.map((it) => it.ingredient_id)),
    [shoppingList],
  );

  // Off-list = items in cart that aren't on the shopping list.
  const offListItems = useMemo(
    () => items.filter((i) => !onListIngredientIds.has(i.ingredient_id)),
    [items, onListIngredientIds],
  );

  const checkedFromList = useMemo(
    () => shoppingList.filter((it) => sessionByIngredient.has(it.ingredient_id)).length,
    [shoppingList, sessionByIngredient],
  );

  // Search-driven add: only ingredients NOT already on the list AND NOT
  // already in the session (so we don't suggest dupes).
  const searchLower = search.toLowerCase().trim();
  const searchResults = useMemo(() => {
    if (!searchLower) return [];
    return ingredients
      .filter((i) => !i.is_assumed_staple)
      .filter((i) => !sessionByIngredient.has(i.id))
      .filter((i) => i.display_name.toLowerCase().includes(searchLower))
      .slice(0, 8);
  }, [ingredients, searchLower, sessionByIngredient]);

  async function ensureSession(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/shopping/sessions", { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    const body = (await res.json()) as { session_id: string };
    setSessionId(body.session_id);
    return body.session_id;
  }

  // Index shopping list items by ingredient_id so addToCart can pull the
  // user's pre-computed `suggested_quantity` (par − current) when the
  // ingredient has no SKU mapping.
  const listItemByIngredient = useMemo(() => {
    const m = new Map<string, ShoppingListItem>();
    for (const it of shoppingList) m.set(it.ingredient_id, it);
    return m;
  }, [shoppingList]);

  async function addToCart(ingredient: Ingredient) {
    setBusy(true);
    setError(null);
    try {
      const sid = await ensureSession();
      const sku = primarySkuByIngredient.get(ingredient.id);
      const listItem = listItemByIngredient.get(ingredient.id);

      let resolved;
      try {
        resolved = resolveAddQuantity(ingredient, listItem, sku);
      } catch (err) {
        if (err instanceof ResolveAddQuantityError) {
          // Surface the failure rather than silently writing a phantom 1.
          setError(err.message);
          return;
        }
        throw err;
      }

      const res = await fetch(`/api/shopping/sessions/${sid}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ingredient_id: ingredient.id,
          source_sku_id: sku?.sku.id ?? null,
          quantity: resolved.quantity,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = (await res.json()) as { item: SessionItem };
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === body.item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = body.item;
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

  async function removeFromCart(item: SessionItem) {
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

  async function toggle(ingredient: Ingredient) {
    const existing = sessionByIngredient.get(ingredient.id);
    if (existing) {
      await removeFromCart(existing);
    } else {
      await addToCart(ingredient);
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

  // Reflect cart count in tab title for tab-switching during shopping.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const original = document.title;
    if (items.length > 0) {
      document.title = `(${items.length}) Live shopping — Stock Up Dinners`;
    }
    return () => {
      document.title = original;
    };
  }, [items.length]);

  const totalChecked = items.length;

  return (
    <div className="ls">
      <header className="ls__head">
        <div>
          <h1>Live shopping</h1>
          <p className="ls__sub">
            {shoppingList.length > 0 ? (
              <>
                {checkedFromList} of {shoppingList.length} from your list
                {offListItems.length > 0 && ` · +${offListItems.length} extra`}
              </>
            ) : (
              <>
                {totalChecked} {totalChecked === 1 ? "item" : "items"} in cart
              </>
            )}
          </p>
        </div>
      </header>

      {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* ----- Search to add an off-list item ----- */}
      <div className="ls__search">
        <input
          type="search"
          placeholder="Add another item not on your list…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {searchResults.length > 0 && (
        <ul className="ls__results">
          {searchResults.map((i) => (
            <li
              key={i.id}
              className="ls__result"
              onClick={() => addToCart(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && addToCart(i)}
            >
              <span>{i.display_name}</span>
              <span className="ls__result__add">Add +</span>
            </li>
          ))}
        </ul>
      )}

      {/* ----- Primary: shopping list as a checkbox list, grouped by category ----- */}
      {shoppingList.length === 0 ? (
        <div className="app-stub">
          <p className="eyebrow">Nothing on your list</p>
          <h2>Your pantry is well stocked.</h2>
          <p>
            Use the search above to add items if you&apos;re grabbing extras while you&apos;re at
            Costco anyway.
          </p>
        </div>
      ) : (
        shoppingListGroups.map((group) => (
          <section key={group.key} className="ls-section">
            <h2 className="ls-section__head">
              {CATEGORY_LABELS[group.key]}
              <span className="ls-section__count">
                {group.items.filter((it) => sessionByIngredient.has(it.ingredient_id)).length}
                {" / "}
                {group.items.length}
              </span>
            </h2>
            <ul className="ls-rows">
              {group.items.map((it) => {
                const ing = ingById.get(it.ingredient_id);
                if (!ing) return null;
                const checked = sessionByIngredient.has(it.ingredient_id);
                return (
                  <li
                    key={it.ingredient_id}
                    className={`ls-row ${checked ? "ls-row--checked" : ""}`}
                  >
                    <button
                      type="button"
                      className="ls-row__btn"
                      role="checkbox"
                      aria-checked={checked}
                      disabled={busy}
                      onClick={() => toggle(ing)}
                    >
                      <span className={`ls-check ${checked ? "ls-check--on" : ""}`} aria-hidden="true">
                        {checked && "✓"}
                      </span>
                      <span
                        className="ls-row__media"
                        style={{ backgroundImage: `url(/images/ingredients/${it.ingredient_slug}.jpg)` }}
                        aria-hidden="true"
                      />
                      <span className="ls-row__name">
                        {it.sku_display_name ?? it.ingredient_display_name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {/* ----- Off-list items: shown only when the user added something via search ----- */}
      {offListItems.length > 0 && (
        <section className="ls-section">
          <h2 className="ls-section__head">
            Extras this trip
            <span className="ls-section__count">
              {offListItems.length} {offListItems.length === 1 ? "item" : "items"}
            </span>
          </h2>
          <ul className="ls-rows">
            {offListItems.map((item) => {
              const ing = ingById.get(item.ingredient_id);
              if (!ing) return null;
              return (
                <li key={item.id} className="ls-row ls-row--checked">
                  <button
                    type="button"
                    className="ls-row__btn"
                    role="checkbox"
                    aria-checked={true}
                    disabled={busy}
                    onClick={() => removeFromCart(item)}
                  >
                    <span className="ls-check ls-check--on" aria-hidden="true">✓</span>
                    <span
                      className="ls-row__media"
                      style={{ backgroundImage: `url(/images/ingredients/${ing.slug}.jpg)` }}
                      aria-hidden="true"
                    />
                    <span className="ls-row__name">{ing.display_name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="ls__commit">
        <button
          type="button"
          className="btn"
          disabled={busy || totalChecked === 0}
          onClick={commit}
        >
          {busy
            ? "Saving…"
            : totalChecked === 0
              ? "Check items as you grab them"
              : `Submit — add ${totalChecked} to pantry`}
        </button>
      </div>
    </div>
  );
}
