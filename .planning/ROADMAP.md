# Roadmap: DietCode

## Overview

DietCode ships in four phases. Phase 1 locks the data models and project scaffold — the LLM output schema is the critical foundation that everything else depends on. Phase 2 delivers the core transformation loop: paste text, select constraints, get an adapted recipe. Phase 3 adds the serving scaler and URL import so any recipe from anywhere can be adapted to any portion size. Phase 4 completes the output surface with before/after comparison, substitution annotations, print/PDF export, and Google Drive export.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Project scaffold, CORS, locked data models, LLM output schema defined
- [ ] **Phase 2: Core Transformation** - Paste input, diet/intolerance controls, LLM rewrite, clean recipe display
- [ ] **Phase 3: Scale and Import** - Serving scaler with sub-linear rules, URL scraping, auto-detect input routing
- [ ] **Phase 4: Output and Polish** - Before/after comparison, substitution annotations, print PDF, Google Drive export

## Phase Details

### Phase 1: Foundation
**Goal**: A running Spring Boot backend and React frontend are wired together with CORS, and the canonical data types (`RecipeDocument`, `IngredientLine`, `TransformedRecipe` with `warnings[]`) are locked so that no downstream feature requires a schema rewrite.
**Depends on**: Nothing (first phase)
**Requirements**: TRANS-02
**Success Criteria** (what must be TRUE):
  1. The Spring Boot backend starts and the React frontend loads in the browser with no console errors
  2. A POST to `/api/recipe/transform` from the browser (on port 5173) succeeds without a CORS error
  3. The `IngredientLine` schema (`quantity`, `unit`, `ingredient`, `preparation`) and `warnings[]` array are present in the codebase and enforced via Spring AI `BeanOutputConverter`
  4. The `RecipeController` stub returns a hardcoded `TransformedRecipe` payload that the frontend renders — proving the full request/response cycle works before real LLM calls are added
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Spring Boot backend scaffold: Gradle project, locked data models (D-01 through D-04), CORS config, service stubs, RecipeController stub
- [x] 01-02-PLAN.md — React frontend scaffold: shadcn/ui Vite template, RecipeCard component, hardcoded stub payload render
- [ ] 01-03-PLAN.md — Integration wiring: App.tsx fetches from backend, end-to-end CORS verification checkpoint

### Phase 2: Core Transformation
**Goal**: A user can paste raw recipe text, select dietary constraints and intolerances in a single unified UI, submit the form, and receive a clean readable transformed recipe — the end-to-end core value loop working for the first time.
**Depends on**: Phase 1
**Requirements**: INP-01, DIET-01, DIET-02, DIET-03, TRANS-01, OUT-01
**Success Criteria** (what must be TRUE):
  1. User can type or paste a recipe into a single input field and submit it for transformation
  2. User can select one or more diet profiles (keto, vegan, gluten-free, paleo, whole30) from a unified constraint panel — not separate forms
  3. User can flag specific ingredient intolerances in the same constraint panel alongside the diet profile selector
  4. The LLM rewrites the recipe with substitutions appropriate to the selected constraints and returns structured `IngredientLine` data
  5. The transformed recipe appears in a clean, readable formatted view with ingredient quantities, units, and instructions clearly presented
**Plans**: TBD
**UI hint**: yes

### Phase 3: Scale and Import
**Goal**: A user can enter a target serving count and receive correctly scaled ingredient quantities (with sub-linear adjustments for leavening, salt, and spices), and can import a recipe by pasting a URL rather than copying the text manually.
**Depends on**: Phase 2
**Requirements**: INP-02, INP-03, TRANS-03, TRANS-04
**Success Criteria** (what must be TRUE):
  1. User can set a target number of servings and the ingredient quantities in the transformed recipe update to match — without triggering a new LLM call
  2. Leavening agents, salt, and strong spices are scaled using sub-linear rules (not naive multiplication), and the scaled amounts are visibly different from a linear calculation at 2x or 3x scale
  3. User can paste a recipe URL into the same input field as plain text and the app automatically routes it to the URL scraping path
  4. A valid recipe URL (from a site with JSON-LD structured data) is successfully ingested and its ingredients and instructions are passed to the LLM for transformation
  5. An invalid or bot-blocked URL produces a clear error prompting the user to paste the recipe text manually — no silent garbage passed to the LLM
**Plans**: TBD
**UI hint**: yes

### Phase 4: Output and Polish
**Goal**: A user can compare the original recipe against the adapted version side by side, inspect the reasoning behind each substitution via popovers, and export the final recipe either via the browser print dialog or directly to Google Drive as a PDF.
**Depends on**: Phase 3
**Requirements**: TRANS-05, OUT-02, OUT-03, OUT-04
**Success Criteria** (what must be TRUE):
  1. User can view the original recipe and the adapted recipe displayed side by side in a before/after comparison layout
  2. Each substituted ingredient shows an info icon; clicking it opens a popover explaining why the ingredient was swapped — not shown inline
  3. User can trigger the browser print dialog and the recipe prints cleanly (no nav, no sidebars, readable typography) and can be saved as a PDF via "Save as PDF"
  4. User can connect to Google Drive via OAuth2, and the transformed recipe is exported as a PDF directly to their Drive
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/3 | In progress | - |
| 2. Core Transformation | 0/TBD | Not started | - |
| 3. Scale and Import | 0/TBD | Not started | - |
| 4. Output and Polish | 0/TBD | Not started | - |
