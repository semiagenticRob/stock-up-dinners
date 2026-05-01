/**
 * Scale a hand-written `display_quantity` string by a factor.
 *
 * The catalog's display quantities are recipe-default-servings prose like
 * "2 tbsp", "1 can (15 oz), drained", "5–6 fillets (about 2 lb)", "½ tsp".
 * When the user adjusts servings, we want those to scale.
 *
 * The scaler parses the leading numeric token (single value, range, or unicode
 * fraction, with or without a leading whole number) and multiplies. The rest
 * of the string (units, parentheticals, instructions) is left untouched. If
 * parsing fails, we append a scale annotation so the cook can do the math.
 */

const FRACTION_VALUES: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};
const FRACTION_GLYPHS = Object.keys(FRACTION_VALUES).join("");

const PREFERRED_FRACTIONS: Array<[number, string]> = [
  [0.125, "⅛"],
  [0.25, "¼"],
  [1 / 3, "⅓"],
  [0.5, "½"],
  [2 / 3, "⅔"],
  [0.75, "¾"],
];

export function scaleDisplayQuantity(input: string, scale: number): string {
  if (!input) return input;
  if (Math.abs(scale - 1) < 1e-9) return input;

  // Range, e.g. "5–6 fillets (about 2 lb)" or "5-6 fillets"
  const range = input.match(/^(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)(.*)$/);
  if (range) {
    const a = parseFloat(range[1]) * scale;
    const b = parseFloat(range[2]) * scale;
    return `${formatNumber(a)}–${formatNumber(b)}${range[3]}`;
  }

  // Mixed number with unicode fraction: "1½ tsp"
  const mixed = input.match(new RegExp(`^(\\d+)([${FRACTION_GLYPHS}])(.*)$`));
  if (mixed) {
    const n = (parseInt(mixed[1], 10) + FRACTION_VALUES[mixed[2]]) * scale;
    return `${formatNumber(n)}${mixed[3]}`;
  }

  // Bare unicode fraction: "½ tsp"
  const fractionOnly = input.match(new RegExp(`^([${FRACTION_GLYPHS}])(.*)$`));
  if (fractionOnly) {
    const n = FRACTION_VALUES[fractionOnly[1]] * scale;
    return `${formatNumber(n)}${fractionOnly[2]}`;
  }

  // Single decimal/integer: "2 tbsp", "1.5 cups", "1 can (15 oz), drained"
  const single = input.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (single) {
    const n = parseFloat(single[1]) * scale;
    return `${formatNumber(n)}${single[2]}`;
  }

  // Couldn't parse — let the cook do the math.
  return `${input} (×${formatNumber(scale)})`;
}

function formatNumber(n: number): string {
  if (n <= 0) return "0";
  const whole = Math.floor(n);
  const frac = n - whole;

  // Try to land on a preferred fraction within 5% tolerance
  for (const [value, glyph] of PREFERRED_FRACTIONS) {
    if (Math.abs(frac - value) < 0.05) {
      return whole > 0 ? `${whole}${glyph}` : glyph;
    }
  }

  // Fractional component negligible → integer
  if (frac < 0.05) return String(whole);
  // Fractional component nearly 1 → round up
  if (frac > 0.95) return String(whole + 1);

  // Fall back to one decimal, dropping trailing zeros
  return n.toFixed(1).replace(/\.?0+$/, "");
}
