#!/usr/bin/env node
//
// Fetch a representative image for each ingredient from Wikimedia Commons.
// Saves a 640×640 JPEG to public/images/ingredients/<slug>.jpg.
//
// Wikimedia Commons API is keyless and returns CC-licensed media.
// Pexels was the original target but its search is behind a Cloudflare
// JS challenge that can't be cleared with plain HTTP — Commons gives the
// same "free generic photos" outcome with a 1-call API per ingredient.
//
// Run: node scripts/fetch-ingredient-images.mjs
//
// Idempotent: skips ingredients whose target file already exists, so re-runs
// only fill in gaps. Pass `--force` to re-fetch everything.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(repoRoot, "public/images/ingredients");
mkdirSync(outDir, { recursive: true });

const FORCE = process.argv.includes("--force");

// Hand-crafted search query per ingredient slug. Keep these visually
// recognizable rather than packaging-specific.
const QUERIES = {
  // Proteins
  rotisserie_chicken: "rotisserie chicken",
  ks_chicken_breasts_boneless_skinless: "raw chicken breast",
  ks_chicken_tenderloins_boneless_skinless: "chicken tenders raw",
  ground_beef: "ground beef raw",
  ground_turkey: "ground turkey raw",
  ground_bison: "ground bison meat",
  pork_tenderloin: "pork meat raw",
  ks_thick_sliced_bacon: "bacon strips raw",
  ks_frozen_wild_alaskan_sockeye_salmon_fillets: "salmon fillet raw",
  frozen_cod_fillets: "cod fillet",
  ks_frozen_raw_shrimp: "shrimp seafood",
  ks_canned_albacore_tuna: "canned tuna",
  ks_canned_wild_alaskan_pink_salmon: "canned salmon",
  ks_canned_chicken_breast: "canned chicken",
  ks_cage_free_eggs: "carton eggs",
  organic_firm_tofu: "tofu block",

  // Canned
  ks_organic_diced_tomatoes: "canned diced tomatoes",
  ks_organic_tomato_sauce: "tomato sauce can",
  ks_organic_tomato_paste: "tomato paste",
  s_w_organic_black_beans: "canned black beans",
  s_w_organic_garbanzo_beans: "canned chickpeas",
  thai_kitchen_organic_coconut_milk: "coconut milk can",
  ks_organic_chicken_stock: "chicken stock broth",
  better_than_bouillon_chicken: "chicken bouillon",
  del_monte_canned_corn_whole_kernel: "canned corn",
  raos_marinara_sauce: "marinara sauce pasta",

  // Grains
  ks_thai_hom_mali_jasmine_rice: "jasmine rice",
  royal_basmati_rice: "basmati rice",
  ks_organic_quinoa: "quinoa grain",
  dry_pasta_spaghetti: "spaghetti dry pasta",
  dry_pasta_short_cuts: "penne pasta",
  rolled_oats: "rolled oats",
  flour_tortillas: "flour tortillas",
  bread_dave_s_killer: "whole grain bread loaf",

  // Oils, condiments, seasonings
  ks_organic_extra_virgin_olive_oil: "olive oil bottle",
  avocado_oil: "avocado oil",
  ks_organic_virgin_coconut_oil: "coconut oil jar",
  avocado_oil_spray: "cooking oil spray",
  soy_sauce: "soy sauce bottle",
  balsamic_vinegar: "balsamic vinegar bottle",
  apple_cider_vinegar: "apple cider vinegar",
  honey: "honey jar",
  sea_salt_himalayan_pink_salt: "pink himalayan salt",
  black_pepper: "black peppercorns",
  garlic_powder: "garlic powder",
  ks_minced_garlic: "minced garlic jar",
  ks_organic_peanut_butter: "peanut butter jar",

  // Dairy
  kerrygold_butter_salted: "butter sticks",
  ks_organic_greek_yogurt: "greek yogurt bowl",
  ks_shredded_mozzarella: "shredded mozzarella",
  ks_parmigiano_reggiano: "parmesan cheese",
  tillamook_medium_cheddar_block: "cheddar cheese block",
  cream_cheese: "cream cheese",
  whole_milk_or_2: "milk carton",
  ks_almond_milk: "almond milk",
  cottage_cheese: "cottage cheese",

  // Frozen
  ks_organic_frozen_broccoli_florets: "broccoli florets",
  ks_stir_fry_vegetable_blend: "frozen mixed vegetables",
  ks_organic_frozen_green_beans: "green beans fresh",
  frozen_cauliflower: "cauliflower florets",
  ks_three_berry_blend: "mixed berries",
  ks_frozen_blueberries: "blueberries",
  frozen_organic_mango_chunks: "mango chunks",
  ks_frozen_pineapple_chunks: "pineapple chunks",
  ks_frozen_chicken_tenderloins: "raw chicken tenders",
  frozen_shelled_edamame: "edamame beans",
  just_bare_chicken_breast_chunks: "breaded chicken nuggets",
  frozen_spinach: "spinach leaves",

  // Produce
  bananas: "bananas bunch",
  apples: "red apples",
  onions: "yellow onions",
  garlic: "garlic bulbs",
  potatoes: "russet potatoes",
  sweet_potatoes: "sweet potatoes",
  baby_spinach: "baby spinach leaves",
};

const UA = "stock-up-dinners-ingredient-images/0.1 (https://github.com/semiagenticRob/stock-up-dinners; rbrt.s.wrrn@gmail.com)";

async function searchCommons(query) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|size|mime",
    iiurlwidth: "1024",
    format: "json",
    origin: "*",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  const json = await res.json();
  const pages = Object.values(json.query?.pages ?? {});
  // Sort by largest dimension first (better-quality photo) and take first jpeg/png.
  pages.sort((a, b) => {
    const aw = a.imageinfo?.[0]?.width ?? 0;
    const bw = b.imageinfo?.[0]?.width ?? 0;
    return bw - aw;
  });
  for (const page of pages) {
    const ii = page.imageinfo?.[0];
    if (!ii) continue;
    const mime = ii.mime ?? "";
    if (!mime.startsWith("image/")) continue;
    if (mime.includes("svg")) continue; // skip vector
    const u = ii.thumburl ?? ii.url;
    if (!u) continue;
    return u;
  }
  return null;
}

async function download(url, dest, attempt = 1) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429 && attempt <= 4) {
    // Wikimedia upload host throttles aggressively. Back off exponentially.
    const wait = 1000 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, wait));
    return download(url, dest, attempt + 1);
  }
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

function resizeAndCompress(file) {
  // Resize to 640px on the long edge, JPEG q78. Mirrors the meal images.
  execFileSync("sips", ["-Z", "640", "-s", "format", "jpeg", "-s", "formatOptions", "78", file], {
    stdio: ["ignore", "ignore", "ignore"],
  });
}

const slugs = Object.keys(QUERIES);
console.log(`Fetching ${slugs.length} ingredient images...`);

let ok = 0;
let skipped = 0;
const failures = [];

for (const slug of slugs) {
  const dest = resolve(outDir, `${slug}.jpg`);
  if (!FORCE && existsSync(dest)) {
    skipped++;
    continue;
  }
  const query = QUERIES[slug];
  try {
    const found = await searchCommons(query);
    if (!found) {
      failures.push({ slug, query, reason: "no Commons result" });
      continue;
    }
    await download(found, dest);
    resizeAndCompress(dest);
    ok++;
    process.stdout.write(`\r✓ ${ok + skipped}/${slugs.length}  ${slug}                              `);
    // Throttle so we don't pummel Wikimedia upload (they 429 hard).
    await new Promise((r) => setTimeout(r, 800));
  } catch (err) {
    failures.push({ slug, query, reason: String(err) });
  }
}

console.log("\n");
console.log(`✓ ${ok} fetched, ${skipped} already present, ${failures.length} failed`);
if (failures.length > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f.slug} (${f.query}): ${f.reason}`);
}
