# Phase 4: Output and Polish - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add the output surface to the existing core transformation loop: a before/after comparison of original vs. adapted recipe displayed side by side, per-substitution rationale popovers (TRANS-05), browser print-to-PDF (OUT-03), and Google Drive export via OAuth2 (OUT-04).

New capabilities (recipe history, sharing, streaming, nutrition breakdown) belong in later phases or v2.

</domain>

<decisions>
## Implementation Decisions

### Before/After Data Model

- **D-01:** Extend `TransformedRecipe` with two new fields populated by the backend from `RecipeDocument` before returning: `originalIngredients: List<IngredientLine>?` and `originalInstructions: List<String>?`. The LLM output schema (`IngredientLine(quantity, unit, ingredient, preparation)` + `warnings[]`) is NOT changed — these fields come from the parser, not the LLM. This is consistent with how `originalServings` was added in Phase 3.

- **D-02:** Both `originalIngredients` and `originalInstructions` are needed (not just ingredients) to allow a complete side-by-side comparison of the full recipe.

### Before/After Comparison Layout

- **D-03:** The before/after comparison is **always shown** immediately after transformation — no toggle or extra click required. It replaces the current single-card result view.

- **D-04:** Layout is **side-by-side columns at the `md:` breakpoint** and wider; stacks vertically on mobile. The comparison view **expands past the current `max-w-2xl`** constraint (original recipe column on left, adapted on right). The `max-w-2xl` constraint continues to apply to the form, toolbar, and standalone card on mobile.

### Export Controls

- **D-05:** A **toolbar row** sits between "Edit / start over" and the side-by-side comparison cards. It contains the Print button and the Google Drive export button. Always visible when the result is showing.

- **D-06:** Both Print and Google Drive export the **adapted recipe only** — the original is for in-browser comparison only, not included in the export output.

### Google Drive OAuth Flow

- **D-07:** **Lazy OAuth** — OAuth popup opens on the first click of the Drive export button. On successful grant, the export proceeds immediately. The access token is stored in `sessionStorage` so subsequent exports in the same session don't re-prompt.

- **D-08:** Exported file is named `{recipeName} ({diet tags}).pdf` — e.g. `Banana Bread (Vegan, GF).pdf`. If no diet tags were selected, name is just `{recipeName}.pdf`.

- **D-09:** On Drive export failure (auth revoked, network error, quota): show an **inline error below the Drive button** — `⚠ Drive export failed — use Print to save as PDF instead.` Print is always the available fallback.

### Claude's Discretion

- Substitution popover UX: whether to use `tooltip.tsx` (hover) or install `shadcn/popover` (click); icon style (ⓘ or similar); exactly what the popover shows (substitutionNote + original ingredient name recommended)
- Print CSS: `@media print` rules — what to hide (nav, toolbar, form, "Edit / start over"), typography sizing, page margins
- Google Drive API details: MIME type (`application/pdf`), folder placement (root Drive by default), no special sharing settings
- Exact column widths and breakpoint values for the side-by-side layout

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Architecture (read before implementing anything)
- `CLAUDE.md` — Critical design decisions: LLM output schema is locked, no WebFlux, Google Drive deferred to Phase 4 (it's now Phase 4), service responsibility table
- `.planning/phases/01-foundation/01-CONTEXT.md` — D-01 through D-06: locked data model schemas (`IngredientLine`, `TransformedRecipe`, `RecipeDocument`, `TransformRequest`)
- `.planning/phases/02-core-transformation/02-CONTEXT.md` — D-01/D-02: single-page layout and form-collapse pattern; D-08: substitution note popovers explicitly deferred to Phase 4

### Phase 4 Requirements
- `.planning/REQUIREMENTS.md` — TRANS-05, OUT-02, OUT-03, OUT-04 are the Phase 4 requirements
- `.planning/ROADMAP.md` — Phase 4 success criteria (4 items)

### Existing Frontend Components (reference before adding new ones)
- `frontend/src/components/RecipeCard.tsx` — current result card; Phase 4 restructures this into the comparison view
- `frontend/src/App.tsx` — form, collapse, and result rendering; Phase 4 adds toolbar and comparison layout
- `frontend/src/components/ui/card.tsx` — shadcn Card (installed)
- `frontend/src/components/ui/tooltip.tsx` — shadcn Tooltip (installed); evaluate for substitution popover
- `frontend/src/components/ServingStepper.tsx` — stepper in result card; still needed in adapted column
- `frontend/src/components/DietPillGroup.tsx` — pill/toggle pattern for badge style reference

### Existing Backend Services
- `backend/src/main/kotlin/com/dietcode/service/TransformationService.kt` — builds LLM prompt; Phase 4 extends prompt to request `substitutionNote` per substituted ingredient
- `backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.class` — compiled model; Phase 4 adds `originalIngredients` and `originalInstructions` fields
- `backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt` — produces `RecipeDocument` with parsed original ingredients/instructions; Phase 4 passes these back in the response

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `IngredientLine` — already has `substitutionNote: String | null` field (added in Phase 1/2 as forward-planning for TRANS-05); LLM just needs to be prompted to populate it
- `RecipeCard` component — existing card structure; restructure into two-column layout rather than replace entirely
- `shadcn/ui Card` — use for both "Original" and "Adapted" columns
- `tooltip.tsx` — installed and ready; evaluate whether click-to-open popover UX needs `shadcn/popover` instead
- `cn()` utility in `frontend/src/lib/utils.ts` — conditional class merging

### Established Patterns
- Tailwind v4 `@import "tailwindcss"` — no config file; use utility classes directly
- shadcn/ui New York style, Zinc base color — export buttons should match existing button aesthetics
- State lives in `App.tsx` as `useState` — no state management library; keep same pattern
- Form collapses on success (D-02 Phase 2) — result view (now comparison + toolbar) replaces form

### Integration Points
- `TransformationService.transform()` — extend system prompt to request `substitutionNote` for each substituted ingredient
- `RecipeController` — currently returns `TransformedRecipe` directly; Phase 4 populates `originalIngredients` and `originalInstructions` from the `RecipeDocument` before returning
- `TransformedRecipe` Kotlin data class — add two nullable fields: `originalIngredients: List<IngredientLine>? = null` and `originalInstructions: List<String>? = null`

</code_context>

<specifics>
## Specific Ideas

- File naming convention for Drive: `{recipeName} ({diet1}, {diet2}).pdf` — diet tags are the `selectedDiets` array joined by ", ". If empty, omit the parenthetical entirely.
- The comparison layout expands past `max-w-2xl` only in the result view. The form stays `max-w-2xl`. Consider `max-w-5xl` or `max-w-6xl` for the comparison container to give both columns breathing room.
- The `substitutionNote` field is already in the frontend `IngredientLine` interface and the backend model — the only missing piece is the LLM being asked to fill it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 4 scope.

</deferred>

---

*Phase: 04-output-and-polish*
*Context gathered: 2026-05-24*
