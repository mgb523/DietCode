---
phase: 03-scale-and-import
plan: "02"
subsystem: backend-scraping
tags: [scraping, jsoup, url-import, tdd, kotlin, error-handling]
dependency_graph:
  requires: []
  provides: [RecipeIngestionService.scrapeUrl, ScrapingException, ValidationExceptionHandler.handleScraping]
  affects: [RecipeController, TransformationService]
tech_stack:
  added: [org.jsoup:jsoup:1.21.1]
  patterns: [tdd-red-green, three-level-fallback-scraping, json-ld-graph-extraction, exception-handler-422]
key_files:
  created:
    - backend/src/main/kotlin/com/dietcode/exception/ScrapingException.kt
  modified:
    - backend/build.gradle.kts
    - backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt
    - backend/src/main/kotlin/com/dietcode/controller/ValidationExceptionHandler.kt
    - backend/src/test/kotlin/com/dietcode/service/RecipeIngestionServiceTest.kt
decisions:
  - "script.data() not .text() for JSON-LD extraction — DataNode content vs rendered text"
  - "Three-level fallback: JSON-LD -> microdata [itemprop] -> heuristic ul/ol li -> ScrapingException"
  - "ScrapingException produces 422 UNPROCESSABLE_ENTITY with {error: scraping_failed, message: ...}"
  - "parseJsonLd() handles both inline @type:Recipe and @graph array (Yoast SEO) formats"
metrics:
  duration: "5 minutes"
  completed: "2026-05-14"
  tasks_completed: 2
  files_changed: 5
---

# Phase 3 Plan 02: URL Scraping and Import Summary

**One-liner:** jsoup-powered URL scraping with JSON-LD -> microdata -> heuristic HTML fallback chain, failing loudly via 422 ScrapingException when no recipe content is found.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add jsoup dependency and ScrapingException | c61b492 | build.gradle.kts, ScrapingException.kt |
| 2 (RED) | Failing URL routing tests | b68bb06 | RecipeIngestionServiceTest.kt |
| 2 (GREEN) | Implement scraping + error handler | 1a33a1f | RecipeIngestionService.kt, ValidationExceptionHandler.kt |

## What Was Built

- **jsoup 1.21.1** added to build.gradle.kts — HTML fetching and parsing
- **ScrapingException(message: String)** — plain `RuntimeException` in `exception` package; no Spring annotations
- **RecipeIngestionService.ingest()** — now branches on `http://` / `https://` prefix to call `scrapeUrl()`; text path unchanged
- **scrapeUrl()** — three-level fallback chain:
  1. JSON-LD: `script[type=application/ld+json]` blocks iterated; `.data()` used (not `.text()`) to read DataNode content; handles inline `@type:Recipe` and Yoast SEO `@graph` array format
  2. Microdata: `[itemprop=recipeIngredient]` selector; also extracts name, instructions, yield
  3. Heuristic HTML: `ul li, ol li` list items; page title as name; full body text as instructions
  4. Fail loudly: `throw ScrapingException("No recipe content found at URL")` — never passes empty content to LLM
- **parseJsonLd()** — handles `recipeIngredient`, `recipeInstructions` (String or HowToStep list), `recipeYield` (Int, String, or List)
- **ValidationExceptionHandler** — adds `@ExceptionHandler(ScrapingException::class)` returning 422 `{error: "scraping_failed", message: "..."}`
- **Network failure** — jsoup connect exceptions caught and re-thrown as `ScrapingException("Failed to fetch URL: ...")`
- **Timeout** — 10,000ms hard limit on jsoup connect (T-03-06 mitigation)

## TDD Gate Compliance

- RED gate: `test(03-02)` commit `b68bb06` — 2 new tests written before implementation; `ingest throws ScrapingException for unreachable http URL` failed as expected (URL routing not yet in service)
- GREEN gate: `feat(03-02)` commit `1a33a1f` — all 6 RecipeIngestionServiceTest tests pass; full suite green
- REFACTOR gate: not needed — implementation clean on first pass

## Decisions Made

1. **`script.data()` not `.text()`** — jsoup DataNode content (raw JSON in `<script>`) is accessed via `.data()`; `.text()` returns empty for DataNode elements (documented anti-pattern in RESEARCH.md)
2. **Three-level fallback order** — JSON-LD → microdata → heuristic HTML → fail; matches CLAUDE.md scraping priority: "JSON-LD first → microdata → heuristic HTML → fail loudly"
3. **@graph support** — Yoast SEO plugin wraps all schema objects in an `@graph` array; `parseJsonLd()` handles both inline and array formats to cover the majority of recipe sites
4. **422 not 400** — `ScrapingException` maps to `UNPROCESSABLE_ENTITY` (422) not `BAD_REQUEST` (400); the URL syntax may be valid but the content is unprocessable — semantically correct

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — scraping chain is fully implemented; all fallback levels present; error handling wired.

## Threat Surface Scan

- **T-03-05 (SSRF)**: `scrapeUrl()` makes server-side requests to attacker-supplied URLs. Per threat model disposition `accept` for personal-use context — jsoup 1.21.1 does not enforce IP allow-listing by default. Residual SSRF risk documented and accepted.
- **T-03-06 (DoS/timeout)**: `.timeout(10_000)` implemented — mitigated as planned.
- **T-03-07 (Tampering/JSON parsing)**: Jackson parses to `Map<String, Any>` with safe `as?` casts — mitigated.
- **T-03-08 (Info disclosure in errors)**: `e.message` included in 422 body — accepted per threat model.
- No new unplanned threat surface introduced.

## Self-Check

- [x] `backend/build.gradle.kts` contains `org.jsoup:jsoup:1.21.1`
- [x] `ScrapingException.kt` exists with `class ScrapingException(message: String) : RuntimeException(message)`
- [x] `RecipeIngestionService.kt` contains `fun scrapeUrl`
- [x] `RecipeIngestionService.kt` contains `input.startsWith("http://") || input.startsWith("https://")`
- [x] `RecipeIngestionService.kt` contains `script.data()` (not `.text()`)
- [x] `RecipeIngestionService.kt` contains `throw ScrapingException("No recipe content found at URL")`
- [x] `ValidationExceptionHandler.kt` contains `ScrapingException::class`
- [x] `ValidationExceptionHandler.kt` contains `"scraping_failed"`
- [x] `ValidationExceptionHandler.kt` contains `HttpStatus.UNPROCESSABLE_ENTITY`
- [x] Commits: c61b492, b68bb06, 1a33a1f all present in git log
- [x] `./gradlew test` BUILD SUCCESSFUL — 0 failures

## Self-Check: PASSED
