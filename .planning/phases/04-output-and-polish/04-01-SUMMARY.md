---
phase: 04-output-and-polish
plan: "01"
subsystem: backend-model
tags: [backend, data-model, llm-prompt, kotlin, spring-boot]
dependency_graph:
  requires: []
  provides: [originalIngredients-field, originalInstructions-field, substitutionNote-prompt-rule]
  affects: [frontend-comparison-view, substitution-popovers]
tech_stack:
  added: []
  patterns: [nullable-field-backward-compat, copy-with-defaults, recipe-doc-to-response-mapping]
key_files:
  created: []
  modified:
    - backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.kt
    - backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt
    - backend/src/main/kotlin/com/dietcode/service/TransformationService.kt
decisions:
  - "originalIngredients populated from recipeDoc.rawIngredients mapped to IngredientLine(quantity='', unit='', ingredient=raw) — minimal structure preserving original text"
  - "originalInstructions populated from recipeDoc.instructions.lines().filter { it.isNotBlank() } — consistent with RecipeDocument holding instructions as a single String"
  - "substitutionNote rule uses null (not empty string) for unchanged ingredients — explicit LLM instruction prevents spurious empty-string values"
metrics:
  duration: "~8 min"
  completed_date: "2026-05-29"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 4 Plan 01: Backend Data Model Extension for Comparison View Summary

**One-liner:** Extended TransformedRecipe with originalIngredients/originalInstructions from RecipeDocument and added substitutionNote LLM prompt rule for TRANS-05 popovers.

## What Was Built

Three targeted backend changes that together enable the Phase 4 frontend comparison view and substitution popovers:

1. **TransformedRecipe.kt** — Added two nullable fields at end of data class: `originalIngredients: List<IngredientLine>? = null` and `originalInstructions: List<String>? = null`. Null defaults preserve backward compatibility with LLM deserialization (same pattern as `originalServings: Int = 0` added in Phase 3).

2. **RecipeController.kt** — After capturing `llmServings`, creates a `withOriginals` copy that maps `recipeDoc.rawIngredients` to `List<IngredientLine>` and splits `recipeDoc.instructions` into `List<String>`. The `withOriginals` value threads through the scaling path and return statement so both new fields survive scaling.

3. **TransformationService.kt** — Added `substitutionNote` entry to the SCHEMA RULES block in the system prompt, instructing the LLM to populate the field with a 1-2 sentence explanation for substituted ingredients and explicitly to use `null` (not empty string) for unchanged ingredients.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: TransformedRecipe fields | 98eb6d4 | TransformedRecipe.kt |
| Task 2: RecipeController originals | b538812 | RecipeController.kt |
| Task 3: substitutionNote prompt rule | 02f0131 | TransformationService.kt |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all fields are wired end-to-end. The frontend plans (04-02 through 04-04) will consume `originalIngredients`, `originalInstructions`, and `substitutionNote` from the API response.

## Threat Flags

No new threat surface beyond what the plan's threat model already accounts for (T-04-01 through T-04-03 accepted).

## Self-Check: PASSED

- backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.kt — FOUND (modified)
- backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt — FOUND (modified)
- backend/src/main/kotlin/com/dietcode/service/TransformationService.kt — FOUND (modified)
- Commit 98eb6d4 — FOUND
- Commit b538812 — FOUND
- Commit 02f0131 — FOUND
- ./gradlew test — BUILD SUCCESSFUL (5 actionable tasks, 0 failures)
