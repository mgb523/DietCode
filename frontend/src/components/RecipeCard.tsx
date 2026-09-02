import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServingStepper } from "@/components/ServingStepper"
import { SubstitutionPopover } from "@/components/SubstitutionPopover"
import { cn } from "@/lib/utils"
import {
  type IngredientLine,
  isToTaste,
  rescaleIngredients,
  shouldShowUnit,
} from "@/lib/scaling"

interface TransformedRecipe {
  recipeName: string
  ingredients: IngredientLine[]
  instructions: string[]
  servings: number          // backend-scaled baseline
  originalServings: number  // LLM-inferred; for "(original: N)" label
  warnings: string[]
}

interface Props {
  recipe: TransformedRecipe
  className?: string
  /** Controlled — caller (App) owns this so ExportToolbar sees the same value. */
  currentServings: number
  onServingsChange: (n: number) => void
}

// ── Instruction rendering ────────────────────────────────────────────────────

// A string is a section header if it ends with ":" and has no sentence-ending
// punctuation before that colon (i.e. it's a label, not a step).
function isSectionHeader(step: string): boolean {
  const t = step.trim()
  return t.endsWith(":") && !/[.!?]/.test(t.slice(0, -1))
}

type InstructionItem =
  | { kind: "header"; text: string }
  | { kind: "step"; num: number; text: string }

function buildInstructionItems(instructions: string[]): InstructionItem[] {
  let n = 0
  return instructions.map(step =>
    isSectionHeader(step)
      ? { kind: "header", text: step }
      : { kind: "step", num: ++n, text: step }
  )
}

// ── Component ────────────────────────────────────────────────────────────────

export function RecipeCard({ recipe, className, currentServings, onServingsChange }: Props) {
  // Rescale quantities relative to the backend-returned baseline.
  // factor=1 when unchanged — still normalises decimals ("0.25" → "1/4").
  const displayedIngredients = rescaleIngredients(
    recipe.ingredients,
    recipe.servings,
    currentServings,
  )

  return (
    <Card className={cn("mx-auto", className)}>
      <CardHeader>
        <CardTitle className="font-veggieburger text-xl">{recipe.recipeName}</CardTitle>
        <div className="flex items-center gap-3 mt-1">
          <span className="hidden print:block text-sm text-muted-foreground">
            {currentServings} servings
          </span>
          <div className="print:hidden">
            <ServingStepper
              value={currentServings}
              min={1}
              onChange={v => onServingsChange(v ?? recipe.servings)}
              originalServings={
                recipe.originalServings !== recipe.servings
                  ? recipe.originalServings
                  : undefined
              }
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <h3 className="font-veggieburger text-lg mb-2">Ingredients</h3>
        <ul className="list-disc pl-5 space-y-1 mb-2">
          {displayedIngredients.filter(ing => !isToTaste(ing)).map((ing, i) => (
            <li key={i}>
              <span className="font-bold">
                {ing.quantity}
                {shouldShowUnit(ing.unit, ing.ingredient) ? ` ${ing.unit}` : ""}
              </span>{" "}
              {ing.ingredient}
              {ing.preparation && `, ${ing.preparation}`}
              {ing.substitutionNote && ing.substitutionNote.length > 0 && (
                <SubstitutionPopover substitutionNote={ing.substitutionNote} />
              )}
            </li>
          ))}
        </ul>

        {displayedIngredients.some(isToTaste) && (
          <div className="mb-6">
            <p className="font-veggieburger text-base text-muted-foreground mt-3 mb-1">
              To taste
            </p>
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

        <h3 className="font-veggieburger text-lg mb-2">Instructions</h3>
        <div className="space-y-1">
          {buildInstructionItems(recipe.instructions).map((item, i) =>
            item.kind === "header" ? (
              <p key={i} className="font-veggieburger text-base mt-4 mb-1 text-muted-foreground">
                {item.text.replace(/:$/, "")}
              </p>
            ) : (
              <div key={i} className="flex gap-2 leading-relaxed">
                <span className="shrink-0 font-semibold text-muted-foreground w-5 text-right">
                  {item.num}.
                </span>
                <span>{item.text}</span>
              </div>
            )
          )}
        </div>

        {recipe.warnings.length > 0 && (
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
            <strong className="font-veggieburger text-base font-normal">Notes</strong>
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
