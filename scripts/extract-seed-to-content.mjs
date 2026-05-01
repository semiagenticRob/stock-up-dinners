#!/usr/bin/env node
//
// One-shot extractor: turns the v1 SQL seeds in supabase/seed/ into the
// versioned JSON catalog that the v2 (ATAT) spec expects under content/.
//
// What it does:
//   - Parses 001_ingredients.sql into content/ingredients.json
//     - Maps old single shelf_life_days into the new pantry/fridge/freezer
//       trio based on default_storage inferred from category + is_perishable
//     - Derives canonical_unit (grams | milliliters | count) from old default_unit
//     - Derives meat_type from name keywords (curate by hand later)
//     - Leaves allergen_tags, dietary_tags, default_par, substitution_group_slug,
//       is_assumed_staple as placeholders for Phase 2 curation
//   - Parses 002 + 003 SQL into content/recipes.json
//     - Re-references old ingredient UUIDs as new slug strings
//     - Computes per-recipe quantity = quantity_per_serving * default_servings
//       in the ingredient's canonical_unit (units converted lb/oz→g, fl_oz→ml)
//     - Defaults allow_substitution = true, is_optional = (preserved from old data)
//   - Writes empty content/{skus,substitution_groups,starter-pack}.json stubs
//
// Inputs:  supabase/seed/{001_ingredients,002_meals_cycle1,003_meal_ingredients_cycle1}.sql
// Outputs: content/{ingredients,recipes,skus,substitution_groups,starter-pack}.json
//
// Run from repo root: node scripts/extract-seed-to-content.mjs

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const seedDir = resolve(repoRoot, 'supabase/seed');
const contentDir = resolve(repoRoot, 'content');

if (!existsSync(contentDir)) mkdirSync(contentDir, { recursive: true });

// ---------- helpers ----------

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_');
}

// Strip SQL line comments (-- ...) outside of quoted strings. The seed files
// have `-- Meal N: Name (serves 4)` headers between row tuples; if we don't
// strip them the parens trick the tuple parser into starting a new record.
function stripSqlLineComments(sql) {
  const out = [];
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (inString) {
      out.push(c);
      if (c === "'") {
        if (sql[i + 1] === "'") { out.push(sql[++i]); continue; }
        inString = false;
      }
      continue;
    }
    if (c === "'") { out.push(c); inString = true; continue; }
    if (c === '-' && sql[i + 1] === '-') {
      // skip to end of line
      while (i < sql.length && sql[i] !== '\n') i++;
      out.push('\n');
      continue;
    }
    out.push(c);
  }
  return out.join('');
}

// Parse a SQL VALUES tuple list. Returns array of arrays of raw token strings.
// Handles quoted strings (with '' as literal quote) and NULL.
function parseValuesTuples(sqlBody) {
  const tuples = [];
  let i = 0;
  while (i < sqlBody.length) {
    // skip to next '('
    while (i < sqlBody.length && sqlBody[i] !== '(') i++;
    if (i >= sqlBody.length) break;
    i++; // past '('
    const fields = [];
    let depth = 1;
    let cur = '';
    let inString = false;
    while (i < sqlBody.length && depth > 0) {
      const c = sqlBody[i];
      if (inString) {
        if (c === "'") {
          if (sqlBody[i + 1] === "'") {
            cur += "'";
            i += 2;
            continue;
          }
          inString = false;
          cur += c;
          i++;
          continue;
        }
        cur += c;
        i++;
        continue;
      }
      if (c === "'") { inString = true; cur += c; i++; continue; }
      if (c === '(') { depth++; cur += c; i++; continue; }
      if (c === ')') {
        depth--;
        if (depth === 0) {
          fields.push(cur.trim());
          cur = '';
          i++;
          break;
        }
        cur += c;
        i++;
        continue;
      }
      if (c === ',' && depth === 1) {
        fields.push(cur.trim());
        cur = '';
        i++;
        continue;
      }
      cur += c;
      i++;
    }
    tuples.push(fields);
  }
  return tuples;
}

function decodeStr(token) {
  if (token === 'NULL' || token === 'null') return null;
  if (token === 'TRUE' || token === 'true') return true;
  if (token === 'FALSE' || token === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token);
  if (token.startsWith("'") && token.endsWith("'")) {
    return token.slice(1, -1).replace(/''/g, "'");
  }
  return token; // unknown
}

// ---------- ingredients ----------

const ingSql = readFileSync(resolve(seedDir, '001_ingredients.sql'), 'utf8');
// strip everything before INSERT ... VALUES
const ingValuesStart = ingSql.indexOf('VALUES');
const ingBody = stripSqlLineComments(ingSql.slice(ingValuesStart + 'VALUES'.length));
const ingTuples = parseValuesTuples(ingBody);

// Old column order:
// id, name, category, default_unit, package_size, package_unit,
// is_perishable, shelf_life_days, shopping_aisle, notes, seed_version

const oldUuidToSlug = new Map();
const ingredients = [];

function deriveCanonicalUnit(default_unit, package_unit) {
  const u = (default_unit || '').toLowerCase();
  const p = (package_unit || '').toLowerCase();
  if (u === 'fl_oz' || p === 'fl_oz') return 'milliliters';
  if (u === 'count' || p === 'count' || u === 'can') return 'count';
  return 'grams';
}

function unitToCanonicalFactor(default_unit, canonical_unit) {
  const u = (default_unit || '').toLowerCase();
  if (canonical_unit === 'grams') {
    if (u === 'lb') return 453.592;
    if (u === 'oz') return 28.3495;
    return 1; // already grams or unspecified
  }
  if (canonical_unit === 'milliliters') {
    if (u === 'fl_oz') return 29.5735;
    return 1;
  }
  return 1; // count
}

function deriveStorage(category, is_perishable, shopping_aisle) {
  if (shopping_aisle === 4) return 'frozen';
  if (is_perishable) return 'refrigerated';
  return 'pantry';
}

function deriveMeatType(name) {
  const n = name.toLowerCase();
  if (n.includes('bison')) return 'bison';
  if (n.includes('chicken')) return 'chicken';
  if (n.includes('beef')) return 'beef';
  if (n.includes('turkey')) return 'turkey';
  if (n.includes('pork') || n.includes('bacon')) return 'pork';
  if (n.includes('salmon') || n.includes('cod') || n.includes('shrimp') || n.includes('tuna')) return 'seafood';
  return null;
}

for (const t of ingTuples) {
  const [id, name, category, default_unit, package_size, package_unit,
         is_perishable, shelf_life_days, shopping_aisle, notes /* seed_version */] = t.map(decodeStr);
  const slug = slugify(name);
  oldUuidToSlug.set(id, slug);
  const canonical_unit = deriveCanonicalUnit(default_unit, package_unit);
  const default_storage = deriveStorage(category, is_perishable, shopping_aisle);
  // Place the old shelf_life_days into the right field for default_storage.
  // Other two fields stay null until human curation in Phase 2.
  const shelf = { pantry: null, fridge: null, freezer: null };
  if (default_storage === 'frozen') shelf.freezer = shelf_life_days; // usually null (frozen ≈ shelf-stable for v1)
  else if (default_storage === 'refrigerated') shelf.fridge = shelf_life_days;
  else shelf.pantry = shelf_life_days; // usually null = shelf-stable

  ingredients.push({
    slug,
    display_name: name,
    canonical_unit,
    category,
    shelf_life_pantry_days: shelf.pantry,
    shelf_life_fridge_days: shelf.fridge,
    shelf_life_freezer_days: shelf.freezer,
    default_storage,
    is_assumed_staple: false, // Phase 2 marks salt/pepper/oils/garlic powder as true
    substitution_group_slug: null, // Phase 2 fills these in
    allergen_tags: [], // Phase 2
    dietary_tags: [], // Phase 2
    meat_type: deriveMeatType(name),
    // default_par is "one Costco pack" in canonical units — derived from
    // package_size × unit-conversion-factor. Used by the onboarding bucket
    // UX (¼/½/¾/Full) and shopping-list threshold math. Phase 2 curation
    // can refine values that differ from one-pack (e.g. shorter shelf-life
    // perishables that warrant a larger par).
    default_par: Math.max(
      1,
      Math.round((package_size ?? 0) * unitToCanonicalFactor(package_unit, canonical_unit)),
    ),
    // ----- v1 source-of-truth fields preserved for Phase 2 curation context -----
    _v1_legacy: {
      old_uuid: id,
      package_size,
      package_unit,
      is_perishable,
      shopping_aisle,
      notes,
    },
  });
}

writeFileSync(
  resolve(contentDir, 'ingredients.json'),
  JSON.stringify(ingredients, null, 2) + '\n',
);

// ---------- meals → recipes ----------

const mealSql = readFileSync(resolve(seedDir, '002_meals_cycle1.sql'), 'utf8');
const mealValuesStart = mealSql.indexOf('VALUES');
const mealBody = stripSqlLineComments(mealSql.slice(mealValuesStart + 'VALUES'.length));
const mealTuples = parseValuesTuples(mealBody);

// Old column order:
// id, name, description, default_servings, prep_time_minutes, cook_time_minutes,
// total_time_minutes, storage_type, storage_instructions, reheat_instructions,
// instructions (JSONB string), cycle, meal_number, seed_version

const meals = mealTuples.map((t) => {
  const [id, name, description, default_servings, prep_time_minutes,
         cook_time_minutes, total_time_minutes, storage_type, storage_instructions,
         reheat_instructions, instructionsJson, cycle, meal_number /* seed_version */] = t.map(decodeStr);
  let instructions = [];
  try {
    instructions = JSON.parse(instructionsJson);
  } catch (e) {
    console.error(`Failed to parse instructions JSON for meal ${id}: ${e.message}`);
  }
  return {
    old_uuid: id,
    name,
    description,
    default_servings,
    prep_time_minutes,
    cook_time_minutes,
    total_time_minutes,
    storage_type,
    storage_instructions,
    reheat_instructions,
    instructions,
    cycle,
    meal_number,
  };
});

// ---------- meal_ingredients ----------

const miSql = readFileSync(resolve(seedDir, '003_meal_ingredients_cycle1.sql'), 'utf8');
const miValuesStart = miSql.indexOf('VALUES');
const miBody = stripSqlLineComments(miSql.slice(miValuesStart + 'VALUES'.length));
const miTuples = parseValuesTuples(miBody);

// Old column order: meal_id, ingredient_id, quantity_per_serving, is_optional, notes

// Group by meal_id.
const ingredientsByMealUuid = new Map();
for (const t of miTuples) {
  const [meal_id, ingredient_id, qty_per_serving, is_optional, notes] = t.map(decodeStr);
  if (!ingredientsByMealUuid.has(meal_id)) ingredientsByMealUuid.set(meal_id, []);
  ingredientsByMealUuid.get(meal_id).push({
    ingredient_uuid: ingredient_id,
    qty_per_serving,
    is_optional,
    notes,
  });
}

// Build the final recipes payload.
const recipes = meals.map((m) => {
  const oldRows = ingredientsByMealUuid.get(m.old_uuid) || [];
  const new_ingredients = oldRows.map((r) => {
    const ingSlug = oldUuidToSlug.get(r.ingredient_uuid);
    if (!ingSlug) {
      console.warn(`[meal ${m.old_uuid}] unknown ingredient_uuid ${r.ingredient_uuid}`);
    }
    const ingRecord = ingredients.find((x) => x.slug === ingSlug);
    const default_unit = ingRecord && ingRecord._v1_legacy ? null : null; // we don't preserve old default_unit on the new ingredient; recompute below from legacy
    // Recover old default_unit from the original SQL row by matching uuid
    const oldIng = ingTuples.find((tt) => decodeStr(tt[0]) === r.ingredient_uuid);
    const oldDefaultUnit = oldIng ? decodeStr(oldIng[3]) : null;
    const canonical_unit = ingRecord ? ingRecord.canonical_unit : 'grams';
    const factor = unitToCanonicalFactor(oldDefaultUnit, canonical_unit);
    const totalForRecipe = r.qty_per_serving * m.default_servings * factor;
    const quantity = Math.round(totalForRecipe);
    return {
      ingredient_slug: ingSlug || `__UNKNOWN_${r.ingredient_uuid}`,
      quantity, // integer in canonical_unit, total for the recipe (all servings)
      display_quantity: null, // Phase 2: write friendly string like "1.5 lb"
      allow_substitution: true, // Phase 2: tighten where the recipe truly needs the exact ingredient
      is_optional: !!r.is_optional,
      notes: r.notes,
      _v1_legacy: {
        quantity_per_serving: r.qty_per_serving,
        default_unit: oldDefaultUnit,
      },
    };
  });

  // Derive meat_types[] from constituent ingredients (for filter exclusion).
  const meatTypes = [
    ...new Set(
      new_ingredients
        .map((ri) => {
          const ingRecord = ingredients.find((x) => x.slug === ri.ingredient_slug);
          return ingRecord ? ingRecord.meat_type : null;
        })
        .filter(Boolean),
    ),
  ];

  return {
    slug: slugify(m.name),
    title: m.name,
    description: m.description,
    servings: m.default_servings,
    prep_minutes: m.prep_time_minutes,
    cook_minutes: m.cook_time_minutes,
    instructions: m.instructions,
    hero_image_url: null, // Phase 2: link to web/public/images/meals/NN-slug.jpg
    dietary_tags: [], // Phase 2
    meat_types: meatTypes,
    is_active: true,
    ingredients: new_ingredients,
    _v1_legacy: {
      old_uuid: m.old_uuid,
      cycle: m.cycle,
      meal_number: m.meal_number,
      total_time_minutes: m.total_time_minutes,
      storage_type: m.storage_type,
      storage_instructions: m.storage_instructions,
      reheat_instructions: m.reheat_instructions,
    },
  };
});

writeFileSync(
  resolve(contentDir, 'recipes.json'),
  JSON.stringify(recipes, null, 2) + '\n',
);

// ---------- empty stubs ----------

writeFileSync(
  resolve(contentDir, 'skus.json'),
  JSON.stringify([], null, 2) + '\n',
);
writeFileSync(
  resolve(contentDir, 'substitution_groups.json'),
  JSON.stringify([], null, 2) + '\n',
);
writeFileSync(
  resolve(contentDir, 'starter-pack.json'),
  JSON.stringify({ sku_slugs: [] }, null, 2) + '\n',
);

console.log(`✓ Wrote ${ingredients.length} ingredients to content/ingredients.json`);
console.log(`✓ Wrote ${recipes.length} recipes to content/recipes.json`);
console.log(`✓ Wrote empty stubs for skus, substitution_groups, starter-pack`);
console.log(`\nPhase 2 curation needed for:`);
console.log(`  - allergen_tags, dietary_tags on ingredients`);
console.log(`  - default_par on ingredients (canonical_unit quantities)`);
console.log(`  - is_assumed_staple flagging (salt, pepper, oils, garlic powder)`);
console.log(`  - shelf_life_{pantry,fridge,freezer}_days where missing`);
console.log(`  - substitution_group_slug assignments + content/substitution_groups.json`);
console.log(`  - allow_substitution=false where recipes need an exact ingredient`);
console.log(`  - display_quantity strings on recipe_ingredients`);
console.log(`  - hero_image_url on recipes (link to web/public/images/meals/NN-*.jpg)`);
console.log(`  - 75-100 SKUs with receipt_aliases in content/skus.json`);
console.log(`  - starter-pack curation (greedy set cover over recipes)`);
