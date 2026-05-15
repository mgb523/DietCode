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

function scaleQuantity(quantityStr: string, scaleFactor: number): string {
  const trimmed = quantityStr.trim()
  if (!trimmed) return trimmed
  try {
    return new Fraction(trimmed).mul(scaleFactor).toFraction(true)
  } catch {
    // Fraction.js throws on "to taste", "a pinch", empty — return unchanged
    return quantityStr
  }
}

function rescaleIngredients(
  ingredients: IngredientLine[],
  fromServings: number,
  toServings: number
): IngredientLine[] {
  if (fromServings === toServings || fromServings <= 0 || toServings <= 0) return ingredients
  const linearFactor = toServings / fromServings
  return ingredients.map(ing => {
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
            onChange={setCurrentServings}
            originalServings={recipe.originalServings !== recipe.servings ? recipe.originalServings : undefined}
          />
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">Ingredients</h3>
        <ul className="list-disc pl-5 space-y-1 mb-6">
          {displayedIngredients.map((ing, i) => (
            <li key={i}>
              <span className="font-bold">{ing.quantity} {ing.unit}</span>{" "}
              {ing.ingredient}
              {ing.preparation && `, ${ing.preparation}`}
            </li>
          ))}
        </ul>

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
