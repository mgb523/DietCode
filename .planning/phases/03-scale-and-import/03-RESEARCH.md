# Phase 3: Scale and Import — Research

**Researched:** 2026-05-14
**Domain:** jsoup scraping, sub-linear scaling math, frontend fraction parsing, backend/frontend scaling architecture
**Confidence:** HIGH (core patterns verified via Context7, Maven Central, npm registry, and official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Target servings field appears **upfront in the form**. Backend runs LLM first (getting the LLM-inferred serving count), then calls `ScalingService.scale()` with user's target before returning the response.
- **D-02:** Result card exposes a **serving count stepper** for re-scaling post-result. Adjusting the stepper calls ScalingService logic **on the frontend** — no new LLM call, no new backend call.
- **D-03:** Serving count input uses a **number input with +/- stepper buttons** on either side. Min value: 1.
- **D-04:** Result card stepper shows **"(original: N)"** alongside current target, where N = `TransformedRecipe.servings` (LLM-inferred).
- **D-05:** URL detection heuristic: input starts with `http://` or `https://`. Checked on frontend on every `onChange`.
- **D-06:** URL detection shows a **small badge/icon** at the top of the textarea. No other change.
- **D-07:** All scraping failures produce a **single generic error**: "Couldn't import this URL. Open it, copy the recipe text, and paste it here."
- **D-08:** On scraping failure, the **URL stays in the input field**.

### Claude's Discretion

- Exact sub-linear scaling coefficients for leavening, salt, and strong spices (choose logarithmic or square-root — pick what produces sensible results at 2x–4x)
- Whether post-result rescaling is a backend call or pure frontend math (pure frontend preferred given ScalingService is stateless)
- Exact badge/icon style for URL detection (use shadcn/Tailwind tokens to match Phase 2 pill/chip aesthetic)
- Placeholder or label wording for the upfront servings field
- Whether to disable the form servings field when the result card scaler is active (or keep both editable)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 3 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INP-02 | User can import a recipe by entering a URL | jsoup `Jsoup.connect()` fetches and parses; JSON-LD extraction from `script[type=application/ld+json]` using `.data()` method |
| INP-03 | Input field auto-detects URL or pasted text and routes automatically | Frontend: `recipeText.startsWith("http://") \|\| recipeText.startsWith("https://")` computed inline; backend: `RecipeIngestionService.ingest()` branches on same prefix |
| TRANS-03 | User can set a target number of servings and receive scaled quantities | `targetServings` added to `TransformRequest`; `ScalingService.scale()` called server-side after LLM; result card stepper rescales client-side |
| TRANS-04 | Serving scaler applies sub-linear rules for leavening agents, salt, and strong spices | Power-curve formula: `scaledQty = baseQty * factor^0.5` for leavening/salt/spice; linear `scaledQty = baseQty * factor` for all others |
</phase_requirements>

---

## Summary

Phase 3 has two independent capabilities: a serving scaler and URL import. Both touch backend and frontend, but the integration points are clean and non-overlapping.

**Serving scaler:** The backend's `ScalingService.scale()` stub is implemented with arithmetic only. The initial scale happens server-side when the user submits the form (LLM runs first → ScalingService scales to `targetServings` before returning). The result card adds a client-side stepper that re-scales quantities using the same formula in TypeScript — no second backend call (per D-02). The `quantity` field in `IngredientLine` is a string (e.g., `"1 1/2"`), so the frontend needs fraction parsing via `fraction.js` to convert, multiply, and reformat.

**URL import:** `RecipeIngestionService.ingest()` branches on the `http`/`https` prefix. The URL path calls jsoup to fetch the page, then extracts the `<script type="application/ld+json">` block using `.data()`, parses it as JSON using Jackson (already on the classpath), and maps `recipeIngredient`, `recipeInstructions`, and `recipeYield` to `RecipeDocument`. If JSON-LD is absent, fall back to microdata (`[itemprop=recipeIngredient]`), then to heuristic HTML (`<li>`, `<ul>` in the body), then throw a `ScrapingException` — never pass empty content to the LLM silently.

**Primary recommendation:** Implement ScalingService with a power-curve formula (`factor^0.5`) for sub-linear ingredients, and `fraction.js` (npm) for frontend quantity parsing. Use jsoup 1.21.1 with `.data()` to extract JSON-LD from recipe pages.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| URL detection (http/https prefix check) | Frontend (derived value) | Backend (same check in ingest()) | Frontend provides immediate visual feedback; backend does the actual branch |
| Recipe scraping from URL | API / Backend (RecipeIngestionService) | — | Network I/O and HTML parsing belong in server, not browser |
| JSON-LD extraction and parsing | API / Backend (RecipeIngestionService) | — | Jackson already on classpath; no extra dep needed |
| Initial scaling (form submission) | API / Backend (ScalingService) | — | D-01 locks this: backend calls ScalingService after LLM |
| Post-result rescaling (result card stepper) | Frontend (RecipeCard local state) | — | D-02 locks this: no backend call; pure client-side math |
| Fraction string parsing | Frontend (fraction.js) | — | `IngredientLine.quantity` is a string; browser parses it for display |
| Sub-linear math coefficients | API / Backend (ScalingService) | Frontend (mirror for client rescaling) | Backend is authoritative; frontend mirrors the same formula |
| Scraping error messaging | Frontend (App.tsx error state) | Backend (status code / error type) | Backend signals failure type; frontend renders single generic message |

---

## Standard Stack

### Core (Backend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jsoup | 1.21.1 | HTML fetch + parse, CSS selector queries, DataNode extraction | De facto Java/Kotlin HTML scraper; schema.org JSON-LD extraction with `.data()` |
| Jackson (jackson-module-kotlin) | Already in project | Parse JSON-LD string to Map | Already on classpath via Spring Boot starter; no new dep |

[VERIFIED: Maven Central — `org.jsoup:jsoup:1.21.1` published 2025-06-22]
[VERIFIED: build.gradle.kts — `com.fasterxml.jackson.module:jackson-module-kotlin` already declared]

### Core (Frontend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fraction.js | 5.3.4 | Parse mixed fraction strings ("1 1/2"), multiply by scale factor, format back to string | Zero-dependency, MIT, BigInt precision; handles all recipe quantity formats |

[VERIFIED: npm registry — `fraction.js@5.3.4`, 0 deps, MIT]

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | Already installed | `Link`/`Link2` icon for URL badge, `Plus`/`Minus` icons for stepper | Already in package.json — no new install |

[VERIFIED: package.json — `lucide-react` already a dependency]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fraction.js | Manual regex parsing | Regex misses Unicode vulgar fractions (½, ¼) and edge cases; fraction.js handles all of them |
| fraction.js | `mathjs` | mathjs is 200KB; fraction.js is 6KB with no deps |
| jsoup `.data()` | `.html()` | `.html()` returns escaped HTML entities; `.data()` returns the raw DataNode content |
| Power-curve `factor^0.5` | 75% cap rule | 75% cap is a discrete cutoff; power-curve is continuous and applies at any scale factor |

**Installation:**
```bash
# Backend — add to build.gradle.kts dependencies {}
implementation("org.jsoup:jsoup:1.21.1")

# Frontend
npm install fraction.js
```

---

## Architecture Patterns

### System Architecture Diagram

```
Form submit
    |
    v
[App.tsx]
  targetServings=N, input=(text or URL)
    |
    v POST /api/recipe/transform (TransformRequest + targetServings)
    |
[RecipeController]
    |
    v input.startsWith("http")?
    |
   YES                          NO
    |                            |
[RecipeIngestionService]    [RecipeIngestionService]
  scrapeUrl(input)            ingest(input) [existing]
    |                            |
  jsoup fetch                   |
  extract JSON-LD               |
  map to RecipeDocument         |
    |                            |
    +----------------------------+
    |
    v RecipeDocument
[TransformationService]
  LLM call → TransformedRecipe (servings = LLM-inferred)
    |
    v
[ScalingService]
  scale(recipe, targetServings) → TransformedRecipe (scaled)
    |
    v JSON response
[App.tsx / RecipeCard]
  currentServings = recipe.servings (LLM-inferred, already scaled)
  stepper onChange → client-side rescale (fraction.js)
    |
    v
  Updated ingredient quantity display (no backend call)
```

### Recommended Project Structure (changes from Phase 2)

```
backend/src/main/kotlin/com/dietcode/
├── service/
│   ├── RecipeIngestionService.kt   # Add URL branch + scrapeUrl()
│   ├── ScalingService.kt           # Implement scale() — was TODO
│   └── TransformationService.kt   # No changes
├── controller/
│   └── RecipeController.kt        # Add targetServings param, call ScalingService
├── model/
│   └── TransformRequest.kt        # Add targetServings: Int = 2
└── exception/
    └── ScrapingException.kt        # NEW: signals scraping failure to controller

frontend/src/
├── components/
│   ├── ServingStepper.tsx           # NEW: +/- stepper component
│   ├── UrlDetectionBadge.tsx        # NEW: inline badge for URL input
│   └── RecipeCard.tsx              # MODIFY: add currentServings state + stepper
└── App.tsx                         # MODIFY: add targetServings state, isUrlInput derived value
```

### Pattern 1: jsoup JSON-LD Extraction

**What:** Fetch a recipe URL with jsoup, select `script[type=application/ld+json]`, read the raw JSON string with `.data()`, parse with Jackson into `Map<String, Any>`, extract Recipe fields.

**When to use:** First-priority scraping path (CLAUDE.md: JSON-LD first). Applies when the page has structured data — the majority of food blogs (AllRecipes, Food Network, Serious Eats, Minimalist Baker all serve JSON-LD).

**Bot-blocking reality:** Major food sites (AllRecipes, NYT Cooking) block server-side requests without a real browser User-Agent. Per STATE.md note, test this early. jsoup allows setting a User-Agent header, which helps with some sites. Where it fails, D-07 covers with a generic error.

**Example (Kotlin):**
```kotlin
// Source: Context7 /jhy/jsoup — Jsoup.connect() + .data() pattern
import org.jsoup.Jsoup
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue

fun scrapeUrl(url: String): RecipeDocument {
    val doc = try {
        Jsoup.connect(url)
            .userAgent("Mozilla/5.0 (compatible; DietCode/1.0)")
            .timeout(10_000)
            .get()
    } catch (e: Exception) {
        throw ScrapingException("Failed to fetch URL: ${e.message}")
    }

    // JSON-LD path (first priority)
    val ldJsonElement = doc.selectFirst("script[type=application/ld+json]")
    if (ldJsonElement != null) {
        val jsonText = ldJsonElement.data()  // .data() reads DataNode content, not .text()
        return parseJsonLd(jsonText)
    }

    // Microdata fallback
    val microdataIngredients = doc.select("[itemprop=recipeIngredient]").map { it.text() }
    if (microdataIngredients.isNotEmpty()) {
        return buildRecipeDocument(
            name = doc.selectFirst("[itemprop=name]")?.text(),
            ingredients = microdataIngredients,
            instructions = doc.select("[itemprop=recipeInstructions]").map { it.text() }.joinToString("\n"),
            servings = doc.selectFirst("[itemprop=recipeYield]")?.text()?.toIntOrNull()
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
    // JSON-LD may be a single object or @graph array — handle both
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
```

**Key jsoup facts:**
- `doc.selectFirst("script[type=application/ld+json]")` — CSS attribute-value selector [VERIFIED: Context7 /jhy/jsoup]
- `.data()` — reads DataNode content (script body), not `.text()` which returns empty for DataNodes [VERIFIED: Context7 /jhy/jsoup — DataNode documentation]
- `.userAgent()` and `.timeout()` are fluent connection builder methods [VERIFIED: Context7 /jhy/jsoup]
- jsoup 1.21.1 supports HTTP/2 on JVM 11+ [VERIFIED: Context7 /jhy/jsoup]

### Pattern 2: JSON-LD @graph and recipeYield handling

**What:** Real-world JSON-LD often wraps the Recipe in an `@graph` array, and `recipeYield` is either a plain string (`"4"`, `"4 servings"`, `"24 cookies"`), an array (`["6", "24 cookies"]`), or an integer. Extract just the numeric portion.

**Example (Kotlin):**
```kotlin
// Source: Google Search Central Recipe Structured Data docs
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
            is Map<*, *> -> step["text"] as? String  // HowToStep
            else -> null
        }
    }
    else -> emptyList()
}
```

### Pattern 3: ScalingService — Sub-linear Math

**What:** Implement `scale()` in `ScalingService.kt`. Parse `IngredientLine.quantity` string to Double, apply linear or sub-linear multiplier, format back to string.

**The sub-linear formula:** Use `factor^0.5` (square root of the scale factor) for leavening agents, salt, and strong spices. This is the best-fit for recipe scaling:

| Scale factor | Linear | `factor^0.5` | Industry 75% |
|---|---|---|---|
| 2x | 2.0 | 1.41 | 1.5 |
| 3x | 3.0 | 1.73 | 2.25 |
| 4x | 4.0 | 2.0 | 3.0 |
| 0.5x | 0.5 | 0.71 | 0.375 |

The square root curve is smooth, continuous, applies to scale-down (0.5x) as well as scale-up, and produces visibly different results at 2x-4x (Phase 3 success criterion 2). The "75% of linear" industry rule is only a guideline for doubling — the power curve is a proper mathematical model.

**Sub-linear ingredient detection (keyword matching):**
```kotlin
// Source: [ASSUMED] — based on standard culinary ingredient classification
private val SUBLINEAR_KEYWORDS = setOf(
    // Leavening
    "baking powder", "baking soda", "bicarbonate", "yeast",
    // Salt
    "salt",
    // Strong spices (used in small quantities; over-scaling ruins the dish)
    "cayenne", "chili powder", "red pepper flakes", "black pepper",
    "cinnamon", "nutmeg", "cloves", "allspice",
    "ginger", "cardamom", "turmeric", "cumin"
)

fun isSubLinear(ingredientName: String): Boolean =
    SUBLINEAR_KEYWORDS.any { ingredientName.lowercase().contains(it) }
```

**Scale function:**
```kotlin
// Source: [ASSUMED] — square root scaling is Claude's discretion per CONTEXT.md
fun scale(recipe: TransformedRecipe, targetServings: Int): TransformedRecipe {
    val originalServings = recipe.servings
    if (originalServings <= 0 || targetServings == originalServings) return recipe

    val factor = targetServings.toDouble() / originalServings

    val scaledIngredients = recipe.ingredients.map { line ->
        val qty = parseQuantity(line.quantity) ?: return@map line
        val scaleFactor = if (isSubLinear(line.ingredient)) {
            Math.pow(factor, 0.5)   // square root curve for leavening/salt/spice
        } else {
            factor                  // linear for everything else
        }
        val scaled = qty * scaleFactor
        line.copy(quantity = formatQuantity(scaled))
    }

    return recipe.copy(
        ingredients = scaledIngredients,
        servings = targetServings
    )
}
```

**Quantity string parsing:**

`IngredientLine.quantity` is LLM-generated and may arrive as:
- `"1"`, `"2"`, `"0.5"` — plain decimal
- `"1/2"`, `"3/4"` — simple fraction
- `"1 1/2"`, `"2 3/4"` — mixed number
- `""` — empty (e.g., "to taste") — return `null`, skip scaling

```kotlin
fun parseQuantity(s: String): Double? {
    val trimmed = s.trim()
    if (trimmed.isBlank()) return null

    // Try plain decimal first
    trimmed.toDoubleOrNull()?.let { return it }

    // Try "A/B" fraction
    val fracRegex = Regex("""^(\d+)\s*/\s*(\d+)$""")
    fracRegex.matchEntire(trimmed)?.let { m ->
        val (num, den) = m.destructured
        return num.toDouble() / den.toDouble()
    }

    // Try "W A/B" mixed number
    val mixedRegex = Regex("""^(\d+)\s+(\d+)\s*/\s*(\d+)$""")
    mixedRegex.matchEntire(trimmed)?.let { m ->
        val (whole, num, den) = m.destructured
        return whole.toDouble() + num.toDouble() / den.toDouble()
    }

    return null
}

fun formatQuantity(value: Double): String {
    // Round to avoid floating point noise (e.g., 0.6666... → "2/3")
    // Use simple fraction approximation for common values
    val rounded = Math.round(value * 8.0) / 8.0  // nearest 1/8
    return if (rounded == rounded.toLong().toDouble()) {
        rounded.toLong().toString()
    } else {
        "%.2f".format(rounded).trimEnd('0').trimEnd('.')
    }
}
```

Note: The backend's `formatQuantity` uses simple decimal rounding. This is sufficient because the LLM will have produced rational quantities and scaling by typical factors produces humanly meaningful values (e.g., 1.5 tsp, 0.75 cup). Perfect fraction formatting (e.g., displaying "3/4" instead of "0.75") is a UX nice-to-have deferred to Phase 5 polish.

### Pattern 4: TransformRequest update and controller wiring

**What:** Add `targetServings` to `TransformRequest` and call `ScalingService` in `RecipeController` after the LLM call.

```kotlin
// TransformRequest.kt — add nullable field with default
data class TransformRequest(
    val input: String,
    val dietProfiles: List<DietProfile>,
    val intolerances: List<String>,
    val targetServings: Int? = null  // null means "use LLM-inferred serving count"
)

// RecipeController.kt — inject ScalingService, call after LLM
@RestController
@RequestMapping("/api/recipe")
class RecipeController(
    private val ingestionService: RecipeIngestionService,
    private val transformationService: TransformationService,
    private val scalingService: ScalingService  // ADD
) {
    @PostMapping("/transform")
    fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
        require(request.input.isNotBlank()) { "Recipe input must not be blank" }
        require(request.input.length <= 10_000) { "Recipe input exceeds maximum length" }
        val recipeDoc = ingestionService.ingest(request.input)
        val transformed = transformationService.transform(recipeDoc, request.dietProfiles, request.intolerances)
        // Scale if targetServings specified and differs from LLM-inferred
        return request.targetServings
            ?.takeIf { it > 0 && it != transformed.servings }
            ?.let { scalingService.scale(transformed, it) }
            ?: transformed
    }
}
```

### Pattern 5: Frontend — fraction.js for client-side rescaling

**What:** `RecipeCard.tsx` maintains `currentServings` state. When the stepper changes, map over `recipe.ingredients`, parse each `quantity` string with `fraction.js`, multiply by the new scale factor, format back.

```typescript
// Source: npm registry — fraction.js@5.3.4, github.com/rawify/Fraction.js
import Fraction from 'fraction.js'

function scaleQuantity(quantityStr: string, scaleFactor: number): string {
  const trimmed = quantityStr.trim()
  if (!trimmed || trimmed === '') return trimmed
  try {
    const scaled = new Fraction(trimmed).mul(scaleFactor)
    return scaled.toFraction(true) // true = mixed fraction format e.g. "1 1/2"
  } catch {
    // If fraction.js can't parse (e.g. "to taste"), return as-is
    return quantityStr
  }
}

// Sub-linear keywords mirrored from backend (TRANS-04)
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

function rescaleIngredients(
  ingredients: IngredientLine[],
  originalServings: number,
  targetServings: number
): IngredientLine[] {
  const linearFactor = targetServings / originalServings
  return ingredients.map(ing => {
    const factor = isSubLinear(ing.ingredient) ? Math.sqrt(linearFactor) : linearFactor
    return { ...ing, quantity: scaleQuantity(ing.quantity, factor) }
  })
}
```

**In RecipeCard:**
```typescript
// recipe prop = already-scaled result from backend (at user's initial targetServings)
// recipe.servings = the LLM-inferred count BEFORE initial scaling was applied
// We need the servings count AFTER initial scaling to set currentServings
// The backend returns recipe.servings = targetServings (after scaling in RecipeController)
// So initialize currentServings to recipe.servings (= the already-scaled count)

const [currentServings, setCurrentServings] = useState(recipe.servings)

// rescale relative to recipe baseline (already-scaled by backend)
const displayedIngredients = rescaleIngredients(
  recipe.ingredients,   // already at recipe.servings scale
  recipe.servings,      // baseline = what backend returned
  currentServings       // what user selected in stepper
)
```

**Important:** After the backend returns a scaled recipe, `recipe.servings` = `targetServings` (the backend updated it). The client-side rescaler starts from that as its baseline. The `(original: N)` label must show the LLM-inferred original — but since the backend overwrites `servings` with `targetServings`, the frontend cannot easily display the LLM-original unless the backend returns it separately. See Open Questions.

### Pattern 6: ScrapingException and error routing

**What:** Define a dedicated exception for scraping failures so the controller can distinguish scraping errors (return 422 with error type) from other failures.

```kotlin
// ScrapingException.kt
class ScrapingException(message: String) : RuntimeException(message)

// In RecipeController or ValidationExceptionHandler:
@ExceptionHandler(ScrapingException::class)
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
fun handleScrapingException(e: ScrapingException): Map<String, String> =
    mapOf("error" to "scraping_failed", "message" to e.message.orEmpty())
```

**Frontend detection:** App.tsx checks for the `"scraping_failed"` error type when `isUrlInput` is true. Uses the same `error` state variable as Phase 2 (per UI-SPEC), but sets D-07 copy instead of the generic transformation error.

### Anti-Patterns to Avoid

- **Using `.text()` to extract script tag content:** jsoup script elements are DataNodes; `.text()` returns empty. Use `.data()`. [VERIFIED: OpenRefine issue #4189, Context7 DataNode docs]
- **Passing `null`/empty RecipeDocument to the LLM:** CLAUDE.md requires "fail loudly" at the scraping layer. Throw `ScrapingException` instead of returning an empty `RecipeDocument`.
- **Calling the LLM to scale quantities:** CLAUDE.md explicitly prohibits this. Scaling is pure math in `ScalingService`.
- **Treating `IngredientLine.quantity` as a Double in the backend:** It is a `String`. Parse it with regex before scaling; handle empty/unparseable strings by skipping (return the line unchanged).
- **Hardcoding a 75% cap for sub-linear scaling:** The 75% rule only applies at 2x. Use a power-curve (`factor^0.5`) so the formula is correct at all scale factors including scale-down.
- **Multiple JSON-LD blocks:** Some pages have multiple `<script type="application/ld+json">` tags (breadcrumbs, organization, recipe). Use `doc.select("script[type=application/ld+json]")` and iterate to find the one with `"@type": "Recipe"`, don't assume the first is the Recipe.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fraction string parsing (frontend) | Custom regex parser | `fraction.js` | Handles Unicode vulgar fractions (½, ¼, ⅓), mixed numbers, repeating decimals, edge cases |
| HTML fetch + parse (backend) | `HttpClient` + manual HTML string manipulation | `jsoup` | HTML is irregular; jsoup handles malformed tags, encoding, relative URL resolution |
| JSON parsing of JSON-LD (backend) | Manual string parsing | Jackson `ObjectMapper` (already on classpath) | Jackson handles all JSON edge cases; already a dependency |
| Schema.org type detection | Custom heuristics | CSS selector `[itemprop=recipeIngredient]` for microdata | Standard attribute presence selector |

**Key insight:** Every "simple" custom solution in this domain hits encoding issues, malformed HTML, Unicode fractions, or JSON edge cases within the first ten test URLs. Use the libraries.

---

## Common Pitfalls

### Pitfall 1: `@graph` wrapped JSON-LD

**What goes wrong:** Assuming `JSON.parse(jsonText)["@type"] == "Recipe"`. Fails on any page using Yoast SEO or similar, where JSON-LD looks like `{ "@graph": [{ "@type": "BreadcrumbList", ... }, { "@type": "Recipe", ... }] }`.

**Why it happens:** JSON-LD allows both inline objects and graph arrays. Food blogs (the primary target) often use WordPress + Yoast, which generates `@graph` format.

**How to avoid:** Always check for both `raw["@type"] == "Recipe"` and `raw["@graph"]` containing a Recipe node. See Pattern 2 above.

**Warning signs:** Backend throws `ClassCastException` or "JSON-LD is not a Recipe schema" for well-known food blog URLs.

### Pitfall 2: Multiple `script[type=application/ld+json]` blocks

**What goes wrong:** `doc.selectFirst("script[type=application/ld+json]").data()` returns the first block, which may be a BreadcrumbList or Organization, not a Recipe.

**Why it happens:** Pages embed multiple structured data types as separate `<script>` blocks.

**How to avoid:** Use `doc.select(...)` (plural) and iterate. Check `@type` on each. Wrap in a loop: find the first with `@type == "Recipe"` or the first whose `@graph` contains a Recipe node.

### Pitfall 3: `recipeYield` is not an Int

**What goes wrong:** Casting `recipeNode["recipeYield"]` directly to `Int`. Crashes on `"4 servings"`, `"makes 24 cookies"`, or `["6", "24 cookies"]`.

**Why it happens:** schema.org `recipeYield` is `Text | QuantitativeValue` — real-world usage is overwhelmingly a human-readable string. [CITED: developers.google.com/search/docs/appearance/structured-data/recipe]

**How to avoid:** Use the `parseYield()` helper in Pattern 2 that strips non-digit characters and handles array format. When no digit is found, return `null` (let LLM infer servings).

### Pitfall 4: Empty `quantity` crashes frontend scaler

**What goes wrong:** `new Fraction("").mul(factor)` — Fraction.js throws on empty string. Also happens with qualitative quantities like `"to taste"`, `"a pinch"`.

**Why it happens:** The LLM produces `quantity: ""` for ingredients without a discrete amount.

**How to avoid:** Wrap in try/catch and return `quantityStr` unchanged if Fraction.js throws. The UI correctly displays `"to taste"` without scaling it.

### Pitfall 5: Backend overwrites `recipe.servings` with `targetServings`

**What goes wrong:** The result card displays `(original: N)` where N = `recipe.servings`. After the backend scales and sets `recipe.servings = targetServings`, the LLM-inferred original is lost. `(original: N)` shows the already-scaled value, which is wrong.

**Why it happens:** D-04 requires displaying the LLM-inferred original; D-01 requires backend scaling. If the backend overwrites `servings`, the LLM-inferred value is gone from the response.

**How to avoid:** Two options — see Open Questions. Simplest fix: add `originalServings: Int` field to `TransformedRecipe`, populated before ScalingService runs. OR: keep `servings` as LLM-inferred and add a separate `displayedServings: Int` field. The planner must choose one.

### Pitfall 6: Bot-blocked recipe sites

**What goes wrong:** jsoup `Jsoup.connect(url).get()` returns a 403, redirect to CAPTCHA, or a minimal HTML page with no JSON-LD. Silent failure passes garbage to the LLM.

**Why it happens:** High-traffic food sites (AllRecipes, NYT Cooking, Food Network) use bot detection. STATE.md explicitly flags this.

**How to avoid:** Set a realistic User-Agent. Wrap in try/catch. If HTTP status ≠ 200, throw `ScrapingException` immediately (don't attempt extraction). The D-07 generic error message covers this case.

---

## Code Examples

### Verified — jsoup connect with User-Agent

```kotlin
// Source: Context7 /jhy/jsoup — Jsoup.connect() documentation
val doc = Jsoup.connect("https://example.com/recipe")
    .userAgent("Mozilla/5.0 (compatible; DietCode/1.0)")
    .timeout(10_000)
    .get()
```

### Verified — jsoup CSS attribute selector for JSON-LD script tags

```kotlin
// Source: Context7 /jhy/jsoup — CSS selector documentation
val scripts = doc.select("script[type=application/ld+json]")
for (script in scripts) {
    val json = script.data()  // .data() not .text() — DataNode content
    // ... parse json
}
```

### Verified — fraction.js parse and scale

```typescript
// Source: npm fraction.js@5.3.4 — github.com/rawify/Fraction.js
import Fraction from 'fraction.js'

const scaled = new Fraction("1 1/2").mul(2).toFraction(true)  // "3"
const half   = new Fraction("3/4").mul(0.5).toFraction(true)  // "3/8"
```

### Verified — jsoup microdata fallback selector

```kotlin
// Source: Context7 /jhy/jsoup — itemprop attribute selector
val ingredients = doc.select("[itemprop=recipeIngredient]").map { it.text() }
val servings    = doc.selectFirst("[itemprop=recipeYield]")?.text()
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex-scrape ingredient lists from body HTML | JSON-LD `recipeIngredient` array | ~2015 (schema.org Recipe adoption) | Structured data is reliable; heuristic fallback needed for non-compliant sites |
| jsoup 1.16.x (Spring Boot 2.x default) | jsoup 1.21.1 (Spring Boot 3.5.0 ships with this) | Spring Boot 3.5.0 | HTTP/2 support; `selectNodes` with `::data` pseudo-element |
| Parse fractions manually with regex | `fraction.js` library | Library stable since 2013; 5.x uses BigInt | BigInt removes floating-point drift at no added dep cost |

**Deprecated/outdated:**
- `element.text()` on `<script>` tags: returns empty for DataNode elements. Use `.data()`.
- Assuming `recipeYield` is numeric: It is `Text | QuantitativeValue` per schema.org spec; string parsing always required.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Sub-linear keyword list covers the standard leavening + salt + strong spice categories correctly | Pattern 3 | Some spice names missing; can be expanded without logic change |
| A2 | `factor^0.5` (square root) curve is the right choice for "sensible results at 2x–4x" | Pattern 3 | Could use `factor^0.75` for milder curve; this is Claude's discretion per CONTEXT.md |
| A3 | LLM-generated quantities arrive in formats: plain decimal, "A/B", "W A/B" — no Unicode vulgar fractions | Pattern 3 (backend parseQuantity) | If LLM returns "½" or "¼", backend regex fails; fraction.js handles these but backend uses regex — safe to add Unicode normalization step |
| A4 | `jackson-module-kotlin`'s `ObjectMapper` can parse JSON-LD `@graph` arrays correctly via `Map<String, Any>` | Pattern 2 | Jackson is general-purpose JSON; this is standard JSON, not JSON-LD-specific syntax — risk is low |

**If this table is empty:** Not empty — A1–A4 need validation.

---

## Open Questions

1. **`(original: N)` label — what does N refer to after backend scaling?**
   - What we know: D-04 says the label shows "the original serving count (the value the LLM inferred)." The backend currently scales and overwrites `TransformedRecipe.servings` with `targetServings`.
   - What's unclear: If `recipe.servings` = `targetServings` after the controller returns, the frontend has no way to display the LLM-inferred original.
   - Recommendation: Add `originalServings: Int` field to `TransformedRecipe`, populated in `RecipeController` from `transformed.servings` (before calling `ScalingService`). The planner must choose this or the alternative (send both fields). **This is a schema change** — the Phase 1 CONTEXT.md locked the schema but did not include this field; confirm before implementing.

2. **`TransformedRecipe.servings` semantic after scaling**
   - What we know: The field is currently the LLM-inferred count. After scaling, it should equal `targetServings`.
   - What's unclear: Does changing `servings` semantics break any downstream Phase 4 consumer?
   - Recommendation: Add `originalServings` and keep `servings` = `targetServings` after scaling. Downstream Phase 4 can use either field.

3. **Should the form's `targetServings` field be disabled while the result card stepper is active?**
   - What we know: CONTEXT.md marks this as Claude's discretion.
   - Recommendation: Keep both editable independently. The form is hidden when `formCollapsed = true` (Phase 2 behavior), so they are never simultaneously visible. No explicit disable needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Java 17 JDK | jsoup, Spring Boot | ✓ | OpenJDK 17.0.18 | — |
| Node.js | npm install fraction.js | ✓ | v25.9.0 | — |
| npm | fraction.js install | ✓ | 11.12.1 | — |
| Maven Central (network) | jsoup 1.21.1 download | ✓ (assumed) | — | gradle --offline with cached dep |
| jsoup 1.21.1 jar | RecipeIngestionService URL path | ✗ (not yet in build.gradle.kts) | — | Blocked until added |
| fraction.js | Frontend quantity rescaling | ✗ (not yet installed) | 5.3.4 | Regex-based manual parsing (poor edge case coverage) |

**Missing dependencies with no fallback:**
- `org.jsoup:jsoup:1.21.1` in `build.gradle.kts` — must be added in Wave 0 / plan task 1 before any jsoup code compiles

**Missing dependencies with fallback:**
- `fraction.js` — a manual regex parser is viable but misses Unicode vulgar fractions; fraction.js strongly preferred

---

## Project Constraints (from CLAUDE.md)

| Directive | Implication for Phase 3 |
|-----------|------------------------|
| `ScalingService` is pure math — never calls LLM | All scaling is arithmetic only (already the plan) |
| Scraping priority: JSON-LD → microdata → heuristic HTML → fail loudly | Three-level fallback chain required; no silent empty RecipeDocument |
| Never pass empty content to LLM silently | `ScrapingException` must be thrown before TransformationService is called if scraping returns nothing |
| No state management library — React `useState` is sufficient | `currentServings` is local state in RecipeCard; `targetServings` in App.tsx — no Zustand/Redux |
| Tailwind v4 `@import "tailwindcss"` — no config file | Use utility classes directly; no `tailwind.config.js` |
| shadcn/ui New York style, Zinc base color | ServingStepper and UrlDetectionBadge use border/muted/background tokens (no accent) per UI-SPEC |
| `RecipeIngestionService` never calls LLM | URL scraping is only fetch + parse; no LLM involvement in ingestion |

---

## Sources

### Primary (HIGH confidence)
- Context7 `/jhy/jsoup` — Jsoup.connect(), CSS selectors, DataNode extraction via `.data()`
- Maven Central API — jsoup 1.21.1 verified as current release (2025-06-22 timestamp)
- npm registry — `fraction.js@5.3.4`, 0 deps, MIT, verified via `npm view`
- `build.gradle.kts` (project file) — confirmed Jackson already on classpath, jsoup not yet added
- `frontend/package.json` — confirmed lucide-react installed; fraction.js not yet installed

### Secondary (MEDIUM confidence)
- [Google Search Central — Recipe Structured Data](https://developers.google.com/search/docs/appearance/structured-data/recipe) — recipeYield format, recipeIngredient/recipeInstructions field names
- [schema.org/Recipe](https://schema.org/Recipe) — canonical field definitions
- [kordu.tools — How to Scale a Recipe Up or Down](https://kordu.tools/blog/how-to-scale-recipe-up-or-down/) — 75% leavening guideline, salt/spice scaling recommendations (industry standard)
- [github.com/rawify/Fraction.js README](https://github.com/rawify/Fraction.js/blob/main/README.md) — Fraction constructor, `.mul()`, `.toFraction(true)` API

### Tertiary (LOW confidence)
- OpenRefine issue #4189 — confirmation that `.data()` is the correct jsoup method for DataNode script content (MEDIUM actually — corroborated by Context7)

---

## Metadata

**Confidence breakdown:**
- Standard stack (jsoup, fraction.js): HIGH — versions verified against Maven Central and npm registry
- Architecture (backend scaling + frontend rescaling split): HIGH — locked by CONTEXT.md D-01/D-02
- Sub-linear math coefficients: MEDIUM — square root curve is Claude's discretion, not empirically tested for this app
- jsoup JSON-LD extraction pattern: HIGH — `.data()` method verified via Context7 and multiple sources
- Bot-blocking behavior: MEDIUM — listed in STATE.md as known concern; not empirically tested for specific sites

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (jsoup, fraction.js are stable; schema.org fields are stable)
