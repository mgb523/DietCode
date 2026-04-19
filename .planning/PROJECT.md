# DietCode

## What This Is

DietCode is a personal recipe transformation tool. You paste in a recipe or import it from a URL, specify dietary needs (keto, vegan, gluten-free, etc.) and any ingredient intolerances, and an LLM rewrites the recipe with appropriate substitutions. The result can be scaled to any number of servings, then printed or exported as a PDF to Google Drive.

## Core Value

Given any recipe, instantly produce a correctly adapted version — right diet, right portions, right substitutions — ready to cook from.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can paste recipe text or import a recipe from a URL
- [ ] User can specify a target diet profile (keto, vegan, gluten-free, paleo, etc.)
- [ ] User can flag specific ingredient intolerances to filter out
- [ ] LLM rewrites the recipe with appropriate ingredient substitutions
- [ ] User can scale the recipe to a custom number of servings
- [ ] User receives the transformed recipe as readable text
- [ ] User can print the transformed recipe or export it as a PDF to Google Drive

### Out of Scope

- User accounts / auth — personal use only, no login in v1
- Recipe library / history — stateless per session in v1
- Meal planning / weekly schedules — out of scope for v1
- Nutrition macro breakdown — transformation focus, not analysis

## Context

- Personal use project — no multi-tenant concerns
- Backend: Spring Boot (Kotlin, Gradle) in `/backend`
- Frontend: React + Vite in `/frontend`
- LLM provider TBD (substitution reasoning delegated to LLM)
- PDF export via browser print dialog or Google Drive API

## Constraints

- **Tech Stack**: Spring Boot + Kotlin + Gradle (backend), React + Vite (frontend) — already decided
- **Scope**: Personal use only — no auth, no multi-user, no persistence in v1
- **LLM**: External API call for substitution logic — latency acceptable for v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| LLM for substitution | Rule-based substitution is brittle; LLM handles edge cases and context | — Pending |
| Stateless v1 | Personal use, no value in persistence until patterns emerge | — Pending |
| PDF export via print/Drive | Familiar UX for printing recipes, no custom PDF rendering library needed | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-19 after initialization*
