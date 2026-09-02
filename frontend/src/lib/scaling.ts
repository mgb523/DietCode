/**
 * Shared ingredient-scaling utilities.
 *
 * Mirrors backend ScalingService exactly so client-side stepper adjustments
 * and Drive export both produce the same quantities.
 *
 * Single source of truth for:
 *   - sub-linear keyword list
 *   - spice-unit detection
 *   - fraction snapping (¼ for spoons, ⅛ for bulk)
 *   - rescaleIngredients()
 */

import Fraction from "fraction.js"

export interface IngredientLine {
  quantity: string | null
  unit: string | null
  ingredient: string | null
  preparation: string | null
  substitutionNote: string | null
}

// ── Constants (mirror ScalingService) ────────────────────────────────────────

const SUBLINEAR_KEYWORDS = [
  "baking powder", "baking soda", "bicarbonate", "yeast",
  "salt",
  "cayenne", "chili powder", "red pepper flakes", "black pepper",
  "cinnamon", "nutmeg", "cloves", "allspice",
  "ginger", "cardamom", "turmeric", "cumin",
]

// Only ¼-increment measuring-spoon tools exist for these units.
const SPICE_UNITS = new Set([
  "tsp", "teaspoon", "teaspoons",
  "tbsp", "tablespoon", "tablespoons",
])

// Ingredients that must always be a whole number — no such thing as half a garlic clove.
const WHOLE_UNIT_KEYWORDS = ["garlic"]

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4",
  "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5",
  "⅙": "1/6", "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
}

// Bulk: ⅛-cup accuracy (1/3 and 2/3 cup measures exist)
const BULK_FRACTIONS  = [0, 1/8, 1/4, 1/3, 3/8, 1/2, 5/8, 2/3, 3/4, 7/8, 1]
// Spice: ¼-spoon accuracy (no ⅓-tsp spoon exists)
const SPICE_FRACTIONS = [0, 1/4, 1/2, 3/4, 1]

export const TO_TASTE_RE =
  /^(to taste|as needed|a? ?pinch|a? ?dash|season to taste|q\.?s\.?)$/i

// ── Predicates ───────────────────────────────────────────────────────────────

export function isSubLinear(ingredient: string): boolean {
  const lower = ingredient.toLowerCase()
  return SUBLINEAR_KEYWORDS.some(kw => lower.includes(kw))
}

/** True when the ingredient must round to ¼ increments after scaling. */
/** True when the ingredient quantity must be a whole number after scaling (ceiling). */
export function isWholeUnit(ingredient: string): boolean {
  const lower = ingredient.toLowerCase()
  return WHOLE_UNIT_KEYWORDS.some(kw => lower.includes(kw))
}

export function isSpiceMeasure(unit: string | null, ingredient: string | null): boolean {
  return (
    SPICE_UNITS.has((unit ?? "").trim().toLowerCase()) ||
    isSubLinear(ingredient ?? "")
  )
}

export function isToTaste(ing: IngredientLine): boolean {
  return TO_TASTE_RE.test((ing.quantity ?? "").trim())
}

/**
 * Returns false when the unit word is already present in the ingredient name,
 * so we don't render "tortillas corn or flour tortillas".
 */
export function shouldShowUnit(unit: string | null, ingredient: string | null): boolean {
  if (!unit) return false
  const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return !new RegExp(`\\b${escaped}\\b`, "i").test(ingredient ?? "")
}

// ── Fraction arithmetic ──────────────────────────────────────────────────────

function normalizeQuantity(s: string): string {
  return s.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, m => {
    const prev = s[s.indexOf(m) - 1]
    return (prev && /\d/.test(prev) ? " " : "") + UNICODE_FRACTIONS[m]
  })
}

function snapToFraction(value: number, spice: boolean): string {
  if (value <= 0) return "0"
  const fractions = spice ? SPICE_FRACTIONS : BULK_FRACTIONS
  const whole = Math.floor(value)
  const remainder = value - whole
  const nearest = fractions.reduce((a, b) =>
    Math.abs(b - remainder) < Math.abs(a - remainder) ? b : a
  )
  const snapped = whole + nearest
  if (snapped === Math.round(snapped)) return String(Math.round(snapped))
  const frac = new Fraction(snapped).simplify(0.01)
  return frac.toFraction(true)
}

function scaleQuantity(
  quantityStr: string,
  scaleFactor: number,
  spice: boolean,
  wholeUnit: boolean,
): string {
  const trimmed = quantityStr.trim()
  if (!trimmed) return trimmed
  try {
    const parsed = new Fraction(normalizeQuantity(trimmed)).valueOf()
    const scaled = parsed * scaleFactor
    if (wholeUnit) {
      // Ceiling to nearest whole — never suggest a partial garlic clove
      return String(Math.max(1, Math.ceil(scaled)))
    }
    return snapToFraction(scaled, spice)
  } catch {
    return quantityStr
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Rescale all ingredients from one serving count to another.
 *
 * Always runs through scaleQuantity (factor = 1 normalises "0.25" → "1/4"
 * on initial display).  Sub-linear ingredients use √factor; everything else
 * scales linearly.  Spices snap to ¼ increments; bulk snaps to ⅛.
 */
export function rescaleIngredients(
  ingredients: IngredientLine[],
  fromServings: number,
  toServings: number,
): IngredientLine[] {
  if (fromServings <= 0 || toServings <= 0) return ingredients
  const linearFactor = toServings / fromServings
  return ingredients.map(ing => {
    if (isToTaste(ing)) return ing
    const factor    = isSubLinear(ing.ingredient ?? "") ? Math.sqrt(linearFactor) : linearFactor
    const spice     = isSpiceMeasure(ing.unit, ing.ingredient)
    const wholeUnit = isWholeUnit(ing.ingredient ?? "")
    return {
      ...ing,
      quantity: ing.quantity != null ? scaleQuantity(ing.quantity, factor, spice, wholeUnit) : null,
    }
  })
}
