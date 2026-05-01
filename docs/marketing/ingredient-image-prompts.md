# Ingredient image prompts — Stock Up Dinners

FLUX.1 prompts for the pantry tiles. Companion to `image-prompts.md` (which covers the 14 cooked dinners). Same brand direction: warm, pragmatic, no AI-glossy, no neon saturation.

## FLUX.1 settings

Append `--ar 16:10` (matches the pantry tile media aspect ratio) and a stable `--seed N` so a series of related ingredients (e.g. all the proteins, or all the canned goods) keeps consistent lighting/surface.

Output saves to `public/images/ingredients/<slug>.jpg`, resized to 640px on the long edge with `sips -Z 640 -s formatOptions 78`.

## House style for ingredients

Paste this at the end of every ingredient prompt:

> *Top-down editorial product photography, soft natural daylight from upper-left, matte oak wood surface or parchment paper, restrained styling, real textures, no labels, no packaging text, no brand marks visible, no excessive shine, no melted theatrics, warm cream-and-ingredient palette.*

Refer to as **[house style]**.

## Notes for series consistency

- Use one seed for all items in a category so the lighting and oak-wood surface read identically across the grid.
- Resist FLUX's tendency to add garnish (parsley sprigs, cracked pepper, lemon wedges) — these are *ingredients*, not finished dishes. Add `no garnish` if the model keeps adding it.
- For canned/jarred items, the goal is "generic deli can/jar" recognizability. Avoid any logo or wordmark; FLUX often hallucinates fake-brand text. If text appears, regenerate.
- Resize before committing: `sips -Z 640 -s formatOptions 78 <file>.jpg`.

---

## Proteins (16)

### rotisserie_chicken

> A whole golden-brown rotisserie chicken with crisp lacquered skin, resting in a plain transparent domed deli container with no labels, slight juice pooling at the base, fresh herbs barely visible. [house style]

### ks_chicken_breasts_boneless_skinless

> Three raw boneless skinless chicken breasts laid flat on white butcher paper, pale pink, freshly trimmed, no marinade, no dressing. [house style]

### ks_chicken_tenderloins_boneless_skinless

> A small mound of raw chicken tenderloins on white butcher paper, six to eight pieces, slender pale-pink strips. [house style]

### ground_beef

> A fresh mound of raw ground beef on white butcher paper, deep red with marbled white flecks, soft texture, no plastic film visible. [house style]

### ground_turkey

> A fresh mound of raw ground turkey on white butcher paper, pale pink, slightly lighter than ground beef, soft texture. [house style]

### ground_bison

> A fresh mound of raw ground bison on white butcher paper, deeper darker red than beef, lean and uniform texture. [house style]

### pork_tenderloin

> Two raw whole pork tenderloins side by side on white butcher paper, long slender pale-pink cylinders, freshly trimmed. [house style]

### ks_thick_sliced_bacon

> A row of six raw thick-cut bacon strips fanned across parchment paper, deep red-pink with white fat striations, no cooking, no curl. [house style]

### ks_frozen_wild_alaskan_sockeye_salmon_fillets

> Two raw skin-on sockeye salmon fillets on parchment paper, deep coral-orange flesh, silver scales on the skin side, no garnish. [house style]

### frozen_cod_fillets

> Three raw cod fillets on parchment paper, opaque white, mild flake texture, no garnish, no skin. [house style]

### ks_frozen_raw_shrimp

> A small heap of raw peeled tail-off shrimp on a small white ceramic plate, pale pink-grey, uniform medium size, no garnish. [house style]

### ks_canned_albacore_tuna

> A simple plain unlabeled steel can on matte oak wood, lid pulled back to reveal solid white tuna packed in clear water, fork resting next to the can. [house style]

### ks_canned_wild_alaskan_pink_salmon

> A simple plain unlabeled steel can on matte oak wood, lid pulled back to reveal pink-orange flaked salmon, no skin or bones visible. [house style]

### ks_canned_chicken_breast

> A simple plain unlabeled steel can on matte oak wood, lid pulled back to reveal chunked white chicken breast in light broth. [house style]

### ks_cage_free_eggs

> An open cardboard egg carton holding twelve large brown eggs, viewed top-down on matte oak wood, no labels, plain pulp pasteboard. [house style]

### organic_firm_tofu

> A single rectangular block of firm tofu on a small white ceramic plate, pale ivory, water glistening lightly on the surface, sharp clean cut edges. [house style]

---

## Canned goods (10)

### ks_organic_diced_tomatoes

> An open plain unlabeled steel can showing diced red tomatoes in their light-pink juice, top-down view on matte oak wood. [house style]

### ks_organic_tomato_sauce

> An open plain unlabeled steel can showing smooth red tomato sauce, slight glossiness, top-down on matte oak wood, small wooden spoon resting next to it. [house style]

### ks_organic_tomato_paste

> A small open plain unlabeled steel can with a thick mound of deep brick-red tomato paste visible, dollop slightly raised above the rim, on matte oak wood. [house style]

### s_w_organic_black_beans

> An open plain unlabeled steel can revealing whole black beans in their dark cooking liquid, top-down on matte oak wood. [house style]

### s_w_organic_garbanzo_beans

> An open plain unlabeled steel can revealing pale tan garbanzo beans in their cooking liquid, top-down on matte oak wood. [house style]

### thai_kitchen_organic_coconut_milk

> An open plain unlabeled steel can showing thick creamy white coconut milk with a slight separation of cream on top, on matte oak wood. [house style]

### ks_organic_chicken_stock

> A simple plain cream-colored cardboard carton of chicken stock standing upright on matte oak wood, no labels or text, gable-top design suggested. [house style]

### better_than_bouillon_chicken

> A small unlabeled glass jar containing dark brown chicken bouillon paste, stainless steel spoon resting against the jar, on matte oak wood. [house style]

### del_monte_canned_corn_whole_kernel

> An open plain unlabeled steel can revealing bright yellow whole kernel corn in light cooking liquid, top-down on matte oak wood. [house style]

### raos_marinara_sauce

> A simple unlabeled clear glass jar of deep red marinara sauce with visible flecks of basil and garlic, lid placed beside it, on matte oak wood. [house style]

---

## Grains & pasta (8)

### ks_thai_hom_mali_jasmine_rice

> A small white ceramic bowl filled with uncooked jasmine rice, long slender white grains, on matte oak wood. [house style]

### royal_basmati_rice

> A small white ceramic bowl filled with uncooked basmati rice, slender pale-ivory grains slightly longer than jasmine, on matte oak wood. [house style]

### ks_organic_quinoa

> A small white ceramic bowl filled with uncooked quinoa, tiny pale tan and ivory grains, on matte oak wood. [house style]

### dry_pasta_spaghetti

> A bundle of dry spaghetti standing upright in a small ceramic crock, golden-yellow strands visible above the rim, on matte oak wood. [house style]

### dry_pasta_short_cuts

> A small white ceramic bowl filled with dry penne pasta tubes, golden-yellow with ridged surface, on matte oak wood. [house style]

### rolled_oats

> A small white ceramic bowl filled with rolled oats, pale beige flakes, on matte oak wood. [house style]

### flour_tortillas

> A stack of six soft flour tortillas on parchment paper, pale ivory color with light browning spots, slight stack offset showing all edges. [house style]

### bread_dave_s_killer

> A whole rustic seeded whole grain bread loaf on a wood cutting board, no packaging, dense crumb visible at one cut end, scattered seeds on top. [house style]

---

## Oils, condiments & seasonings (13)

### ks_organic_extra_virgin_olive_oil

> A simple clear glass bottle of green-gold extra virgin olive oil, no labels, cork stopper, on matte oak wood. [house style]

### avocado_oil

> A simple clear glass bottle of pale-green avocado oil, no labels, dark cap, on matte oak wood. [house style]

### ks_organic_virgin_coconut_oil

> A small clear glass jar of solid white coconut oil, no labels, lid removed beside the jar, on matte oak wood. [house style]

### avocado_oil_spray

> A simple unlabeled spray-can style cooking oil bottle in pale silver, no text or branding, on matte oak wood. [house style]

### soy_sauce

> A small clear glass bottle of dark soy sauce, no labels, narrow neck, on matte oak wood. [house style]

### balsamic_vinegar

> A simple clear glass bottle of dark balsamic vinegar, no labels, on matte oak wood. [house style]

### apple_cider_vinegar

> A simple clear glass bottle of amber apple cider vinegar, no labels, on matte oak wood. [house style]

### honey

> A small clear glass jar of golden raw honey with visible texture, wooden honey dipper resting in the jar, on matte oak wood. [house style]

### sea_salt_himalayan_pink_salt

> A small white ceramic bowl filled with coarse pink Himalayan salt crystals, on matte oak wood, a few crystals scattered around the bowl. [house style]

### black_pepper

> A small white ceramic bowl filled with whole black peppercorns, on matte oak wood, a few peppercorns scattered around the bowl. [house style]

### garlic_powder

> A small white ceramic bowl filled with fine pale tan garlic powder, on matte oak wood, smooth uniform surface. [house style]

### ks_minced_garlic

> A small clear glass jar filled with chopped white-cream garlic in oil, no label, lid open beside the jar, small spoon nearby, on matte oak wood. [house style]

### ks_organic_peanut_butter

> A clear glass jar of natural peanut butter, slight oil layer on top, no label, butter knife resting against the jar, on matte oak wood. [house style]

---

## Dairy & dairy alternatives (9)

### kerrygold_butter_salted

> Four wrapped sticks of butter in plain white paper wrapping, no labels or text, stacked loosely on parchment paper, golden butter visible at the cut ends of one stick. [house style]

### ks_organic_greek_yogurt

> A small white ceramic bowl filled with thick plain greek yogurt, smooth surface with a few small craters, on matte oak wood. [house style]

### ks_shredded_mozzarella

> A small heap of pre-shredded white mozzarella cheese on parchment paper, fluffy texture, top-down view. [house style]

### ks_parmigiano_reggiano

> A wedge of aged Parmigiano Reggiano cheese on a small wood board, characteristic golden rind on three sides, crystalline interior, on matte oak wood. [house style]

### tillamook_medium_cheddar_block

> A rectangular block of medium cheddar cheese, deep yellow-orange, partially unwrapped from white parchment paper, sharp clean cut edge, on matte oak wood. [house style]

### cream_cheese

> A rectangular brick of plain cream cheese on parchment paper, ivory-white, slightly soft edges, no labels. [house style]

### whole_milk_or_2

> A simple plain cream cardboard carton of whole milk standing upright on matte oak wood, gable-top design, no labels or text. [house style]

### ks_almond_milk

> A simple plain cream cardboard carton of almond milk standing upright on matte oak wood, no labels, slightly slimmer profile than dairy milk carton. [house style]

### cottage_cheese

> A small white ceramic bowl filled with curds of cottage cheese, ivory-white with visible curd texture, on matte oak wood. [house style]

---

## Frozen (12)

### ks_organic_frozen_broccoli_florets

> A small heap of fresh-looking broccoli florets on a white ceramic plate, deep green tops with creamy stems, top-down. [house style]

### ks_stir_fry_vegetable_blend

> A small heap of mixed stir-fry vegetables on a white ceramic plate — broccoli florets, sliced carrots, snap peas, red bell pepper strips, baby corn — colorful and uniform. [house style]

### ks_organic_frozen_green_beans

> A small heap of trimmed green beans on a white ceramic plate, vivid green, uniform thin pods, top-down. [house style]

### frozen_cauliflower

> A small heap of cauliflower florets on a white ceramic plate, creamy white with pale green leaf bits, top-down. [house style]

### ks_three_berry_blend

> A small white ceramic bowl filled with mixed berries — blueberries, raspberries, blackberries — vivid jewel tones, on matte oak wood. [house style]

### ks_frozen_blueberries

> A small white ceramic bowl filled with deep blue blueberries, slight bloom on the skin, on matte oak wood. [house style]

### frozen_organic_mango_chunks

> A small white ceramic bowl filled with bright orange-yellow mango chunks, irregular cubes, on matte oak wood. [house style]

### ks_frozen_pineapple_chunks

> A small white ceramic bowl filled with bright yellow pineapple chunks, slight juiciness, on matte oak wood. [house style]

### ks_frozen_chicken_tenderloins

> A small mound of raw chicken tenderloins on white butcher paper, six to eight slender pale-pink strips. [house style]

### just_bare_chicken_breast_chunks

> A small heap of lightly breaded chicken breast chunks on parchment paper, golden-tan crust, bite-sized pieces. [house style]

### frozen_shelled_edamame

> A small white ceramic bowl filled with bright green shelled edamame beans, kidney-shaped, on matte oak wood. [house style]

### frozen_spinach

> A small white ceramic bowl filled with dark green chopped spinach leaves, slightly compressed but loose, on matte oak wood. [house style]

---

## Produce (7)

### bananas

> A bunch of five yellow bananas on matte oak wood, slight green at the stem end, ripe and even. [house style]

### apples

> Three Cosmic Crisp or Honeycrisp apples on matte oak wood, deep red with hints of yellow, varied positions. [house style]

### onions

> Three whole yellow onions with papery golden skin on matte oak wood, intact root and stem ends. [house style]

### garlic

> Two whole garlic bulbs with papery white skin on matte oak wood, intact, one slightly loose clove showing. [house style]

### potatoes

> Four russet potatoes with rough brown skin on matte oak wood, varied sizes, no sprouts. [house style]

### sweet_potatoes

> Three whole sweet potatoes with deep orange-brown skin on matte oak wood, varied sizes, intact. [house style]

### baby_spinach

> A small heap of fresh baby spinach leaves on a white ceramic plate, bright green, tender, top-down view. [house style]
