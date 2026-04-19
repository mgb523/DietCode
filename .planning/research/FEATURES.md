# DietCode — Features Research

## Table Stakes (must build)

### Input
- **Text paste** — trivial complexity, no dependencies; user pastes raw recipe text
- **URL scraping** — medium complexity, biggest parsing edge case; feeds the same transformation pipeline as paste; must handle JS-rendered pages and bot detection

### Transformation Controls
- **Diet profile selector** — low complexity; collapses into LLM request parameters (keto, vegan, gluten-free, paleo, etc.)
- **Intolerance/allergy tags** — low complexity; same LLM parameter surface as diet profile; combine into one prompt parameter set

### Core Engine
- **LLM transformation with structured response schema** — high complexity; this is the core feature; must design response format (JSON or consistent markdown) upfront — retrofitting later is expensive
- **Serving scaler** — delegate to LLM in same call; handles fractional edge cases (leavening, salt) better than pure math

### Output
- **Readable output render** — low complexity once structured output exists; needs a clean recipe display component
- **Print stylesheet** — low complexity; CSS `@media print` rules
- **PDF via browser print dialog** — zero additional code if print stylesheet is right; "Save as PDF" is built into all modern browsers

---

## Differentiators (design for, defer build)

- **Before/after dual-pane view** — low-medium complexity; high trust payoff (user can see exactly what changed); worth designing into the layout even if not v1
- **Substitution annotations** — medium complexity; essentially free if the structured LLM schema returns substitution rationale alongside swapped ingredients; design schema for it from day one
- **URL auto-detection in single input field** — low complexity; detect `http` prefix and route to scraper vs text parser; polished UX, minimal code

---

## Anti-features (never build in v1)

| Feature | Why not |
|---------|---------|
| User accounts / auth | Personal use only; no multi-user value |
| Recipe library / save history | Stateless is fine for personal use; adds DB complexity |
| Nutrition macro breakdown | Separate problem; different LLM prompt strategy |
| Meal planning / weekly schedules | Scope creep; not the core value |
| Social sharing | No audience |
| Recipe discovery / browsing | Content problem, not transformation |
| Native mobile app | Web is sufficient |
| Collaborative editing | Single user |
| Custom LLM fine-tuning | Overkill; general models handle this well |

---

## Critical Dependency

**The LLM response schema is a choke point.**

If the LLM returns unstructured prose in v1, annotations and the before/after diff view become expensive retrofits. The schema must be designed into Phase 1:

```
{
  "title": "...",
  "servings": N,
  "ingredients": [
    { "original": "...", "adapted": "...", "substitution_note": "..." }
  ],
  "steps": ["..."],
  "diet_notes": "..."
}
```

Getting this right from day one costs nothing. Getting it wrong costs a full rewrite of the prompt layer.
