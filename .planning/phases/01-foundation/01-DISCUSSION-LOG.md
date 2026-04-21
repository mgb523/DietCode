# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-20
**Phase:** 01-foundation
**Areas discussed:** Full data model schema, Substitution note placement, Frontend stub fidelity, Service scaffolding scope

---

## Full Data Model Schema

### TransformedRecipe

| Option | Description | Selected |
|--------|-------------|----------|
| name + instructions + servings | recipeName: String, instructions: List<String>, servings: Int | ✓ |
| name + instructions only | Skip servings on TransformedRecipe | |
| name + instructions + servings + prepTime/cookTime | Full metadata including prep/cook time | |

**User's choice:** `name + instructions + servings` — covers Phase 2 display, Phase 3 scaler, Phase 4 comparison.

### RecipeDocument

| Option | Description | Selected |
|--------|-------------|----------|
| name + rawIngredients + instructions + servings | Nullable fields for graceful URL metadata handling | ✓ |
| rawIngredients + instructions only | Minimal — name/servings not needed by LLM | |
| Full metadata (name, servings, prepTime, cookTime, ...) | Mirror all JSON-LD fields | |

**User's choice:** `name + rawIngredients + instructions + servings` — balanced, nullable where metadata may be absent.

### Diet/intolerance placement (clarification raised by user)

**User question:** Should the input also include diet type and sensitivities?

**Resolution:** Diet profiles and intolerances are user preferences, not recipe content — they belong on a separate `TransformRequest` DTO (not on `RecipeDocument`). User confirmed this separation.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep separate (TransformRequest carries diet/intolerance) | Clean service boundaries | ✓ |
| Fold into RecipeDocument | Simpler passing, mixes concerns | |

---

## Substitution Note Placement

| Option | Description | Selected |
|--------|-------------|----------|
| On IngredientLine as substitutionNote: String? | LLM returns note with each ingredient; no map to keep in sync | ✓ |
| Separate map on TransformedRecipe | Map<String, String> keyed by ingredient name | |
| Claude's discretion | Either approach | |

**User's choice:** On `IngredientLine` — co-located with the ingredient it describes.

---

## Frontend Stub Fidelity

| Option | Description | Selected |
|--------|-------------|----------|
| Raw JSON / plain text | Prove wire works only | |
| Minimal recipe render | Name + bulleted ingredients + plain instructions | |
| First-pass styled card | shadcn/ui card with Tailwind — refined in Phase 2, not replaced | ✓ |

**User's choice:** First-pass styled card — avoids throwaway code and gives Phase 2 something to build on.

---

## Service Scaffolding Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Scaffold all 5 services | RecipeIngestionService, TransformationService, ScalingService, ExportService, RecipeController — all stubbed | ✓ |
| Only RecipeController | Minimal — other services created in later phases | |

**User's choice:** Scaffold all 5 — architecture is visible before implementation begins.

---

## Claude's Discretion

- Java version (17 vs 21)
- Gradle wrapper and Kotlin versions
- Package naming
- DietProfile type (enum vs sealed class)
- Spring Boot project generation approach

## Deferred Ideas

None.
