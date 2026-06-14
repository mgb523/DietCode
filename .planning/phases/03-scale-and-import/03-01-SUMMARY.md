---
phase: 03-scale-and-import
plan: "01"
subsystem: backend-scaling
tags: [scaling, sub-linear, kotlin, tdd, data-model]
dependency_graph:
  requires: []
  provides: [ScalingService, TransformedRecipe.originalServings, TransformRequest.targetServings]
  affects: [RecipeController, TransformationService]
tech_stack:
  added: []
  patterns: [sub-linear-power-curve, tdd-red-green, spring-service-injection]
key_files:
  created:
    - backend/src/test/kotlin/com/dietcode/service/ScalingServiceTest.kt
  modified:
    - backend/src/main/kotlin/com/dietcode/model/TransformRequest.kt
    - backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.kt
    - backend/src/main/kotlin/com/dietcode/service/ScalingService.kt
    - backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt
decisions:
  - "ScalingService uses factor^0.5 (square root) for sub-linear ingredients — smooth continuous curve correct at all scale factors including scale-down"
  - "originalServings defaults to 0 in TransformedRecipe constructor so Jackson can deserialize LLM JSON without the field"
  - "RecipeController captures llmServings before ScalingService call and sets it via .copy(originalServings = llmServings) in both branches"
metrics:
  duration: "2 minutes"
  completed: "2026-05-15"
  tasks_completed: 3
  files_changed: 5
---

# Phase 3 Plan 01: Serving Scaler Backend Summary

**One-liner:** Sub-linear serving scaler with `factor^0.5` for leavening/salt/spice and linear for all else, wired into RecipeController after LLM transform.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1+2a | Extend data models + RED phase tests | 0c2e206 | TransformRequest.kt, TransformedRecipe.kt, ScalingServiceTest.kt |
| 2b | Implement ScalingService (GREEN) | 295b78c | ScalingService.kt |
| 3 | Wire ScalingService into RecipeController | 4b47bfe | RecipeController.kt |

## What Was Built

- **TransformRequest.targetServings: Int? = null** — nullable field; null means use LLM-inferred count as-is
- **TransformedRecipe.originalServings: Int = 0** — populated by RecipeController (not LLM); default 0 lets Jackson deserialize LLM JSON without this field; sentinel "not set"
- **ScalingService.scale()** — fully implemented replacing TODO stub:
  - Linear factor for standard ingredients
  - `factor^0.5` (square root power curve) for leavening (baking powder/soda, yeast), salt, and strong spices (cayenne, cumin, cinnamon, etc.)
  - `parseQuantity()` handles plain decimal, `A/B` fraction, `W A/B` mixed number; returns null for blank (line returned unchanged)
  - `formatQuantity()` rounds to nearest 1/8 to avoid floating-point noise
  - No-op when targetServings == originalServings or either is ≤ 0
- **RecipeController** — injects ScalingService; captures `llmServings` before potential scaling; calls `scalingService.scale()` only when `targetServings > 0 && targetServings != llmServings`; always sets `originalServings = llmServings` via `.copy()`

## TDD Gate Compliance

- RED gate: `test(03-01)` commit `0c2e206` — tests written before implementation; build failed as expected (parseQuantity unresolved reference)
- GREEN gate: `feat(03-01)` commit `295b78c` — all 11 ScalingServiceTest tests pass
- REFACTOR gate: not needed — implementation was clean on first pass

## Decisions Made

1. **`factor^0.5` sub-linear curve** — continuous, applies at all scale factors (0.5x down through 4x up); avoids the 75% industry rule which is only valid at 2x doubling
2. **`originalServings: Int = 0` default** — Spring AI `BeanOutputConverter` deserializes LLM response JSON which lacks this field; default prevents Jackson deserialization failure
3. **`llmServings` capture pattern** — controller captures `transformed.servings` before any ScalingService call; used in `.copy(originalServings = llmServings)` in both the scaling and no-scaling branches so the field is always populated

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — ScalingService TODO stub fully replaced; all fields populated at runtime.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. `targetServings` validated via `takeIf { it > 0 }` in RecipeController per T-03-01 mitigation. ScalingService is pure arithmetic with no I/O per T-03-04.

## Self-Check

- [x] `ScalingService.kt` exists and contains `factor.pow(0.5)`
- [x] `ScalingServiceTest.kt` exists with 11 tests
- [x] `TransformRequest.kt` contains `val targetServings: Int? = null`
- [x] `TransformedRecipe.kt` contains `val originalServings: Int = 0`
- [x] `RecipeController.kt` contains `val llmServings = transformed.servings` and `scalingService.scale`
- [x] Commits: 0c2e206, 295b78c, 4b47bfe all present in git log
- [x] `./gradlew test` BUILD SUCCESSFUL — 0 failures
