# Phase 2: Core Transformation - Pattern Map

**Mapped:** 2026-04-21
**Files analyzed:** 7
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `backend/.../service/RecipeIngestionService.kt` | service | transform | `backend/.../service/ExportService.kt` (service shell shape) | role-match |
| `backend/.../service/TransformationService.kt` | service | request-response | `backend/.../service/ExportService.kt` (service shell shape) | role-match |
| `backend/.../controller/RecipeController.kt` | controller | request-response | `backend/.../controller/RecipeController.kt` (existing stub) | exact (replace stub) |
| `frontend/src/App.tsx` | component | request-response | `frontend/src/App.tsx` (existing stub) | exact (replace useEffect) |
| `frontend/src/components/RecipeCard.tsx` | component | transform | `frontend/src/components/RecipeCard.tsx` (existing) | exact (refine) |
| `frontend/src/components/DietPillGroup.tsx` | component | event-driven | `frontend/src/components/ui/card.tsx` (cn() + Tailwind token pattern) | partial |
| `frontend/src/components/TagInput.tsx` | component | event-driven | `frontend/src/App.tsx` (useState controlled input pattern) | partial |

---

## Pattern Assignments

### `backend/.../service/RecipeIngestionService.kt` (service, transform)

**Analog:** `backend/src/main/kotlin/com/dietcode/service/ExportService.kt` — provides the `@Service` + single method shell shape.

**Package + imports pattern** (ExportService.kt lines 1-5):
```kotlin
package com.dietcode.service

import com.dietcode.model.RecipeDocument
import org.springframework.stereotype.Service
```

**Service shell pattern** (ExportService.kt lines 7-11):
```kotlin
@Service
class RecipeIngestionService {
    fun ingest(input: String): RecipeDocument {
        // implementation
    }
}
```

**Core implementation pattern** (RESEARCH.md Pattern 2 — no codebase analog; use research pattern):
```kotlin
@Service
class RecipeIngestionService {
    fun ingest(input: String): RecipeDocument {
        // Phase 2: text-only path — no LLM calls (CLAUDE.md constraint)
        // Pass raw text through; let TransformationService + LLM handle semantic parsing
        val lines = input.trim().lines().map { it.trim() }.filter { it.isNotEmpty() }
        return RecipeDocument(
            name = null,           // LLM infers name
            rawIngredients = lines, // All lines — LLM identifies which are ingredients
            instructions = input,   // Full raw text as fallback
            servings = null
        )
    }
}
```

**RecipeDocument shape** (`backend/.../model/RecipeDocument.kt`):
```kotlin
data class RecipeDocument(
    val name: String?,
    val rawIngredients: List<String>,
    val instructions: String,
    val servings: Int?
)
```

**Error handling:** No try/catch needed — pure string manipulation cannot throw. IllegalArgumentException for blank input is acceptable (controller validates before calling).

---

### `backend/.../service/TransformationService.kt` (service, request-response)

**Analog:** `backend/src/main/kotlin/com/dietcode/service/TransformationService.kt` (existing stub — replace body, keep constructor injection shape).

**Existing stub to replace** (TransformationService.kt lines 1-22):
```kotlin
package com.dietcode.service

import com.dietcode.model.DietProfile
import com.dietcode.model.RecipeDocument
import com.dietcode.model.TransformedRecipe
import org.springframework.ai.converter.BeanOutputConverter  // REMOVE — replaced by ChatClient.entity()
import org.springframework.stereotype.Service

@Service
class TransformationService {
    private val outputConverter = BeanOutputConverter(TransformedRecipe::class.java)  // REMOVE

    fun transform(
        recipe: RecipeDocument,
        dietProfiles: List<DietProfile>,
        intolerances: List<String>
    ): TransformedRecipe {
        TODO("Phase 2: ...")
    }
}
```

**New imports pattern** (from RESEARCH.md verified import list):
```kotlin
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service
import com.dietcode.model.DietProfile
import com.dietcode.model.RecipeDocument
import com.dietcode.model.TransformedRecipe
```

**Constructor injection pattern** (RESEARCH.md Pattern 1 — `ChatClient.Builder` is a prototype bean, build once in constructor):
```kotlin
@Service
class TransformationService(chatClientBuilder: ChatClient.Builder) {
    private val chatClient = chatClientBuilder.build()
    // ...
}
```

**Core ChatClient call pattern** (RESEARCH.md Full TransformationService example):
```kotlin
return chatClient
    .prompt()
    .system(systemPrompt)
    .user(userPrompt)
    .call()
    .entity(TransformedRecipe::class.java)
    ?: throw IllegalStateException("LLM returned null — possible malformed response")
```

**Null guard:** `entity()` returns `T?` in Kotlin — always follow with `?: throw IllegalStateException(...)`. The controller's unhandled exception becomes a 500 which the frontend error handler catches.

**System prompt structure** (D-05 requirement — must be verbatim):
```kotlin
val systemPrompt = """
    You are a professional recipe adaptation expert.
    Rewrite recipes to conform to the specified dietary requirements.
    For ingredient exclusions, interpret each item broadly and forgive spelling errors
    (e.g. "peenut" means peanuts, "cow milk" means dairy).
    Return ONLY valid JSON matching the required schema — no markdown fences, no prose, no explanation.
""".trimIndent()
```

**Empty-list guards** (Pitfall 3 — both dietProfiles and intolerances can be empty):
```kotlin
val dietRules = if (dietProfiles.isEmpty()) "none"
    else dietProfiles.joinToString(", ") { it.name.lowercase().replace("_", "-") }
val exclusionList = if (intolerances.isEmpty()) "none" else intolerances.joinToString(", ")
```

---

### `backend/.../controller/RecipeController.kt` (controller, request-response)

**Analog:** `backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt` (existing file — replace stub body only, keep all structure).

**Keep as-is — package, imports, class declaration, DI** (RecipeController.kt lines 1-18):
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
)
```

**Remove from imports** (no longer needed after stub removal):
```kotlin
import com.dietcode.model.IngredientLine   // REMOVE — only used in hardcoded stub
```

**Replace stub body with real service calls** (RESEARCH.md Pattern 3):
```kotlin
@PostMapping("/transform")
fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
    val recipeDoc = ingestionService.ingest(request.input)
    return transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)
}
```

**Input validation to add** (RESEARCH.md Security Domain recommendation):
```kotlin
@PostMapping("/transform")
fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
    require(request.input.isNotBlank()) { "Recipe input must not be blank" }
    require(request.input.length <= 10_000) { "Recipe input exceeds maximum length" }
    val recipeDoc = ingestionService.ingest(request.input)
    return transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)
}
```

**Error handling:** Spring Boot's default exception handler returns 500 for unhandled exceptions and 400 for `IllegalArgumentException` from `require()`. No custom `@ExceptionHandler` needed in Phase 2.

---

### `frontend/src/App.tsx` (component, request-response)

**Analog:** `frontend/src/App.tsx` (existing file — replace useEffect with handleSubmit, extend state).

**Existing imports to extend** (App.tsx line 1 — add `useRef` only if needed for form ref; keep `useState`):
```typescript
import { useState } from "react"
import { RecipeCard } from "@/components/RecipeCard"
import { DietPillGroup } from "@/components/DietPillGroup"   // ADD
import { TagInput } from "@/components/TagInput"              // ADD
import { Loader2 } from "lucide-react"                        // ADD (D-06 spinner)
```

**Existing interface definitions to keep** (App.tsx lines 4-18 — keep `IngredientLine` and `TransformedRecipe` interfaces unchanged).

**Replace `useEffect` auto-fetch with form state + submit handler** (replaces App.tsx lines 23-47):
```typescript
// Keep these from Phase 1:
const [recipe, setRecipe] = useState<TransformedRecipe | null>(null)
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)   // CHANGE: was true, now false (no auto-fetch)

// ADD — form state (D-01, D-02, D-03, D-04)
const [formCollapsed, setFormCollapsed] = useState(false)
const [recipeText, setRecipeText] = useState("")
const [selectedDiets, setSelectedDiets] = useState<string[]>([])
const [intolerances, setIntolerances] = useState<string[]>([])

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
        intolerances
      })
    })
    if (!res.ok) throw new Error(`Backend returned ${res.status}`)
    const data = await res.json() as TransformedRecipe
    setRecipe(data)
    setFormCollapsed(true)   // D-02: collapse form on success
  } catch {
    setError("Transformation failed — please try again.")   // D-07
  } finally {
    setLoading(false)
  }
}
```

**Existing fetch shape to copy** (App.tsx lines 26-46 — same `fetch` + `.ok` check + `.json()` + `.catch` structure; only the trigger and state variables change).

**JSX layout pattern — form section** (D-01 vertical layout, D-06 spinner, D-07 error):
```typescript
{!formCollapsed && (
  <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
    {/* textarea, DietPillGroup, TagInput, submit button */}
    <button
      type="submit"
      disabled={loading}
      className="w-full ..."
    >
      {loading ? <><Loader2 className="animate-spin inline mr-2" />Transforming...</> : "Transform Recipe"}
    </button>
    {error && (
      <p className="text-destructive text-sm">⚠ {error}</p>
    )}
  </form>
)}
{recipe && <RecipeCard recipe={recipe} />}
```

**Existing error JSX pattern to copy** (App.tsx line 56 — `text-destructive` class for error text):
```typescript
{error && (
  <p className="text-center text-destructive">Error: {error}...</p>
)}
```

---

### `frontend/src/components/RecipeCard.tsx` (component, transform)

**Analog:** `frontend/src/components/RecipeCard.tsx` — existing file; targeted change to ingredient rendering only.

**Keep unchanged** (RecipeCard.tsx lines 1-33 and 41-61 — all imports, interfaces, Card wrapper, Instructions section, warnings section).

**Replace ingredient `<li>` rendering only** (RecipeCard.tsx line 35 — current):
```typescript
// BEFORE (line 35):
<li key={i}>
  {ing.quantity} {ing.unit} {ing.ingredient}
  {ing.preparation && `, ${ing.preparation}`}
</li>
```

**New ingredient `<li>` pattern** (D-08 — bold quantity + unit):
```typescript
// AFTER:
<li key={i}>
  <span className="font-semibold">{ing.quantity} {ing.unit}</span>{" "}
  {ing.ingredient}
  {ing.preparation && `, ${ing.preparation}`}
</li>
```

**Edge case handled:** When `unit` is empty string (e.g. "2 eggs"), `{ing.quantity} {ing.unit}` renders as `"2 "` — the bold span still works correctly with the trailing space before `{ing.ingredient}`.

No imports change needed.

---

### `frontend/src/components/DietPillGroup.tsx` (component, event-driven) — NEW FILE

**Analog:** `frontend/src/components/ui/card.tsx` — provides the `cn()` + Tailwind token pattern and the functional component export style.

**cn() import pattern** (card.tsx line 2 — path alias `@/lib/utils`):
```typescript
import { cn } from "@/lib/utils"
```

**Component export style** (card.tsx lines 4-15 — named function export, TypeScript props interface):
```typescript
interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function DietPillGroup({ selected, onChange }: Props) {
  // ...
}
```

**cn() conditional class pattern** (card.tsx lines 8-13 — base classes + conditional override):
```typescript
className={cn(
  "base classes here",
  condition ? "active classes" : "inactive classes"
)}
```

**Core toggle pill pattern** (RESEARCH.md Pattern 5 — no codebase analog exists; use research pattern):
```typescript
const DIET_OPTIONS = [
  { value: "KETO", label: "Keto" },
  { value: "VEGAN", label: "Vegan" },
  { value: "GLUTEN_FREE", label: "GF" },
  { value: "PALEO", label: "Paleo" },
  { value: "WHOLE30", label: "Whole30" },
]
// value strings MUST match DietProfile enum names exactly (Pitfall 6)

const toggle = (value: string) => {
  onChange(
    selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
  )
}
```

**Tailwind tokens for selected/unselected states** (from shadcn New York + Zinc theme used in card.tsx):
```typescript
className={cn(
  "px-3 py-1 rounded-full border text-sm font-medium transition-colors",
  selected.includes(opt.value)
    ? "bg-primary text-primary-foreground border-primary"
    : "bg-background text-foreground border-border hover:bg-muted"
)}
```

**Accessibility:** `type="button"` is mandatory on each pill button to prevent form submission when user clicks a pill inside the `<form>`.

---

### `frontend/src/components/TagInput.tsx` (component, event-driven) — NEW FILE

**Analog:** `frontend/src/App.tsx` — provides the `useState` controlled input pattern; `frontend/src/components/ui/card.tsx` provides the `cn()` + Tailwind border/focus-ring pattern.

**useState import** (App.tsx line 1):
```typescript
import { useState } from "react"
```

**Controlled input state pattern** (App.tsx lines 21-23 — local state for the current typed value):
```typescript
const [value, setValue] = useState("")
```

**Focus-within ring pattern** (card.tsx lines 8-13 — shadcn uses `focus-within:ring-1 focus-within:ring-ring`):
```typescript
className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring"
```

**Core tag add/remove pattern** (RESEARCH.md Pattern 6 — no codebase analog exists):
```typescript
const addTag = (raw: string) => {
  const tag = raw.trim().replace(/,+$/, "").trim()
  if (tag && !tags.includes(tag)) {
    onChange([...tags, tag])
  }
  setValue("")
}

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter" || e.key === ",") {
    e.preventDefault()   // prevent form submission on Enter
    addTag(value)
  } else if (e.key === "Backspace" && value === "" && tags.length > 0) {
    onChange(tags.slice(0, -1))
  }
}
```

**`onBlur` flush:** Call `addTag(value)` on blur so text typed without pressing Enter is not lost when user tabs/clicks away.

**Tag badge pattern** — use `bg-muted rounded-full` consistent with shadcn muted token (same token family as pill inactive state in DietPillGroup).

---

## Shared Patterns

### Kotlin Service Shell
**Source:** `backend/src/main/kotlin/com/dietcode/service/ExportService.kt` lines 1-11
**Apply to:** `RecipeIngestionService.kt`, `TransformationService.kt`
```kotlin
package com.dietcode.service

import org.springframework.stereotype.Service

@Service
class ServiceName {
    fun methodName(param: Type): ReturnType {
        // implementation
    }
}
```

### Kotlin Model Import Path
**Source:** `backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt` lines 3-5
**Apply to:** All backend service and controller files
```kotlin
import com.dietcode.model.DietProfile
import com.dietcode.model.RecipeDocument
import com.dietcode.model.TransformedRecipe
import com.dietcode.model.TransformRequest
import com.dietcode.model.IngredientLine
```

### React Named Component Export
**Source:** `frontend/src/components/RecipeCard.tsx` lines 23-24
**Apply to:** `DietPillGroup.tsx`, `TagInput.tsx`
```typescript
export function ComponentName({ prop }: Props) {
  // ...
}
```

### cn() Conditional Class Merging
**Source:** `frontend/src/components/ui/card.tsx` lines 2, 8-13
**Apply to:** `DietPillGroup.tsx` (pill active/inactive states)
```typescript
import { cn } from "@/lib/utils"

className={cn(
  "always-applied-classes",
  condition ? "truthy-classes" : "falsy-classes"
)}
```

### Fetch + Error Handling Shape
**Source:** `frontend/src/App.tsx` lines 26-47
**Apply to:** `App.tsx` `handleSubmit` (keep same shape, change trigger from useEffect to form submit)
```typescript
fetch("http://localhost:8080/api/recipe/transform", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ... })
})
  .then(res => {
    if (!res.ok) throw new Error(`Backend returned ${res.status}`)
    return res.json() as Promise<TransformedRecipe>
  })
  .then(data => { setRecipe(data); setLoading(false) })
  .catch((err: Error) => { setError(err.message); setLoading(false) })
```

### Tailwind Text Color Tokens
**Source:** `frontend/src/App.tsx` line 56 + `frontend/src/components/RecipeCard.tsx` line 49
**Apply to:** Error message in `App.tsx`, warning block in `RecipeCard.tsx`
- `text-destructive` — error/failure text
- `text-muted-foreground` — secondary/de-emphasized text
- `bg-muted` — subtle background for tags and inactive states
- `bg-primary` / `text-primary-foreground` — active/selected highlighted state

---

## No Analog Found

All 7 files have an analog (either an exact existing file to modify or a partial match for structural patterns). The two new components (`DietPillGroup.tsx`, `TagInput.tsx`) have no existing component-level analog but their structural sub-patterns (cn() usage, useState, export style) are fully covered by existing codebase files.

---

## Key Constraints from CLAUDE.md

These constraints must be enforced in every plan action:

| Constraint | Applies To |
|-----------|------------|
| `RecipeIngestionService` MUST NOT call the LLM — pure string manipulation only | `RecipeIngestionService.kt` |
| Scaling is `ScalingService` math, never LLM | No Phase 2 file — informational |
| No state management library — `useState` only | `App.tsx`, `DietPillGroup.tsx`, `TagInput.tsx` |
| `ChatClient.Builder` must be injected (autoconfigured), never constructed manually | `TransformationService.kt` |
| Model ID is set in `application.yml` — do not override in code | `TransformationService.kt` |
| `DietProfile` enum values sent from frontend as exact names: `"KETO"`, `"VEGAN"`, `"GLUTEN_FREE"`, `"PALEO"`, `"WHOLE30"` | `DietPillGroup.tsx` |

---

## Metadata

**Analog search scope:** `backend/src/main/kotlin/com/dietcode/`, `frontend/src/`
**Files scanned:** 12 Kotlin files, 5 TSX/TS files
**Pattern extraction date:** 2026-04-21
