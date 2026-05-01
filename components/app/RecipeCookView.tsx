"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Ingredient, Recipe, RecipeIngredient } from "@/lib/types";
import type { IngredientMatchStatus, RecipeMatch } from "@/lib/matching/engine";
import { scaleDisplayQuantity } from "@/lib/scale-display";

interface SubstitutionCandidate {
  id: string;
  display_name: string;
}

interface Props {
  recipe: Recipe;
  match: RecipeMatch | undefined;
  ingredients: Ingredient[];
  /** recipe_ingredient.id → candidate substitutes from the user's pantry */
  candidatesByRi: Record<string, SubstitutionCandidate[]>;
  allReady: boolean;
}

export function RecipeCookView({
  recipe,
  match,
  ingredients,
  candidatesByRi,
  allReady,
}: Props) {
  const router = useRouter();
  const ingById = useMemo(
    () => new Map(ingredients.map((i) => [i.id, i] as const)),
    [ingredients],
  );

  // ----- Interactive state -----
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [substitutions, setSubstitutions] = useState<Record<string, string>>({});
  const [keepAwake, setKeepAwake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ----- Wake lock -----
  useEffect(() => {
    if (!keepAwake) return;
    let cancelled = false;
    let wakeLock: { release: () => Promise<void> } | null = null;
    type WakeLockNav = Navigator & { wakeLock?: { request: (t: string) => Promise<typeof wakeLock> } };
    const n = navigator as WakeLockNav;
    if (n.wakeLock?.request) {
      n.wakeLock
        .request("screen")
        .then((wl) => {
          if (cancelled) wl?.release();
          else wakeLock = wl;
        })
        .catch(() => {
          // Browser may deny (Safari iOS pre-16.4 etc); silently ignore.
        });
    }
    return () => {
      cancelled = true;
      wakeLock?.release().catch(() => {});
    };
  }, [keepAwake]);

  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setSub(riId: string, ingredientId: string | null) {
    setSubstitutions((prev) => {
      const next = { ...prev };
      if (ingredientId === null) delete next[riId];
      else next[riId] = ingredientId;
      return next;
    });
  }

  async function onCook() {
    if (busy || !allReady) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/cook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          servings_cooked: servings,
          substitutions,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const body = (await res.json()) as { shortfalls?: Array<{ ingredient_id: string }> };
      if (body.shortfalls && body.shortfalls.length > 0) {
        setInfo(
          `Logged. We tracked less than the recipe needed for ${body.shortfalls.length} ingredient${body.shortfalls.length > 1 ? "s" : ""} — adjust pantry quantities if needed.`,
        );
      } else {
        setInfo("Logged. Pantry updated.");
      }
      router.refresh();
      setTimeout(() => router.push("/recipes"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cook failed");
      setBusy(false);
    }
  }

  const totalMinutes = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);

  return (
    <article className="recipe-detail">
      <header className="recipe-detail__head">
        <p className="eyebrow">
          <Link href="/recipes">← Recipes</Link>
        </p>
        <h1>{recipe.title}</h1>
        {recipe.description && <p className="lede">{recipe.description}</p>}
        <div className="recipe-detail__meta">
          {totalMinutes > 0 && (
            <div className="meta-pill">
              <strong>{totalMinutes} min</strong>
              {recipe.prep_minutes != null && recipe.cook_minutes != null && (
                <span className="meta-pill__sub">
                  {recipe.prep_minutes} prep + {recipe.cook_minutes} cook
                </span>
              )}
            </div>
          )}
          <div className="servings-stepper" role="group" aria-label="Servings">
            <button
              type="button"
              className="servings-stepper__btn"
              aria-label="Fewer servings"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
            >
              −
            </button>
            <div className="servings-stepper__value">
              <strong>{servings}</strong>
              <span>servings</span>
            </div>
            <button
              type="button"
              className="servings-stepper__btn"
              aria-label="More servings"
              onClick={() => setServings((s) => Math.min(99, s + 1))}
            >
              +
            </button>
          </div>
        </div>
      </header>

      {!match && (
        <p className="recipe-detail__warn">
          This recipe is filtered out by your current preferences (allergens, dietary, blocked).
          Adjust under <Link href="/settings">Settings</Link> to enable cooking.
        </p>
      )}

      {recipe.hero_image_url && (
        <div className="recipe-detail__media">
          <Image
            src={recipe.hero_image_url}
            alt=""
            width={1200}
            height={800}
            className="recipe-detail__img"
            priority
          />
        </div>
      )}

      <section className="recipe-detail__section">
        <div className="ings-head">
          <h2>Ingredients</h2>
          <KeepAwakeToggle on={keepAwake} onToggle={() => setKeepAwake((v) => !v)} />
        </div>
        <ul className="ings ings--checkable">
          <li className="ings__header" aria-hidden="true">
            <span />
            <span>Item</span>
            <span>Amount</span>
          </li>
          {recipe.ingredients.map((ri) => {
            const status = match?.ingredient_status.find(
              (s) => s.recipe_ingredient_id === ri.id,
            );
            return (
              <IngredientRow
                key={ri.id}
                ri={ri}
                ing={ingById.get(ri.ingredient_id)}
                status={status}
                ingById={ingById}
                candidates={candidatesByRi[ri.id] ?? []}
                checked={checked.has(ri.id)}
                onToggleChecked={() => toggleChecked(ri.id)}
                substituteId={substitutions[ri.id]}
                onSetSub={(id) => setSub(ri.id, id)}
                scale={servings / recipe.servings}
              />
            );
          })}
        </ul>
      </section>

      <section className="recipe-detail__section">
        <h2>Instructions</h2>
        <ol className="instructions">
          {recipe.instructions.map((step) => (
            <li key={step.step}>{step.text}</li>
          ))}
        </ol>
      </section>

      <CookBar
        servings={servings}
        recipeServings={recipe.servings}
        busy={busy}
        disabled={!allReady}
        error={error}
        info={info}
        onCook={onCook}
      />
    </article>
  );
}

function IngredientRow({
  ri,
  ing,
  status,
  ingById,
  candidates,
  checked,
  onToggleChecked,
  substituteId,
  onSetSub,
  scale,
}: {
  ri: RecipeIngredient;
  ing: Ingredient | undefined;
  status: IngredientMatchStatus | undefined;
  ingById: Map<string, Ingredient>;
  candidates: SubstitutionCandidate[];
  checked: boolean;
  onToggleChecked: () => void;
  substituteId: string | undefined;
  onSetSub: (id: string | null) => void;
  scale: number;
}) {
  const baseQty = ri.display_quantity ?? `${ri.quantity} ${ing?.canonical_unit ?? ""}`;
  const qty = ri.display_quantity
    ? scaleDisplayQuantity(baseQty, scale)
    : `${Math.round(ri.quantity * scale)} ${ing?.canonical_unit ?? ""}`;
  const subName = substituteId ? ingById.get(substituteId)?.display_name : null;
  const engineSubName = !subName && status?.substituted_with_ingredient_id
    ? ingById.get(status.substituted_with_ingredient_id)?.display_name
    : null;
  const canSub = candidates.length > 0 && !ri.is_optional;
  const ingredientName = ing?.display_name ?? "(unknown)";

  return (
    <li
      className={`ings__row ings__row--${status?.status?.toLowerCase() ?? "unknown"} ${checked ? "ings__row--checked" : ""}`}
    >
      <button
        type="button"
        className={`ings__check ${checked ? "ings__check--on" : ""}`}
        aria-label={checked ? `Mark ${ingredientName} unused` : `Mark ${ingredientName} added`}
        aria-pressed={checked}
        onClick={onToggleChecked}
      >
        {checked && <span aria-hidden="true">✓</span>}
      </button>
      <div className="ings__body">
        <div className="ings__line">
          <span className="ings__name">
            {ingredientName}
            {ri.is_optional && <span className="ings__opt"> (optional)</span>}
          </span>
          {canSub && (
            <SubPicker
              candidates={candidates}
              currentId={substituteId}
              ingredientName={ingredientName}
              onPick={onSetSub}
            />
          )}
        </div>
        {ri.notes && <p className="ings__notes">{ri.notes}</p>}
        {subName && <p className="ings__sub">subbing in {subName}</p>}
        {!subName && engineSubName && (
          <p className="ings__sub ings__sub--auto">auto-subbing {engineSubName} from your pantry</p>
        )}
      </div>
      <span className="ings__qty">{qty}</span>
    </li>
  );
}

function SubPicker({
  candidates,
  currentId,
  ingredientName,
  onPick,
}: {
  candidates: SubstitutionCandidate[];
  currentId: string | undefined;
  ingredientName: string;
  onPick: (id: string | null) => void;
}) {
  return (
    <details className="sub-picker">
      <summary
        className={`sub-picker__btn ${currentId ? "sub-picker__btn--on" : ""}`}
        aria-label={`Substitute for ${ingredientName}`}
      >
        {currentId ? "Sub ✓" : "Sub"}
      </summary>
      <div className="sub-picker__panel" role="menu">
        <p className="sub-picker__title">Use instead:</p>
        <ul>
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={`sub-picker__opt ${currentId === c.id ? "sub-picker__opt--on" : ""}`}
                onClick={() => onPick(currentId === c.id ? null : c.id)}
              >
                {c.display_name}
              </button>
            </li>
          ))}
        </ul>
        {currentId && (
          <button
            type="button"
            className="sub-picker__clear"
            onClick={() => onPick(null)}
          >
            Clear
          </button>
        )}
      </div>
    </details>
  );
}

function KeepAwakeToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`awake-toggle ${on ? "awake-toggle--on" : ""}`}
      role="switch"
      aria-checked={on}
      onClick={onToggle}
    >
      <span className="awake-toggle__track">
        <span className="awake-toggle__knob" />
      </span>
      <span className="awake-toggle__label">Keep screen awake</span>
    </button>
  );
}

function CookBar({
  servings,
  recipeServings,
  busy,
  disabled,
  error,
  info,
  onCook,
}: {
  servings: number;
  recipeServings: number;
  busy: boolean;
  disabled: boolean;
  error: string | null;
  info: string | null;
  onCook: () => void;
}) {
  const scale = servings === recipeServings ? null : `${servings}/${recipeServings} servings`;
  return (
    <div className="cook-bar cook-bar--big">
      <button
        type="button"
        className="cook-bar__cta"
        disabled={busy || disabled}
        onClick={onCook}
      >
        {busy ? "Cooking…" : disabled ? "Missing ingredients" : "I cooked this"}
      </button>
      <p className="cook-bar__note">
        {disabled ? (
          <>Add the missing items to your pantry to enable cooking.</>
        ) : (
          <>
            Logging this <strong>draws down your pantry</strong> by what the recipe used
            {scale ? ` (scaled to ${scale})` : ""}.
          </>
        )}
      </p>
      {error && <p className="cook-bar__msg cook-bar__msg--err">{error}</p>}
      {info && <p className="cook-bar__msg cook-bar__msg--ok">{info}</p>}
    </div>
  );
}
