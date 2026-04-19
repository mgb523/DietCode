# DietCode — Research Summary

**Synthesized:** 2026-04-19
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall Confidence:** HIGH

---

## Executive Summary

DietCode is a stateless, single-user recipe transformation tool. The core value prop is: paste or scrape a recipe URL, select dietary constraints, and receive a correctly adapted recipe — structured, printable, and scaled. There is no persistence, no auth, and no multi-user surface, which dramatically simplifies the architecture. The backend is Spring Boot Kotlin acting as a thin LLM orchestrator with URL scraping capability; the frontend is React + Vite rendering structured output into a clean, printable layout.

The recommended approach leans heavily on Spring AI as the LLM abstraction layer (provider-portable, structured output via `BeanOutputConverter`, retry/backoff included) with Anthropic Claude Haiku 3.5 as the model (fast, cheap, excellent at instruction-following). Two-tier URL scraping (JSON-LD first, heuristic HTML fallback) avoids brittle per-site CSS selectors. PDF export is solved entirely by `window.print()` + a `@media print` stylesheet — no backend, no dependency.

**The critical design decision that must be locked in before any code is written is the LLM output schema.** If the schema does not include structured ingredient lines (`quantity`, `unit`, `ingredient`), substitution notes, and a `warnings[]` array from day one, the serving scaler and annotation features become expensive retrofits. Everything else is additive. Google Drive integration is explicitly deferred to v2.

---

## 1. Recommended Stack

- **Spring AI 1.1.4 (BOM) + Anthropic Claude Haiku 3.5** — Spring AI provides a provider-portable `ChatClient` with native structured output (`BeanOutputConverter`), auto-configuration, and retry/backoff. Haiku 3.5 is cheaper than GPT-4o-mini at comparable quality for structured instruction-following tasks. Temperature fixed at 0.3 — recipe substitution is deterministic reasoning.
- **jsoup 1.17.2 + Jackson (bundled)** — jsoup fetches and parses HTML; Jackson deserializes `schema.org/Recipe` JSON-LD blocks. Avoids brittle per-site CSS selectors by prioritizing JSON-LD (stable because it is SEO-critical).
- **React + Vite + Tailwind CSS v4 + shadcn/ui** — Tailwind v4 has a first-class Vite plugin (CSS-first config, fastest build). shadcn/ui provides accessible Radix UI primitives with Tailwind styling, copy-into-project model — no design-system lock-in.
- **`window.print()` + `@media print` CSS** — zero-dependency PDF export. Browser handles pagination and "Save as PDF." Eliminates jsPDF, @react-pdf/renderer, and any server-side PDF tooling.
- **`SseEmitter` (servlet stack, no WebFlux)** — streaming LLM responses to the browser. Sufficient for a single-user app; avoids the complexity of a reactive migration.

**Explicitly excluded:** Redux/Zustand, Axios/React Query, MUI/Chakra, Puppeteer, jsPDF, Google Drive (v1).

---

## 2. Table Stakes Features (must build in v1)

| Feature | Complexity | Notes |
|---------|------------|-------|
| Paste raw recipe text | Trivial | Entry point for all transformation |
| URL scraping (JSON-LD + heuristic fallback) | Medium | Fail loudly; never silently pass empty content to LLM |
| Diet profile selector (keto, vegan, gluten-free, paleo, etc.) | Low | Collapses into LLM prompt parameters |
| Intolerance/allergy tags | Low | Same parameter surface as diet profile |
| LLM transformation with structured JSON response schema | High | The core feature; schema must be locked before any other work |
| Serving scaler | Medium | Deterministic arithmetic on backend; non-linear rules for leavening/salt/spice |
| Clean recipe output render | Low | Requires structured output to exist first |
| Print stylesheet (`@media print`) + browser PDF | Low | ~10 lines of CSS; ship in v1 |

**Design for but defer:** before/after dual-pane diff view, substitution annotation display, URL auto-detection in single input field.

**Never build in v1:** user accounts, saved recipe library, nutrition macros, meal planning, social sharing, native mobile app.

---

## 3. Architecture in a Nutshell

**Component breakdown:**

| Component | Responsibility | Rule |
|-----------|---------------|------|
| `RecipeController` | HTTP routing, SSE setup, request validation | Routes only — no business logic |
| `RecipeIngestionService` | Parse pasted text OR fetch+parse URL → `RecipeDocument` | Never calls LLM |
| `TransformationService` | Build prompt + call Spring AI `ChatClient` → `TransformedRecipe` (SSE) | Never scrapes |
| `ScalingService` | Deterministic arithmetic on `IngredientLine.quantity` | Pure math; sub-linear rules for leavening/salt/spice |
| `ExportService` | Serialize `TransformedRecipe` for frontend | Stateless; no PDF generation on backend |

**Canonical data types to lock in on day one:**
- `RecipeDocument` — raw parsed recipe (text or URL source)
- `IngredientLine(quantity: Double?, unit: String?, ingredient: String, preparation: String?)` — structured for scaling; must be LLM output, not free-form strings
- `TransformedRecipe` — includes `substitutionNotes: List<String>` and `warnings: List<String>`

**URL scraping priority chain:**
1. JSON-LD `<script type="application/ld+json">` with `@type=Recipe`
2. Microdata fallback (`itemprop=recipeIngredient`)
3. Heuristic HTML via jsoup
4. Hard fail — prompt user to paste text manually

**API surface:**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/recipe/ingest` | Parse text or scrape URL → `RecipeDocument` |
| `POST` | `/api/recipe/transform/stream` | LLM transformation → SSE stream |
| `POST` | `/api/recipe/scale` | Re-scale without another LLM call |

**Suggested build order:**
1. Core data models + `RecipeIngestionService` (no LLM, fully testable without API key)
2. LLM integration synchronous (get prompt + schema right before adding streaming)
3. `ScalingService` (pure arithmetic, trivially decoupled)
4. SSE streaming (additive — replace synchronous call with `SseEmitter` + frontend `EventSource`)
5. Export (print CSS + `window.print()`; no backend changes)

---

## 4. Top Pitfalls to Avoid

### 1. LLM hallucinating chemically wrong substitutions (CRITICAL)

Almond flour 1:1 for all-purpose flour collapses a cake. Coconut marked as nut-free. LLMs have no "I don't know" state.

**Mitigation:** Mandatory `warnings[]` array in the output schema — model must populate it when replacing any structural ingredient. System prompt requires botanical family disclosure on allergy substitutions. Design this into the schema from day one.

### 2. Naive linear scaling breaks baked goods (HIGH)

Leavening at 2× batch should be ~75% of linear, not 100%. Salt and strong spices are sub-linear. Cook time is not multiplicative.

**Mitigation:** `ScalingService` categorizes ingredients and applies programmatic sub-linear rules. Never delegate scaling math to the LLM. UI warning for scale factors >3× or <0.5×.

### 3. URL scraping silently returning garbage to the LLM (CRITICAL)

JS-rendered SPAs, bot-blocked sites, and silent JSON-LD removal all produce empty/partial content. LLM fabricates a plausible-looking recipe from the fragment — dangerous and undetectable.

**Mitigation:** Validate non-empty `ingredients` AND `instructions` before calling LLM. Fail loudly with "paste the recipe text instead." Test against 10+ real URLs before marking URL import complete.

### 4. Wrong LLM output schema locks out downstream features (CRITICAL)

Free-form ingredient strings → `ScalingService` cannot operate. No `warnings[]` → safety annotations cannot be added. Retrofitting is a full rewrite.

**Mitigation:** Lock the complete output schema before writing any LLM code. Use Spring AI's `BeanOutputConverter` to auto-generate and inject the JSON schema into the prompt.

---

## 5. Key Decisions Already Made

| Decision | Rationale |
|----------|-----------|
| Spring AI + Anthropic Claude Haiku 3.5 | Provider-portable; structured output built in; cheaper/faster than GPT-4o-mini for this task |
| `temperature=0.3` | Deterministic reasoning task — high temperature produces inconsistent quantities |
| Two-tier URL scraping (JSON-LD first, heuristic fallback) | JSON-LD is stable (SEO-critical); per-site CSS selectors are brittle |
| `IngredientLine` structured output from LLM (not free-form strings) | `ScalingService` requires numeric quantity; retrofitting is expensive |
| Mandatory `warnings[]` in LLM output schema | Safety-critical; cannot be added later without rewriting prompt + schema |
| `SseEmitter` (servlet stack, no WebFlux) | Sufficient for one user; avoids reactive rewrite |
| PDF via `window.print()` + `@media print` | Zero dependencies; browser handles pagination |
| Google Drive integration deferred to v2 | OAuth2 complexity is disproportionate for personal use |
| No user accounts, no persistence, no DB | Single-user stateless tool |
| No state management library | Linear single-session flow; React state is sufficient |
| CORS configured on day one | `WebMvcConfigurer` bean allowing `http://localhost:5173` — must exist before any frontend-backend integration |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Stack | HIGH | Spring AI docs verified; Tailwind v4 blog post; MDN for print |
| Features | HIGH | Personal-use scope is well-defined |
| Architecture | HIGH | Stateless single-user system; patterns are established |
| Pitfalls | HIGH | Recipe chemistry and scraping brittleness are well-documented failure modes |
| URL scraping edge cases | MEDIUM | Bot-blocked sites may require paste-only fallback |

**Gaps to address during implementation:**
- Bot-blocked sites: test AllRecipes, Epicurious, NYT Cooking early
- Print CSS: cross-browser test (Chrome, Firefox, Safari) before marking export complete
- LLM token limits on very long recipes: set `max_tokens=2048` minimum
