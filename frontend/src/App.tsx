import { useState } from "react"
import { RecipeCard } from "@/components/RecipeCard"
import { DietPillGroup } from "@/components/DietPillGroup"
import { TagInput } from "@/components/TagInput"
import { Loader2 } from "lucide-react"
import { UrlDetectionBadge } from "@/components/UrlDetectionBadge"
import { ServingStepper } from "@/components/ServingStepper"
import { ComparisonLayout } from "@/components/ComparisonLayout"
import { ExportToolbar } from "@/components/ExportToolbar"
import dietcodeLogo  from "@/assets/dietcode-logo.svg"
import dietcodeRobot from "@/assets/dietcode-robot.svg"

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
        const body = await res.json().catch(() => ({})) as Record<string, string>
        if (isUrlInput && body.error === "scraping_failed") {
          setError("Couldn't import this URL. Open it, copy the recipe text, and paste it here.")
          return
        }
        const detail = body.message || body.error || `Backend returned ${res.status}`
        throw new Error(detail)
      }
      const data = await res.json() as TransformedRecipe
      setRecipe(data)
      setTargetServings(data.originalServings || null)
      setFormCollapsed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transformation failed — please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header
        className="w-full text-white py-5 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2 shadow-lg"
        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%)" }}
      >
        <div className="flex items-center justify-center gap-5 sm:gap-8">
          {/* Kale + fruit — left of title */}
          <img
            src={dietcodeLogo}
            alt=""
            aria-hidden="true"
            className="h-14 sm:h-16 drop-shadow-lg flex-shrink-0"
          />

          {/* Brand name */}
          <h1 className="font-veggieburger text-5xl sm:text-6xl text-white leading-none drop-shadow-md">
            DietCode
          </h1>

          {/* Robot — right of title */}
          <img
            src={dietcodeRobot}
            alt=""
            aria-hidden="true"
            className="h-16 sm:h-20 drop-shadow-lg flex-shrink-0"
          />
        </div>

        <p className="font-veggieburger text-amber-100 text-sm sm:text-base opacity-90 drop-shadow-sm">
          Recipe transformation, your way
        </p>
      </header>
      <main className="px-4 sm:px-6 lg:px-8 py-8" style={{ background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 160px)" }}>

      <div className="max-w-2xl mx-auto">
        {!formCollapsed && (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-sm border border-amber-100 p-6 sm:p-8">
            <section>
              <label className="block font-veggieburger text-base text-stone-700 mb-2">Your Recipe</label>
              <div className="relative">
                <UrlDetectionBadge visible={isUrlInput} />
                <textarea
                  className="w-full resize-y border rounded-md p-3 text-sm bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                <label className="block font-veggieburger text-base text-stone-700 mb-2">Diet profiles</label>
                <DietPillGroup selected={selectedDiets} onChange={setSelectedDiets} />
              </div>
              <div>
                <label className="block font-veggieburger text-base text-stone-700 mb-2">Ingredients to omit or replace</label>
                <TagInput
                  tags={intolerances}
                  onChange={setIntolerances}
                  placeholder="peanuts, dairy, shellfish — press Enter to add"
                />
              </div>
            </section>

            {!isUrlInput && (
              <section>
                <label className="block font-veggieburger text-base text-stone-700 mb-2">Servings</label>
                <ServingStepper value={targetServings} min={1} onChange={setTargetServings} />
              </section>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground font-veggieburger text-lg disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="inline mr-2 h-4 w-4 animate-spin" />Transforming...</>
              ) : (
                "Mod This Recipe"
              )}
            </button>

            {error && (
              <p role="alert" className="text-sm text-destructive mt-2">⚠ {error}</p>
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
              <p className="font-veggieburger text-lg text-muted-foreground mb-2">
                Original
              </p>
              {isUrlInput ? (
                // URL import: show structured data scraped from the page
                recipe.originalIngredients && recipe.originalIngredients.length > 0 ? (
                  <div className="text-sm space-y-4">
                    <div>
                      <p className="font-veggieburger text-base mb-1">Ingredients</p>
                      <ul className="list-disc pl-5 space-y-1">
                        {recipe.originalIngredients.map((ing, i) => (
                          <li key={i}>{ing.ingredient}</li>
                        ))}
                      </ul>
                    </div>
                    {recipe.originalInstructions && recipe.originalInstructions.length > 0 && (
                      <div>
                        <p className="font-veggieburger text-base mb-1">Instructions</p>
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
                    Original recipe unavailable — paste it above to see the comparison.
                  </p>
                )
              ) : (
                // Text paste: show exactly what was pasted — no parsing, always accurate
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{recipeText}</pre>
              )}
            </section>
            <section aria-label="Adapted recipe" className="flex-1 min-w-0">
              <p className="font-veggieburger text-lg text-muted-foreground mb-1 print:hidden">
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
              <RecipeCard
                recipe={{ ...recipe, recipeName: `Modified: ${recipe.recipeName}` }}
                className="max-w-none"
              />
            </section>
          </ComparisonLayout>
        </div>
      )}
    </main>
    </>
  )
}
