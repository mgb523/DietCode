import { useState } from "react"
import { RecipeCard } from "@/components/RecipeCard"
import { DietPillGroup } from "@/components/DietPillGroup"
import { TagInput } from "@/components/TagInput"
import { Loader2 } from "lucide-react"
import { UrlDetectionBadge } from "@/components/UrlDetectionBadge"
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
  servings: number
  originalServings: number
  warnings: string[]
}

export default function App() {
  const [recipe, setRecipe] = useState<TransformedRecipe | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formCollapsed, setFormCollapsed] = useState(false)

  const [recipeText, setRecipeText] = useState("")
  const [selectedDiets, setSelectedDiets] = useState<string[]>([])
  const [intolerances, setIntolerances] = useState<string[]>([])
  const [targetServings, setTargetServings] = useState<number | null>(null)

  const isUrlInput = recipeText.startsWith("http://") || recipeText.startsWith("https://")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("http://localhost:8080/api/recipe/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: recipeText,
          dietProfiles: selectedDiets,
          intolerances,
          targetServings
        })
      })
      if (!res.ok) {
        if (isUrlInput) {
          const body = await res.json().catch(() => ({})) as Record<string, string>
          if (body.error === "scraping_failed") {
            setError("Couldn't import this URL. Open it, copy the recipe text, and paste it here.")
            return
          }
        }
        throw new Error(`Backend returned ${res.status}`)
      }
      const data = await res.json() as TransformedRecipe
      setRecipe(data)
      setFormCollapsed(true)
    } catch {
      setError("Transformation failed — please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">DietCode</h1>

      {!formCollapsed && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <label className="block text-sm mb-2">Your Recipe</label>
            <div className="relative">
              <UrlDetectionBadge visible={isUrlInput} />
              <textarea
                className="w-full resize-y border rounded-md p-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                rows={10}
                placeholder="Paste your recipe here, or enter a URL..."
                value={recipeText}
                onChange={e => setRecipeText(e.target.value)}
                required
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Diet profiles</label>
              <DietPillGroup selected={selectedDiets} onChange={setSelectedDiets} />
            </div>
            <div>
              <label className="block text-sm mb-2">Ingredients to omit or replace</label>
              <TagInput
                tags={intolerances}
                onChange={setIntolerances}
                placeholder="peanuts, dairy, shellfish — press Enter to add"
              />
            </div>
          </section>

          <section>
            <label className="block text-sm mb-2">Servings</label>
            <ServingStepper value={targetServings} min={1} onChange={setTargetServings} />
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="inline mr-2 h-4 w-4 animate-spin" />Transforming...</>
            ) : (
              "Transform Recipe"
            )}
          </button>

          {error && (
            <p className="text-sm text-destructive mt-2">⚠ {error}</p>
          )}
        </form>
      )}

      {formCollapsed && recipe && (
        <div className="mt-8">
          <button
            type="button"
            className="text-sm text-muted-foreground underline mb-4"
            onClick={() => {
              setFormCollapsed(false)
              setRecipe(null)
              setError(null)
              // recipeText, selectedDiets, intolerances intentionally preserved (D-02)
            }}
          >
            Edit / start over
          </button>
          <RecipeCard recipe={recipe} />
        </div>
      )}
    </main>
  )
}
