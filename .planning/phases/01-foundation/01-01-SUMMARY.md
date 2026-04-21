---
phase: 01-foundation
plan: 01
subsystem: api
tags: [spring-boot, kotlin, gradle, spring-ai, cors, jackson]

# Dependency graph
requires: []
provides:
  - Spring Boot 3.5 + Kotlin backend scaffold with Gradle
  - Locked data model classes: IngredientLine (D-01), TransformedRecipe (D-02), RecipeDocument (D-03), TransformRequest (D-04)
  - DietProfile enum: KETO, VEGAN, GLUTEN_FREE, PALEO, WHOLE30
  - CORS configured for http://localhost:5173 on /api/**
  - Five service stubs with correct method signatures: RecipeIngestionService, TransformationService, ScalingService, ExportService, RecipeController
  - BeanOutputConverter<TransformedRecipe> registered in TransformationService (TRANS-02)
  - POST /api/recipe/transform returns hardcoded JSON payload proving CORS + Jackson serialization
affects: [01-02, 01-03, phase-2, phase-3, phase-4]

# Tech tracking
tech-stack:
  added:
    - Spring Boot 3.5.0
    - Kotlin 1.9.25
    - Spring AI BOM 1.1.4
    - spring-ai-starter-model-anthropic (BOM-managed)
    - jackson-module-kotlin (transitive via spring-boot-starter-web)
    - kotlin("plugin.spring") — opens Spring-annotated classes for proxying
  patterns:
    - dependencyManagement block for Spring AI BOM (avoids Boot BOM version conflicts)
    - @get:JsonProperty use-site target for Kotlin data class fields
    - WebMvcConfigurer.addCorsMappings for CORS (not a custom Filter)
    - BeanOutputConverter instantiated in service layer, not called until Phase 2
    - TODO() bodies on service stubs with phase annotation (Phase 2, Phase 3, etc.)

key-files:
  created:
    - backend/build.gradle.kts
    - backend/settings.gradle.kts
    - backend/src/main/kotlin/com/dietcode/DietCodeApplication.kt
    - backend/src/main/resources/application.yml
    - backend/src/main/kotlin/com/dietcode/model/DietProfile.kt
    - backend/src/main/kotlin/com/dietcode/model/IngredientLine.kt
    - backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.kt
    - backend/src/main/kotlin/com/dietcode/model/RecipeDocument.kt
    - backend/src/main/kotlin/com/dietcode/model/TransformRequest.kt
    - backend/src/main/kotlin/com/dietcode/config/CorsConfig.kt
    - backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt
    - backend/src/main/kotlin/com/dietcode/service/TransformationService.kt
    - backend/src/main/kotlin/com/dietcode/service/ScalingService.kt
    - backend/src/main/kotlin/com/dietcode/service/ExportService.kt
    - backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt
  modified: []

key-decisions:
  - "Spring Boot 3.5.0 used (3.4.1 no longer served by start.spring.io; 3.5.0 is compatible with Spring AI 1.1.4)"
  - "Spring AI BOM imported via dependencyManagement block to avoid Boot BOM version conflicts (Pitfall 4)"
  - "BeanOutputConverter<TransformedRecipe> instantiated in Phase 1 to lock TRANS-02 schema before Phase 2 LLM wiring"
  - "@get:JsonProperty use-site target on substitutionNote to ensure Jackson reads the getter"
  - "allowCredentials(false) on CORS since DietCode does not use cookies or auth headers"
  - "ANTHROPIC_API_KEY uses ${ANTHROPIC_API_KEY:placeholder-not-needed-in-phase-1} so Phase 1 starts without env var"

patterns-established:
  - "Pattern: dependencyManagement block for Spring AI BOM — never mix platform() and dependencyManagement for same BOM"
  - "Pattern: @get:JsonProperty for Kotlin data class fields needing explicit JSON property names"
  - "Pattern: WebMvcConfigurer.addCorsMappings with exact origin string (not wildcard)"
  - "Pattern: Service stubs with TODO() bodies annotated with which phase implements them"

requirements-completed: [TRANS-02]

# Metrics
duration: 5min
completed: 2026-04-21
---

# Phase 1 Plan 01: Spring Boot Backend Scaffold Summary

**Spring Boot 3.5 + Kotlin backend with locked IngredientLine/TransformedRecipe schemas, BeanOutputConverter registered, CORS wired, five service stubs compiling, and POST /api/recipe/transform returning hardcoded JSON**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-21T01:24:25Z
- **Completed:** 2026-04-21T01:29:35Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Gradle + Kotlin project generated via Spring Initializr with Spring Boot 3.5.0, Spring AI BOM 1.1.4 imported via `dependencyManagement` block
- All four locked data model classes (D-01 through D-04) created as Kotlin `data class` with correct nullable fields and `@get:JsonProperty` on `substitutionNote`
- `BeanOutputConverter<TransformedRecipe>` instantiated in `TransformationService` (TRANS-02 requirement satisfied — schema locked in compiled Kotlin before Phase 2 LLM wiring)
- CORS configured for `http://localhost:5173` with `allowCredentials(false)` via `WebMvcConfigurer`
- POST `/api/recipe/transform` returns hardcoded JSON with all five `TransformedRecipe` fields including a non-null `substitutionNote`, confirming Jackson serialization works

## Task Commits

1. **Task 1: Create Gradle project structure and build configuration** - `651ffde` (feat)
2. **Task 2: Create all locked data models, CORS config, service stubs, and RecipeController stub** - `02b4202` (feat)

## Files Created/Modified

- `backend/build.gradle.kts` - Spring Boot 3.5.0, Kotlin, Spring AI BOM 1.1.4, dependencyManagement block
- `backend/src/main/resources/application.yml` - Anthropic API key placeholder, model config with TODO Phase 2 comments
- `backend/src/main/kotlin/com/dietcode/DietCodeApplication.kt` - @SpringBootApplication entry point
- `backend/src/main/kotlin/com/dietcode/model/IngredientLine.kt` - D-01 locked schema with @get:JsonProperty
- `backend/src/main/kotlin/com/dietcode/model/TransformedRecipe.kt` - D-02 locked schema
- `backend/src/main/kotlin/com/dietcode/model/RecipeDocument.kt` - D-03 locked schema (nullable name, servings)
- `backend/src/main/kotlin/com/dietcode/model/TransformRequest.kt` - D-04 controller DTO
- `backend/src/main/kotlin/com/dietcode/model/DietProfile.kt` - enum: KETO, VEGAN, GLUTEN_FREE, PALEO, WHOLE30
- `backend/src/main/kotlin/com/dietcode/config/CorsConfig.kt` - WebMvcConfigurer allowing localhost:5173
- `backend/src/main/kotlin/com/dietcode/service/TransformationService.kt` - stub with BeanOutputConverter registered
- `backend/src/main/kotlin/com/dietcode/service/RecipeIngestionService.kt` - stub
- `backend/src/main/kotlin/com/dietcode/service/ScalingService.kt` - stub
- `backend/src/main/kotlin/com/dietcode/service/ExportService.kt` - stub
- `backend/src/main/kotlin/com/dietcode/controller/RecipeController.kt` - POST /api/recipe/transform stub

## Decisions Made

- Spring Boot 3.5.0 required: start.spring.io rejected 3.4.1 (minimum now 3.5.0). Spring AI 1.1.4 is compatible with 3.5.0.
- Spring AI BOM imported via `dependencyManagement` block (not `implementation(platform(...))`) to avoid Boot BOM override of Spring AI transitive dependency versions.
- `BeanOutputConverter` instantiated at field level (not in method body) so the schema is locked as a field, not recreated per request.
- `ANTHROPIC_API_KEY` uses property default expression so Phase 1 starts without the env var set (no LLM calls in Phase 1).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Spring Boot version upgraded from 3.4.1 to 3.5.0**
- **Found during:** Task 1 (Spring Initializr download)
- **Issue:** start.spring.io returned HTTP 400 — "Invalid Spring Boot version '3.4.1', Spring Boot compatibility range is >=3.5.0". The plan specified 3.4.1 which is no longer served.
- **Fix:** Used 3.5.0 instead. Spring AI 1.1.4 is compatible with Spring Boot 3.5.0.
- **Files modified:** backend/build.gradle.kts
- **Verification:** ./gradlew build passes BUILD SUCCESSFUL; bootRun starts and endpoint returns 200
- **Committed in:** 651ffde (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (version bump, non-breaking)
**Impact on plan:** No scope change. All acceptance criteria met with 3.5.0.

## Known Stubs

The following service methods have `TODO()` bodies by design — they are Phase 1 scaffolding stubs:

| File | Method | Implementing Phase |
|------|--------|--------------------|
| `RecipeIngestionService.kt` | `ingest(input)` | Phase 2 (text), Phase 3 (URL) |
| `TransformationService.kt` | `transform(recipe, dietProfiles, intolerances)` | Phase 2 |
| `ScalingService.kt` | `scale(recipe, targetServings)` | Phase 3 |
| `ExportService.kt` | `serialize(recipe)` | Phase 4 |

`RecipeController.transform()` returns a hardcoded payload — intentional Phase 1 stub replaced in Phase 2.

These stubs are intentional and required (D-05 decision). All five service skeletons compile and wire correctly via Spring's dependency injection.

## Self-Check: PASSED

All 11 key files verified present on disk. Commits 651ffde and 02b4202 verified in git log.
