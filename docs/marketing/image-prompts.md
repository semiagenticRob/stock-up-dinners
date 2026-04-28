# Image prompts — Stock Up Dinners

FLUX.1 prompts grounded in the actual 14 dinners from `PLAN.md` (Cycle 1) and the brand direction locked in for the marketing site (warm, pragmatic, no AI-glossy, no melted-cheese theatrics).

## FLUX.1 settings

Append the appropriate aspect ratio for the use case:

- `--ar 4:5` — recipe cards in the PDF, square-ish social
- `--ar 2:3` — Pinterest pins (1000×1500)
- `--ar 1.91:1` — Open Graph / Twitter cards (1200×630)
- `--ar 16:9` — site hero / blog header

Use `--seed N` (any integer) and reuse it across a series of meals to keep lighting and surfaces consistent.

## House style

Paste this at the end of every meal prompt before the FLUX flags:

> *Top-down editorial cookbook food photography, soft natural daylight from upper-left, warm cream linen runner on a matte oak wood surface, pale stoneware or simple white ceramic, restrained styling, real textures, no excessive steam, no glossy varnish, no neon saturation, warm cream-and-ingredient palette.*

Refer to this below as **[house style]**.

---

## Per-meal prompts (Cycle 1 — 14 dinners)

### 01 — Chicken Burrito Bowls

> Cubed roasted chicken breast, fluffy jasmine rice, black beans, sweet corn, melted shredded cheddar in a low pale stoneware bowl. Half a lime wedge on the rim. [house style]

### 02 — Beef Bolognese over Spaghetti

> A nest of spaghetti twirled in rich beef bolognese with diced tomato, fresh shaved Parmigiano on top, a torn basil leaf. White ceramic shallow bowl. [house style]

### 03 — Teriyaki Salmon & Broccoli Rice

> A glossy teriyaki-glazed sockeye salmon fillet, white jasmine rice, charred broccoli florets, scattered toasted sesame seeds. Pale stoneware plate. [house style]

### 04 — Chicken & Veggie Stir-Fry

> Sliced chicken tenderloin with stir-fry vegetables (red bell pepper, broccoli, snap peas, carrot ribbons) over jasmine rice, glossy soy-garlic sauce, no excessive shine. Wide pale stoneware bowl. [house style]

### 05 — Turkey Chili

> Hearty ground turkey chili with black beans, diced tomato, sweet corn kernels, in a deep cream stoneware bowl. Topped with a small dollop of sour cream, a pinch of grated cheddar, fresh cilantro leaves. Spoon resting in the bowl. [house style]

### 06 — Coconut Shrimp Curry

> Plump shrimp simmered in golden coconut curry sauce with stir-fry vegetables, served over fluffy jasmine rice. Cilantro and lime wedge garnish. Wide white ceramic bowl. [house style]

### 07 — Baked Penne Bolognese

> A small foil pan of baked penne pasta in beef bolognese, blanketed with melted mozzarella and pockets of wilted spinach, browned on top. The corner of the pan with one scooped serving missing, a wooden spoon resting alongside. [house style]

### 08 — Chicken Tikka-Style Bowls

> Diced chicken tikka in deep red-orange tomato-yogurt sauce, fluffy basmati rice, garbanzo beans on the side, swirl of yogurt drizzle, fresh cilantro. Pale stoneware bowl. [house style]

### 09 — Roasted Pork Tenderloin Plates

> Sliced roasted pork tenderloin medallions, roasted sweet potato wedges with charred edges, blistered green beans with garlic flecks. White ceramic dinner plate. [house style]

### 10 — Fish Taco Kits

> Two soft flour tortilla tacos filled with flaky pan-seared cod, shredded cabbage slaw, black beans, sweet corn, lime wedge, fresh cilantro. Plated on a pale stoneware oval. [house style]

### 11 — Peanut Chicken Noodles

> Spaghetti coated in glossy peanut-soy sauce, sliced chicken tenderloin, bright green edamame, scattered toasted sesame seeds. Wide white ceramic bowl, pair of chopsticks resting on the rim. [house style]

### 12 — Beef & Black Bean Burritos

> A flour tortilla burrito sliced diagonally to reveal seasoned ground beef, black beans, fluffy rice, melted cheddar inside. On a wood cutting board, second whole burrito beside it, lime wedge and a small bowl of salsa nearby. [house style]

### 13 — Salmon Quinoa Power Bowls

> Flaked roasted sockeye salmon over fluffy quinoa, bright green edamame, fresh baby spinach leaves, balsamic glaze drizzled in a thin line across the top. Pale stoneware low bowl. [house style]

### 14 — Chicken Parm & Pasta

> Breaded chicken cutlet topped with rich marinara and bubbling melted mozzarella, plated alongside spaghetti dressed in marinara. Fresh basil leaf, a dusting of grated Parmigiano. White ceramic plate. [house style]

---

## Lifestyle / marketing prompts

### Cook Day spread

> Editorial overhead kitchen scene: a worn oak wood counter lined with seven aluminum foil pans, each containing a different prepped meal, lids partly closed, masking-tape labels with handwritten meal names. A wooden spoon, a half-used roll of foil, a kitchen towel, and a cutting board with chopped herbs at the edge. Soft natural daylight from a window. Warm, lived-in, organized. Top-down, slightly tilted. [house style]

### Costco staples haul

> Three large Costco-style brown paper grocery bags on a kitchen island, overflowing with whole rotisserie chicken-shaped packaging, large bags of jasmine rice and pasta, jars of marinara, a bunch of bananas, a pack of avocados, a flat of eggs visible through the top. Cream linen runner. Warm daylight. Real groceries, not stylized. [house style]

### Reheat moment

> Close-up at a 30-degree angle: a foil pan freshly out of the oven, foil lid peeled back to reveal bubbling baked penne bolognese with browned mozzarella. Light steam, oven mitt edge visible, wooden trivet under the pan. Warm tungsten + window light blend, evening kitchen mood. [house style]

### Family table scene

> A casual family-of-four dinner table mid-meal: four white ceramic plates with portions of beef bolognese over spaghetti, glasses of water, a kid's hand reaching for the parm shaker (face out of frame), a paper napkin slightly crumpled, an open meal-plan PDF beside one plate. Warm overhead pendant light. Real, unstaged, slightly imperfect. [house style]

### Container library

> Top-down: a row of stacked, labeled foil pans and gallon freezer bags inside a clean refrigerator, each label hand-written in black marker (meal names visible: "Bolognese — reheat 350° 25min", "Chili — stovetop"). Crisp white interior, soft cool daylight. Organized, system-feeling, no clutter. [house style]

---

## Pinterest pin scaffolds (1000 × 1500, `--ar 2:3`)

### Pin A — "14 dinners. One Costco trip."

> Vertical 2:3 composition. Top two-thirds: an overhead photo of seven foil pans arranged in a 2×3+1 grid on cream linen, each pan visibly different (bolognese, salmon, chili, etc.). Bottom one-third: solid `#0F172A` ink-black panel with bold white sans-serif text "14 DINNERS." on the first line and "ONE COSTCO TRIP." on the second, plus a small crimson square mark + "STOCK UP DINNERS" wordmark. [house style] for the photo half.

### Pin B — "Two cook days. Two weeks of dinner."

> Vertical 2:3 composition. Photo half: a kitchen counter with a person's hands (face out of frame) labeling a foil pan with masking tape, a roll of foil and a wooden spoon nearby. Warm daylight. Bottom half: solid white panel with bold ink-black sans-serif text "TWO COOK DAYS." / "TWO WEEKS OF DINNER." and a small red accent rule + url "stockupdinners.com". [house style] for the photo.

### Pin C — Meal grid teaser

> Vertical 2:3 composition. A 2×4 grid of square food photos (8 of the 14 meals, edge-to-edge with thin white gutters between): burrito bowl, bolognese, salmon, stir-fry, chili, shrimp curry, baked penne, tikka. Below the grid: ink-black bar with white text "STOCK UP DINNERS — 14 DINNERS, 2 COOK DAYS, 1 LIST." [house style] for each cell.

---

## Notes for production

- **Series consistency:** lock `--seed` per series so all 14 meal photos share the same surface, lighting, and stoneware palette. Pick a seed by generating Meal 01 first; once the surface looks right, reuse that seed for Meals 02–14.
- **Negatives to avoid (FLUX has no negative prompt, so describe the absence in the positive prompt):** no plastic-looking food, no excessive cheese strings, no over-styled garnish piles, no glowing edges, no shallow depth-of-field haze, no fingerprints on glass.
- **Surface alternatives** if oak wood reads too dark for some meals: swap "matte oak wood" for "weathered cream-painted plank" (lighter mood) or "white marble slab" (cleaner, more editorial). Keep the rest of the house style.
- **Per-meal hints** worth trying as variants:
  - Meals 1, 8, 13 (bowls): try a 30° angle as an alternate to top-down — bowl food often photographs better with rim shadow.
  - Meal 7 (Baked Penne): the foil-pan-shot is the right hero; try also a single plated portion for the recipe card.
  - Meal 10 (Fish Tacos): kit-style flatlay (tortillas + bowls of components) is a strong alt for the PDF.
- **OG image:** the production OG image should match Pin A's bottom-third treatment but cropped to `--ar 1.91:1` (1200×630). Alternatively, use the existing `web/public/og-default.png` placeholder and replace before launch distribution.
