---
phase: 04-output-and-polish
plan: "03"
subsystem: frontend-substitution-popovers-and-export
tags: [frontend, react, tailwind, shadcn, popover, google-drive, oauth, print]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [substitution-popovers, print-button, drive-export-toolbar]
  affects: []
tech_stack:
  added: []
  patterns: [gis-oauth-lazy-load, sessionstorage-token-cache, drive-multipart-upload, radix-popover-trigger, drive-state-machine]
key_files:
  created:
    - frontend/src/components/SubstitutionPopover.tsx
    - frontend/src/components/ExportToolbar.tsx
    - frontend/.env.example
  modified:
    - frontend/src/components/RecipeCard.tsx
    - frontend/src/App.tsx
decisions:
  - "originalIngredient prop omitted from SubstitutionPopover in RecipeCard — comparison column already shows original ingredient visually; prop is available for future enhancement"
  - "loadGis() guards against double-loading GIS script by checking window.google before appending script element"
  - "ExportToolbar local interface definitions (IngredientLine, TransformedRecipe) match App.tsx interface — avoids cross-component import of non-exported types"
metrics:
  duration: "~2 min"
  completed_date: "2026-05-29"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 5
---

# Phase 4 Plan 03: Substitution Popovers and Export Toolbar Summary

**One-liner:** SubstitutionPopover with Radix Popover + Info icon injected into RecipeCard, and ExportToolbar with window.print() and GIS OAuth2 lazy-load Drive HTML upload wired between Edit/start-over and ComparisonLayout.

## What Was Built

Two frontend changes that together complete TRANS-05 (substitution rationale popovers), OUT-03 (print button), and OUT-04 (Drive export):

1. **SubstitutionPopover.tsx** — New component wrapping shadcn `Popover` with an `Info` icon trigger button. Accepts `substitutionNote` (required) and `originalIngredient` (optional). The `aria-label` reads "Why [ingredient] was substituted" or the generic fallback. `PopoverContent` renders the substitutionNote text, optionally preceded by a "Substituted for: [original]" heading.

2. **RecipeCard.tsx** — Added import for `SubstitutionPopover`. In the main ingredient `<li>` loop (non-"to taste" ingredients), appended a conditional `SubstitutionPopover` render after preparation text: `{ing.substitutionNote && ing.substitutionNote.length > 0 && (<SubstitutionPopover ... />)}`. The "to taste" section is intentionally excluded.

3. **ExportToolbar.tsx** — New component with:
   - `DriveState` type (`"idle" | "connecting" | "exporting" | "error"`) and associated `useState`.
   - `loadGis()` — lazily injects `accounts.google.com/gsi/client` script; guards against double-injection by checking `window.google`.
   - `getAccessToken()` — reads cached token from `sessionStorage`; on cache miss, calls `loadGis()` and opens GIS `initTokenClient` popup. Writes token and expiry to `sessionStorage`.
   - `uploadToDrive()` — multipart FormData upload to Drive REST API v3 with `Authorization: Bearer` header.
   - `serializeAdaptedRecipe()` — serializes adapted recipe (ingredients, instructions, warnings) as self-contained HTML.
   - Print button: `onClick={window.print()}`, always enabled.
   - Drive button: disabled when `VITE_GOOGLE_CLIENT_ID` env var is falsy or when busy; shows `Loader2` spinner during `connecting`/`exporting` states; shows `role="alert"` error paragraph with exact copy `⚠ Drive export failed — use Print to save as PDF instead.` on error state.
   - File name follows D-08: `{recipeName} ({diet1}, {diet2}).pdf` or `{recipeName}.pdf`.

4. **App.tsx** — Added `import { ExportToolbar }`. Replaced `{/* ExportToolbar placeholder — added in Plan 03 */}` comment with `<div className="max-w-5xl mx-auto mb-6 print:hidden"><ExportToolbar recipe={recipe} selectedDiets={selectedDiets} /></div>`. Positioned between "Edit / start over" button and `<ComparisonLayout>`.

5. **frontend/.env.example** — Created with `VITE_GOOGLE_CLIENT_ID` documented, explaining how to obtain from Google Cloud Console and noting the `http://localhost:5173` authorized origin requirement.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: SubstitutionPopover + RecipeCard injection | 7bc2166 | SubstitutionPopover.tsx (new), RecipeCard.tsx |
| Task 2: ExportToolbar + App.tsx wire + .env.example | e2cd413 | ExportToolbar.tsx (new), App.tsx, .env.example (new) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all components are wired to real data. The `originalIngredient` prop is intentionally omitted from `SubstitutionPopover` in RecipeCard (comparison column already shows original ingredient; prop is available in the interface for future use).

## Threat Flags

No new threat surface beyond what the plan's threat model already documents:
- T-04-06: Access token stored in `sessionStorage` (not `localStorage`) — cleared on tab close; scoped to `drive.file` only. Implemented as designed.
- T-04-07: OAuth scope locked to `drive.file` — restricts to files created by this app. Implemented as designed.
- T-04-09: `serializeAdaptedRecipe` maps content to `<li>` text nodes without `dangerouslySetInnerHTML`. Implemented as designed.
- T-04-10: `substitutionNote` rendered as React text node (not innerHTML). Implemented as designed.

## Self-Check: PASSED

- frontend/src/components/SubstitutionPopover.tsx — FOUND
- frontend/src/components/ExportToolbar.tsx — FOUND
- frontend/.env.example — FOUND
- frontend/src/components/RecipeCard.tsx — FOUND (modified)
- frontend/src/App.tsx — FOUND (modified)
- Commit 7bc2166 — FOUND
- Commit e2cd413 — FOUND
- npm run build — BUILD SUCCESSFUL (0 TypeScript errors, 308.05 kB bundle)
