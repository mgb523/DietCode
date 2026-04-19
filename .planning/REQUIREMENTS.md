# Requirements: DietCode

**Defined:** 2026-04-19
**Core Value:** Given any recipe, instantly produce a correctly adapted version — right diet, right portions, right substitutions — ready to cook from.

## v1 Requirements

### Input

- [ ] **INP-01**: User can paste raw recipe text into an input field
- [ ] **INP-02**: User can import a recipe by entering a URL
- [ ] **INP-03**: Input field auto-detects whether the input is a URL or pasted text and routes to the appropriate path automatically

### Dietary Controls

- [ ] **DIET-01**: User can select one or more diet profiles from a predefined list (keto, vegan, gluten-free, paleo, whole30, etc.)
- [ ] **DIET-02**: User can flag specific ingredients or ingredient categories as intolerances to remove or replace
- [ ] **DIET-03**: Diet profiles and intolerance tags are presented in a single unified constraint UI (not separate forms)

### Transformation

- [ ] **TRANS-01**: LLM rewrites the recipe with ingredient substitutions appropriate to the selected dietary constraints
- [ ] **TRANS-02**: LLM returns structured output with per-ingredient data (`quantity`, `unit`, `ingredient`, `preparation`) and a `warnings[]` array for structural ingredient swaps (leavening, binders, gluten-forming flours)
- [ ] **TRANS-03**: User can set a target number of servings and receive scaled ingredient quantities
- [ ] **TRANS-04**: Serving scaler applies sub-linear rules for leavening agents, salt, and strong spices (not naive linear multiplication)
- [ ] **TRANS-05**: Each substituted ingredient has an annotation explaining why it was swapped, accessible via an info icon popover (not shown inline)

### Output

- [ ] **OUT-01**: Transformed recipe is displayed in a clean, readable formatted view
- [ ] **OUT-02**: User can view a before/after comparison showing the original recipe alongside the adapted version
- [ ] **OUT-03**: User can print the recipe or save it as a PDF via the browser print dialog (`window.print()` + `@media print` CSS)
- [ ] **OUT-04**: User can export the recipe as a PDF directly to Google Drive via OAuth2

## v2 Requirements

### UX Enhancements

- **UX-01**: LLM transformation result streams progressively (SSE) rather than appearing all at once
- **UX-02**: User can re-scale a transformed recipe without triggering another LLM call

### Input Enhancements

- **INP-04**: User can import from JS-rendered recipe sites (requires Playwright sidecar or similar)

### Export Enhancements

- **EXP-01**: User can share a recipe via a link (requires persistence)

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Personal use only — no multi-user value in v1 |
| Saved recipe library / history | Stateless is fine for personal use; DB adds complexity |
| Nutrition macro breakdown | Different problem domain; different LLM prompt strategy |
| Meal planning / weekly schedules | Scope creep; not the core value |
| Social sharing / discovery | No audience; out of charter |
| Native mobile app | Web-first; browser print covers mobile use case |
| Collaborative editing | Single user |
| Custom LLM fine-tuning | General models handle recipe substitution well |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INP-01 | Phase 2 | Pending |
| INP-02 | Phase 3 | Pending |
| INP-03 | Phase 3 | Pending |
| DIET-01 | Phase 2 | Pending |
| DIET-02 | Phase 2 | Pending |
| DIET-03 | Phase 2 | Pending |
| TRANS-01 | Phase 2 | Pending |
| TRANS-02 | Phase 1 | Pending |
| TRANS-03 | Phase 3 | Pending |
| TRANS-04 | Phase 3 | Pending |
| TRANS-05 | Phase 4 | Pending |
| OUT-01 | Phase 2 | Pending |
| OUT-02 | Phase 4 | Pending |
| OUT-03 | Phase 4 | Pending |
| OUT-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-19*
*Last updated: 2026-04-19 after roadmap creation*
