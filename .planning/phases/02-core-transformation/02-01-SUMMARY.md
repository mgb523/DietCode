---
phase: 02-core-transformation
plan: "01"
subsystem: backend
tags: [spring-ai, chatclient, recipe-ingestion, transformation, validation, tdd]
dependency_graph:
  requires: []
  provides: [RecipeIngestionService.ingest, TransformationService.transform, RecipeController.validation]
  affects: [02-02, 02-03, 02-04]
tech_stack:
  added: [io.mockk:mockk:1.13.10]
  patterns: [ChatClient.Builder injection, ChatClient.entity() structured output, @RestControllerAdvice validation handler, TDD RED/GREEN]
key_files:
  created:
    - backend/src/main/kotlin/com/dietcode/controller/ValidationExceptionHandler.kt
    - backend/src/test/kotlin/com/dietcode/service/RecipeIngestionServiceTest.kt
    - backend/src/test/kotlin/com/dietcode/service/TransformationServiceTest.kt
  modified:
    - backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt
    - backend/src/main/kotlin/com/dietcode/service/TransformationService.kt
    - backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt
    - backend/build.gradle.kts
decisions:
  - "Use ChatClient.entity() fluent API over low-level BeanOutputConverter — cleaner, handles schema injection automatically"
  - "ValidationExceptionHandler @RestControllerAdvice maps IllegalArgumentException to HTTP 400 — Spring Boot default returns 500"
  - "RecipeIngestionService passes full raw text as both rawIngredients lines and instructions — LLM does semantic parsing"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-23"
  tasks_completed: 3
  files_modified: 7
---

# Phase 2 Plan 1: Backend Services — Real LLM Pipeline Summary

**One-liner:** Spring AI ChatClient.entity() wired end-to-end — raw text in, structured TransformedRecipe out — replacing Phase 1 hardcoded stub with a live LLM pipeline.

## What Was Built

The three backend stubs from Phase 1 are now fully implemented:

1. **RecipeIngestionService** — Pure string manipulation (no LLM). Splits input on newlines, filters blank lines, trims whitespace. Passes full raw text as both `rawIngredients` and `instructions` for LLM consumption. Confirmed: no ChatClient import, no LLM calls.

2. **TransformationService** — Injects `ChatClient.Builder` (Spring AI autoconfigure), builds once in constructor. Constructs system prompt (with explicit markdown suppression per Pitfall 1) and user prompt (with `"none"` guards for empty dietProfiles/intolerances per Pitfall 3). Calls `.entity(TransformedRecipe::class.java)` with null-check (`?: throw IllegalStateException`) per Pitfall 5. Model ID and temperature remain in `application.yml` — not hardcoded.

3. **RecipeController** — Hardcoded Phase 1 stub removed. `IngredientLine` import removed. Input validated with `require(isNotBlank)` and `require(length <= 10_000)` before service dispatch. Backed by new `ValidationExceptionHandler` that maps `IllegalArgumentException` to HTTP 400.

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED — RecipeIngestionService | 09116a9 | PASS — 4 tests failed as expected |
| GREEN — RecipeIngestionService | 069b79d | PASS — 4 tests pass |
| RED — TransformationService | 3074598 | PASS — compile failed (constructor mismatch) |
| GREEN — TransformationService | 28c6945 | PASS — 3 tests pass |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 RED | 09116a9 | test(02-01): add failing tests for RecipeIngestionService |
| Task 1 GREEN | 069b79d | feat(02-01): implement RecipeIngestionService — text-only path |
| Task 2 RED | 3074598 | test(02-01): add failing tests for TransformationService + add mockk dependency |
| Task 2 GREEN | 28c6945 | feat(02-01): implement TransformationService — ChatClient LLM call |
| Task 3 | e1df561 | feat(02-01): wire RecipeController to real services + input validation |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation | Location |
|-----------|-----------|----------|
| T-02-01 | `require(input.isNotBlank())` + `require(input.length <= 10_000)` | RecipeController.kt:20-21 |
| T-02-02 | System prompt instructs "Return ONLY valid JSON — no markdown fences" | TransformationService.kt:28 |
| T-02-04 | 10,000-char max enforced at controller before service dispatch | RecipeController.kt:21 |

## Known Stubs

None — all stubs replaced with real implementations. End-to-end LLM call requires `ANTHROPIC_API_KEY` env var set at runtime (verified in Plan 02-04).

## Self-Check: PASSED

| Item | Status |
|------|--------|
| RecipeIngestionService.kt exists | FOUND |
| TransformationService.kt exists | FOUND |
| RecipeController.kt exists | FOUND |
| ValidationExceptionHandler.kt exists | FOUND |
| 02-01-SUMMARY.md exists | FOUND |
| Commit 09116a9 (RecipeIngestionService RED) | FOUND |
| Commit 069b79d (RecipeIngestionService GREEN) | FOUND |
| Commit 3074598 (TransformationService RED) | FOUND |
| Commit 28c6945 (TransformationService GREEN) | FOUND |
| Commit e1df561 (Controller wiring) | FOUND |
