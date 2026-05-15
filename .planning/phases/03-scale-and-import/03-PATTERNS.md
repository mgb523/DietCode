# Phase 3: Scale and Import - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 8 new/modified files
**Analogs found:** 7 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/src/main/kotlin/com/dietcode/service/ScalingService.kt` | service | transform | `backend/.../service/RecipeIngestionService.kt` | role-match |
| `backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt` | service | request-response + I/O | self (existing text path) | self-extension |
| `backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.kt` | model | — | `backend/.../model/TransformRequest.kt` | exact |
| `backend/src/main/kotlin/com/dietcode/model/TransformRequest.kt` | model | — | self (existing data class) | self-extension |
| `backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt` | controller | request-response | self (existing controller) | self-extension |
| `backend/src/main/kotlin/com/dietcode/exception/ScrapingException.kt` | utility | — | `backend/.../controller/ValidationExceptionHandler.kt` | partial |
| `frontend/src/components/ServingStepper.tsx` | component | event-driven | `frontend/src/components/TagInput.tsx` | role-match |
| `frontend/src/components/UrlDetectionBadge.tsx` | component | event-driven | `frontend/src/components/DietPillGroup.tsx` | role-match |

---

## Pattern Assignments

### `backend/src/main/kotlin/com/dietcode/service/ScalingService.kt` (service, transform)

**Analog:** `backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt`

**Imports pattern** (lines 1-4 of RecipeIngestionService.kt):
```kotlin
package com.dietcode.service

import com.dietcode.model.RecipeDocument
import org.springframework.stereotype.Service
```
Copy this import block; replace `RecipeDocument` with `TransformedRecipe`, `IngredientLine`.

**Core service pattern** (lines 7-19 of RecipeIngestionService.kt):
```kotlin
@Service
class RecipeIngestionService {
    fun ingest(input: String): RecipeDocument {
        val lines = input.trim().lines().map { it.trim() }.filter { it.isNotEmpty() }
        return RecipeDocument(
            name = null,
            rawIngredients = lines,
            instructions = input,
            servings = null
        )
    }
}
```
`ScalingService` follows the same `@Service` + single public method pattern. Replace the method body with the sub-linear scaling logic below.

**ScalingService implementation pattern** (from RESEARCH.md Pattern 3 — authoritative):
```kotlin
package com.dietcode.service

import com.dietcode.model.IngredientLine
import com.dietcode.model.TransformedRecipe
import org.springframework.stereotype.Service
import kotlin.math.pow

@Service
class ScalingService {

    private val SUBLINEAR_KEYWORDS = setOf(
        "baking powder", "baking soda", "bicarbonate", "yeast",
        "salt",
        "cayenne", "chili powder", "red pepper flakes", "black pepper",
        "cinnamon", "nutmeg", "cloves", "allspice",
        "ginger", "cardamom", "turmeric", "cumin"
    )

    fun scale(recipe: TransformedRecipe, targetServings: Int): TransformedRecipe {
        val originalServings = recipe.servings
        if (originalServings <= 0 || targetServings == originalServings) return recipe
        val factor = targetServings.toDouble() / originalServings
        val scaledIngredients = recipe.ingredients.map { line ->
            val qty = parseQuantity(line.quantity) ?: return@map line
            val scaleFactor = if (isSubLinear(line.ingredient)) factor.pow(0.5) else factor
            line.copy(quantity = formatQuantity(qty * scaleFactor))
        }
        return recipe.copy(ingredients = scaledIngredients, servings = targetServings)
    }

    internal fun isSubLinear(ingredientName: String): Boolean =
        SUBLINEAR_KEYWORDS.any { ingredientName.lowercase().contains(it) }

    internal fun parseQuantity(s: String): Double? {
        val trimmed = s.trim()
        if (trimmed.isBlank()) return null
        trimmed.toDoubleOrNull()?.let { return it }
        val fracRegex = Regex("""^(\d+)\s*/\s*(\d+)$""")
        fracRegex.matchEntire(trimmed)?.let { m ->
            val (num, den) = m.destructured
            return num.toDouble() / den.toDouble()
        }
        val mixedRegex = Regex("""^(\d+)\s+(\d+)\s*/\s*(\d+)$""")
        mixedRegex.matchEntire(trimmed)?.let { m ->
            val (whole, num, den) = m.destructured
            return whole.toDouble() + num.toDouble() / den.toDouble()
        }
        return null
    }

    internal fun formatQuantity(value: Double): String {
        val rounded = Math.round(value * 8.0) / 8.0
        return if (rounded == rounded.toLong().toDouble()) {
            rounded.toLong().toString()
        } else {
            "%.2f".format(rounded).trimEnd('0').trimEnd('.')
        }
    }
}
```

---

### `backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt` (service, request-response + I/O — add URL branch)

**Analog:** self — existing text path is the reference for the new URL branch to match in style.

**Existing core pattern** (lines 1-20 of RecipeIngestionService.kt — read and preserved):
```kotlin
package com.dietcode.service

import com.dietcode.model.RecipeDocument
import org.springframework.stereotype.Service

@Service
class RecipeIngestionService {
    fun ingest(input: String): RecipeDocument {
        val lines = input.trim().lines().map { it.trim() }.filter { it.isNotEmpty() }
        return RecipeDocument(
            name = null,
            rawIngredients = lines,
            instructions = input,
            servings = null
        )
    }
}
```

**URL branch extension pattern** — add imports and `scrapeUrl()` private method:
```kotlin
// ADD to imports:
import com.dietcode.exception.ScrapingException
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.jsoup.Jsoup

// REPLACE ingest() body:
fun ingest(input: String): RecipeDocument {
    return if (input.startsWith("http://") || input.startsWith("https://")) {
        scrapeUrl(input)
    } else {
        val lines = input.trim().lines().map { it.trim() }.filter { it.isNotEmpty() }
        RecipeDocument(name = null, rawIngredients = lines, instructions = input, servings = null)
    }
}

// ADD private method:
private fun scrapeUrl(url: String): RecipeDocument {
    val doc = try {
        Jsoup.connect(url)
            .userAgent("Mozilla/5.0 (compatible; DietCode/1.0)")
            .timeout(10_000)
            .get()
    } catch (e: Exception) {
        throw ScrapingException("Failed to fetch URL: ${e.message}")
    }

    // JSON-LD path (first priority)
    val scripts = doc.select("script[type=application/ld+json]")
    for (script in scripts) {
        val jsonText = script.data()   // .data() NOT .text() — DataNode content
        try {
            return parseJsonLd(jsonText)
        } catch (_: ScrapingException) {
            continue  // try next script block
        }
    }

    // Microdata fallback
    val microdataIngredients = doc.select("[itemprop=recipeIngredient]").map { it.text() }
    if (microdataIngredients.isNotEmpty()) {
        return RecipeDocument(
            name = doc.selectFirst("[itemprop=name]")?.text(),
            rawIngredients = microdataIngredients,
            instructions = doc.select("[itemprop=recipeInstructions]").map { it.text() }.joinToString("\n"),
            servings = doc.selectFirst("[itemprop=recipeYield]")?.text()?.filter { it.isDigit() }?.toIntOrNull()
        )
    }

    // Heuristic HTML fallback
    val listItems = doc.select("ul li, ol li").map { it.text() }.filter { it.isNotBlank() }
    if (listItems.isNotEmpty()) {
        return RecipeDocument(
            name = doc.title().takeIf { it.isNotBlank() },
            rawIngredients = listItems,
            instructions = doc.body().text(),
            servings = null
        )
    }

    throw ScrapingException("No recipe content found at URL")
}

private fun parseJsonLd(jsonText: String): RecipeDocument {
    val mapper = jacksonObjectMapper()
    val raw = mapper.readValue<Map<String, Any>>(jsonText)
    val recipeNode: Map<*, *> = when {
        raw["@type"] == "Recipe" -> raw
        raw["@graph"] is List<*> -> {
            @Suppress("UNCHECKED_CAST")
            (raw["@graph"] as List<Map<*, *>>).firstOrNull { it["@type"] == "Recipe" }
                ?: throw ScrapingException("No Recipe node in @graph")
        }
        else -> throw ScrapingException("JSON-LD is not a Recipe schema")
    }
    @Suppress("UNCHECKED_CAST")
    val ingredients = (recipeNode["recipeIngredient"] as? List<String>) ?: emptyList()
    val instructions = extractInstructions(recipeNode["recipeInstructions"])
    val servings = parseYield(recipeNode["recipeYield"])
    return RecipeDocument(
        name = recipeNode["name"] as? String,
        rawIngredients = ingredients,
        instructions = instructions.joinToString("\n"),
        servings = servings
    )
}

private fun parseYield(raw: Any?): Int? = when (raw) {
    is Int -> raw
    is String -> raw.filter { it.isDigit() }.takeIf { it.isNotEmpty() }?.toIntOrNull()
    is List<*> -> raw.firstOrNull()?.let { parseYield(it) }
    else -> null
}

private fun extractInstructions(raw: Any?): List<String> = when (raw) {
    is String -> listOf(raw)
    is List<*> -> raw.mapNotNull { step ->
        when (step) {
            is String -> step
            is Map<*, *> -> step["text"] as? String
            else -> null
        }
    }
    else -> emptyList()
}
```

---

### `backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.kt` (model — add `originalServings` field)

**Analog:** `backend/src/main/kotlin/com/dietcode/model/TransformRequest.kt` — same data class style

**Existing model** (lines 1-9 of TransformedRecipe.kt):
```kotlin
package com.dietcode.model

data class TransformedRecipe(
    val recipeName: String,
    val ingredients: List<IngredientLine>,
    val instructions: List<String>,
    val servings: Int,
    val warnings: List<String>
)
```

**Modified model** — add `originalServings` to preserve LLM-inferred count before ScalingService overwrites `servings`:
```kotlin
package com.dietcode.model

data class TransformedRecipe(
    val recipeName: String,
    val ingredients: List<IngredientLine>,
    val instructions: List<String>,
    val servings: Int,           // = targetServings after backend scaling
    val originalServings: Int,   // = LLM-inferred count; used for "(original: N)" display in RecipeCard
    val warnings: List<String>
)
```
Note: `TransformationService` currently creates `TransformedRecipe` via Spring AI `.entity()` deserialization. Adding `originalServings` requires either (a) the LLM returns it (unlikely) or (b) `RecipeController` captures `transformed.servings` before calling `ScalingService` and sets it via `.copy(originalServings = llmServings)`. Option (b) is correct — see RecipeController pattern below.

---

### `backend/src/main/kotlin/com/dietcode/model/TransformRequest.kt` (model — add `targetServings` field)

**Analog:** self — existing data class style

**Existing model** (lines 1-7 of TransformRequest.kt):
```kotlin
package com.dietcode.model

data class TransformRequest(
    val input: String,
    val dietProfiles: List<DietProfile>,
    val intolerances: List<String>
)
```

**Modified model** — add nullable `targetServings` with default `null`:
```kotlin
package com.dietcode.model

data class TransformRequest(
    val input: String,
    val dietProfiles: List<DietProfile>,
    val intolerances: List<String>,
    val targetServings: Int? = null   // null = use LLM-inferred serving count as-is
)
```

---

### `backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt` (controller, request-response — inject ScalingService)

**Analog:** self — existing controller is the reference; extend with ScalingService injection and call.

**Existing controller** (lines 1-25 of RecipeController.kt):
```kotlin
package com.dietcode.controller

import com.dietcode.model.TransformRequest
import com.dietcode.model.TransformedRecipe
import com.dietcode.service.RecipeIngestionService
import com.dietcode.service.TransformationService
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/recipe")
class RecipeController(
    private val ingestionService: RecipeIngestionService,
    private val transformationService: TransformationService
) {
    @PostMapping("/transform")
    fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
        require(request.input.isNotBlank()) { "Recipe input must not be blank" }
        require(request.input.length <= 10_000) { "Recipe input exceeds maximum length of 10,000 characters" }
        val recipeDoc = ingestionService.ingest(request.input)
        return transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)
    }
}
```

**Modified controller** — add `ScalingService` dependency and post-LLM scaling call:
```kotlin
// ADD import:
import com.dietcode.service.ScalingService

// ADD constructor param:
private val scalingService: ScalingService

// REPLACE transform() body:
fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
    require(request.input.isNotBlank()) { "Recipe input must not be blank" }
    require(request.input.length <= 10_000) { "Recipe input exceeds maximum length of 10,000 characters" }
    val recipeDoc = ingestionService.ingest(request.input)
    val transformed = transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)
    val llmServings = transformed.servings   // capture BEFORE ScalingService overwrites it
    return request.targetServings
        ?.takeIf { it > 0 && it != transformed.servings }
        ?.let { scalingService.scale(transformed.copy(originalServings = llmServings), it) }
        ?: transformed.copy(originalServings = llmServings)
}
```

**Error handling pattern** (lines 1-13 of ValidationExceptionHandler.kt — copy this pattern for ScrapingException):
```kotlin
@ExceptionHandler(ScrapingException::class)
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
fun handleScraping(e: ScrapingException) =
    mapOf("error" to "scraping_failed", "message" to e.message.orEmpty())
```
This goes in `ValidationExceptionHandler.kt` alongside the existing `IllegalArgumentException` handler.

---

### `backend/src/main/kotlin/com/dietcode/exception/ScrapingException.kt` (utility — new file)

**Analog:** `ValidationExceptionHandler.kt` shows how exceptions are handled; `ScrapingException` is a plain `RuntimeException`.

**New file pattern:**
```kotlin
package com.dietcode.exception

class ScrapingException(message: String) : RuntimeException(message)
```
No Spring annotations — it is a plain exception. The `@ExceptionHandler` lives in `ValidationExceptionHandler`.

---

### `frontend/src/components/ServingStepper.tsx` (component, event-driven)

**Analog:** `frontend/src/components/TagInput.tsx` — controlled input with local event handlers, same pattern; also `DietPillGroup.tsx` for button + cn() styling.

**Imports pattern** (lines 1-3 of TagInput.tsx):
```tsx
import { useState } from "react"
```
ServingStepper does not need local state (value is controlled by parent), so no `useState`. Add lucide-react:
```tsx
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
```

**Button styling pattern** (lines 54-65 of DietPillGroup.tsx — button with border and cn()):
```tsx
<button
  type="button"
  onClick={() => toggle(opt.value)}
  className={cn(
    "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-normal border cursor-pointer transition-colors",
    selected.includes(opt.value)
      ? "bg-primary text-primary-foreground border-primary"
      : "bg-background text-foreground border-border hover:bg-muted"
  )}
>
```
ServingStepper buttons use the same token set: `border-border`, `bg-background`, `hover:bg-muted`. No accent color.

**Core ServingStepper pattern:**
```tsx
interface Props {
  value: number
  min?: number
  onChange: (value: number) => void
  originalServings?: number   // shows "(original: N)" label when provided
}

export function ServingStepper({ value, min = 1, onChange, originalServings }: Props) {
  const decrement = () => { if (value > min) onChange(value - 1) }
  const increment = () => onChange(value + 1)

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="flex items-center justify-center w-7 h-7 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-40 transition-colors"
        aria-label="Decrease servings"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="text-sm font-medium min-w-[2ch] text-center">{value}</span>
      <button
        type="button"
        onClick={increment}
        className="flex items-center justify-center w-7 h-7 rounded-md border border-border bg-background hover:bg-muted transition-colors"
        aria-label="Increase servings"
      >
        <Plus className="h-3 w-3" />
      </button>
      {originalServings !== undefined && originalServings !== value && (
        <span className="text-xs text-muted-foreground">(original: {originalServings})</span>
      )}
    </div>
  )
}
```

---

### `frontend/src/components/UrlDetectionBadge.tsx` (component, event-driven)

**Analog:** `frontend/src/components/DietPillGroup.tsx` — pill/chip aesthetic with Tailwind tokens; `TagInput.tsx` for the `bg-muted rounded-full` chip pattern.

**Pill chip pattern** (lines 30-40 of TagInput.tsx):
```tsx
<span
  key={tag}
  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-sm"
>
  {tag}
  ...
</span>
```

**Icon pattern** — lucide-react is already installed:
```tsx
import { Link2 } from "lucide-react"
```

**Core UrlDetectionBadge pattern:**
```tsx
import { Link2 } from "lucide-react"

interface Props {
  visible: boolean
}

export function UrlDetectionBadge({ visible }: Props) {
  if (!visible) return null
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
      <Link2 className="h-3 w-3" />
      URL detected
    </span>
  )
}
```
Rendered above the textarea in `App.tsx` when `isUrlInput` is true.

---

### `frontend/src/components/RecipeCard.tsx` (component — add stepper and client-side rescaling)

**Analog:** self — existing RecipeCard is the reference; add `useState`, `fraction.js` logic, and `ServingStepper`.

**Existing imports** (lines 1 of RecipeCard.tsx):
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
```

**Add to imports:**
```tsx
import { useState } from "react"
import Fraction from "fraction.js"
import { ServingStepper } from "@/components/ServingStepper"
```

**Interface additions** — `TransformedRecipe` gains `originalServings`:
```tsx
interface TransformedRecipe {
  recipeName: string
  ingredients: IngredientLine[]
  instructions: string[]
  servings: number          // already-scaled to targetServings by backend
  originalServings: number  // LLM-inferred count; for "(original: N)" label
  warnings: string[]
}
```

**Client-side rescaling helpers** (from RESEARCH.md Pattern 5):
```tsx
const SUBLINEAR_KEYWORDS = [
  'baking powder', 'baking soda', 'bicarbonate', 'yeast',
  'salt', 'cayenne', 'chili powder', 'red pepper', 'black pepper',
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
    return quantityStr  // "to taste", "a pinch", etc. — return unchanged
  }
}

function rescaleIngredients(
  ingredients: IngredientLine[],
  fromServings: number,
  toServings: number
): IngredientLine[] {
  const linearFactor = toServings / fromServings
  return ingredients.map(ing => {
    const factor = isSubLinear(ing.ingredient) ? Math.sqrt(linearFactor) : linearFactor
    return { ...ing, quantity: scaleQuantity(ing.quantity, factor) }
  })
}
```

**State and derived display** (place inside `RecipeCard` component body):
```tsx
// recipe.servings = what backend returned (already at user's initial targetServings)
const [currentServings, setCurrentServings] = useState(recipe.servings)
const displayedIngredients = rescaleIngredients(recipe.ingredients, recipe.servings, currentServings)
```

**Stepper placement** — inside `<CardHeader>`, replacing the static `<p>`:
```tsx
// REPLACE:
// <p className="text-sm text-muted-foreground">Serves {recipe.servings}</p>
// WITH:
<div className="flex items-center gap-3 mt-1">
  <span className="text-sm text-muted-foreground">Servings:</span>
  <ServingStepper
    value={currentServings}
    min={1}
    onChange={setCurrentServings}
    originalServings={recipe.originalServings !== recipe.servings ? recipe.originalServings : undefined}
  />
</div>
```

---

### `frontend/src/App.tsx` (MODIFY — add `targetServings` state and URL detection)

**Analog:** self — existing state pattern is the reference for adding `targetServings`.

**Existing state pattern** (lines 24-31 of App.tsx):
```tsx
const [recipe, setRecipe] = useState<TransformedRecipe | null>(null)
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
const [formCollapsed, setFormCollapsed] = useState(false)
const [recipeText, setRecipeText] = useState("")
const [selectedDiets, setSelectedDiets] = useState<string[]>([])
const [intolerances, setIntolerances] = useState<string[]>([])
```

**Additions:**
```tsx
// ADD state:
const [targetServings, setTargetServings] = useState<number>(2)

// ADD derived value (no state needed — computed from recipeText):
const isUrlInput = recipeText.startsWith("http://") || recipeText.startsWith("https://")
```

**Updated interface** — add `originalServings`:
```tsx
interface TransformedRecipe {
  recipeName: string
  ingredients: IngredientLine[]
  instructions: string[]
  servings: number
  originalServings: number
  warnings: string[]
}
```

**Updated fetch body** (lines 41-46 of App.tsx — add `targetServings`):
```tsx
body: JSON.stringify({
  input: recipeText,
  dietProfiles: selectedDiets,
  intolerances,
  targetServings
})
```

**Error handling for scraping** — detect `scraping_failed` error type:
```tsx
// In handleSubmit catch block, after checking res.ok:
if (!res.ok) {
  if (isUrlInput) {
    const body = await res.json().catch(() => ({}))
    if (body.error === "scraping_failed") {
      setError("Couldn't import this URL. Open it, copy the recipe text, and paste it here.")
      return
    }
  }
  throw new Error(`Backend returned ${res.status}`)
}
```

**Form additions** — `UrlDetectionBadge` above textarea, `ServingStepper` / number input for servings:
```tsx
// ADD import:
import { UrlDetectionBadge } from "@/components/UrlDetectionBadge"
import { ServingStepper } from "@/components/ServingStepper"

// In JSX, above textarea:
<UrlDetectionBadge visible={isUrlInput} />

// After the intolerances TagInput section, add a servings field:
<div>
  <label className="block text-sm mb-2">Target servings</label>
  <ServingStepper value={targetServings} min={1} onChange={setTargetServings} />
</div>
```

---

## Shared Patterns

### Service: `@Service` + single public method + `@SpringBootTest`-compatible

**Source:** `backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt` (all lines)
**Apply to:** `ScalingService.kt`
```kotlin
package com.dietcode.service

import org.springframework.stereotype.Service

@Service
class XxxService {
    fun doThing(input: TheInputType): TheOutputType {
        // pure computation — no LLM, no network
    }
}
```

### Controller: `require()` validation before service calls

**Source:** `backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt` lines 20-21
**Apply to:** `RecipeController.kt` (extended)
```kotlin
require(request.input.isNotBlank()) { "Recipe input must not be blank" }
require(request.input.length <= 10_000) { "Recipe input exceeds maximum length of 10,000 characters" }
```
Any new controller input validation follows this `require()` + `IllegalArgumentException` pattern, which is caught by `ValidationExceptionHandler`.

### Exception handling: `@ExceptionHandler` in `ValidationExceptionHandler`

**Source:** `backend/src/main/kotlin/com/dietcode/controller/ValidationExceptionHandler.kt` lines 1-13
**Apply to:** `ValidationExceptionHandler.kt` (add `ScrapingException` handler)
```kotlin
@ExceptionHandler(IllegalArgumentException::class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
fun handleValidation(e: IllegalArgumentException) = mapOf("error" to e.message)
```
Mirror this pattern exactly; change the exception class, HTTP status, and error key.

### Model: plain `data class`, no annotations except Jackson where needed

**Source:** `backend/src/main/kotlin/com/dietcode/model/IngredientLine.kt` lines 1-13
**Apply to:** `TransformedRecipe.kt`, `TransformRequest.kt` (both modified), `ScrapingException.kt` (N/A — not a data class)
```kotlin
import com.fasterxml.jackson.annotation.JsonProperty
data class IngredientLine(
    val quantity: String,
    // ...
    @get:JsonProperty("substitutionNote")
    val substitutionNote: String?
)
```
Only add `@JsonProperty` when the JSON field name differs from the Kotlin property name. `originalServings` maps directly, so no annotation needed.

### Frontend: Tailwind v4 tokens — `bg-muted`, `border-border`, `text-muted-foreground`

**Source:** `frontend/src/components/DietPillGroup.tsx` lines 59-65, `frontend/src/components/TagInput.tsx` lines 30-33
**Apply to:** `ServingStepper.tsx`, `UrlDetectionBadge.tsx`
```tsx
// OFF-token: bg-gray-100, text-gray-500         ← DO NOT USE
// ON-token:  bg-muted, text-muted-foreground     ← USE THESE
```
No `tailwind.config.js` — use design tokens directly as class names. No hex values or opacity modifiers in class names.

### Frontend: controlled component pattern with no local state in leaf components

**Source:** `frontend/src/components/TagInput.tsx` and `frontend/src/components/DietPillGroup.tsx`
**Apply to:** `ServingStepper.tsx`, `UrlDetectionBadge.tsx`
```tsx
interface Props {
  value: SomeType
  onChange: (value: SomeType) => void
}
```
State lives in `App.tsx` (for `targetServings`) or in `RecipeCard.tsx` (for `currentServings`). Leaf components receive value + onChange as props.

### Frontend: error display pattern

**Source:** `frontend/src/App.tsx` lines 103-105
**Apply to:** `App.tsx` (scraping error)
```tsx
{error && (
  <p className="text-sm text-destructive mt-2">⚠ {error}</p>
)}
```
Same element reused — just change the string in `setError()`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `backend/src/main/kotlin/com/dietcode/exception/ScrapingException.kt` | utility | — | No exception classes exist in the project yet; pattern trivially simple (`class X : RuntimeException(message)`) |

---

## Metadata

**Analog search scope:** `backend/src/main/kotlin/com/dietcode/**`, `frontend/src/components/**`, `frontend/src/App.tsx`
**Files scanned:** 13 backend Kotlin files, 4 frontend component files, App.tsx
**Pattern extraction date:** 2026-05-14
