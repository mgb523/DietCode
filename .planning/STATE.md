# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Given any recipe, instantly produce a correctly adapted version — right diet, right portions, right substitutions — ready to cook from.
**Current focus:** Phase 3 — Scale and Import

## Current Position

Phase: 3 of 5 (Scale and Import)
Plan: 2 of 4 in current phase
Status: Executing — Phase 3 plan 02 complete (URL scraping backend)
Last activity: 2026-05-14 — 03-02 complete: jsoup URL scraping with three-level fallback, ScrapingException 422 handler

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 3.5 min
- Total execution time: 7 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 03-scale-and-import | 2 | 7 min | 3.5 min |

**Recent Trend:**
- Last 5 plans: 03-01 (2 min), 03-02 (5 min)
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Pre-roadmap: LLM output schema (`IngredientLine` + `warnings[]`) must be locked in Phase 1 — retrofitting is a full rewrite
- Pre-roadmap: Spring AI 1.1.4 + Anthropic Claude Haiku 3.5, temperature 0.3
- Pre-roadmap: Google Drive OAuth2 kept in v1 scope (OUT-04); complexity accepted for personal use
- Pre-roadmap: CORS configured on day one — `WebMvcConfigurer` allowing `http://localhost:5173`
- 03-01: `factor^0.5` sub-linear curve for leavening/salt/spice (continuous, correct at all scale factors)
- 03-01: `originalServings: Int = 0` default in TransformedRecipe so Jackson can deserialize LLM JSON without field
- 03-01: RecipeController captures llmServings before ScalingService call; sets originalServings in both branches
- 03-02: script.data() not .text() for JSON-LD DataNode content extraction (anti-pattern documented)
- 03-02: ScrapingException -> 422 UNPROCESSABLE_ENTITY with {error: scraping_failed, message: ...}
- 03-02: parseJsonLd() handles both inline @type:Recipe and Yoast SEO @graph array format

### Roadmap Evolution

- Phase 5 added: UI Polish — general visual refinement: spacing, typography, responsiveness, overall feel and cohesion

### Pending Todos

None yet.

### Blockers/Concerns

- URL scraping: bot-blocked sites (AllRecipes, NYT Cooking) may require paste-only fallback — test early in Phase 3
- Print CSS: cross-browser test (Chrome, Firefox, Safari) required before marking Phase 4 export complete
- LLM token limits: set `max_tokens=2048` minimum; very long recipes may need truncation strategy

## Deferred Items

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| v2 | SSE streaming for LLM output (UX-01) | Deferred | Roadmap creation |
| v2 | Re-scale without LLM call (UX-02) | Deferred | Roadmap creation |
| v2 | JS-rendered recipe site import (INP-04) | Deferred | Roadmap creation |
| v2 | Share via link (EXP-01) | Deferred | Roadmap creation |

## Session Continuity

Last session: 2026-05-14
Stopped at: Completed 03-02-PLAN.md — URL scraping backend
Resume file: None
