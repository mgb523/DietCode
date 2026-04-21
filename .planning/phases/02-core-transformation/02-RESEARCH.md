# Phase 2: Core Transformation - Research

**Researched:** 2026-04-21
**Domain:** Spring AI structured output / React form state / Tailwind v4 pill UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Single-page, top-to-bottom vertical layout: textarea → constraint panel → submit button → result card. All on one scrolling page. No side-by-side columns.
- **D-02:** Form collapses/hides on successful transformation. Result card takes over the page. User re-expands (or refreshes) to start a new transformation.
- **D-03:** Diet profiles displayed as toggle pills in a horizontal row: `[Keto] [Vegan] [GF] [Paleo] [Whole30]`. Selected pills highlight. Multiple selections allowed simultaneously.
- **D-04:** Ingredient exclusions field is a free-text tag input. Label: "Ingredients to omit or replace". Placeholder: `peanuts, dairy, shellfish — press Enter to add`. Tags are removable. Maps to `List<String>` on the backend.
- **D-05:** LLM prompt must handle typos and loose phrasing gracefully — "peenut" → peanuts, "cow milk" → dairy. Implement via prompt instruction: "interpret each item broadly and forgive spelling errors".
- **D-06:** During LLM transformation, submit button changes to spinner state (`Transforming...`) and is disabled. No skeleton card.
- **D-07:** On failure, show inline error message below the submit button: `Transformation failed — please try again.` Form stays visible.
- **D-08:** Bold the quantity + unit portion of each ingredient line (e.g. **2 cups** oat flour). No other RecipeCard changes.

### Claude's Discretion

- Textarea height (suggest ~8-12 rows)
- Exact pill styling (border, background color on selected state — use shadcn/Tailwind tokens)
- Tag input component approach (controlled input with Enter/comma detection — no library needed)
- Whether to show a character count on the textarea
- Exact wording of form section headings ("Your Recipe", "Dietary Needs", etc.)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 2 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INP-01 | User can paste raw recipe text into an input field | RecipeIngestionService text path; textarea in App.tsx form |
| DIET-01 | User can select one or more diet profiles from a predefined list | Toggle pill component; DietProfile enum already locked |
| DIET-02 | User can flag specific ingredients/categories as intolerances | Free-text tag input; maps to `intolerances: List<String>` in TransformRequest |
| DIET-03 | Diet profiles and intolerance tags in a single unified constraint UI | Single constraint panel section in App.tsx |
| TRANS-01 | LLM rewrites recipe with substitutions appropriate to selected constraints | TransformationService implements: ChatClient + BeanOutputConverter pattern |
| OUT-01 | Transformed recipe displayed in a clean, readable formatted view | RecipeCard refinement: bold quantity+unit; form collapse on success |
</phase_requirements>

---

## Summary

Phase 2 closes the end-to-end loop: pasted text in → constrained LLM call → structured recipe out → rendered card. The backend has two stubs to fill (`RecipeIngestionService.ingest()` and `TransformationService.transform()`) and the frontend needs a complete form replacing the Phase 1 `useEffect` auto-fetch stub.

The Spring AI layer is straightforward. Spring Boot 3 + Spring AI 1.1.4 autoconfigures `ChatClient.Builder` as a prototype bean. Injecting it into `TransformationService` and calling `.entity(TransformedRecipe::class.java)` handles JSON schema generation, prompt injection, LLM call, and deserialization in one fluent chain. The `BeanOutputConverter` approach (lower-level) is also valid and already partially wired in Phase 1 — the key difference is whether to use the high-level `ChatClient` or the lower-level `chatModel.call(Prompt)` path. Both work; `ChatClient` is cleaner for Phase 2.

On the frontend, no new packages are needed. All form state fits in `useState`. The toggle pill component and tag input are straightforward controlled components using `cn()` from `lib/utils.ts` and Tailwind v4 utility classes directly.

**Primary recommendation:** Use `ChatClient.Builder` (autoconfigured) injected into `TransformationService`; call `.system(systemPrompt).user(userPrompt).call().entity(TransformedRecipe::class.java)`. Replace the `useEffect` in `App.tsx` with a `handleSubmit` function that fires the same POST, gating on form state.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Recipe text parsing (INP-01) | API / Backend | — | `RecipeIngestionService` — pure text parsing, no LLM |
| Diet/intolerance constraint collection (DIET-01–03) | Browser / Client | API / Backend | Form state in React; serialized to `TransformRequest` |
| LLM prompt construction (TRANS-01) | API / Backend | — | `TransformationService` — never in browser |
| Structured output parsing (TRANS-01) | API / Backend | — | `BeanOutputConverter` / `ChatClient.entity()` — server-side |
| Recipe display (OUT-01) | Browser / Client | — | `RecipeCard` component; data is already serialized by backend |
| Form collapse on success (D-02) | Browser / Client | — | `useState` boolean gate in `App.tsx` |
| Error display (D-07) | Browser / Client | — | Inline error state below submit button |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Spring AI | 1.1.4 | LLM orchestration, structured output | Already in `build.gradle.kts`; BOM locked |
| `spring-ai-starter-model-anthropic` | 1.1.4 | Anthropic Claude autoconfiguration | Already declared; provides `ChatClient.Builder` |
| `jackson-module-kotlin` | (transitive via `jackson-module-kotlin` dep in `build.gradle.kts`) | Kotlin data class deserialization | Already present; required for BeanOutputConverter to deserialize Kotlin data classes |
| React `useState` | (React 19, already installed) | Form state management | Per CLAUDE.md: no state management library |
| `cn()` from `lib/utils.ts` | (already in codebase) | Conditional class merging for pill toggle | Already present; use as-is |
| Tailwind CSS v4 | 4.2.3 (already installed) | All UI styling | `@import "tailwindcss"` single-line, no config file |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | 1.8.0 (already installed) | Spinner icon for D-06 loading state | Use `Loader2` icon with `animate-spin` class |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `ChatClient` fluent API | Low-level `chatModel.call(Prompt)` + `BeanOutputConverter.convert()` | `ChatClient` is cleaner; BeanOutputConverter manually wired is already present in Phase 1 stub but adds boilerplate |
| Controlled tag input (vanilla) | `react-tag-input` or similar | CLAUDE.md forbids adding state management libraries; a simple `onKeyDown` handler is sufficient |

**Installation:** No new packages needed for Phase 2. All dependencies are already in the project.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser
  |
  | POST /api/recipe/transform
  | { input: string, dietProfiles: DietProfile[], intolerances: string[] }
  v
RecipeController
  |
  |-- ingestionService.ingest(input) ---------> RecipeIngestionService
  |                                               (text path: parse raw text → RecipeDocument)
  |<-- RecipeDocument ----------------------------
  |
  |-- transformationService.transform(...) ---> TransformationService
  |                                               |-- build system prompt (diet rules)
  |                                               |-- build user prompt (recipe + exclusions)
  |                                               |-- ChatClient.entity(TransformedRecipe)
  |                                               |     |-- Spring AI injects format schema
  |                                               |     |-- AnthropicChatModel.call()
  |                                               |     |-- BeanOutputConverter.convert()
  |                                               |<-- TransformedRecipe (structured)
  |<-- TransformedRecipe --------------------------
  |
  | JSON response
  v
Browser
  App.tsx: setRecipe(data), setFormCollapsed(true)
  RecipeCard renders result
```

### Recommended Project Structure

No changes to project structure needed. Phase 2 fills in existing stubs:

```
backend/src/main/kotlin/com/dietcode/
├── service/
│   ├── RecipeIngestionService.kt   -- implement text path (replace TODO)
│   └── TransformationService.kt   -- implement ChatClient call (replace TODO)
├── controller/
│   └── RecipeController.kt        -- replace hardcoded stub with real service calls
└── model/                         -- no changes; all types locked in Phase 1

frontend/src/
├── App.tsx                        -- replace useEffect with handleSubmit form
├── components/
│   ├── RecipeCard.tsx             -- bold quantity+unit (D-08)
│   ├── DietPillGroup.tsx          -- NEW: toggle pills (D-03)
│   └── TagInput.tsx               -- NEW: free-text tag input (D-04)
```

### Pattern 1: TransformationService — ChatClient fluent API

**What:** Inject autoconfigured `ChatClient.Builder`, build one `ChatClient`, call `.system()` + `.user()` + `.entity()` for structured output.

**When to use:** Whenever you need a structured LLM response mapped to a Kotlin data class.

```kotlin
// Source: https://docs.spring.io/spring-ai/reference/api/chatclient.html
// Source: https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html

@Service
class TransformationService(chatClientBuilder: ChatClient.Builder) {
    private val chatClient = chatClientBuilder.build()

    fun transform(
        recipe: RecipeDocument,
        dietProfiles: List<DietProfile>,
        intolerances: List<String>
    ): TransformedRecipe {
        val dietRules = dietProfiles.joinToString(", ") { it.name.lowercase().replace("_", "-") }
        val exclusionList = if (intolerances.isEmpty()) "none" else intolerances.joinToString(", ")

        val systemPrompt = """
            You are a professional recipe adaptation expert.
            Rewrite recipes to conform to the specified dietary requirements.
            For ingredient exclusions, interpret each item broadly and forgive spelling errors
            (e.g. "peenut" means peanuts, "cow milk" means dairy).
            Return ONLY valid JSON matching the required schema — no prose, no markdown.
        """.trimIndent()

        val userPrompt = """
            Adapt the following recipe.
            Diet profiles to apply: $dietRules
            Ingredients to omit or replace: $exclusionList

            Recipe:
            Name: ${recipe.name ?: "Untitled"}
            Servings: ${recipe.servings ?: "unknown"}
            Ingredients:
            ${recipe.rawIngredients.joinToString("\n")}
            Instructions:
            ${recipe.instructions}
        """.trimIndent()

        return chatClient
            .prompt()
            .system(systemPrompt)
            .user(userPrompt)
            .call()
            .entity(TransformedRecipe::class.java)
            ?: throw IllegalStateException("LLM returned null for recipe transformation")
    }
}
```

**Import note:** `ChatClient` is `org.springframework.ai.chat.client.ChatClient`. [VERIFIED: Context7 /spring-projects/spring-ai]

### Pattern 2: RecipeIngestionService — Text Path

**What:** Parse raw pasted text into `RecipeDocument`. Phase 3 adds URL detection; Phase 2 text-only path is minimal — preserve raw text, no NLP needed. The LLM receives the raw text and does the semantic heavy lifting.

**When to use:** `input` is plain text (Phase 2 always; Phase 3 routes URL vs. text).

```kotlin
@Service
class RecipeIngestionService {
    fun ingest(input: String): RecipeDocument {
        // Phase 2: text-only path
        // Pass raw text straight through — the LLM handles parsing structure.
        // Split on blank lines as a best-effort heuristic for ingredient vs. instruction sections.
        val lines = input.trim().lines().map { it.trim() }.filter { it.isNotEmpty() }
        return RecipeDocument(
            name = null,           // LLM will infer the name
            rawIngredients = lines, // Pass all lines; LLM identifies ingredient lines
            instructions = input,   // Also pass full text as instructions fallback
            servings = null
        )
    }
}
```

**Design note:** Passing raw text verbatim to the LLM is intentional and correct for Phase 2. The LLM is the parser. `RecipeDocument.rawIngredients` carries the full text lines; `instructions` carries the full raw text as a fallback. The LLM prompt explicitly asks it to extract ingredients, instructions, and servings from whatever it receives. [ASSUMED — the exact strategy for how much to pre-parse before LLM is not specified in Phase 1 locked decisions; the above matches the spirit of "RecipeIngestionService never calls LLM" + "pass content to LLM for transformation".]

### Pattern 3: RecipeController — Replace Stub

**What:** Replace hardcoded Phase 1 stub with real service calls.

```kotlin
@PostMapping("/transform")
fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
    val recipeDoc = ingestionService.ingest(request.input)
    return transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)
}
```

### Pattern 4: App.tsx — Form Replace useEffect

**What:** Replace the Phase 1 `useEffect` auto-fetch with a submit handler. Keep the same `fetch` shape but trigger on user action.

```typescript
// Source: Phase 1 App.tsx pattern — extend, not replace
const [recipe, setRecipe] = useState<TransformedRecipe | null>(null)
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
const [formCollapsed, setFormCollapsed] = useState(false)

// Form state
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
    setFormCollapsed(true)  // D-02: collapse form on success
  } catch (err) {
    setError("Transformation failed — please try again.")  // D-07
  } finally {
    setLoading(false)
  }
}
```

### Pattern 5: Toggle Pills (DietPillGroup.tsx)

**What:** Controlled toggle pill for each `DietProfile`. Uses `cn()` for conditional class merging with Tailwind v4 tokens.

```typescript
// Source: Tailwind v4 + cn() pattern — verified in codebase
// cn() is at frontend/src/lib/utils.ts
const DIET_OPTIONS = [
  { value: "KETO", label: "Keto" },
  { value: "VEGAN", label: "Vegan" },
  { value: "GLUTEN_FREE", label: "GF" },
  { value: "PALEO", label: "Paleo" },
  { value: "WHOLE30", label: "Whole30" },
]

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function DietPillGroup({ selected, onChange }: Props) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DIET_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={cn(
            "px-3 py-1 rounded-full border text-sm font-medium transition-colors",
            selected.includes(opt.value)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

### Pattern 6: Tag Input (TagInput.tsx)

**What:** Controlled free-text input that appends a tag on Enter or comma; tags are removable.

```typescript
interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder }: Props) {
  const [value, setValue] = useState("")

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, "").trim()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(value)
    } else if (e.key === "Backspace" && value === "" && tags.length > 0) {
      onChange(tags.slice(0, -1))  // remove last tag on backspace when input empty
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
      {tags.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter(t => t !== tag))}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(value)}
        placeholder={tags.length === 0 ? placeholder : ""}
      />
    </div>
  )
}
```

### Pattern 7: RecipeCard — Bold Quantity + Unit (D-08)

**What:** Bold the `quantity` and `unit` fields in each ingredient line. Only those two fields; `ingredient` and `preparation` remain normal weight.

```typescript
// Before (Phase 1):
// <li key={i}>{ing.quantity} {ing.unit} {ing.ingredient}...</li>

// After (Phase 2, D-08):
<li key={i}>
  <span className="font-semibold">{ing.quantity} {ing.unit}</span>{" "}
  {ing.ingredient}
  {ing.preparation && `, ${ing.preparation}`}
</li>
```

**Edge case:** When `unit` is empty (e.g. "2 eggs" — no unit), the bold span still works: `"2 "` renders as bold with a trailing space before `eggs`. No special handling needed.

### Anti-Patterns to Avoid

- **Calling LLM from `RecipeIngestionService`:** CLAUDE.md prohibits this. Text parsing must be pure string manipulation only.
- **Asking the LLM to scale quantities:** Per CLAUDE.md, scaling is `ScalingService` (Phase 3), never LLM.
- **Adding a state management library:** CLAUDE.md mandates `useState` only. The linear form → result flow fits naturally in component state.
- **Constructing the Anthropic client manually:** Do not `new AnthropicChatModel(...)` — inject `ChatClient.Builder` from Spring Boot autoconfiguration instead.
- **Using `BeanOutputConverter.getFormat()` in the user message for Tailwind classes:** `getFormat()` returns JSON Schema instructions — always inject these via the user prompt template `{format}` placeholder (or use the `ChatClient.entity()` path which handles this automatically).
- **Hardcoding the model ID in `TransformationService`:** It is already set in `application.yml` (`claude-3-5-haiku-20241022`, temperature 0.3). Do not override in code.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema generation for LLM output | Custom schema strings | `BeanOutputConverter` / `ChatClient.entity()` | Schema stays in sync with Kotlin data class; hand-crafted JSON schemas drift |
| JSON deserialization of LLM response | Manual `JSONObject` parsing | `BeanOutputConverter.convert()` / `ChatClient.entity()` | Handles null fields, list types, nested objects correctly |
| Spinner icon for loading state | SVG or CSS spinner | `lucide-react` `Loader2` with `animate-spin` | Already installed; one import |
| Comma-split tag parsing | Regex or split logic spread across component | Encapsulate in `TagInput.tsx` `addTag()` | Consistent edge-case handling (trailing commas, duplicates) |

**Key insight:** The `ChatClient.entity(TransformedRecipe::class.java)` call is effectively BeanOutputConverter + prompt injection + HTTP call + deserialization in one line. Any attempt to do this manually introduces parser drift risk.

---

## Common Pitfalls

### Pitfall 1: LLM Wraps JSON in Markdown Code Block

**What goes wrong:** Claude sometimes returns ` ```json\n{...}\n``` ` instead of raw JSON. `BeanOutputConverter.convert()` will fail to deserialize.

**Why it happens:** The model defaults to "helpful" markdown formatting. The system prompt must explicitly suppress it.

**How to avoid:** Include `"Return ONLY valid JSON — no markdown fences, no prose, no explanation."` in the system prompt. The `ChatClient.entity()` path also injects schema instructions via `getFormat()` which instructs the model to return RFC8259 JSON — but an explicit system instruction is belt-and-suspenders.

**Warning signs:** `IllegalStateException` or `JsonParseException` from the converter; raw response contains triple backticks.

### Pitfall 2: Kotlin Data Class Deserialization Failure

**What goes wrong:** `BeanOutputConverter` uses Jackson to deserialize the LLM's JSON response. If `jackson-module-kotlin` is not registered, Kotlin data classes without `@JsonCreator` annotations fail to deserialize (no-arg constructor issue).

**Why it happens:** Standard `ObjectMapper()` does not auto-register the Kotlin module.

**How to avoid:** Spring Boot 3 with `jackson-module-kotlin` on the classpath (already in `build.gradle.kts` as `com.fasterxml.jackson.module:jackson-module-kotlin`) auto-configures the `ObjectMapper` with the Kotlin module. The existing setup is correct. Do not create a custom `ObjectMapper` without registering the Kotlin module. [VERIFIED: `jackson-module-kotlin` is in `build.gradle.kts`]

**Warning signs:** `MismatchedInputException`, `InvalidDefinitionException` during conversion.

### Pitfall 3: Empty `dietProfiles` Sends Null-Like JSON

**What goes wrong:** If the user submits with no diet profile selected, `dietProfiles` is `[]`. The backend `TransformRequest` correctly accepts an empty list. The LLM prompt must still produce a valid recipe (just no diet adaptation). The prompt must not break when diet rules and exclusion lists are both empty.

**How to avoid:** Guard the prompt construction: if `dietProfiles` is empty, use the string `"none"` for diet rules; similarly for `intolerances`. The LLM should be instructed to return the recipe unmodified if no constraints are active.

**Warning signs:** LLM returns a nonsensical adaptation or an empty ingredients list when no constraints are given.

### Pitfall 4: Form Does Not Prevent Double-Submit

**What goes wrong:** User clicks "Transform" while a fetch is in flight — two concurrent requests, possible race condition on `setRecipe`.

**How to avoid:** The `loading` state disables the submit button (D-06). Ensure `disabled={loading}` is on the `<button type="submit">` element.

**Warning signs:** Multiple simultaneous network requests visible in DevTools.

### Pitfall 5: `ChatClient.entity()` Returns Null vs. Throws

**What goes wrong:** `entity(TransformedRecipe::class.java)` can return `null` if the LLM response is empty or malformed. The Kotlin return type of `entity()` is nullable (`T?`).

**How to avoid:** Always null-check: `?: throw IllegalStateException(...)`. The controller will then return a 500 which the frontend error handler catches. [VERIFIED: Context7 Spring AI docs show `entity()` return is `T?`]

### Pitfall 6: `DietProfile` Enum Serialization in JSON Request

**What goes wrong:** The frontend sends `dietProfiles: ["KETO", "VEGAN"]` as strings. The backend `TransformRequest.dietProfiles` is `List<DietProfile>`. Jackson must deserialize the strings to the enum. This works automatically because Jackson maps string values to enum names by default.

**How to avoid:** Ensure the frontend sends the enum key names exactly (`"KETO"`, `"VEGAN"`, `"GLUTEN_FREE"`, `"PALEO"`, `"WHOLE30"`) — not display labels. The `DietPillGroup` should store `value: "KETO"` (not `"Keto"`) in its option definitions.

---

## Code Examples

### Full TransformationService (Phase 2 implementation)

```kotlin
// Source: https://docs.spring.io/spring-ai/reference/api/chatclient.html [CITED]
// Combines: system+user message pattern + ChatClient.entity() structured output
@Service
class TransformationService(chatClientBuilder: ChatClient.Builder) {
    private val chatClient = chatClientBuilder.build()

    fun transform(
        recipe: RecipeDocument,
        dietProfiles: List<DietProfile>,
        intolerances: List<String>
    ): TransformedRecipe {
        val dietRules = if (dietProfiles.isEmpty()) "none"
            else dietProfiles.joinToString(", ") { it.name.lowercase().replace("_", "-") }
        val exclusionList = if (intolerances.isEmpty()) "none" else intolerances.joinToString(", ")

        val systemPrompt = """
            You are a professional recipe adaptation expert.
            Rewrite recipes to conform to the specified dietary requirements.
            For ingredient exclusions, interpret each item broadly and forgive spelling errors.
            Return ONLY valid JSON matching the required schema — no markdown fences, no prose.
        """.trimIndent()

        val userPrompt = """
            Adapt the following recipe.
            Diet profiles: $dietRules
            Ingredients to omit or replace: $exclusionList

            Recipe:
            Name: ${recipe.name ?: "Untitled"}
            Servings: ${recipe.servings ?: "unknown"}
            Ingredients:
            ${recipe.rawIngredients.joinToString("\n")}
            Instructions:
            ${recipe.instructions}
        """.trimIndent()

        return chatClient
            .prompt()
            .system(systemPrompt)
            .user(userPrompt)
            .call()
            .entity(TransformedRecipe::class.java)
            ?: throw IllegalStateException("LLM returned null — possible malformed response")
    }
}
```

### Import List for TransformationService

```kotlin
import org.springframework.ai.chat.client.ChatClient
import org.springframework.stereotype.Service
import com.dietcode.model.DietProfile
import com.dietcode.model.RecipeDocument
import com.dietcode.model.TransformedRecipe
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `BeanOutputConverter` manually wired (low-level `chatModel.call()`) | `ChatClient.entity()` fluent API (autoconfigured) | Spring AI 1.0 GA | Cleaner code; fewer imports; entity() handles format injection automatically |
| Separate `@EnableWebMvc` / `WebMvcConfigurer` beans | Spring Boot autoconfigures CORS via `WebMvcConfigurer` bean | Spring Boot 3.x | Already done in Phase 1 |
| `useEffect` fetch on mount | `onSubmit` handler triggering fetch | Phase 2 | Form-driven data fetching replaces mount-time auto-fetch |

**Deprecated/outdated:**
- `chatModel.call(String)` with raw string prompt: still works, but bypasses structured output. Use `ChatClient.entity()` for typed responses.
- Phase 1 `useEffect` auto-fetch stub: replace entirely with `handleSubmit` in Phase 2 — do not keep both.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | RecipeIngestionService text path: pass all lines as `rawIngredients` and full text as `instructions`; let LLM parse structure | Architecture Patterns — Pattern 2 | If RecipeDocument schema is insufficient for the LLM prompt, the LLM may produce poor results; the schema can be adjusted without breaking downstream |
| A2 | `ChatClient.entity()` return type is `T?` (nullable) in Kotlin | Common Pitfalls — Pitfall 5 | If non-nullable, the null-check is harmless dead code; no risk |

---

## Open Questions

1. **ANTHROPIC_API_KEY on the dev machine**
   - What we know: The env var is not currently set (`ANTHROPIC_API_KEY set: NO`). The `application.yml` uses `${ANTHROPIC_API_KEY:placeholder-not-needed-in-phase-1}` fallback.
   - What's unclear: The developer must set this before Phase 2 can be tested end-to-end.
   - Recommendation: Phase 2 plan Wave 0 should include a checkpoint: "confirm `ANTHROPIC_API_KEY` is set before running LLM tests."

2. **Exact model ID string**
   - What we know: `application.yml` has `claude-3-5-haiku-20241022`. Phase 1 TODO comment flagged this as needing verification.
   - What's unclear: Whether `claude-3-5-haiku-20241022` is the correct current ID for Claude Haiku 3.5 on the Anthropic API.
   - Recommendation: Test the model ID by running a minimal curl against the Anthropic API in Wave 0 of Phase 2.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend dev server | YES | v25.9.0 | — |
| Java (JDK 17) | Backend (Gradle requires 17) | YES | OpenJDK 17.0.18 | — |
| ANTHROPIC_API_KEY | LLM calls in TransformationService | NOT SET | — | Must be set before LLM test; backend runs without it for unit tests |

**Missing dependencies with no fallback:**
- `ANTHROPIC_API_KEY` — must be set as env var before end-to-end LLM tests. Backend will start but `chatClient.call()` will throw `401 Unauthorized`. Wave 0 of the plan must include a checkpoint for this.

---

## Security Domain

The phase involves no authentication, no user data persistence, no file uploads, and no secrets managed in code. The only external call is from the backend to the Anthropic API using an env-var API key.

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | YES (minimal) | Recipe text is free-form; validate non-empty before calling LLM; max length guard prevents token overrun |
| V6 Cryptography | NO | No secrets stored; API key via env var is not cryptography domain |
| V2 Authentication | NO | No user auth in Phase 2 |
| V3 Session Management | NO | Stateless — no sessions |
| V4 Access Control | NO | Single-user personal tool |

**Input validation recommendation:** In `RecipeController`, validate `request.input.isNotBlank()` and return `400 Bad Request` before calling services. Add a max-length guard (e.g., 10,000 chars) to prevent accidental token exhaustion. [ASSUMED — no specific validation rule in CLAUDE.md, but this is standard practice]

---

## Sources

### Primary (HIGH confidence)
- [Context7 /spring-projects/spring-ai] — BeanOutputConverter, ChatClient.entity(), system+user message Prompt pattern, ChatClient.Builder autoconfiguration
- [docs.spring.io/spring-ai/reference/api/structured-output-converter.html](https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html) — BeanOutputConverter low-level API (getFormat, convert)
- [docs.spring.io/spring-ai/reference/api/chatclient.html](https://docs.spring.io/spring-ai/reference/api/chatclient.html) — ChatClient.Builder injection, entity() method
- Codebase — all existing Kotlin models, `build.gradle.kts`, `application.yml`, `App.tsx`, `RecipeCard.tsx`, `lib/utils.ts`, `package.json`

### Secondary (MEDIUM confidence)
- [Gareth Hallberg — Spring AI + Kotlin blog series (Medium)](https://medium.com/@gareth.hallberg_55290/part-5-getting-predictable-results-structured-output-and-templates-with-spring-ai-820016fc68d9) — Kotlin + BeanOutputConverter usage patterns
- [Baeldung — Spring AI Structured Output](https://www.baeldung.com/spring-artificial-intelligence-structure-output) — BeanOutputConverter with Spring Boot 3

### Tertiary (LOW confidence)
- None — all claims are either verified from codebase or cited from official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies verified from `build.gradle.kts`, `package.json`, and Context7 Spring AI docs
- Architecture: HIGH — service stubs and locked data models are in the codebase; ChatClient API verified from official docs
- Pitfalls: MEDIUM-HIGH — LLM markdown wrapping (widely documented), Jackson Kotlin module (verified in build file), enum serialization (Spring MVC default behavior, standard)

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (Spring AI 1.1.x stable; Tailwind v4 stable)
