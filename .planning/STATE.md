# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-19)

**Core value:** Given any recipe, instantly produce a correctly adapted version — right diet, right portions, right substitutions — ready to cook from.
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 2 of 4 (Core Transformation)
Plan: 0 of TBD in current phase
Status: Phase 1 complete — ready to plan Phase 2
Last activity: 2026-04-21 — Phase 1 complete (3/3 plans); all four roadmap success criteria verified in browser

Progress: [██░░░░░░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
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

Last session: 2026-04-19
Stopped at: Roadmap created — ready to plan Phase 1
Resume file: None
