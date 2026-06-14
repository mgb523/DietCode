# Phase 3: Scale and Import - Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Add two capabilities on top of the Phase 2 core loop:

1. **Serving scaler** — User sets a target serving count (upfront in form and adjustable post-transformation in the result card). `ScalingService` applies sub-linear math for leavening/salt/spices; all other ingredients scale linearly. No new LLM call for rescaling.

2. **URL import** — The existing recipe input field auto-detects a URL (starts with `http://` or `https://`) and routes to jsoup scraping instead of text parsing. Auto-detection gives visual feedback in the UI. Scraping failures show a generic error with the URL preserved for recovery.

New capabilities (before/after comparison, substitution popovers, print/export) belong in Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Serving Scaler — Placement

- **D-01:** A target servings field appears **upfront in the form** alongside the recipe input and constraint panel. The LLM transformation runs first (returning the recipe at the LLM's inferred serving count), then `ScalingService.scale()` is called with the user's target before the response is returned.

- **D-02:** The result card **also exposes a serving count stepper** so the user can re-scale without resubmitting. Adjusting the stepper calls `ScalingService` logic on the frontend (or triggers a lightweight backend call) — no new LLM call either way.

### Serving Scaler — Control Style

- **D-03:** Serving count input uses a **number input with +/− stepper buttons** on either side. Min value: 1. Clamp on both form field and result card stepper.

- **D-04:** The result card stepper shows the **original serving count** (the value the LLM inferred and returned in `TransformedRecipe.servings`) alongside the current target — e.g., "Servings: [8] (original: 4)". Lets the user understand the scale factor being applied.

### URL Input — Auto-Detection

- **D-05:** URL detection heuristic: input starts with `http://` or `https://`. Checked on the frontend on every input change.

- **D-06:** When a URL is detected, a **small badge/icon appears at the top of the textarea** (e.g., a link icon or "URL detected" chip). No change otherwise. Provides reassurance without cluttering the form.

### Scraping Failure UX

- **D-07:** All scraping failures (network error, no JSON-LD, bot-blocked) show a **single generic error message**: "Couldn't import from this URL — please paste the recipe text instead." Different root causes do not need different messages.

- **D-08:** On scraping failure, the **URL stays in the input field**. The user can open it, copy the recipe text, and paste it back. The error message should reinforce this recovery path.

### Claude's Discretion

- Exact sub-linear scaling coefficients for leavening, salt, and strong spices (e.g., logarithmic curve or square-root — pick what produces sensible results at 2x–4x)
- Whether post-result rescaling is a backend call or pure frontend math (pure frontend preferred given ScalingService is stateless)
- Exact badge/icon style for URL detection (use shadcn/Tailwind tokens to match Phase 2 pill/chip aesthetic)
- Placeholder or label wording for the upfront servings field
- Whether to disable the form servings field when the result card scaler is active (or keep both editable)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Architecture (read before implementing anything)
- `CLAUDE.md` — Critical design decisions: ScalingService is pure math (never calls LLM), scraping priority order (JSON-LD → microdata → heuristic HTML → fail loudly), service responsibility table
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-01 through D-06: locked data model schemas (`IngredientLine`, `TransformedRecipe`, `RecipeDocument`, `TransformRequest`)
- `.planning/phases/02-core-transformation/02-CONTEXT.md` — D-01/D-02: single-page top-to-bottom layout, form collapses on success; D-03/D-04: constraint panel patterns

### Phase 3 Requirements
- `.planning/REQUIREMENTS.md` — INP-02, INP-03, TRANS-03, TRANS-04 are the Phase 3 requirements
- `.planning/ROADMAP.md` — Phase 3 success criteria (5 items)

### Existing Backend Service Stubs (Phase 3 implements these)
- `backend/src/main/kotlin/com/dietcode/service/ScalingService.kt` — stub with TODO; Phase 3 implements
- `backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt` — text path complete; Phase 3 adds URL routing

### Existing Frontend Components (reference before adding new ones)
- `frontend/src/components/RecipeCard.tsx` — result card component; Phase 3 adds serving scaler stepper here
- `frontend/src/App.tsx` — form state and submit handler; Phase 3 adds servings field
- `frontend/src/components/DietPillGroup.tsx` — pill/toggle pattern to reference for badge styling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RecipeIngestionService.ingest()` — text path complete; URL routing branches off here
- `ScalingService.scale(recipe, targetServings)` — method signature already defined, stub awaiting implementation
- `TransformedRecipe.servings: Int` — LLM returns this; it becomes the "original" baseline for the scaler display
- `RecipeDocument.servings: Int?` — nullable; URL-scraped recipes may populate this from JSON-LD metadata
- `DietPillGroup` and `TagInput` — existing component patterns for constrained toggle UI; stepper and badge should follow the same aesthetic

### Established Patterns
- Tailwind v4 `@import "tailwindcss"` — no config file; use utility classes directly
- shadcn/ui New York style, Zinc base color — badge/chip should use the same token set as DietPillGroup pills
- Form field state lives in `App.tsx` as `useState` — add `targetServings: number` to existing form state

### Integration Points
- `RecipeIngestionService.ingest(input)` — Phase 3 adds: if `input.startsWith("http")` → scrape path; else → existing text path
- `RecipeController` — may need to pass `targetServings` from `TransformRequest` to trigger `ScalingService` after LLM call, OR scaling is done on frontend. Decide during planning.
- `TransformRequest` — consider whether `targetServings: Int?` field needs to be added, or scaling is kept frontend-only

</code_context>

<specifics>
## Specific Ideas

- The "original: 4" reference count in the result card scaler comes from `TransformedRecipe.servings` as returned by the LLM — this is what the LLM inferred the recipe yields. No separate tracking needed.
- Scraping error message should suggest the specific recovery action inline: "Couldn't import this URL. Open it, copy the recipe text, and paste it here."

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 3 scope.

</deferred>

---

*Phase: 03-scale-and-import*
*Context gathered: 2026-05-14*
