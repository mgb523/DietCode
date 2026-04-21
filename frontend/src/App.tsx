import { useEffect, useState } from "react"
import { RecipeCard } from "@/components/RecipeCard"

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

export default function App() {
  const [recipe, setRecipe] = useState<TransformedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("http://localhost:8080/api/recipe/transform", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: "phase-1-integration-check",
        dietProfiles: [],
        intolerances: []
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend returned ${res.status}`)
        return res.json() as Promise<TransformedRecipe>
      })
      .then((data) => {
        setRecipe(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <main className="min-h-screen p-8 bg-background">
      <h1 className="text-2xl font-bold text-center mb-8">DietCode</h1>
      {loading && (
        <p className="text-center text-muted-foreground">Loading recipe...</p>
      )}
      {error && (
        <p className="text-center text-destructive">Error: {error}. Is the backend running on port 8080?</p>
      )}
      {recipe && <RecipeCard recipe={recipe} />}
    </main>
  )
}
