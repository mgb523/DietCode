import { useState } from "react"
import { RecipeCard } from "@/components/RecipeCard"
import { DietPillGroup } from "@/components/DietPillGroup"
import { TagInput } from "@/components/TagInput"
import { Loader2 } from "lucide-react"
import { UrlDetectionBadge } from "@/components/UrlDetectionBadge"
import { ServingStepper } from "@/components/ServingStepper"
import { ComparisonLayout } from "@/components/ComparisonLayout"
import { ExportToolbar } from "@/components/ExportToolbar"
import dietcodeLogo from "@/assets/dietcode-logo.svg"

const DIET_LABELS: Record<string, string> = {
  KETO: "Keto",
  VEGAN: "Vegan",
  VEGETARIAN: "Vegetarian",
  GLUTEN_FREE: "Gluten-free",
  PALEO: "Paleo",
  WHOLE30: "Whole30",
}

interface IngredientLine {
  quantity: string | null
  unit: string | null
  ingredient: string | null
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
  originalIngredients?: IngredientLine[]
  originalInstructions?: string[]
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
      setTargetServings(data.originalServings || null)
      setFormCollapsed(true)
    } catch {
      setError("Transformation failed — please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="w-full bg-emerald-700 text-white py-4 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        <img
          src={dietcodeLogo}
          alt=""
          aria-hidden="true"
          className="h-9 w-9 flex-shrink-0"
        />
        <h1 className="text-2xl font-bold text-white leading-none">DietCode</h1>
      </header>
      <main className="px-4 py-8">

      <div className="max-w-2xl mx-auto">
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
                  onChange={e => {
                    const val = e.target.value
                    setRecipeText(val)
                    const isUrl = val.startsWith("http://") || val.startsWith("https://")
                    setTargetServings(isUrl ? null : 2)
                  }}
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

            {!isUrlInput && (
              <section>
                <label className="block text-sm mb-2">Servings</label>
                <ServingStepper value={targetServings} min={1} onChange={setTargetServings} />
              </section>
            )}

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
      </div>

      {formCollapsed && recipe && (
        <div className="mt-8">
          <div className="max-w-5xl mx-auto">
            <button
              type="button"
              className="text-sm text-muted-foreground underline mb-4 print:hidden"
              onClick={() => {
                setFormCollapsed(false)
                setRecipe(null)
                setError(null)
                // recipeText, selectedDiets, intolerances intentionally preserved (D-02)
              }}
            >
              Edit / start over
            </button>
          </div>
          <div className="max-w-5xl mx-auto mb-6 print:hidden">
            <ExportToolbar recipe={recipe} selectedDiets={selectedDiets} />
          </div>
          <ComparisonLayout>
            <section aria-label="Original recipe" className="flex-1 min-w-0 print:hidden">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">
                Original
              </p>
              {isUrlInput ? (
                // URL import: show structured data scraped from the page
                recipe.originalIngredients && recipe.originalIngredients.length > 0 ? (
                  <div className="text-sm space-y-4">
                    <div>
                      <p className="font-semibold mb-1">Ingredients</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {recipe.originalIngredients.map((ing, i) => (
                          <li key={i}>{ing.ingredient}</li>
                        ))}
                      </ul>
                    </div>
                    {recipe.originalInstructions && recipe.originalInstructions.length > 0 && (
                      <div>
                        <p className="font-semibold mb-1">Instructions</p>
                        <ol className="list-decimal pl-5 space-y-1">
                          {recipe.originalInstructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Original recipe unavailable.
                  </p>
                )
              ) : (
                // Text paste: show exactly what was pasted — no parsing, always accurate
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{recipeText}</pre>
              )}
            </section>
            <section aria-label="Adapted recipe" className="flex-1 min-w-0">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-1 print:hidden">
                Adapted
              </p>
              {(selectedDiets.length > 0 || intolerances.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedDiets.map(d => (
                    <span key={d} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {DIET_LABELS[d] ?? d.toLowerCase().replace(/_/g, " ")}
                    </span>
                  ))}
                  {intolerances.map(ing => (
                    <span key={ing} className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border">
                      no {ing}
                    </span>
                  ))}
                </div>
              )}
              <RecipeCard recipe={recipe} className="max-w-none" />
            </section>
          </ComparisonLayout>
        </div>
      )}
    </main>
    </>
  )
}
