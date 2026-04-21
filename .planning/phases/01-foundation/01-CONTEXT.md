# Phase 1: Foundation - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold a running Spring Boot backend and React frontend wired together with CORS, lock all canonical data types (`RecipeDocument`, `IngredientLine`, `TransformedRecipe`, `TransformRequest`), and scaffold all five service skeletons. The `RecipeController` stub returns a hardcoded `TransformedRecipe` that the frontend renders as a first-pass styled card — proving the full request/response cycle works before real LLM calls are added.

New capabilities (LLM integration, diet controls, scraping, scaling, export) belong in later phases.

</domain>

<decisions>
## Implementation Decisions

### Data Models (locked — downstream phases must not change field names or types)

- **D-01:** `IngredientLine` fields: `quantity: String`, `unit: String`, `ingredient: String`, `preparation: String?`, `substitutionNote: String?`. The `substitutionNote` field lives on `IngredientLine` itself (not a separate map) so the LLM returns the reason alongside each ingredient and there is no name-matching brittleness.

- **D-02:** `TransformedRecipe` fields: `recipeName: String`, `ingredients: List<IngredientLine>`, `instructions: List<String>` (one step per item), `servings: Int`, `warnings: List<String>`. Covers Phase 2 display, Phase 3 scaler input, and Phase 4 before/after comparison cleanly.

- **D-03:** `RecipeDocument` fields: `name: String?`, `rawIngredients: List<String>`, `instructions: String` (raw block), `servings: Int?`. Nullable fields handle URLs with missing metadata gracefully. RecipeDocument is purely recipe content — no dietary preferences.

- **D-04:** `TransformRequest` (controller DTO, not persisted): `input: String` (raw recipe text OR URL), `dietProfiles: List<DietProfile>`, `intolerances: List<String>`. Diet profiles and intolerances are user preferences that travel separately from parsed recipe content. The controller passes `input` to `RecipeIngestionService` and then forwards `RecipeDocument + dietProfiles + intolerances` to `TransformationService`.

### Service Scaffolding

- **D-05:** All five service skeletons are created in Phase 1 with correct class names and method signatures (stubbed, not implemented): `RecipeIngestionService`, `TransformationService`, `ScalingService`, `ExportService`, `RecipeController`. This makes the architecture visible before Phase 2 fills in the implementations.

### Frontend Phase 1 Stub

- **D-06:** Phase 1 frontend shows a first-pass styled shadcn/ui card with Tailwind CSS — recipe name, bulleted ingredient list, and instructions. Not a raw JSON dump; not throwaway code. Phase 2 refines this component rather than replacing it.

### Claude's Discretion

- Java version selection (17 vs 21) — either is fine with Spring Boot 3.x
- Gradle wrapper version and Kotlin version
- Package naming convention (e.g., `com.dietcode`)
- Whether `DietProfile` is an enum or a sealed class
- Spring Boot project generation approach (Initializr vs manual)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture and Design
- `CLAUDE.md` — Service responsibility rules, critical design decisions (do not re-litigate), dev setup, CORS config, stack versions
- `.planning/REQUIREMENTS.md` — TRANS-02 is the only v1 requirement mapped to Phase 1; v2 items are out of scope here
- `.planning/ROADMAP.md` — Phase 1 success criteria (4 items); phase boundary definition

### Stack Versions (from CLAUDE.md)
- Spring AI 1.1.4
- Anthropic Claude Haiku 3.5 (`temperature=0.3`)
- React + Vite + Tailwind CSS v4 + shadcn/ui
- Spring Boot + Kotlin + Gradle

No external ADRs or specs — all decisions are captured above or in CLAUDE.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing components, hooks, or utilities.

### Established Patterns
- None yet — Phase 1 establishes the patterns that later phases follow.

### Integration Points
- CORS must allow `http://localhost:5173` (frontend dev server) — `WebMvcConfigurer` bean in backend
- Frontend calls `POST /api/recipe/transform` with a `TransformRequest` JSON body
- `RecipeController` is the single HTTP entry point; all other services are called internally

</code_context>

<specifics>
## Specific Ideas

- Phase 1 frontend card is intentionally first-pass — it should be refined (not replaced) in Phase 2 as the real LLM response shape is confirmed
- `substitutionNote` on `IngredientLine` is nullable — ingredients that were not substituted leave it null; Phase 4 only shows the info icon when the field is non-null

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-20*
