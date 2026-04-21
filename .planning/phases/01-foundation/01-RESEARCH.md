# Phase 1: Foundation - Research

**Researched:** 2026-04-20
**Domain:** Spring Boot + Kotlin + Gradle scaffold; React + Vite + Tailwind CSS v4 + shadcn/ui scaffold; CORS wiring; locked data model definition
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** `IngredientLine` fields: `quantity: String`, `unit: String`, `ingredient: String`, `preparation: String?`, `substitutionNote: String?`. The `substitutionNote` field lives on `IngredientLine` itself (not a separate map) so the LLM returns the reason alongside each ingredient and there is no name-matching brittleness.
- **D-02:** `TransformedRecipe` fields: `recipeName: String`, `ingredients: List<IngredientLine>`, `instructions: List<String>` (one step per item), `servings: Int`, `warnings: List<String>`. Covers Phase 2 display, Phase 3 scaler input, and Phase 4 before/after comparison cleanly.
- **D-03:** `RecipeDocument` fields: `name: String?`, `rawIngredients: List<String>`, `instructions: String` (raw block), `servings: Int?`. Nullable fields handle URLs with missing metadata gracefully. RecipeDocument is purely recipe content — no dietary preferences.
- **D-04:** `TransformRequest` (controller DTO, not persisted): `input: String` (raw recipe text OR URL), `dietProfiles: List<DietProfile>`, `intolerances: List<String>`. Diet profiles and intolerances are user preferences that travel separately from parsed recipe content.
- **D-05:** All five service skeletons are created in Phase 1 with correct class names and method signatures (stubbed, not implemented): `RecipeIngestionService`, `TransformationService`, `ScalingService`, `ExportService`, `RecipeController`.
- **D-06:** Phase 1 frontend shows a first-pass styled shadcn/ui card with Tailwind CSS — recipe name, bulleted ingredient list, and instructions. Not a raw JSON dump; not throwaway code. Phase 2 refines this component rather than replacing it.

### Claude's Discretion

- Java version selection (17 vs 21) — either is fine with Spring Boot 3.x
- Gradle wrapper version and Kotlin version
- Package naming convention (e.g., `com.dietcode`)
- Whether `DietProfile` is an enum or a sealed class
- Spring Boot project generation approach (Initializr vs manual)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 1 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRANS-02 | LLM returns structured output with per-ingredient data (`quantity`, `unit`, `ingredient`, `preparation`) and a `warnings[]` array for structural ingredient swaps | Phase 1 defines the Kotlin data classes and the `BeanOutputConverter` setup that enforces this schema. The converter is wired up in Phase 1 even though it is not called until Phase 2. |
</phase_requirements>

---

## Summary

Phase 1 is a scaffolding phase: stand up the backend and frontend projects, lock all canonical data models, stub all five service classes, wire CORS, and prove the end-to-end request/response cycle with a hardcoded payload. No LLM call happens in Phase 1; the BeanOutputConverter is configured and injected but its `convert()` method is not invoked until Phase 2.

The Spring AI 1.1.4 BOM is available on Maven Central (confirmed released 2026-03-26) and is compatible with Spring Boot 3.4.x. Java 17 is installed on this machine (Temurin 17.0.18) and is the correct baseline. For the frontend, shadcn/ui now has a first-class Vite template (`npx shadcn@latest init -t vite`) that handles Tailwind CSS v4 setup automatically — this is the fastest path and avoids the manual wiring of the `@tailwindcss/vite` plugin and CSS variable configuration.

The primary implementation risk in Phase 1 is Kotlin nullable types and Jackson deserialization: Kotlin data classes with nullable fields require the `jackson-module-kotlin` on the classpath (Spring Boot's web starter pulls this in automatically, but it must be verified). The `BeanOutputConverter` with Kotlin data classes requires `@get:JsonProperty` target syntax on fields that need explicit JSON names.

**Primary recommendation:** Use Spring Initializr (start.spring.io) to generate the backend skeleton — it sets the correct Kotlin plugin versions, `kotlin-reflect` dependency, and `kotlin-spring` open-class plugin automatically. Use `npx shadcn@latest init -t vite` for the frontend — it scaffolds the Vite project, installs Tailwind v4 via `@tailwindcss/vite`, and configures `tsconfig.json` path aliases in a single command.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTTP routing and request validation | API / Backend (`RecipeController`) | — | Single entry point rule from CLAUDE.md; validation belongs in the controller layer |
| Data model definitions (IngredientLine, TransformedRecipe, RecipeDocument) | API / Backend (shared model package) | — | Models are consumed by all backend services; frontend consumes the JSON shape |
| CORS policy enforcement | API / Backend (`WebMvcConfigurer`) | — | Must be applied before DispatcherServlet handles requests; not frontend responsibility |
| Hardcoded stub response (Phase 1 only) | API / Backend (`RecipeController`) | — | Controller returns hardcoded `TransformedRecipe` JSON; no service delegation needed for stub |
| Recipe card display | Browser / Client (React) | — | Stateless render of JSON; React `useState` sufficient per CLAUDE.md |
| BeanOutputConverter schema registration | API / Backend (`TransformationService`) | — | Converter is injected into the service that will call the LLM; Phase 1 just registers it |

---

## Standard Stack

### Core — Backend

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Spring Boot | 3.4.x | Application framework, auto-config, web MVC | Latest stable 3.x; compatible with Spring AI 1.1.4 [VERIFIED: docs.spring.io] |
| Kotlin | 2.1.x | JVM language | Spring Boot 3.4 dependency management resolves a compatible Kotlin version; Initializr generates 2.1.x [VERIFIED: docs.spring.io/spring-boot/reference/features/kotlin.html] |
| Kotlin plugin.spring | same as kotlin jvm | Opens `@Component`, `@Configuration` classes for Spring proxying | Kotlin classes are `final` by default; without this plugin, Spring AOP fails silently [CITED: docs.spring.io/spring-boot/reference/features/kotlin.html] |
| spring-boot-starter-web | managed by Boot BOM | Embedded Tomcat, Spring MVC, Jackson, `SseEmitter` | Servlet stack required; no WebFlux per CLAUDE.md |
| spring-ai-bom | 1.1.4 | Manages all Spring AI module versions | Released 2026-03-26, available on Maven Central, Spring Boot 3.4 compatible [VERIFIED: github.com/spring-projects/spring-ai/releases/tag/v1.1.4] |
| spring-ai-starter-model-anthropic | managed by Spring AI BOM | Anthropic ChatModel auto-config, `AnthropicChatOptions`, `BeanOutputConverter` | The Anthropic-specific starter; provides `spring.ai.anthropic.*` properties binding [CITED: github.com/spring-projects/spring-ai] |
| jackson-module-kotlin | managed by Boot BOM | Kotlin data class JSON serialization/deserialization | Required for nullable types in Kotlin data classes; Boot web starter pulls this in automatically [CITED: docs.spring.io/spring-boot/reference/features/kotlin.html] |

### Core — Frontend

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI component model | Default in shadcn Vite template; React 19 is required by current shadcn/ui [CITED: ui.shadcn.com/docs/tailwind-v4] |
| Vite | 8.0.9 (latest) | Dev server + bundler | Fastest HMR; native ESM; shadcn official Vite template target [VERIFIED: npm view vite version] |
| @vitejs/plugin-react | 6.0.1 (latest) | React Fast Refresh in Vite | Official React plugin for Vite [VERIFIED: npm view @vitejs/plugin-react version] |
| Tailwind CSS | 4.2.3 (latest) | Utility-first CSS | v4 is current; `@tailwindcss/vite` plugin replaces PostCSS config [VERIFIED: npm view tailwindcss version] |
| @tailwindcss/vite | 4.2.3 (latest) | Vite plugin for Tailwind v4 | Replaces PostCSS approach; no `tailwind.config.js` needed in v4 [VERIFIED: npm view @tailwindcss/vite version] |
| shadcn/ui | latest (CLI-managed) | Component library | Components are copied into the project via CLI, not a versioned npm package; uses Card, etc. [CITED: ui.shadcn.com/docs/installation/vite] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Spring Initializr (start.spring.io) | Manual build.gradle.kts | Initializr auto-wires Kotlin plugin versions correctly; manual setup risks wrong `kotlin-spring` plugin version |
| `npx shadcn@latest init -t vite` | Manual Vite + Tailwind + shadcn wiring | CLI sets up `tsconfig.json` aliases, `@theme` CSS variables, and `components.json` in one step |
| Tailwind v4 (`@tailwindcss/vite`) | Tailwind v3 + PostCSS | v4 is what shadcn/ui now targets; mixing v3 with current shadcn components breaks CSS variable syntax |

### Installation — Backend

Generated via start.spring.io with these selections:
- Project: Gradle - Kotlin
- Language: Kotlin
- Spring Boot: 3.4.x
- Dependencies: Spring Web
- Java: 17

Then add to `build.gradle.kts`:

```kotlin
// In the dependencyManagement or dependencies block, import Spring AI BOM
implementation(platform("org.springframework.ai:spring-ai-bom:1.1.4"))
implementation("org.springframework.ai:spring-ai-starter-model-anthropic")
```

No extra repositories needed — Spring AI 1.1.4 is on Maven Central. [VERIFIED: docs.spring.io/spring-ai/reference/getting-started.html]

### Installation — Frontend

```bash
npx shadcn@latest init -t vite
# Select: New project, TypeScript, default style (New York or Default), enter project name
npx shadcn@latest add card
```

---

## Architecture Patterns

### System Architecture Diagram (Phase 1 only)

```
Browser (port 5173)
       │
       │  POST /api/recipe/transform
       │  { input, dietProfiles, intolerances }
       ▼
[RecipeController]  ──── CORS filter (WebMvcConfigurer) ────
       │
       │  Phase 1: returns hardcoded TransformedRecipe JSON
       │  (no service delegation yet)
       │
       ▼
{ recipeName, ingredients[], instructions[], servings, warnings[] }
       │
       ▼
[React RecipeCard component]
  - Card > CardHeader (recipeName)
  - CardContent: bulleted ingredients list
  - CardContent: numbered instructions list
```

### Recommended Project Structure — Backend

```
backend/
├── build.gradle.kts
├── settings.gradle.kts
└── src/
    └── main/
        ├── kotlin/com/dietcode/
        │   ├── DietCodeApplication.kt       # @SpringBootApplication entry
        │   ├── config/
        │   │   └── CorsConfig.kt            # WebMvcConfigurer CORS bean
        │   ├── model/
        │   │   ├── IngredientLine.kt         # D-01 locked schema
        │   │   ├── TransformedRecipe.kt      # D-02 locked schema
        │   │   ├── RecipeDocument.kt         # D-03 locked schema
        │   │   ├── TransformRequest.kt       # D-04 controller DTO
        │   │   └── DietProfile.kt            # enum or sealed class (discretion)
        │   └── service/
        │       ├── RecipeIngestionService.kt # stub
        │       ├── TransformationService.kt  # stub — holds BeanOutputConverter ref
        │       ├── ScalingService.kt         # stub
        │       └── ExportService.kt          # stub
        │   └── controller/
        │       └── RecipeController.kt       # POST /api/recipe/transform stub
        └── resources/
            └── application.yml
```

### Recommended Project Structure — Frontend

```
frontend/
├── vite.config.ts        # react() + tailwindcss() plugins, @ alias
├── tsconfig.json         # paths: { "@/*": ["./src/*"] }
├── components.json       # shadcn config (style, baseColor, aliases)
├── src/
│   ├── main.tsx
│   ├── App.tsx           # renders RecipeCard with hardcoded payload
│   ├── index.css         # @import "tailwindcss"; + @theme { CSS vars }
│   └── components/
│       ├── ui/
│       │   └── card.tsx  # added by: npx shadcn@latest add card
│       └── RecipeCard.tsx # Phase 1 recipe display component
└── lib/
    └── utils.ts          # cn() helper (added by shadcn init)
```

### Pattern 1: Kotlin Data Classes for Locked Schema

**What:** Kotlin `data class` with `@get:JsonProperty` for fields needing explicit JSON names. Nullable fields use `String?` or `Int?`.

**When to use:** All four locked model types (IngredientLine, TransformedRecipe, RecipeDocument, TransformRequest).

```kotlin
// Source: Context7 /spring-projects/spring-ai — BeanOutputConverter Kotlin example
// Also: github.com/spring-projects/spring-ai/blob/main/spring-ai-docs/.../openai-chat.adoc

data class IngredientLine(
    val quantity: String,
    val unit: String,
    val ingredient: String,
    val preparation: String?,
    @get:JsonProperty("substitutionNote")
    val substitutionNote: String?
)

data class TransformedRecipe(
    val recipeName: String,
    val ingredients: List<IngredientLine>,
    val instructions: List<String>,
    val servings: Int,
    val warnings: List<String>
)

data class RecipeDocument(
    val name: String?,
    val rawIngredients: List<String>,
    val instructions: String,
    val servings: Int?
)
```

**Note on `@get:JsonProperty`:** In Kotlin, annotations targeting the generated getter (used by Jackson) require the `@get:` use-site target. Without it, the annotation applies to the constructor parameter only, which Jackson may not see. [CITED: Context7 Spring AI BeanOutputConverter Kotlin example]

### Pattern 2: BeanOutputConverter Registration

**What:** Instantiate `BeanOutputConverter<TransformedRecipe>` and inject it into `TransformationService`. In Phase 1, the converter is registered but not called. Phase 2 will call `converter.getJsonSchema()` to build the prompt and `converter.convert(responseText)` to parse the result.

**When to use:** In `TransformationService` — this is the only service that calls the LLM.

```kotlin
// Source: Context7 /spring-projects/spring-ai — BeanOutputConverter Kotlin usage
import org.springframework.ai.converter.BeanOutputConverter
import org.springframework.stereotype.Service

@Service
class TransformationService(
    // chatModel will be injected in Phase 2
) {
    private val outputConverter = BeanOutputConverter(TransformedRecipe::class.java)

    // Phase 2 will implement this:
    fun transform(recipe: RecipeDocument, dietProfiles: List<DietProfile>, intolerances: List<String>): TransformedRecipe {
        TODO("Phase 2: build prompt, call LLM, parse with outputConverter.convert()")
    }
}
```

### Pattern 3: CORS Configuration

**What:** `@Configuration` class implementing `WebMvcConfigurer.addCorsMappings`. Allows `http://localhost:5173` on all `/api/**` routes.

**When to use:** Applied once in Phase 1; never changed.

```kotlin
// Source: enable-cors.org/server_spring-boot_kotlin.html (verified against Spring docs)
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class CorsConfig : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:5173")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(false)
            .maxAge(3600)
    }
}
```

**Note on `allowCredentials`:** Setting `allowCredentials(true)` with a wildcard origin throws a Spring error. Since DietCode does not use cookies or auth headers, use `allowCredentials(false)` and `allowedOrigins("http://localhost:5173")` (exact origin, not a pattern). [CITED: docs.spring.io/spring-framework/reference/web/webmvc-cors.html]

### Pattern 4: RecipeController Stub

**What:** `@RestController` at `/api/recipe` with a single `@PostMapping("/transform")` that accepts `TransformRequest` and returns a hardcoded `TransformedRecipe`. Proves CORS + serialization work before any service logic is added.

```kotlin
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/recipe")
class RecipeController(
    private val ingestionService: RecipeIngestionService,
    private val transformationService: TransformationService
) {
    @PostMapping("/transform")
    fun transform(@RequestBody request: TransformRequest): TransformedRecipe {
        // Phase 1 stub — hardcoded response
        return TransformedRecipe(
            recipeName = "Vegan Chocolate Chip Cookies (Stub)",
            ingredients = listOf(
                IngredientLine("2", "cups", "oat flour", null, null),
                IngredientLine("1/2", "cup", "coconut oil", "melted", null),
                IngredientLine("3/4", "cup", "maple syrup", null, null),
                IngredientLine("1", "cup", "vegan chocolate chips", null, "Substituted dairy chips")
            ),
            instructions = listOf(
                "Preheat oven to 350°F.",
                "Mix dry ingredients.",
                "Combine wet and dry ingredients.",
                "Drop by spoonfuls onto lined baking sheet.",
                "Bake 12 minutes."
            ),
            servings = 24,
            warnings = listOf("Oat flour replaces all-purpose flour — texture will be denser.")
        )
    }
}
```

### Pattern 5: Spring AI application.yml Configuration

**What:** Anthropic API key and model defaults configured in `application.yml`. The `spring.ai.anthropic.chat.options.model` and `temperature` are set globally here; `TransformationService` can override them per-call via `AnthropicChatOptions.builder()`.

```yaml
# Source: Context7 /spring-projects/spring-ai — application.yml configuration
spring:
  ai:
    anthropic:
      api-key: ${ANTHROPIC_API_KEY}
      chat:
        options:
          model: claude-haiku-4-5   # Phase 2 will use claude-haiku-3-5 per CLAUDE.md
          temperature: 0.3
          max-tokens: 2048
```

**Note on model name:** CLAUDE.md specifies "Anthropic Claude Haiku 3.5". The Spring AI model ID for this is `claude-haiku-4-5` or `claude-3-5-haiku-20241022`. Verify the exact string against the Anthropic API at Phase 2 implementation time. [ASSUMED — model identifier strings change; verify against Anthropic docs at Phase 2]

### Pattern 6: Tailwind CSS v4 globals.css

**What:** Tailwind v4 replaces the v3 `@tailwind base/components/utilities` directives with a single import plus an `@theme inline` block for CSS variable mapping. shadcn/ui's init command writes this file automatically.

```css
/* Source: ui.shadcn.com/docs/tailwind-v4 */
@import "tailwindcss";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... shadcn init fills in the full token set */
}

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
}

.dark {
  --background: hsl(0 0% 3.9%);
  --foreground: hsl(0 0% 98%);
}
```

**Key difference from v3:** No `tailwind.config.js` content globs needed. No PostCSS config needed. The `@tailwindcss/vite` plugin handles discovery automatically. [CITED: ui.shadcn.com/docs/tailwind-v4]

### Pattern 7: RecipeCard shadcn/ui Component

**What:** Phase 1 recipe display using shadcn `Card` subcomponents. This component is a stub target — not thrown away in Phase 2, refined.

```tsx
// Source: ui.shadcn.com/docs/installation/vite (Card import pattern)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  recipe: TransformedRecipe
}

export function RecipeCard({ recipe }: Props) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{recipe.recipeName}</CardTitle>
        <p className="text-sm text-muted-foreground">Serves {recipe.servings}</p>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">Ingredients</h3>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          {recipe.ingredients.map((ing, i) => (
            <li key={i}>
              {ing.quantity} {ing.unit} {ing.ingredient}
              {ing.preparation && `, ${ing.preparation}`}
            </li>
          ))}
        </ul>
        <h3 className="font-semibold mb-2">Instructions</h3>
        <ol className="list-decimal pl-5 space-y-1">
          {recipe.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {recipe.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded text-sm">
            <strong>Notes:</strong>
            <ul className="list-disc pl-4 mt-1">
              {recipe.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Anti-Patterns to Avoid

- **Wildcard CORS origin with credentials:** `allowedOrigins("*")` combined with `allowCredentials(true)` throws a Spring exception. Use an exact origin string. [CITED: docs.spring.io/spring-framework/reference/web/webmvc-cors.html]
- **Kotlin `@JsonProperty` without use-site target:** `@JsonProperty("foo")` on a Kotlin constructor parameter may not be seen by Jackson. Use `@get:JsonProperty("foo")` to target the getter. [CITED: Context7 Spring AI Kotlin BeanOutputConverter example]
- **Tailwind v3 CSS directives in a v4 project:** `@tailwind base`, `@tailwind components`, `@tailwind utilities` do not work in v4. Use `@import "tailwindcss"` instead. [CITED: ui.shadcn.com/docs/tailwind-v4]
- **Adding Spring AI BOM version to individual dependency declarations:** When using `implementation(platform("org.springframework.ai:spring-ai-bom:1.1.4"))`, do NOT specify a version on `spring-ai-starter-model-anthropic` — the BOM manages it. [CITED: docs.spring.io/spring-ai/reference/getting-started.html]
- **Implementing service logic before skeletons compile:** The five service stubs must compile and wire together (even with `TODO()` bodies) before any implementation begins. Verify `./gradlew build` passes on the skeleton.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema generation from data class | Custom reflection-based schema builder | `BeanOutputConverter.getJsonSchema()` | Spring AI generates DRAFT_2020_12-compliant schema from Jackson annotations; hand-rolled schemas drift from the actual class [CITED: Context7 Spring AI] |
| LLM response parsing | String splitting or regex on LLM output | `BeanOutputConverter.convert(text)` | LLM output is not guaranteed format; the converter handles whitespace, markdown fences, and malformed JSON gracefully [CITED: Context7 Spring AI] |
| CORS filter | Servlet `Filter` or `OncePerRequestFilter` | `WebMvcConfigurer.addCorsMappings` | Spring MVC handles preflight OPTIONS automatically; a custom filter must handle OPTIONS manually and risks double-application [CITED: docs.spring.io/spring-framework] |
| Path alias resolution | Relative import chains (`../../components/ui`) | `@/` alias in `vite.config.ts` + `tsconfig.json` `paths` | shadcn/ui components use `@/` internally; without the alias, adding shadcn components breaks immediately [CITED: ui.shadcn.com/docs/installation/vite] |

**Key insight:** The BOM + starter pattern in Spring AI means you should never manually copy dependency version strings — let the BOM manage them so Spring AI internal module versions stay consistent.

---

## Common Pitfalls

### Pitfall 1: Kotlin Classes Not Open for Spring Proxying

**What goes wrong:** Spring cannot create a proxy for a `@Service` or `@Configuration` class because Kotlin classes are `final` by default. Error: `Cannot subclass final class`.

**Why it happens:** Kotlin compiles all classes as `final` unless explicitly marked `open`. Spring AOP (used for `@Transactional`, etc.) requires subclassing.

**How to avoid:** The `kotlin("plugin.spring")` Gradle plugin automatically opens Spring-annotated classes. This plugin MUST appear in the `plugins {}` block. Spring Initializr includes it by default; manual setups forget it.

**Warning signs:** `BeanCreationException` with "Cannot subclass final class" in the stack trace. [CITED: docs.spring.io/spring-boot/reference/features/kotlin.html]

### Pitfall 2: Missing `jackson-module-kotlin` Causes Null Field Errors

**What goes wrong:** Deserializing `TransformRequest` from the frontend POST body fails or silently sets all fields to null/default values.

**Why it happens:** Standard Jackson cannot read Kotlin constructor parameters by name without the Kotlin module. The module is included transitively via `spring-boot-starter-web` → `jackson-databind` → `jackson-module-kotlin`, but only if the dependency graph includes `jackson-module-kotlin`.

**How to avoid:** Verify `./gradlew dependencies | grep jackson-module-kotlin` shows the module in the compile classpath. Spring Boot auto-configures the `KotlinModule` when it is present.

**Warning signs:** `400 Bad Request` on POST with a body that should parse cleanly, or all fields showing as null/empty in the controller method. [CITED: docs.spring.io/spring-boot/reference/features/kotlin.html]

### Pitfall 3: Tailwind v4 `@theme` Variable Not Accessible in Components

**What goes wrong:** shadcn/ui components render without colour — buttons appear plain, cards have no border. CSS variables are undefined.

**Why it happens:** In Tailwind v4, the `@theme inline` block must appear in the file that is imported as the root CSS (typically `index.css` or `globals.css`). If it is split into a separate file that is not properly imported, the variables are never registered.

**How to avoid:** Let `npx shadcn@latest init -t vite` write `index.css` — do not move or split the generated CSS without understanding the import chain.

**Warning signs:** Chrome DevTools shows `--background` resolving to empty string. [CITED: ui.shadcn.com/docs/tailwind-v4]

### Pitfall 4: Spring AI BOM Version Conflicts with Spring Boot BOM

**What goes wrong:** Dependency resolution fails with version conflict errors, or an older Spring AI version is resolved instead of 1.1.4.

**Why it happens:** If the Spring Boot dependency-management plugin is active AND you import the Spring AI BOM via `implementation(platform(...))`, the Boot BOM may override Spring AI BOM versions for shared transitive dependencies.

**How to avoid:** Import the Spring AI BOM inside the `dependencyManagement` block (using `io.spring.dependency-management` plugin syntax) OR as a standalone `platform()` call in `dependencies`. Do not mix both approaches. The `io.spring.dependency-management` plugin approach:

```kotlin
dependencyManagement {
    imports {
        mavenBom("org.springframework.ai:spring-ai-bom:1.1.4")
    }
}
```

[CITED: docs.spring.io/spring-ai/reference/getting-started.html]

### Pitfall 5: `npx shadcn@latest init` Prompts Are Interactive

**What goes wrong:** Running `npx shadcn@latest init` in a non-interactive shell (e.g., script) hangs.

**Why it happens:** The CLI requires user input for style, base color, CSS variables, and project name.

**How to avoid:** Run the command interactively in a terminal. For Phase 1 this is a one-time setup step; it does not need to be scripted. [CITED: ui.shadcn.com/docs/installation/vite]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3: `@tailwind base/components/utilities` in CSS | Tailwind v4: `@import "tailwindcss"` single import | Tailwind CSS v4 (Jan 2025) | No `tailwind.config.js` needed; PostCSS optional |
| Tailwind v3: PostCSS plugin (`tailwindcss` in postcss.config.js) | Tailwind v4: `@tailwindcss/vite` Vite plugin | Tailwind CSS v4 (Jan 2025) | Faster build; no PostCSS config file |
| shadcn/ui: manual Vite + Tailwind wiring | `npx shadcn@latest init -t vite` Vite template | shadcn 2.x+ (2025) | One command scaffolds full project including shadcn config |
| shadcn `tailwindcss-animate` | `tw-animate-css` | shadcn Tailwind v4 update | `tailwindcss-animate` deprecated for v4 projects |
| Spring AI milestone releases (pre-1.0) | Spring AI 1.x GA on Maven Central | Spring AI 1.0 GA (2025) | No milestone repo needed; `mavenCentral()` only |

**Deprecated/outdated:**
- `tailwindcss-animate`: Use `tw-animate-css` in new shadcn/ui + Tailwind v4 projects. [CITED: ui.shadcn.com/docs/tailwind-v4]
- Spring AI milestone/snapshot repositories: Not needed for 1.1.4 which is GA on Maven Central. [CITED: docs.spring.io/spring-ai/reference/getting-started.html]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Anthropic model ID for "Claude Haiku 3.5" is `claude-haiku-4-5` or `claude-3-5-haiku-20241022` | Pattern 5 (application.yml) | Wrong model ID causes 422 error from Anthropic at Phase 2 LLM call time; safe to defer since Phase 1 does not call the LLM |
| A2 | Spring Boot 3.4.x is the correct latest 3.x release to target | Standard Stack | If 3.5.x is now stable, using 3.4.x is still compatible with Spring AI 1.1.4; low risk |
| A3 | `DietProfile` as enum covers all Phase 1–4 needs | Discretion area | If Phase 2 requires structured metadata per profile (e.g., excluded ingredients list), enum may need replacement with sealed class; low risk for Phase 1 |

---

## Open Questions

1. **Exact Anthropic model ID string for Claude Haiku 3.5**
   - What we know: CLAUDE.md specifies "Anthropic Claude Haiku 3.5 (temperature=0.3)"
   - What's unclear: Spring AI model ID string (could be `claude-3-5-haiku-20241022` or `claude-haiku-4-5`)
   - Recommendation: Leave a TODO comment in `application.yml` for Phase 2 to verify against Anthropic API docs. Phase 1 does not call the LLM so this does not block the phase.

2. **Gradle wrapper version**
   - What we know: Initializr generates an appropriate wrapper for the selected Spring Boot version
   - What's unclear: Specific wrapper version (not consequential)
   - Recommendation: Use whatever Initializr generates; no action needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Java (JDK) | Spring Boot backend build and run | Yes | OpenJDK 17.0.18 (Temurin) [VERIFIED] | — |
| Node.js | Frontend dev server, npm commands | Yes | v25.9.0 [VERIFIED] | — |
| npm | Frontend package management | Yes | 11.12.1 [VERIFIED] | — |
| Gradle wrapper | Backend build | Generated by Initializr | — | `./gradlew` generated at project creation |
| ANTHROPIC_API_KEY env var | Spring AI Anthropic starter (Phase 2+) | Not checked — Phase 1 does not call LLM | — | Phase 1 stub does not invoke LLM; env var not required for Phase 1 |

**Missing dependencies with no fallback:** None that block Phase 1.

**Notes:**
- Gradle is NOT installed globally on this machine (command not found), but the Gradle wrapper (`./gradlew`) is self-contained and will download the correct version on first run. This is standard practice and not a problem.
- Java 17 is available, which satisfies Spring Boot 3.4.x's minimum requirement.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/spring-projects/spring-ai` — BeanOutputConverter Kotlin example, Anthropic starter dependency, application.yml properties, structured output converter docs
- [ui.shadcn.com/docs/installation/vite](https://ui.shadcn.com/docs/installation/vite) — Vite setup commands, Card import pattern, vite.config.ts, tsconfig paths
- [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) — v4 changes, `@theme inline`, `tw-animate-css` replacement
- [docs.spring.io/spring-ai/reference/getting-started.html](https://docs.spring.io/spring-ai/reference/getting-started.html) — Spring AI BOM Gradle DSL, repository config, Spring Boot 3.4.x compatibility
- [github.com/spring-projects/spring-ai/releases/tag/v1.1.4](https://github.com/spring-projects/spring-ai/releases/tag/v1.1.4) — Spring AI 1.1.4 release confirmation (2026-03-26)
- [docs.spring.io/spring-boot/reference/features/kotlin.html](https://docs.spring.io/spring-boot/reference/features/kotlin.html) — Kotlin plugin requirements, `kotlin-spring`, `jackson-module-kotlin`
- [enable-cors.org/server_spring-boot_kotlin.html](https://enable-cors.org/server_spring-boot_kotlin.html) — `WebMvcConfigurer` CORS Kotlin pattern

### Secondary (MEDIUM confidence)
- npm registry (`npm view`) — confirmed current versions: vite@8.0.9, tailwindcss@4.2.3, @tailwindcss/vite@4.2.3, @vitejs/plugin-react@6.0.1

### Tertiary (LOW confidence — marked ASSUMED in text)
- Anthropic model ID string for Claude Haiku 3.5 — training knowledge only, must be verified at Phase 2

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified via npm registry and official Spring AI release page
- Architecture: HIGH — patterns derived from official Spring and shadcn docs
- Pitfalls: HIGH — sourced from official Spring and Tailwind/shadcn docs with specific error behaviors

**Research date:** 2026-04-20
**Valid until:** 2026-07-20 (stable ecosystem; Tailwind v4 and Spring AI 1.1.x are not fast-moving at this point)
