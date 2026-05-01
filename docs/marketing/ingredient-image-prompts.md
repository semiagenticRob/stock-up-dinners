# Ingredient Image Prompts — Stock Up Dinners

FLUX.1 prompts for ingredient tile images used in the pantry tracker and shopping list UI.

## FLUX.1 settings

- `--ar 16:10` — landscape tile (component uses object-fit: cover, renders square at 48×48px)
- `--seed N` — use one seed per category for consistent surface/light
- Save to: `web/public/images/ingredients/<slug>.jpg`
- Resize: `sips -Z 640 -s formatOptions 78 <file>.jpg`

## House style

Append to every prompt:

> *Top-down editorial food photography, soft natural daylight from upper-left, warm cream linen runner on a matte oak wood surface, pale stoneware or simple white ceramic, real textures, clean background, no excessive styling, warm cream-and-ingredient palette.*

Referred to below as **[house style]**.

---

## Proteins (seed: 1001)

### chicken-breast
> Two raw boneless skinless chicken breasts on a pale stoneware plate, natural pink-cream color, small sprig of fresh thyme beside them. [house style]

### ground-beef
> A mound of raw ground beef loosely piled in a pale stoneware low bowl, deep red-brown color, visible texture. [house style]

### salmon
> A single raw sockeye salmon fillet, deep orange-pink, on a pale stoneware plate, skin side visible, small lemon slice beside it. [house style]

### ground-turkey
> A mound of raw ground turkey in a pale stoneware bowl, pale pink-beige color, fresh texture, small rosemary sprig. [house style]

### shrimp
> A handful of large raw shrimp, shell-on, tails visible, arranged loosely on a pale stoneware plate, translucent pink-grey color. [house style]

### pork-tenderloin
> A raw pork tenderloin on a pale stoneware plate, silver-pink, slightly glistening, tied with kitchen twine at two points. [house style]

### tilapia
> Two raw tilapia fillets, pale white-pink, on a pale stoneware plate, small wedge of lime beside them. [house style]

---

## Grains & Pasta (seed: 1002)

### jasmine-rice
> A small white ceramic bowl of dry jasmine rice, white and slightly translucent grains, overflowing gently over the rim. [house style]

### spaghetti
> A bundle of dry spaghetti noodles fanned slightly, pale wheat-yellow, resting diagonally on cream linen surface. [house style]

### penne
> A handful of dry penne pasta scattered loosely on a cream linen surface, pale yellow, ribbed texture visible. [house style]

### quinoa
> A small white ceramic bowl of dry quinoa, pale ivory with subtle spiral germ visible, slightly overflowing. [house style]

---

## Canned Goods (seed: 1003)

### black-beans
> A small pale stoneware bowl of cooked black beans, deep glossy black, few beans spilling over the edge, small cilantro sprig. [house style]

### diced-tomatoes
> A small white ceramic bowl of diced canned tomatoes, bright red chunks in clear liquid, sprig of fresh basil beside it. [house style]

### coconut-milk
> An open can of coconut milk poured slightly into a small white ceramic bowl showing thick cream layer on top, pale ivory. [house style]

### corn
> A small pale stoneware bowl of sweet corn kernels, bright golden yellow, a few kernels scattered on the linen surface beside it. [house style]

### garbanzo-beans
> A small white ceramic bowl of cooked garbanzo beans, pale golden tan, slightly glossy, few beans beside the bowl. [house style]

---

## Produce (seed: 1004)

### broccoli
> A small head of fresh broccoli and two florets beside it on cream linen, deep green, tight buds, clean cut stem. [house style]

### bell-pepper
> One red bell pepper and one cut half showing seeds and ribs, bright red, on cream linen surface. [house style]

### sweet-potato
> Two medium sweet potatoes, russet-orange skin, one sliced to show bright orange interior, on cream linen. [house style]

### spinach
> A small pile of fresh baby spinach leaves, deep forest green, slightly overlapping, on a pale stoneware plate. [house style]

### lime
> Two limes, one whole and one halved showing bright green-yellow interior, on cream linen. [house style]

---

## Dairy (seed: 1005)

### cheddar
> A small wedge of cheddar cheese, orange-yellow, slight crumble at the cut edge, beside a small pile of shredded cheddar. Pale stoneware plate. [house style]

### mozzarella
> A ball of fresh mozzarella, ivory-white, slightly wet, on a pale stoneware plate, small fresh basil leaf beside it. [house style]

### greek-yogurt
> A small white ceramic bowl of thick Greek yogurt, bright white, swirled slightly with a spoon resting in the bowl. [house style]

### sour-cream
> A small white ceramic bowl of sour cream, bright white, thick and glossy, small dollop on top. [house style]

---

## Frozen (seed: 1006)

### edamame
> A small pale stoneware bowl of shelled edamame, bright vivid green, slight sheen, few scattered on linen beside bowl. [house style]

---

## To use end-to-end

1. Generate via FLUX with `--ar 16:10 --seed N` (one seed per category)
2. Save outputs as `web/public/images/ingredients/<slug>.jpg`
3. Resize: `sips -Z 640 -s formatOptions 78 <file>.jpg`
4. Commit + push — the tile component picks up the swap with no code change
