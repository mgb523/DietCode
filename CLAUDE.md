# DietCode — Project Guide

## Project

Recipe transformation app: paste or import a recipe, select dietary constraints and intolerances, get a correctly adapted recipe with scaled servings, then print or export to Google Drive.

See `.planning/PROJECT.md` for full context.

## Stack

- **Backend**: Spring Boot + Kotlin + Gradle in `/backend`
- **Frontend**: React + Vite + Tailwind CSS v4 + shadcn/ui in `/frontend`
- **LLM**: Spring AI 1.1.4 + Anthropic Claude Haiku 3.5 (`temperature=0.3`)
- **Scraping**: jsoup + JSON-LD structured data extraction
- **PDF export**: `window.print()` + `@media print` CSS (zero dependencies)
- **Drive export**: Google Drive REST API v3 via OAuth2 (browser-side)

## Architecture

Five backend services — each independently testable:

| Service | Responsibility | Rule |
|---------|---------------|------|
| `RecipeController` | HTTP routing, SSE setup, validation | Routes only |
| `RecipeIngestionService` | Parse text OR scrape URL → `RecipeDocument` | Never calls LLM |
| `TransformationService` | Build prompt + call Spring AI → `TransformedRecipe` | Never scrapes |
| `ScalingService` | Arithmetic on `IngredientLine.quantity` | Pure math; sub-linear for leavening/salt/spice |
| `ExportService` | Serialize for frontend | Stateless |

## Critical Design Decisions (do not re-litigate)

- **LLM output schema is locked**: `IngredientLine(quantity, unit, ingredient, preparation)` + `warnings[]` — free-form strings break `ScalingService`
- **Scaling is deterministic math, not LLM**: never ask the LLM to scale quantities
- **Scraping priority**: JSON-LD first → microdata → heuristic HTML → fail loudly (never pass empty content to LLM silently)
- **No WebFlux**: `SseEmitter` on servlet stack is sufficient for one user
- **No state management library**: React `useState` is sufficient for a linear single-session flow
- **Google Drive deferred to Phase 4**: browser print-to-PDF covers the use case earlier

## GSD Workflow

This project uses GSD for planning and execution.

- **Planning docs**: `.planning/`
- **Roadmap**: `.planning/ROADMAP.md`
- **Requirements**: `.planning/REQUIREMENTS.md`
- **Research**: `.planning/research/`

### Commands

```
/gsd-discuss-phase 1    # gather context before planning
/gsd-plan-phase 1       # create execution plan for a phase
/gsd-execute-phase 1    # execute the plan
/gsd-progress           # check current state
```

### Before each phase

1. Run `/gsd-discuss-phase N` to surface assumptions
2. Run `/gsd-plan-phase N` to create PLAN.md
3. Run `/gsd-execute-phase N` to execute

## Dev Setup

```bash
# Backend
cd backend && ./gradlew bootRun

# Frontend
cd frontend && npm run dev    # runs on port 5173
```

CORS is configured to allow `http://localhost:5173` in development.

Required env var: `ANTHROPIC_API_KEY`
