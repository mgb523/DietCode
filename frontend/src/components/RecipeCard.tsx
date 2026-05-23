import { useState } from "react"
import Fraction from "fraction.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServingStepper } from "@/components/ServingStepper"

interface IngredientLine {
  quantity: string
  unit: string
  ingredient: string
  preparation: string | null
  substitutionNote: string | null
}

interface TransformedRecipe {
  recipeName: string
  ingredients: IngredientLine[]
  instructions: string[]
  servings: number          // already-scaled to user's targetServings by backend
  originalServings: number  // LLM-inferred count; for "(original: N)" label
  warnings: string[]
}

interface Props {
  recipe: TransformedRecipe
}

// Mirror backend ScalingService.SUBLINEAR_KEYWORDS (TRANS-04 requirement)
const SUBLINEAR_KEYWORDS = [
  'baking powder', 'baking soda', 'bicarbonate', 'yeast',
  'salt', 'cayenne', 'chili powder', 'red pepper flakes', 'black pepper',
  'cinnamon', 'nutmeg', 'cloves', 'allspice', 'ginger',
  'cardamom', 'turmeric', 'cumin'
]

function isSubLinear(ingredient: string): boolean {
  const lower = ingredient.toLowerCase()
  return SUBLINEAR_KEYWORDS.some(kw => lower.includes(kw))
}

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
  '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
}

function normalizeQuantity(s: string): string {
  // Replace unicode fraction chars, handling "1½" → "1 1/2"
  return s.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, m => {
    const prev = s[s.indexOf(m) - 1]
    return (prev && /\d/.test(prev) ? ' ' : '') + UNICODE_FRACTIONS[m]
  })
}

const COOKING_FRACTIONS = [0, 1/8, 1/4, 1/3, 3/8, 1/2, 5/8, 2/3, 3/4, 7/8, 1]

function snapToFraction(value: number): string {
  if (value <= 0) return "0"
  const whole = Math.floor(value)
  const remainder = value - whole
  // Find nearest cooking fraction for the remainder
  const nearest = COOKING_FRACTIONS.reduce((a, b) =>
    Math.abs(b - remainder) < Math.abs(a - remainder) ? b : a
  )
  const snapped = whole + nearest
  if (snapped === Math.round(snapped)) return String(Math.round(snapped))
  // Format as fraction string
  const frac = new Fraction(snapped).simplify(0.01)
  return frac.toFraction(true)
}

function scaleQuantity(quantityStr: string, scaleFactor: number): string {
  const trimmed = quantityStr.trim()
  if (!trimmed) return trimmed
  try {
    const parsed = new Fraction(normalizeQuantity(trimmed)).valueOf()
    return snapToFraction(parsed * scaleFactor)
  } catch {
    return quantityStr
  }
}

const TO_TASTE_RE = /^(to taste|as needed|a? ?pinch|a? ?dash|season to taste|q\.?s\.?)$/i

function isToTaste(ing: IngredientLine): boolean {
  return TO_TASTE_RE.test(ing.quantity.trim())
}

function shouldShowUnit(unit: string, ingredient: string): boolean {
  if (!unit) return false
  // Suppress unit when it echoes a word already in the ingredient name
  // e.g. unit="tortillas" ingredient="corn or flour tortillas" → hide unit
  const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return !new RegExp(`\\b${escaped}\\b`, 'i').test(ingredient)
}

function rescaleIngredients(
  ingredients: IngredientLine[],
  fromServings: number,
  toServings: number
): IngredientLine[] {
  // Always run through scaleQuantity (factor=1 normalises "0.25" → "1/4" on initial display)
  if (fromServings <= 0 || toServings <= 0) return ingredients
  const linearFactor = toServings / fromServings
  return ingredients.map(ing => {
    if (isToTaste(ing)) return ing
    const factor = isSubLinear(ing.ingredient) ? Math.sqrt(linearFactor) : linearFactor
    return { ...ing, quantity: scaleQuantity(ing.quantity, factor) }
  })
}

export function RecipeCard({ recipe }: Props) {
  // currentServings starts at recipe.servings (already-scaled by backend at user's initial targetServings)
  const [currentServings, setCurrentServings] = useState(recipe.servings)

  // Rescale quantities client-side relative to backend-returned baseline (no new backend call)
  const displayedIngredients = rescaleIngredients(recipe.ingredients, recipe.servings, currentServings)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{recipe.recipeName}</CardTitle>
        <div className="flex items-center gap-3 mt-1">
          <ServingStepper
            value={currentServings}
            min={1}
            onChange={v => setCurrentServings(v ?? recipe.servings)}
            originalServings={recipe.originalServings !== recipe.servings ? recipe.originalServings : undefined}
          />
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">Ingredients</h3>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          {displayedIngredients.filter(ing => !isToTaste(ing)).map((ing, i) => (
            <li key={i}>
              <span className="font-bold">{ing.quantity}{shouldShowUnit(ing.unit, ing.ingredient) ? ` ${ing.unit}` : ""}</span>{" "}
              {ing.ingredient}
              {ing.preparation && `, ${ing.preparation}`}
            </li>
          ))}
        </ul>
        {displayedIngredients.some(isToTaste) && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-muted-foreground mt-3 mb-1">To taste:</p>
            <ul className="list-disc pl-5 space-y-1">
              {displayedIngredients.filter(isToTaste).map((ing, i) => (
                <li key={i}>
                  {ing.ingredient}
                  {ing.preparation && `, ${ing.preparation}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        <h3 className="font-semibold mb-2">Instructions</h3>
        <ol className="list-decimal pl-5 space-y-1">
          {recipe.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>

        {recipe.warnings.length > 0 && (
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
            <strong>Notes:</strong>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              {recipe.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
