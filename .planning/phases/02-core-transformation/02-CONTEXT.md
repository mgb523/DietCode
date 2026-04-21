# Phase 2: Core Transformation - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the end-to-end core value loop for the first time: user pastes raw recipe text, selects diet profiles and ingredient exclusions in a single unified panel, submits, LLM rewrites the recipe, and the transformed result appears in a clean readable card.

New capabilities (URL scraping, serving scaler, before/after comparison, export) belong in later phases.

</domain>

<decisions>
## Implementation Decisions

### App Layout & Flow

- **D-01:** Single-page, top-to-bottom vertical layout: textarea → constraint panel → submit button → result card. All on one scrolling page. No side-by-side columns. Mobile-friendly and matches natural top-to-bottom workflow.

- **D-02:** Form collapses/hides on successful transformation. Result card takes over the page. User re-expands (or refreshes) to start a new transformation. Keeps the result focused.

### Constraint Panel

- **D-03:** Diet profiles displayed as toggle pills/badges in a horizontal row: `[Keto] [Vegan] [GF] [Paleo] [Whole30]`. Selected pills highlight. Multiple selections allowed simultaneously.

- **D-04:** Ingredient exclusions field is a free-text tag input. Label: **"Ingredients to omit or replace"** (not "Intolerances"). Placeholder: e.g. `peanuts, dairy, shellfish — press Enter to add`. Tags are removable. Maps directly to `List<String>` on the backend.

- **D-05:** The LLM prompt must handle typos and loose phrasing in the exclusions field gracefully — "peenut" should be treated as peanuts, "cow milk" as dairy. Implement via prompt instruction ("interpret each item broadly and forgive spelling errors").

### Loading & Error States

- **D-06:** During LLM transformation, the submit button changes to a spinner state (`⧗ Transforming...`) and is disabled. No skeleton card or progress bar needed in Phase 2.

- **D-07:** On failure (timeout, bad LLM response, network error), show an inline error message directly below the submit button: `⚠ Transformation failed — please try again.` Form stays visible for immediate retry.

### RecipeCard Refinements

- **D-08:** Bold the quantity + unit portion of each ingredient line (e.g. **2 cups** oat flour). No other RecipeCard changes in Phase 2. Substitution note popovers and before/after comparison belong in Phase 4.

### Claude's Discretion

- Textarea height (suggest ~8-12 rows)
- Exact pill styling (border, background color on selected state — use shadcn/Tailwind tokens)
- Tag input component approach (controlled input with Enter/comma detection — no library needed)
- Whether to show a character count on the textarea
- Exact wording of form section headings ("Your Recipe", "Dietary Needs", etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Data Models (Phase 1)
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-01 through D-06: all locked schemas (IngredientLine, TransformedRecipe, RecipeDocument, TransformRequest, DietProfile enum)
- `CLAUDE.md` — Service responsibility rules, stack versions, critical design decisions

### Phase Scope
- `.planning/REQUIREMENTS.md` — INP-01, DIET-01, DIET-02, DIET-03, TRANS-01, OUT-01 are the Phase 2 requirements
- `.planning/ROADMAP.md` — Phase 2 success criteria (5 items)

### Existing Frontend Code
- `frontend/src/components/RecipeCard.tsx` — existing card component; refine (bold quantity+unit), do not replace
- `frontend/src/App.tsx` — replace auto-fetch stub with form-based submission
- `frontend/src/components/ui/card.tsx` — shadcn Card component available

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RecipeCard` component — exists, just needs ingredient formatting tweak (bold quantity+unit)
- `shadcn/ui Card` — installed and working
- `cn()` utility in `frontend/src/lib/utils.ts` — use for conditional class merging on toggle pills

### Established Patterns
- Fetch pattern: `useEffect → fetch POST → .then(setData) / .catch(setError)` (Phase 1 App.tsx) — Phase 2 replaces useEffect trigger with form submit handler, keeps the same fetch shape
- Tailwind v4 `@import "tailwindcss"` CSS entry — no config file, use utility classes directly
- shadcn/ui component style: New York, Zinc base color

### Integration Points
- `POST /api/recipe/transform` — accepts `{ input, dietProfiles, intolerances }` — already wired in Phase 1; Phase 2 populates all three fields from form state
- `RecipeIngestionService.ingest()` stub → Phase 2 implements: detect if `input` is URL or text, parse text path only (URL path is Phase 3)
- `TransformationService.transform()` stub → Phase 2 implements: build prompt with BeanOutputConverter schema, call AnthropicChatModel, parse response

</code_context>

<specifics>
## Specific Ideas

- "Ingredients to omit or replace" framing is intentional — it's more intuitive than "intolerances" for a cooking context. The LLM should handle both specific ingredients ("peanuts") and categories ("tree nuts", "dairy").
- Form collapses on success — consider a subtle "Edit / start over" link or chevron to re-expand without a full page refresh.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 2 scope.

</deferred>

---

*Phase: 02-core-transformation*
*Context gathered: 2026-04-21*
