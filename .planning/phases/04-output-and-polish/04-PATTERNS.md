# Phase 4: Output and Polish - Pattern Map

**Mapped:** 2026-05-24
**Files analyzed:** 9 (6 frontend new/modified, 3 backend modified)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `frontend/src/components/ComparisonLayout.tsx` | component | request-response | `frontend/src/components/RecipeCard.tsx` | role-match (layout wrapper) |
| `frontend/src/components/ExportToolbar.tsx` | component | event-driven | `frontend/src/components/ServingStepper.tsx` | role-match (stateful button group) |
| `frontend/src/components/SubstitutionPopover.tsx` | component | event-driven | `frontend/src/components/DietPillGroup.tsx` | exact (Info icon + radix primitive trigger/content) |
| `frontend/src/components/RecipeCard.tsx` | component | request-response | self (extend existing) | exact |
| `frontend/src/App.tsx` | component | request-response | self (extend existing) | exact |
| `frontend/src/index.css` | config | transform | self (extend existing) | exact |
| `backend/.../model/TransformedRecipe.kt` | model | request-response | self (extend existing) | exact |
| `backend/.../controller/RecipeController.kt` | controller | request-response | self (extend existing) | exact |
| `backend/.../service/TransformationService.kt` | service | request-response | self (extend existing) | exact |

---

## Pattern Assignments

### `frontend/src/components/ComparisonLayout.tsx` (component, request-response)

**Analog:** `frontend/src/components/RecipeCard.tsx`

**Imports pattern** (RecipeCard.tsx lines 1-4):
```tsx
import { useState } from "react"
import Fraction from "fraction.js"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServingStepper } from "@/components/ServingStepper"
```
New file import pattern (no state needed for a layout wrapper):
```tsx
import { cn } from "@/lib/utils"
```

**Core pattern** — flex container, `max-w-5xl` overrides the form's `max-w-2xl`, stacks on mobile (RecipeCard.tsx line 119 shows the `mx-auto` convention):
```tsx
// RecipeCard.tsx line 119 — existing max-w pattern to mirror:
<Card className="max-w-2xl mx-auto">

// ComparisonLayout expands past max-w-2xl:
export function ComparisonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      {children}
    </div>
  )
}
```

**No error handling needed** — layout wrapper is pure rendering; no async operations.

---

### `frontend/src/components/ExportToolbar.tsx` (component, event-driven)

**Analog:** `frontend/src/components/ServingStepper.tsx`

**Imports pattern** (ServingStepper.tsx lines 1-2):
```tsx
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
```
ExportToolbar imports pattern:
```tsx
import { useState } from "react"
import { Printer, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
```

**State machine pattern** (ServingStepper.tsx lines 11-17 shows typed props + `useState`):
```tsx
// ServingStepper.tsx — typed props interface, single state:
interface Props {
  value: number | null
  min?: number
  onChange: (value: number | null) => void
  originalServings?: number
}
export function ServingStepper({ value, min = 1, onChange, originalServings }: Props) {
  // state and handlers inline
}
```
ExportToolbar follows the same props + local state pattern:
```tsx
// ExportToolbar: own DriveState type, Props interface, local useState
type DriveState = "idle" | "connecting" | "exporting" | "error"
interface Props {
  recipe: TransformedRecipe
  selectedDiets: string[]
  className?: string
}
export function ExportToolbar({ recipe, selectedDiets, className }: Props) {
  const [driveState, setDriveState] = useState<DriveState>("idle")
  // ...
}
```

**Button styling pattern** (ServingStepper.tsx lines 22-31 — `cn()` + border/bg/hover classes):
```tsx
// ServingStepper.tsx lines 22-31:
className={cn(
  "min-w-9 h-9 flex items-center justify-center",
  "border border-border bg-background hover:bg-muted",
  "rounded-l-md transition-colors",
  "disabled:opacity-40 disabled:cursor-not-allowed"
)}
```

**Error display pattern** (App.tsx lines 135-137 — inline warning below element):
```tsx
// App.tsx lines 135-137:
{error && (
  <p className="text-sm text-destructive mt-2">⚠ {error}</p>
)}
```
ExportToolbar Drive error follows same pattern:
```tsx
{driveState === "error" && (
  <p className="text-sm text-destructive mt-2">
    ⚠ Drive export failed — use Print to save as PDF instead.
  </p>
)}
```

**Loading icon pattern** (App.tsx lines 129-130 — Loader2 inline with text):
```tsx
// App.tsx lines 129-130:
<><Loader2 className="inline mr-2 h-4 w-4 animate-spin" />Transforming...</>
```

**Env var access pattern** — use `import.meta.env.VITE_*` (Vite convention, no analog in existing code but aligns with project's Vite setup):
```tsx
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
```

---

### `frontend/src/components/SubstitutionPopover.tsx` (component, event-driven)

**Analog:** `frontend/src/components/DietPillGroup.tsx` — exact match: uses `Info` from lucide-react, wraps a Radix primitive (Tooltip), applies `cn()` for conditional classes.

**Imports pattern** (DietPillGroup.tsx lines 1-3):
```tsx
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
```
SubstitutionPopover swaps Tooltip for Popover (same Radix umbrella package pattern):
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"
```

**Radix primitive wrapper pattern** (DietPillGroup.tsx lines 67-82 — Root → Trigger asChild → Content):
```tsx
// DietPillGroup.tsx lines 67-82:
<Tooltip>
  <TooltipTrigger asChild>
    <span
      role="img"
      aria-label={`Info about ${opt.label}`}
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center"
    >
      <Info className="h-3 w-3 opacity-60" />
    </span>
  </TooltipTrigger>
  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
    {opt.description}
  </TooltipContent>
</Tooltip>
```
SubstitutionPopover follows same Root → Trigger → Content structure; uses `Popover` instead of `Tooltip` (click, not hover):
```tsx
<Popover>
  <PopoverTrigger asChild>
    <button
      aria-label="Why this ingredient was substituted"
      className="text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center ml-1"
    >
      <Info className="h-4 w-4" />
    </button>
  </PopoverTrigger>
  <PopoverContent className="max-w-[280px] text-sm">
    {originalIngredient && (
      <p className="font-medium mb-1">Substituted for: {originalIngredient}</p>
    )}
    <p>{substitutionNote}</p>
  </PopoverContent>
</Popover>
```

**Tooltip wrapper source** (tooltip.tsx lines 1-2 — `radix-ui` umbrella import pattern):
```tsx
import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
```
Popover component (to be scaffolded by `npx shadcn@latest add popover`) will use the same umbrella import:
```tsx
import { Popover as PopoverPrimitive } from "radix-ui"
```

---

### `frontend/src/components/RecipeCard.tsx` (component, request-response — MODIFY)

**Analog:** self — extend the existing file.

**Current interface** (RecipeCard.tsx lines 6-21 — both `IngredientLine` and `TransformedRecipe` defined inline):
```tsx
// RecipeCard.tsx lines 6-21:
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

interface Props {
  recipe: TransformedRecipe
}
```

**Ingredient render loop** (RecipeCard.tsx lines 134-140 — where `SubstitutionPopover` trigger is injected):
```tsx
// RecipeCard.tsx lines 134-140 — inject Info icon after ingredient text:
{displayedIngredients.filter(ing => !isToTaste(ing)).map((ing, i) => (
  <li key={i}>
    <span className="font-bold">{ing.quantity}{shouldShowUnit(ing.unit, ing.ingredient) ? ` ${ing.unit}` : ""}</span>{" "}
    {ing.ingredient}
    {ing.preparation && `, ${ing.preparation}`}
    {/* INSERT: ing.substitutionNote && <SubstitutionPopover ... /> */}
  </li>
))}
```

**Card container** (RecipeCard.tsx line 119 — `max-w-2xl mx-auto` must be removed when used inside `ComparisonLayout`):
```tsx
// RecipeCard.tsx line 119 — current:
<Card className="max-w-2xl mx-auto">
// Modify to accept optional className prop so ComparisonLayout can override:
<Card className={cn("", className)}>
```

---

### `frontend/src/App.tsx` (component, request-response — MODIFY)

**Analog:** self — extend the existing file.

**TransformedRecipe interface** (App.tsx lines 17-24 — add two optional fields):
```tsx
// App.tsx lines 17-24 — current:
interface TransformedRecipe {
  recipeName: string
  ingredients: IngredientLine[]
  instructions: string[]
  servings: number
  originalServings: number
  warnings: string[]
}
// Phase 4: add at end of interface:
//   originalIngredients?: IngredientLine[]
//   originalInstructions?: string[]
```

**Result section structure** (App.tsx lines 141-157 — the block to restructure):
```tsx
// App.tsx lines 141-157 — current single-card result:
{formCollapsed && recipe && (
  <div className="mt-8">
    <button
      type="button"
      className="text-sm text-muted-foreground underline mb-4"
      onClick={() => {
        setFormCollapsed(false)
        setRecipe(null)
        setError(null)
      }}
    >
      Edit / start over
    </button>
    <RecipeCard recipe={recipe} />
  </div>
)}
```
Phase 4 replaces `<RecipeCard recipe={recipe} />` with `<ExportToolbar>` + `<ComparisonLayout>`.

**max-w-2xl constraint** (App.tsx line 76 — applied to `<main>`):
```tsx
// App.tsx line 76:
<main className="max-w-2xl mx-auto px-4 py-8">
// Phase 4: move max-w-2xl from <main> to the <form> element (or form wrapper div).
// <main> becomes max-w-none (or remove constraint) so ComparisonLayout can expand to max-w-5xl.
```

**State pattern** (App.tsx lines 27-35 — all state in top-level component, passed as props):
```tsx
// App.tsx lines 27-35 — pattern to continue:
const [recipe, setRecipe] = useState<TransformedRecipe | null>(null)
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
const [formCollapsed, setFormCollapsed] = useState(false)
const [recipeText, setRecipeText] = useState("")
const [selectedDiets, setSelectedDiets] = useState<string[]>([])
const [intolerances, setIntolerances] = useState<string[]>([])
const [targetServings, setTargetServings] = useState<number | null>(null)
// selectedDiets must be passed to ExportToolbar for Drive filename construction.
```

---

### `frontend/src/index.css` (config — MODIFY)

**Analog:** self — single-line file, append `@media print` and `@page` blocks.

**Current content** (index.css line 1):
```css
@import "tailwindcss";
```
Phase 4 appends after the import:
```css
@media print {
  body {
    font-size: 12pt;
    line-height: 1.5;
  }
  h1, h2, h3 {
    font-size: 14pt;
    font-weight: 700;
  }
}

@page {
  margin: 1cm;
}
```
Elements use Tailwind `print:hidden` in JSX (no CSS needed for hiding — Tailwind v4 generates `@media print { display: none }` natively from the utility class).

---

### `backend/.../model/TransformedRecipe.kt` (model — MODIFY)

**Analog:** self — extend the existing data class.

**Current shape** (TransformedRecipe.kt lines 1-10):
```kotlin
package com.dietcode.model

data class TransformedRecipe(
    val recipeName: String,
    val ingredients: List<IngredientLine>,
    val instructions: List<String>,
    val servings: Int,
    val originalServings: Int = 0,
    val warnings: List<String>
)
```
**Field addition pattern** — follow `originalServings: Int = 0` convention: add nullable fields with `= null` default at end to preserve backward compatibility (Jackson serializes nulls as absent by default):
```kotlin
// Add after warnings:
val originalIngredients: List<IngredientLine>? = null,
val originalInstructions: List<String>? = null,
```

**IngredientLine for reference** (IngredientLine.kt lines 5-12 — shows `@JsonProperty` annotation pattern if needed):
```kotlin
data class IngredientLine(
    val quantity: String,
    val unit: String,
    val ingredient: String,
    val preparation: String?,
    @get:JsonProperty("substitutionNote")
    val substitutionNote: String?
)
```

---

### `backend/.../controller/RecipeController.kt` (controller, request-response — MODIFY)

**Analog:** self — extend the existing controller method.

**Current transform method** (RecipeController.kt lines 21-35):
```kotlin
@PostMapping("/transform")
fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
    require(request.input.isNotBlank()) { "Recipe input must not be blank" }
    require(request.input.length <= 10_000) { "Recipe input exceeds maximum length of 10,000 characters" }

    val recipeDoc = ingestionService.ingest(request.input)
    val transformed = transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)

    // Capture LLM-inferred serving count BEFORE ScalingService may overwrite recipe.servings
    val llmServings = transformed.servings

    return request.targetServings
        ?.takeIf { it > 0 && it != transformed.servings }
        ?.let { scalingService.scale(transformed.copy(originalServings = llmServings), it) }
        ?: transformed.copy(originalServings = llmServings)
}
```
**Phase 4 insertion point** — between `val llmServings = transformed.servings` and the `return` statement, create `withOriginals` via `.copy()` before passing to scaling:
```kotlin
// Pattern: use .copy() to attach fields — same as existing `transformed.copy(originalServings = llmServings)`
val withOriginals = transformed.copy(
    originalIngredients = recipeDoc.rawIngredients.map { raw ->
        IngredientLine(quantity = "", unit = "", ingredient = raw, preparation = null, substitutionNote = null)
    },
    originalInstructions = recipeDoc.instructions.lines().filter { it.isNotBlank() }
)
return request.targetServings
    ?.takeIf { it > 0 && it != withOriginals.servings }
    ?.let { scalingService.scale(withOriginals.copy(originalServings = llmServings), it) }
    ?: withOriginals.copy(originalServings = llmServings)
```

**`RecipeDocument` shape** (RecipeIngestionService.kt lines 20-27 — shows `rawIngredients: List<String>` and `instructions: String`):
```kotlin
RecipeDocument(
    name = null,
    rawIngredients = lines,   // List<String>
    instructions = input,     // String (not List)
    servings = null
)
```
Use `.lines()` on `instructions` (String → List<String>) and `.filter { it.isNotBlank() }` when building `originalInstructions`.

---

### `backend/.../service/TransformationService.kt` (service, request-response — MODIFY)

**Analog:** self — extend the existing system prompt.

**System prompt location** (TransformationService.kt lines 22-63 — `systemPrompt` trimIndent block):
```kotlin
val systemPrompt = """
    You are a professional recipe adaptation expert.
    ...
    SCHEMA RULES for each ingredient line:
    - quantity: ...
    - unit: ...
    - ingredient: ...
    - preparation: optional method...

    Return ONLY valid JSON matching the required schema — no markdown fences, no prose, no explanation.
""".trimIndent()
```
**Phase 4 insertion** — add `substitutionNote` rule to SCHEMA RULES section, before "Return ONLY valid JSON":
```kotlin
// Insert into SCHEMA RULES block, after the `preparation` rule:
"""
- substitutionNote: if this ingredient was substituted or significantly changed from the
  original, provide a brief explanation (1-2 sentences) of why the substitution was made.
  Set to null (omit the field entirely) if the ingredient was NOT changed from the original.
  Do NOT set substitutionNote to an empty string — use null for unchanged ingredients.
"""
```
The `IngredientLine` Kotlin model already has `substitutionNote: String?` (IngredientLine.kt line 11) and the frontend `IngredientLine` interface already has `substitutionNote: string | null` (App.tsx line 14, RecipeCard.tsx line 11) — no model changes needed for this field.

---

## Shared Patterns

### Tailwind `cn()` Conditional Classes
**Source:** `frontend/src/lib/utils.ts` line 4
**Apply to:** `ComparisonLayout.tsx`, `ExportToolbar.tsx`, `SubstitutionPopover.tsx`, `RecipeCard.tsx` (when adding `className` prop)
```tsx
import { cn } from "@/lib/utils"
// Usage: className={cn("base-classes", condition && "conditional-class", passedClassName)}
```

### Radix Umbrella Package Import
**Source:** `frontend/src/components/ui/tooltip.tsx` line 2
**Apply to:** `frontend/src/components/ui/popover.tsx` (generated by shadcn CLI)
```tsx
// tooltip.tsx line 2 — pattern to expect in scaffolded popover.tsx:
import { Tooltip as TooltipPrimitive } from "radix-ui"
// popover.tsx will follow:
import { Popover as PopoverPrimitive } from "radix-ui"
```

### lucide-react Icon Usage
**Source:** `frontend/src/components/DietPillGroup.tsx` line 3, `frontend/src/App.tsx` line 5
**Apply to:** `ExportToolbar.tsx` (Printer, Loader2), `SubstitutionPopover.tsx` (Info)
```tsx
import { Info } from "lucide-react"           // DietPillGroup.tsx line 3
import { Loader2 } from "lucide-react"        // App.tsx line 5
// Usage: <Info className="h-4 w-4" />       // DietPillGroup.tsx line 77
// Usage: <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />  // App.tsx line 129
```

### Kotlin `.copy()` for Model Extension
**Source:** `backend/.../controller/RecipeController.kt` lines 32-34
**Apply to:** `RecipeController.kt` Phase 4 `withOriginals` construction
```kotlin
// RecipeController.kt lines 32-34 — existing pattern:
?.let { scalingService.scale(transformed.copy(originalServings = llmServings), it) }
?: transformed.copy(originalServings = llmServings)
// Phase 4 follows same .copy() chaining pattern
```

### Inline Error Display
**Source:** `frontend/src/App.tsx` lines 135-137
**Apply to:** `ExportToolbar.tsx` Drive error state
```tsx
// App.tsx lines 135-137:
{error && (
  <p className="text-sm text-destructive mt-2">⚠ {error}</p>
)}
```

### `print:hidden` Tailwind Utility
**Source:** Tailwind v4 built-in (no config required; confirmed by `frontend/src/index.css` using `@import "tailwindcss"` only)
**Apply to:** `App.tsx` form/edit button, `ExportToolbar.tsx`, original column section in comparison layout, "Adapted" label, `ServingStepper` in print context
```tsx
// Pattern — add className prop on elements to hide from print:
className="... print:hidden"
```

---

## No Analog Found

All Phase 4 files have close analogs in the existing codebase. The GIS OAuth pattern and Drive REST multipart upload are new browser-side logic with no existing analog — use the concrete examples from `04-RESEARCH.md` (Pattern 2: GIS Token Flow + Drive Multipart Upload) for those sections of `ExportToolbar.tsx`.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| GIS + Drive logic (inside `ExportToolbar.tsx`) | utility | event-driven | No OAuth or external API call patterns exist in the frontend codebase; use RESEARCH.md Pattern 2 directly |

---

## Metadata

**Analog search scope:** `frontend/src/`, `backend/src/main/kotlin/com/dietcode/`
**Files read:** 11 source files
**Pattern extraction date:** 2026-05-24
