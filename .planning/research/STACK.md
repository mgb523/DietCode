# Technology Stack

**Project:** DietCode
**Researched:** 2026-04-19
**Confidence:** MEDIUM-HIGH

---

## Recommended Stack

### LLM Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Spring AI | 1.1.4 (BOM) | LLM abstraction layer | Official Spring project; native Spring Boot auto-configuration; provider-portable `ChatClient` API |
| Anthropic Claude (via Spring AI) | claude-3-5-haiku-latest | Recipe transformation LLM | Claude excels at instruction-following structured tasks; Haiku is fast and cheap for personal use |
| `spring-ai-starter-model-anthropic` | managed by BOM | Spring Boot starter | Auto-configures `ChatClient` bean; handles retry/backoff; structured output to Kotlin data classes |

**Recommendation: Anthropic over OpenAI.** Recipe transformation is structured instruction-following, not reasoning. Haiku 3.5 is cheaper per token than GPT-4o-mini at comparable quality. Spring AI's `ChatClient` API is fully provider-portable — switching later is a one-line config change.

**Gradle:**
```kotlin
implementation(platform("org.springframework.ai:spring-ai-bom:1.1.4"))
implementation("org.springframework.ai:spring-ai-starter-model-anthropic")
```

**Key properties:**
```properties
spring.ai.anthropic.api-key=${ANTHROPIC_API_KEY}
spring.ai.anthropic.chat.options.model=claude-3-5-haiku-latest
spring.ai.anthropic.chat.options.temperature=0.3
spring.ai.anthropic.chat.options.max-tokens=2048
```

Use `temperature=0.3` — recipe substitution is deterministic reasoning, not creative generation. High temperature produces inconsistent quantities.

**Structured output pattern (Kotlin):**
```kotlin
data class TransformedRecipe(
    val title: String,
    val servings: Int,
    val ingredients: List<String>,
    val instructions: List<String>,
    val substitutionNotes: List<String>
)

val recipe = chatClient.prompt()
    .user { it.text(promptTemplate).param("recipe", rawText).param("diet", diet) }
    .call()
    .entity(TransformedRecipe::class.java)
```

---

### Recipe URL Scraping (Backend)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| jsoup | 1.17.2 | HTML fetching and parsing | Standard JVM HTML parser; handles malformed HTML from recipe sites |
| Jackson (included with Spring Boot) | 2.17.x | JSON-LD parsing | Parse `<script type="application/ld+json">` blocks |

**Strategy: Two-tier scraping.**

- **Tier 1 — JSON-LD (preferred):** Most major recipe sites embed `schema.org/Recipe` JSON-LD for SEO. Parse `<script type="application/ld+json">` tags first — clean structured data without fragile CSS scraping.
- **Tier 2 — Heuristic text extraction (fallback):** If no JSON-LD, extract full visible text and pass to LLM with a "parse this into a recipe" prompt before transformation.

Do NOT maintain per-site CSS selectors. Recipe plugins change; JSON-LD is stable because it's SEO-critical.

```kotlin
val doc = Jsoup.connect(url)
    .userAgent("Mozilla/5.0 (compatible; DietCode/1.0)")
    .timeout(10_000)
    .get()

val jsonLd = doc.select("script[type=application/ld+json]")
    .firstOrNull { it.data().contains("\"@type\":\"Recipe\"") }
    ?.data()
```

**Gradle:**
```kotlin
implementation("org.jsoup:jsoup:1.17.2")
implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
// Jackson already present via spring-boot-starter-web
```

---

### Frontend Framework and Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React + Vite | Already chosen | App shell | — |
| Tailwind CSS v4 | 4.x | Styling | First-class Vite plugin; CSS-first config; fastest build in class |
| shadcn/ui | Current (CLI) | UI components | Unstyled Radix UI primitives with Tailwind styling; copy-into-project model |
| Radix UI (via shadcn) | 2.x | Accessible primitives | Headless; keyboard/screen-reader accessible; Dialog, Select, Tabs built-in |

**Tailwind v4 Vite setup:**
```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ plugins: [tailwindcss()] });
```

**Do NOT use:** MUI, Ant Design (impose design language), Chakra UI (CSS-in-JS overhead), Zustand/Redux (overkill for linear single-session flow), Axios/React Query (one async call, no caching needed).

---

### PDF Generation

**Recommendation: CSS `@media print` + `window.print()`**

| Approach | Verdict | Rationale |
|----------|---------|-----------|
| `window.print()` + `@media print` CSS | **USE THIS** | Zero dependencies; browser handles pagination; "Save as PDF" built into all OSes |
| jsPDF | DO NOT USE | Imperative canvas layout; inferior output; adds ~300KB bundle |
| @react-pdf/renderer | DO NOT USE | Separate layout system; only justified if you need a PDF Blob for programmatic Drive upload |
| Puppeteer/server-side | DO NOT USE | Server complexity; Docker bloat; unnecessary |

---

### Google Drive Integration

**v1 recommendation: Defer.** Browser print-to-PDF covers the export need. Drive upload requires OAuth2 app registration with Google and a PDF Blob (which `window.print()` doesn't produce programmatically). Validate actual usage before building.

If built in v2: use @react-pdf/renderer on the frontend to generate a Blob, then POST to Drive REST API v3 with `drive.file` scope (narrowest — only files the app creates).

---

### API Contract

```
POST /api/scrape
{ "url": "https://..." }
→ { "rawText": "..." }

POST /api/transform
{ "recipeText": "...", "dietProfiles": ["keto"], "intolerances": ["gluten"], "servings": 4 }
→ TransformedRecipe JSON
```

Scraping is its own endpoint, separate from transformation — independent testing and retry.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Spring AI version + Anthropic support | HIGH | Verified via official Spring AI docs |
| Spring AI structured output | HIGH | `.entity()` pattern confirmed in docs |
| jsoup + JSON-LD strategy | MEDIUM | Capability verified; JSON-LD strategy well-established |
| Tailwind v4 + Vite | HIGH | Verified via official Tailwind v4 blog post |
| PDF via window.print() | HIGH | MDN confirmed; rationale against alternatives authoritative |
| Google Drive defer recommendation | MEDIUM | Based on OAuth2 registration complexity for personal apps |

## Roadmap Implications

1. Wire Spring AI first — it's the core value prop and a prerequisite for everything else
2. Scraping and transformation should be in the same phase — JSON-LD + fallback strategy implemented together
3. PDF export is Day 1 trivial — `window.print()` + ~10 lines of CSS; ship it in the first working phase
4. Google Drive integration explicitly deferred to v2
5. No state management library — not a roadmap task
