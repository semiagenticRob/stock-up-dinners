"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Ingredient, Recipe, RecipeIngredient } from "@/lib/types";
import type { IngredientMatchStatus, RecipeMatch } from "@/lib/matching/engine";
import { scaleDisplayQuantity } from "@/lib/scale-display";
import { formatPantryQuantity } from "@/lib/format-quantity";
import { pickQuantityInput } from "@/lib/quantity-input";

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
  /**
   * Whether the recipe is cookable on first render — used as the seed.
   * Once the user picks any substitution we recompute live so a recipe in
   * "almost there" tier becomes cookable as soon as a missing ingredient
   * is satisfied from the pantry.
   */
  startsReady: boolean;
}

export function RecipeCookView({
  recipe,
  match,
  ingredients,
  candidatesByRi,
  startsReady,
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
  // recipe_ingredient_id → user-overridden quantity in canonical units (g/ml/ct).
  // When set, this absolute amount wins over servings-scaled defaults.
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [keepAwake, setKeepAwake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ----- Cookability ------
  // A recipe is cookable when every non-optional ingredient is either
  // already covered (DIRECT / ASSUMED / SUBSTITUTED) OR the user has
  // explicitly picked a substitution for it from the pantry.
  // This re-evaluates on every render as the substitutions map changes,
  // so picking a sub for a MISSING ingredient unlocks the cook button.
  const allReady = useMemo(() => {
    if (!match) return false;
    for (const ri of recipe.ingredients) {
      if (ri.is_optional) continue;
      const status = match.ingredient_status.find(
        (s) => s.recipe_ingredient_id === ri.id,
      );
      const covered =
        status?.status === "DIRECT" ||
        status?.status === "ASSUMED" ||
        status?.status === "SUBSTITUTED" ||
        Boolean(substitutions[ri.id]);
      if (!covered) return false;
    }
    return true;
  }, [match, recipe.ingredients, substitutions]);
  void startsReady; // accepted for prop parity but unused — match drives readiness

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

  function setOverride(riId: string, canonicalQty: number | null) {
    setOverrides((prev) => {
      const next = { ...prev };
      if (canonicalQty === null) delete next[riId];
      else next[riId] = Math.max(1, Math.round(canonicalQty));
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
          overrides,
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
                override={overrides[ri.id]}
                isEditing={editingId === ri.id}
                onStartEdit={() => setEditingId(ri.id)}
                onStopEdit={() => setEditingId(null)}
                onSetOverride={(qty) => setOverride(ri.id, qty)}
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
  override,
  isEditing,
  onStartEdit,
  onStopEdit,
  onSetOverride,
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
  override: number | undefined;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onSetOverride: (canonicalQty: number | null) => void;
}) {
  // The unit picker uses the ingredient that actually gets drawn from the
  // pantry — substitute if picked, otherwise the recipe's required ingredient.
  const consumedIng = substituteId ? ingById.get(substituteId) : ing;
  const baseQty = ri.display_quantity ?? `${ri.quantity} ${ing?.canonical_unit ?? ""}`;
  const scaledQty = ri.display_quantity
    ? scaleDisplayQuantity(baseQty, scale)
    : `${Math.round(ri.quantity * scale)} ${ing?.canonical_unit ?? ""}`;
  const overrideDisplay =
    override != null && consumedIng
      ? formatPantryQuantity(override, consumedIng.canonical_unit)
      : null;
  const qty = overrideDisplay ?? scaledQty;
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
        {isEditing && consumedIng && (
          <QtyEditor
            ingredient={consumedIng}
            recipeQuantity={Math.max(1, Math.round(ri.quantity * scale))}
            currentOverride={override}
            onChange={onSetOverride}
            onDone={onStopEdit}
          />
        )}
      </div>
      {isEditing ? (
        <span className="ings__qty ings__qty--editing">{qty}</span>
      ) : (
        <button
          type="button"
          className={`ings__qty ings__qty--btn ${override != null ? "ings__qty--edited" : ""}`}
          onClick={onStartEdit}
          aria-label={`Adjust amount for ${ingredientName}`}
        >
          {qty}
          <span className="ings__qty__pencil" aria-hidden="true">
            ✎
          </span>
        </button>
      )}
    </li>
  );
}

function QtyEditor({
  ingredient,
  recipeQuantity,
  currentOverride,
  onChange,
  onDone,
}: {
  ingredient: Ingredient;
  recipeQuantity: number;
  currentOverride: number | undefined;
  onChange: (canonicalQty: number | null) => void;
  onDone: () => void;
}) {
  const spec = useMemo(() => pickQuantityInput(ingredient), [ingredient]);
  // Display value derived from the current canonical state.
  const canonical = currentOverride ?? recipeQuantity;
  const display = canonicalToDisplay(canonical, ingredient.canonical_unit, spec.unitLabel);

  function bump(delta: number) {
    const nextDisplay = Math.max(0, round2(display + delta));
    if (nextDisplay <= 0) return;
    onChange(spec.toCanonical(nextDisplay));
  }

  return (
    <div className="qty-editor">
      <div className="qty-editor__stepper">
        <button
          type="button"
          onClick={() => bump(-spec.step)}
          aria-label="Decrease"
        >
          −
        </button>
        <span className="qty-editor__value">{spec.formatDisplay(display)}</span>
        <span className="qty-editor__unit">{spec.unitLabel}</span>
        <button type="button" onClick={() => bump(spec.step)} aria-label="Increase">
          +
        </button>
      </div>
      <div className="qty-editor__actions">
        {currentOverride != null && (
          <button
            type="button"
            className="qty-editor__reset"
            onClick={() => {
              onChange(null);
              onDone();
            }}
          >
            Reset to recipe default
          </button>
        )}
        <button type="button" className="qty-editor__done" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

function canonicalToDisplay(
  canonical: number,
  canonicalUnit: string,
  displayUnit: string,
): number {
  const G_PER_LB = 453.592;
  const G_PER_OZ = 28.3495;
  const ML_PER_CUP = 240;
  const ML_PER_FL_OZ = 29.5735;
  const ML_PER_TBSP = 14.7868;
  if (canonicalUnit === "grams") {
    if (displayUnit === "lb") return round2(canonical / G_PER_LB);
    if (displayUnit === "oz") return Math.round(canonical / G_PER_OZ);
  }
  if (canonicalUnit === "milliliters") {
    if (displayUnit === "cup") return round2(canonical / ML_PER_CUP);
    if (displayUnit === "fl oz") return Math.round(canonical / ML_PER_FL_OZ);
    if (displayUnit === "tbsp") return Math.round(canonical / ML_PER_TBSP);
  }
  return Math.round(canonical);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
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
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function close() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  function pickAndClose(id: string | null) {
    onPick(id);
    close();
  }

  if (candidates.length === 0) return null;

  return (
    <details className="sub-picker" ref={detailsRef}>
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
                onClick={() => pickAndClose(c.id)}
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
            onClick={() => pickAndClose(null)}
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
