import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  servings: number
  warnings: string[]
}

interface Props {
  recipe: TransformedRecipe
}

export function RecipeCard({ recipe }: Props) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{recipe.recipeName}</CardTitle>
        <p className="text-sm text-muted-foreground">Serves {recipe.servings}</p>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">Ingredients</h3>
        <ul className="list-disc pl-5 space-y-1 mb-6">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>
              {ing.quantity} {ing.unit} {ing.ingredient}
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
