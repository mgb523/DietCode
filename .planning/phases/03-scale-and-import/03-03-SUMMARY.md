---
phase: 03-scale-and-import
plan: "03"
subsystem: ui
tags: [react, fraction.js, typescript, tailwind, shadcn, serving-scaler, url-import]

# Dependency graph
requires:
  - phase: 03-01
    provides: targetServings in TransformRequest, originalServings in TransformedRecipe, ScalingService backend
  - phase: 03-02
    provides: jsoup URL scraping, ScrapingException 422 handler with scraping_failed error body

provides:
  - ServingStepper component (+/- stepper with aria support and originalServings annotation)
  - UrlDetectionBadge component (conditional overlay badge for URL inputs)
  - RecipeCard with fraction.js client-side rescaling and sub-linear keyword matching
  - App.tsx with targetServings form field, isUrlInput detection, and scraping_failed error handling

affects: [04-export-and-print, 05-ui-polish]

# Tech tracking
tech-stack:
  added: [fraction.js@5.3.4]
  patterns:
    - "Client-side rescaling via fraction.js with sub-linear sqrt curve for leavening/salt/spices"
    - "Controlled stepper component: value + onChange props, no local state"
    - "Conditional overlay badge: absolute positioning inside relative wrapper"
    - "scraping_failed error detection: check body.error before generic throw"

key-files:
  created:
    - frontend/src/components/ServingStepper.tsx
    - frontend/src/components/UrlDetectionBadge.tsx
  modified:
    - frontend/src/components/RecipeCard.tsx
    - frontend/src/App.tsx
    - frontend/package.json

key-decisions:
  - "fraction.js wraps in try/catch — non-numeric quantities ('to taste', 'a pinch') return unchanged"
  - "originalServings passed to ServingStepper only when it differs from recipe.servings (avoids spurious annotation when no scaling occurred)"
  - "isUrlInput is a derived value (not useState) — computed inline from recipeText"
  - "scraping_failed check is guarded by isUrlInput to avoid unnecessary JSON parse on non-URL errors"

patterns-established:
  - "SUBLINEAR_KEYWORDS in RecipeCard mirrors backend ScalingService — keep in sync for TRANS-04 parity"
  - "Controlled component pattern: ServingStepper takes value + onChange, state lives in parent"
  - "UrlDetectionBadge: aria-hidden, absolute top-2 right-2, parent sets relative"

requirements-completed: [TRANS-03, TRANS-04, INP-02, INP-03]

# Metrics
duration: 1min
completed: 2026-05-15
---

# Phase 03 Plan 03: Phase 3 Frontend Summary

**fraction.js client-side serving rescaler with sub-linear spice curve, URL detection badge, and scraping error UX wired to the Spring backend**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-15T02:34:29Z
- **Completed:** 2026-05-15T02:36:02Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Installed fraction.js and created two new reusable components (ServingStepper, UrlDetectionBadge)
- RecipeCard now rescales ingredient quantities client-side via fraction.js with sqrt sub-linear curve for leavening/salt/spices — no backend call
- App.tsx sends targetServings to backend, shows URL detected badge, and handles scraping_failed errors with D-07 copy while preserving the URL in the field (D-08)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install fraction.js and create ServingStepper and UrlDetectionBadge** - `7401390` (feat)
2. **Task 2: Update RecipeCard with client-side rescaling and serving stepper** - `393a6b0` (feat)
3. **Task 3: Update App.tsx with targetServings, URL detection, scraping error** - `013955c` (feat)

## Files Created/Modified
- `frontend/src/components/ServingStepper.tsx` - +/- stepper with aria-label, aria-live, min clamping, originalServings annotation
- `frontend/src/components/UrlDetectionBadge.tsx` - conditional overlay badge with Link2 icon, aria-hidden
- `frontend/src/components/RecipeCard.tsx` - fraction.js rescaling helpers, SUBLINEAR_KEYWORDS, currentServings state, displayedIngredients derivation, ServingStepper in CardHeader
- `frontend/src/App.tsx` - targetServings state (default 2), isUrlInput derived value, scraping_failed error branch, targetServings in fetch body, UrlDetectionBadge overlay, Servings section with ServingStepper
- `frontend/package.json` - fraction.js@5.3.4 added

## Decisions Made
- fraction.js scaleQuantity wraps Fraction constructor in try/catch so "to taste", "a pinch", and other non-numeric quantities are returned unchanged — satisfies T-03-11 (DoS mitigation)
- originalServings is passed to ServingStepper only when `recipe.originalServings !== recipe.servings` to avoid a redundant "(original: N)" annotation when no scaling occurred
- isUrlInput is a derived value (not state) computed from recipeText — reactive without extra state management
- scraping_failed JSON body parse is guarded by isUrlInput check to avoid unnecessary res.json() calls on non-URL 4xx errors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All Phase 3 requirements (TRANS-03, TRANS-04, INP-02, INP-03) are fully implemented across backend (plans 03-01, 03-02) and frontend (this plan)
- Phase 4 (Export and Print) can begin: RecipeCard is the stable output surface for print/export features
- Known concern: bot-blocked sites (AllRecipes, NYT Cooking) may return scraping errors — the UX handles this correctly with D-07/D-08 copy

---
*Phase: 03-scale-and-import*
*Completed: 2026-05-15*

## Self-Check: PASSED

| Item | Status |
|------|--------|
| frontend/src/components/ServingStepper.tsx | FOUND |
| frontend/src/components/UrlDetectionBadge.tsx | FOUND |
| frontend/src/components/RecipeCard.tsx | FOUND |
| frontend/src/App.tsx | FOUND |
| commit 7401390 (Task 1) | FOUND |
| commit 393a6b0 (Task 2) | FOUND |
| commit 013955c (Task 3) | FOUND |
