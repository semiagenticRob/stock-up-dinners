#!/usr/bin/env node
//
// One-shot content pass: rewrites every recipe in content/recipes.json with
// cooking-friendly display_quantity strings (no grams/milliliters in the UI)
// and time-ordered numbered cook-now instructions.
//
// Mirror of the manual fish_taco_kits authoring pass, applied across the
// catalog. Re-run is idempotent.
//
// Run: node scripts/recipe-content-pass.mjs
//
// Then: npm run seed

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = resolve(repoRoot, "content/recipes.json");
const recipes = JSON.parse(readFileSync(path, "utf8"));

/** Per-recipe overrides keyed by slug. */
const UPDATES = {
  chicken_burrito_bowls: {
    display: {
      ks_chicken_breasts_boneless_skinless: "3 lb (about 4–5 breasts)",
      ks_thai_hom_mali_jasmine_rice: "1½ cups dry (about 3 cups cooked)",
      s_w_organic_black_beans: "2 cans (15 oz each), drained",
      del_monte_canned_corn_whole_kernel: "1 can (15 oz), drained",
      tillamook_medium_cheddar_block: "2 cups shredded (about 8 oz)",
      baby_spinach: "2 handfuls (about 4 oz)",
      sea_salt_himalayan_pink_salt: "1 tsp",
      black_pepper: "½ tsp",
      garlic_powder: "1 tbsp",
    },
    instructions: [
      { step: 1, text: "Cook the rice: rinse 1½ cups jasmine rice, simmer with 2¼ cups water for 18 minutes, then rest 5 minutes off heat. Fluff with a fork." },
      { step: 2, text: "While rice cooks, season the chicken breasts on both sides with salt, pepper, and garlic powder." },
      { step: 3, text: "Bake the chicken on a sheet pan at 400°F for 22–25 minutes until 165°F internal." },
      { step: 4, text: "Drain and rinse the black beans and corn; warm them together in a small saucepan over low heat." },
      { step: 5, text: "Rest the chicken 5 minutes, then dice into bite-size pieces." },
      { step: 6, text: "Build the bowls: rice on the bottom, then diced chicken, beans + corn, shredded cheddar, and a handful of spinach on top." },
    ],
  },

  beef_bolognese_over_spaghetti: {
    display: {
      ground_beef: "1½ lb (90/10 or 85/15)",
      dry_pasta_spaghetti: "1½ lb (1½ boxes)",
      ks_organic_diced_tomatoes: "2 cans (14.5 oz each)",
      ks_organic_tomato_paste: "1 can (6 oz)",
      ks_parmigiano_reggiano: "½ cup grated (about 3 oz)",
      onions: "1 medium yellow onion, diced",
      ks_minced_garlic: "2 tbsp (or 4 cloves, minced)",
      ks_organic_extra_virgin_olive_oil: "2 tbsp",
      sea_salt_himalayan_pink_salt: "1 tsp",
      black_pepper: "½ tsp",
      garlic_powder: "1 tsp",
    },
    instructions: [
      { step: 1, text: "Bring a large pot of salted water to a boil for the spaghetti." },
      { step: 2, text: "Heat olive oil in a large skillet or Dutch oven over medium heat. Sweat the diced onion for 5 minutes until translucent, then add the garlic and cook 30 seconds more." },
      { step: 3, text: "Add the ground beef. Brown for 6–8 minutes, breaking it up with a spoon, until no pink remains. Drain off excess fat." },
      { step: 4, text: "Stir in diced tomatoes, tomato paste, salt, pepper, and garlic powder. Simmer uncovered on low for 30–40 minutes, stirring occasionally, until thickened." },
      { step: 5, text: "While the sauce simmers, cook the spaghetti to al dente per package directions (usually 9–11 minutes). Drain and toss with a drizzle of olive oil to keep it loose." },
      { step: 6, text: "Plate the spaghetti, spoon the bolognese on top, and finish with a heavy hand of grated parmesan." },
    ],
  },

  teriyaki_salmon_broccoli_rice: {
    display: {
      ks_frozen_wild_alaskan_sockeye_salmon_fillets: "4 fillets (about 1½ lb)",
      ks_thai_hom_mali_jasmine_rice: "1½ cups dry",
      ks_organic_frozen_broccoli_florets: "1 lb (one bag)",
      soy_sauce: "¼ cup",
      honey: "3 tbsp",
      ks_minced_garlic: "1 tbsp (or 2 cloves)",
    },
    instructions: [
      { step: 1, text: "Thaw the salmon fillets if frozen — under cold running water, about 5–10 minutes." },
      { step: 2, text: "Cook the rice: rinse 1½ cups jasmine rice, simmer with 2¼ cups water for 18 minutes, then rest 5 minutes off heat." },
      { step: 3, text: "Heat oven to 400°F. Whisk soy sauce, honey, and minced garlic together in a small bowl — that's the teriyaki glaze." },
      { step: 4, text: "Pat the salmon dry, brush with half the glaze, and place on a parchment-lined sheet pan. Bake 12–15 minutes until just flaky." },
      { step: 5, text: "Steam the broccoli: 4–5 minutes in the microwave-safe bag, or 5 minutes in a covered pan with a splash of water." },
      { step: 6, text: "Plate rice, salmon, and broccoli. Drizzle the remaining glaze over the salmon." },
    ],
  },

  chicken_veggie_stir_fry: {
    display: {
      ks_chicken_tenderloins_boneless_skinless: "2½ lb tenderloins, sliced into strips",
      ks_thai_hom_mali_jasmine_rice: "1½ cups dry",
      ks_stir_fry_vegetable_blend: "1½ lb (about half of a 3 lb bag)",
      soy_sauce: "3 tbsp",
      ks_minced_garlic: "1 tbsp (or 2 cloves)",
      avocado_oil: "2 tbsp, divided",
    },
    instructions: [
      { step: 1, text: "Cook the rice: rinse 1½ cups jasmine rice, simmer with 2¼ cups water for 18 minutes, then rest off heat." },
      { step: 2, text: "Slice the chicken tenderloins into thin strips against the grain." },
      { step: 3, text: "Heat 1 tbsp avocado oil in a large skillet or wok over high heat. Stir-fry the chicken with half the garlic for 4–5 minutes until just cooked through. Move to a plate." },
      { step: 4, text: "Add the second tbsp of oil to the same pan. Stir-fry the frozen vegetable blend for 5–6 minutes until tender-crisp; add the remaining garlic in the last minute." },
      { step: 5, text: "Return the chicken to the pan. Add soy sauce and toss everything together for 1 minute to coat." },
      { step: 6, text: "Serve the stir-fry over the rice." },
    ],
  },

  turkey_chili: {
    display: {
      ground_turkey: "2 lb",
      ks_organic_diced_tomatoes: "2 cans (14.5 oz each)",
      ks_organic_tomato_paste: "1 can (6 oz)",
      s_w_organic_black_beans: "2 cans (15 oz each), drained",
      del_monte_canned_corn_whole_kernel: "2 cans (15 oz each), drained",
      tillamook_medium_cheddar_block: "1 cup shredded (about 4 oz), for topping",
      onions: "1 medium yellow onion, diced",
      ks_minced_garlic: "1 tbsp (or 2 cloves)",
      garlic_powder: "1 tbsp",
      sea_salt_himalayan_pink_salt: "1 tsp",
      black_pepper: "½ tsp",
    },
    instructions: [
      { step: 1, text: "In a Dutch oven over medium heat, cook the diced onion for 5 minutes until translucent. Add minced garlic for 30 seconds." },
      { step: 2, text: "Add the ground turkey. Brown for 6–8 minutes, breaking it up, until no pink remains." },
      { step: 3, text: "Stir in diced tomatoes, tomato paste, drained beans, drained corn, garlic powder, salt, and pepper." },
      { step: 4, text: "Simmer uncovered on low for 25–30 minutes, stirring occasionally, until thickened." },
      { step: 5, text: "Taste and adjust salt. Ladle into bowls and top with shredded cheddar." },
    ],
  },

  coconut_shrimp_curry: {
    display: {
      ks_frozen_raw_shrimp: "2 lb, thawed (tail-off)",
      ks_thai_hom_mali_jasmine_rice: "1½ cups dry",
      thai_kitchen_organic_coconut_milk: "2 cans (13.66 fl oz each)",
      ks_stir_fry_vegetable_blend: "1½ lb (about half of a 3 lb bag)",
      soy_sauce: "1 tbsp",
      ks_minced_garlic: "1 tbsp (or 2 cloves)",
      onions: "1 medium yellow onion, diced",
      ks_organic_virgin_coconut_oil: "2 tbsp",
      sea_salt_himalayan_pink_salt: "1 tsp",
    },
    instructions: [
      { step: 1, text: "Cook the rice: rinse 1½ cups jasmine rice, simmer with 2¼ cups water for 18 minutes, then rest off heat." },
      { step: 2, text: "Thaw the shrimp under cold running water (5–10 minutes) and pat dry." },
      { step: 3, text: "Heat coconut oil in a large skillet over medium heat. Sweat the diced onion for 5 minutes, then add garlic for 30 seconds." },
      { step: 4, text: "Pour in both cans of coconut milk and the soy sauce; bring to a simmer. Add the frozen vegetable blend and cook 5 minutes." },
      { step: 5, text: "Add the shrimp and salt. Simmer 4–5 more minutes until the shrimp turn pink and curl. Don't overcook." },
      { step: 6, text: "Spoon the curry over the rice." },
    ],
  },

  baked_penne_bolognese: {
    display: {
      ground_beef: "1½ lb",
      dry_pasta_short_cuts: "2 lb penne (or rigatoni / rotini)",
      ks_organic_tomato_sauce: "1 can (15 oz)",
      raos_marinara_sauce: "1 jar (28 oz)",
      ks_shredded_mozzarella: "4 cups (16 oz)",
      frozen_spinach: "1 lb (one bag), thawed and squeezed dry",
      ks_organic_diced_tomatoes: "2 cans (14.5 oz each)",
      ks_organic_tomato_paste: "1 can (6 oz)",
      kerrygold_butter_salted: "2 tbsp",
    },
    instructions: [
      { step: 1, text: "Heat oven to 375°F. Bring a large pot of salted water to a boil." },
      { step: 2, text: "Brown the ground beef in a large skillet over medium heat, 6–8 minutes; drain. Stir in diced tomatoes, tomato paste, and tomato sauce. Simmer 10 minutes to thicken." },
      { step: 3, text: "Cook the penne to AL DENTE — about 2 minutes shy of package directions, since it'll bake more. Drain." },
      { step: 4, text: "Thaw frozen spinach in the microwave (3–4 min on defrost), then squeeze dry in a clean towel." },
      { step: 5, text: "In a 9×13 baking dish: layer half the pasta, all of the spinach, all of the bolognese, the rest of the pasta, the marinara, and finally all of the mozzarella. Dot the top with butter." },
      { step: 6, text: "Bake covered with foil for 20 minutes. Uncover and bake 10 more minutes until the cheese is bubbly and golden." },
    ],
  },

  chicken_tikka_style_bowls: {
    display: {
      ks_chicken_breasts_boneless_skinless: "3 lb, cut into 1-inch chunks",
      royal_basmati_rice: "2 cups dry",
      ks_organic_tomato_sauce: "2 cans (15 oz each)",
      ks_organic_tomato_paste: "1 can (6 oz)",
      s_w_organic_garbanzo_beans: "2 cans (15 oz each), drained",
      ks_organic_greek_yogurt: "¾ cup (split: ½ cup for marinade, ¼ cup stirred into sauce)",
      baby_spinach: "2 handfuls (about 4 oz), fresh",
      onions: "1 medium yellow onion, diced",
      ks_minced_garlic: "1 tbsp (or 2 cloves)",
      garlic_powder: "1 tbsp",
      sea_salt_himalayan_pink_salt: "1 tsp",
    },
    instructions: [
      { step: 1, text: "Marinate the chicken: cube the breasts and toss with ½ cup yogurt, half the minced garlic, 1 tbsp tomato paste, garlic powder, and salt. Rest 15 minutes (or up to overnight)." },
      { step: 2, text: "Cook the basmati rice: rinse 2 cups, simmer with 3 cups water for 18 minutes, then rest off heat." },
      { step: 3, text: "Heat oven to 425°F. Spread the marinated chicken on a parchment-lined sheet pan and bake 18–20 minutes until 165°F internal." },
      { step: 4, text: "While the chicken roasts, make the sauce: sweat onion in a saucepan over medium heat for 5 minutes, add the remaining garlic for 30 seconds, then stir in tomato sauce and the rest of the tomato paste. Simmer 10 minutes." },
      { step: 5, text: "Off the heat, stir the remaining ¼ cup yogurt into the sauce until smooth. Add the drained garbanzo beans and the roasted chicken." },
      { step: 6, text: "Serve over basmati rice with a handful of fresh spinach on top." },
    ],
  },

  roasted_pork_tenderloin_plates: {
    display: {
      pork_tenderloin: "2 tenderloins (about 3½ lb total)",
      sweet_potatoes: "2½ lb (about 3 medium), cubed",
      ks_organic_frozen_green_beans: "2 lb (one bag)",
      kerrygold_butter_salted: "2 tbsp, for the green beans",
      ks_organic_extra_virgin_olive_oil: "2 tbsp, for the pork",
      avocado_oil: "2 tbsp, for the sweet potatoes",
      ks_minced_garlic: "1 tbsp (or 2 cloves)",
      sea_salt_himalayan_pink_salt: "1 tsp",
      black_pepper: "½ tsp",
      garlic_powder: "1 tbsp",
    },
    instructions: [
      { step: 1, text: "Heat oven to 400°F. Cube sweet potatoes into ¾-inch pieces; toss with avocado oil, salt, and pepper. Spread on a sheet pan and start roasting — they'll go for 30 minutes total." },
      { step: 2, text: "Pat the pork tenderloins dry. Season all over with garlic powder, salt, and pepper. Drizzle with olive oil." },
      { step: 3, text: "After the sweet potatoes have roasted 10 minutes, slide the pork onto a second sheet pan into the oven. Roast 20–25 minutes until 145°F internal." },
      { step: 4, text: "While the pork roasts, melt butter in a skillet over medium heat. Add minced garlic for 30 seconds, then add the frozen green beans straight from the bag. Cover and cook 5 minutes, then uncover and sauté 3 more minutes." },
      { step: 5, text: "Rest the pork 10 minutes before slicing into ½-inch medallions." },
      { step: 6, text: "Plate: pork medallions, sweet potatoes, green beans." },
    ],
  },

  peanut_chicken_noodles: {
    display: {
      ks_chicken_tenderloins_boneless_skinless: "2½ lb",
      dry_pasta_spaghetti: "1½ lb",
      ks_organic_peanut_butter: "1 cup",
      soy_sauce: "¼ cup",
      honey: "2 tbsp",
      ks_minced_garlic: "2 tbsp (or 4 cloves)",
      frozen_shelled_edamame: "12 oz (one bag)",
    },
    instructions: [
      { step: 1, text: "Bring a large pot of salted water to a boil for the spaghetti." },
      { step: 2, text: "Poach the chicken: cover the tenderloins with cold water in a saucepan, bring to a bare simmer, cook 12 minutes until 165°F. Cool, then shred with two forks." },
      { step: 3, text: "Cook the spaghetti to al dente per package directions. Reserve ½ cup pasta water; drain the pasta." },
      { step: 4, text: "Meanwhile, whisk peanut butter, soy sauce, honey, minced garlic, and ¼ cup warm pasta water in a large bowl until smooth. Thin further with pasta water as needed." },
      { step: 5, text: "Cook the edamame in the microwave per package (3–4 minutes) and drain." },
      { step: 6, text: "Toss the hot pasta in the peanut sauce, then fold in the shredded chicken and edamame. Serve immediately, drizzling extra sauce on top if desired." },
    ],
  },

  beef_black_bean_burritos: {
    display: {
      ground_beef: "2 lb",
      flour_tortillas: "8 large tortillas",
      ks_thai_hom_mali_jasmine_rice: "1½ cups dry",
      s_w_organic_black_beans: "1 can (15 oz), drained",
      del_monte_canned_corn_whole_kernel: "1 can (15 oz), drained",
      tillamook_medium_cheddar_block: "2 cups shredded (about 8 oz)",
      onions: "1 medium yellow onion, diced",
      ks_minced_garlic: "1 tbsp (or 2 cloves)",
      garlic_powder: "1 tbsp",
      sea_salt_himalayan_pink_salt: "1 tsp",
      black_pepper: "½ tsp",
    },
    instructions: [
      { step: 1, text: "Cook the rice: rinse 1½ cups jasmine rice, simmer with 2¼ cups water for 18 minutes, then rest off heat." },
      { step: 2, text: "In a large skillet over medium heat, sweat the diced onion for 5 minutes, then add minced garlic for 30 seconds." },
      { step: 3, text: "Add the ground beef. Brown for 6–8 minutes, breaking it up, until no pink remains. Drain excess fat." },
      { step: 4, text: "Stir in the drained black beans, drained corn, garlic powder, salt, and pepper. Cook 2 more minutes to warm through." },
      { step: 5, text: "Warm tortillas: 30 seconds in a dry skillet over medium, or wrap in foil and warm at 300°F for 5 minutes." },
      { step: 6, text: "Assemble each burrito: tortilla, scoop of rice, scoop of beef-bean mixture, sprinkle of cheddar. Roll: tuck sides, fold bottom up, roll forward." },
    ],
  },

  salmon_quinoa_power_bowls: {
    display: {
      ks_frozen_wild_alaskan_sockeye_salmon_fillets: "4 fillets (about 1½ lb)",
      ks_organic_quinoa: "1½ cups dry",
      frozen_shelled_edamame: "12 oz (one bag)",
      frozen_spinach: "1 lb (one bag), thawed and squeezed dry",
      ks_organic_extra_virgin_olive_oil: "3 tbsp, for vinaigrette",
      balsamic_vinegar: "2 tbsp, for vinaigrette",
      sea_salt_himalayan_pink_salt: "½ tsp",
      black_pepper: "¼ tsp",
    },
    instructions: [
      { step: 1, text: "Thaw the salmon fillets if frozen — under cold running water, about 5–10 minutes." },
      { step: 2, text: "Cook the quinoa: rinse 1½ cups, simmer with 3 cups water for 15 minutes, then rest 5 minutes covered. Fluff." },
      { step: 3, text: "Heat oven to 400°F. Pat salmon dry, drizzle with a little olive oil and a pinch of salt. Bake on parchment 12–15 minutes until flaky." },
      { step: 4, text: "Cook the edamame in the microwave per package (3–4 minutes); drain." },
      { step: 5, text: "Thaw the frozen spinach (3–4 minutes in the microwave on defrost), then squeeze dry in a clean towel." },
      { step: 6, text: "Whisk olive oil, balsamic vinegar, salt, and pepper for the vinaigrette." },
      { step: 7, text: "Build the bowls: quinoa on the bottom, then flaked salmon, edamame, and spinach. Drizzle generously with vinaigrette." },
    ],
  },

  chicken_parm_pasta: {
    display: {
      just_bare_chicken_breast_chunks: "2 lb (one bag, lightly breaded)",
      dry_pasta_spaghetti: "1 lb (one box)",
      raos_marinara_sauce: "1 jar (28 oz)",
      ks_shredded_mozzarella: "4 cups (16 oz)",
      ks_parmigiano_reggiano: "½ cup grated (about 3 oz)",
      ks_organic_extra_virgin_olive_oil: "1 tbsp, for the pasta",
      kerrygold_butter_salted: "1 tbsp, for the pasta",
    },
    instructions: [
      { step: 1, text: "Heat oven to 400°F (or air fryer to 400°F). Bring a large pot of salted water to a boil." },
      { step: 2, text: "Bake the chicken chunks per package directions — usually 18–20 minutes in the oven, or 10–12 minutes in the air fryer." },
      { step: 3, text: "Cook the spaghetti to al dente per package directions. Drain and toss with butter and a drizzle of olive oil to keep it loose." },
      { step: 4, text: "Warm the marinara in a small saucepan over low heat — or skip and use it cold straight from the jar; it'll heat in the bake." },
      { step: 5, text: "Transfer the cooked chicken to a 9×13 baking dish. Pour marinara over the top, then blanket with mozzarella and parmesan." },
      { step: 6, text: "Bake uncovered 8–10 minutes until the cheese is bubbly and golden. Plate over the spaghetti." },
    ],
  },
};

// Apply
let updatedRecipes = 0;
let updatedIngs = 0;
for (const r of recipes) {
  const u = UPDATES[r.slug];
  if (!u) continue;
  for (const ri of r.ingredients) {
    if (u.display[ri.ingredient_slug]) {
      ri.display_quantity = u.display[ri.ingredient_slug];
      updatedIngs++;
    }
  }
  if (u.instructions) r.instructions = u.instructions;
  updatedRecipes++;
}

writeFileSync(path, JSON.stringify(recipes, null, 2) + "\n");
console.log(`Updated ${updatedRecipes} recipes, ${updatedIngs} ingredient display strings`);

// Sanity: which ingredients in those recipes still have null display_quantity?
const stillNull = [];
for (const r of recipes) {
  if (!UPDATES[r.slug]) continue;
  for (const ri of r.ingredients) {
    if (!ri.display_quantity) {
      stillNull.push(`  ${r.slug}: ${ri.ingredient_slug} (q=${ri.quantity})`);
    }
  }
}
if (stillNull.length > 0) {
  console.log("\nStill missing display_quantity:");
  console.log(stillNull.join("\n"));
}
