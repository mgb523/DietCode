---
phase: 02-core-transformation
plan: "03"
subsystem: frontend-wiring
tags: [react, form, fetch, state-management, ui-wiring]
dependency_graph:
  requires:
    - 02-01 (backend POST /api/recipe/transform endpoint)
    - 02-02 (DietPillGroup, TagInput components)
  provides:
    - App.tsx complete form-driven submit flow
    - RecipeCard bold quantity+unit rendering
  affects: []
tech_stack:
  added: []
  patterns:
    - form onSubmit async handler with loading/error state
    - formCollapsed state — form hides on success, result card shown
    - inline error display below submit button
    - Loader2 spinner for loading state
key_files:
  created: []
  modified:
    - frontend/src/App.tsx
    - frontend/src/components/RecipeCard.tsx
decisions:
  - "Edit / start over clears recipe and formCollapsed but preserves recipeText, selectedDiets, intolerances per D-02"
  - "Error handler uses generic string only — backend status code never surfaced to UI (T-02-09 accept)"
  - "disabled={loading} on submit button prevents double-submit (T-02-08 mitigate)"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-23"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 2 Plan 3: App Wiring — Form Submit Flow and RecipeCard Refinement Summary

## One-Liner

Form-driven App.tsx wired end-to-end: textarea + diet pills + tag input → POST /api/recipe/transform → collapsed result card with bold ingredient quantities.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite App.tsx — form layout, state, submit handler, result area | dde4ef8 | frontend/src/App.tsx |
| 2 | Refine RecipeCard.tsx — bold quantity+unit per D-08 | 439cdb5 | frontend/src/components/RecipeCard.tsx |

## What Was Built

### App.tsx (full replacement)

The Phase 1 `useEffect` auto-fetch stub is replaced with a complete form-driven flow:

- **State variables:** `recipe`, `error`, `loading`, `formCollapsed`, `recipeText`, `selectedDiets`, `intolerances`
- **handleSubmit:** async fetch POST to `http://localhost:8080/api/recipe/transform` with `{ input, dietProfiles, intolerances }`. On success: sets recipe + collapses form. On failure: sets generic error string. `setLoading(true)` / `setError(null)` at top; `setLoading(false)` in finally.
- **Form section:** textarea (10 rows, required), DietPillGroup wired to `selectedDiets`, TagInput wired to `intolerances`
- **Submit button:** `disabled={loading}`, shows Loader2 spinner + "Transforming..." during fetch
- **Error display:** `{error && <p className="text-sm text-destructive mt-2">⚠ {error}</p>}` below button
- **Form collapse:** `{!formCollapsed && <form>}` — hidden on success; `{formCollapsed && recipe && <div>}` shown with "Edit / start over" button
- **Edit / start over:** sets `formCollapsed(false)`, `setRecipe(null)`, `setError(null)` — preserves `recipeText`, `selectedDiets`, `intolerances` per D-02

### RecipeCard.tsx (targeted change)

Single element change to ingredient `<li>` rendering per D-08:

- Before: `{ing.quantity} {ing.unit} {ing.ingredient}`
- After: `<span className="font-bold">{ing.quantity} {ing.unit}</span>{" "} {ing.ingredient}`

All other content (Card wrapper, headings, instructions, warnings amber callout, Serves line) unchanged.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation | Location |
|-----------|-----------|----------|
| T-02-08 | `disabled={loading}` prevents double-submit | App.tsx:93 |
| T-02-09 | catch block shows fixed "Transformation failed" string only | App.tsx:52 |
| T-02-10 | `required` on textarea prevents empty submission | App.tsx:73 |

## Known Stubs

None — all form fields wired to state, all state wired to fetch handler, fetch handler wired to real backend endpoint. Result rendering uses real RecipeCard component.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. The single fetch target (`http://localhost:8080/api/recipe/transform`) was established in Phase 1.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| frontend/src/App.tsx — exists | FOUND |
| frontend/src/components/RecipeCard.tsx — exists | FOUND |
| App.tsx contains no useEffect | CONFIRMED |
| App.tsx contains handleSubmit | CONFIRMED |
| App.tsx contains formCollapsed | CONFIRMED |
| App.tsx contains DietPillGroup import + usage | CONFIRMED |
| App.tsx contains TagInput import + usage | CONFIRMED |
| App.tsx contains Loader2 import + usage | CONFIRMED |
| App.tsx contains "Transformation failed — please try again." | CONFIRMED |
| App.tsx contains "Edit / start over" | CONFIRMED |
| RecipeCard.tsx contains font-bold span on ingredient | CONFIRMED |
| RecipeCard.tsx still has bg-amber-50 border border-amber-200 | CONFIRMED |
| RecipeCard.tsx still has Serves {recipe.servings} | CONFIRMED |
| Commit dde4ef8 (App.tsx rewrite) | FOUND |
| Commit 439cdb5 (RecipeCard refinement) | FOUND |
