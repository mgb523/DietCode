# Phase 4: Output and Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 04-output-and-polish
**Areas discussed:** Before/After data model, Export controls placement, Google Drive OAuth flow

---

## Before/After Data Model

| Option | Description | Selected |
|--------|-------------|----------|
| Extend TransformedRecipe | Add `originalIngredients` + `originalInstructions` fields; backend populates from RecipeDocument. Consistent with how `originalServings` was added in Phase 3. LLM schema untouched. | ✓ |
| New wrapper response type | Return `TransformationResult { original: RecipeDocument, transformed: TransformedRecipe }`. Cleaner separation but requires new API type and frontend restructuring. | |

**User's choice:** Extend TransformedRecipe (recommended default)
**Notes:** Consistent with Phase 3 precedent (originalServings). No LLM schema changes.

---

### Original data fields

| Option | Description | Selected |
|--------|-------------|----------|
| Ingredients + instructions | `originalIngredients: List<IngredientLine>?` and `originalInstructions: List<String>?` — full side-by-side comparison. | ✓ |
| Ingredients only | Only `originalIngredients`. Instructions rarely change structurally. | |
| Full original as plain text | `originalText: String?` — raw text block. Avoids restructuring. | |

**User's choice:** Ingredients + instructions
**Notes:** Full comparison, not just ingredient diff.

---

### Comparison trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Always shown after transformation | Side-by-side is the main result view — no extra click. | ✓ |
| Behind a toggle | Adapted card first; "Compare with original" button reveals side-by-side. | |

**User's choice:** Always shown
**Notes:** Comparison is the primary result view in Phase 4.

---

### Visual layout

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side columns, wider breakpoint | Two columns at `md:`, stacks on mobile, expands past `max-w-2xl`. Matches roadmap spec. | ✓ |
| Tabbed view | Tabs: Original / Adapted. Stays at `max-w-2xl`. One version at a time. | |
| Toggle button | Single card, flip between versions. Can't scan both simultaneously. | |

**User's choice:** Side-by-side columns (recommended default)
**Notes:** Layout expands past `max-w-2xl` for comparison view only.

---

## Export Controls Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Toolbar row above comparison | Action row between "Edit / start over" and the comparison cards. Always visible. | ✓ |
| Inside RecipeCard header | Buttons in CardHeader of adapted card. Scoped to card. | |
| Sticky bottom bar | Fixed bar at bottom of viewport. Always accessible while scrolling. | |

**User's choice:** Toolbar row above the comparison

---

### Export scope

| Option | Description | Selected |
|--------|-------------|----------|
| Adapted recipe only | Print and Drive export just the transformed result. Clean output. | ✓ |
| Both versions | Export includes original + adapted. More complex print layout. | |

**User's choice:** Adapted recipe only
**Notes:** Original is for in-browser comparison only.

---

## Google Drive OAuth Flow

### Auth trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Lazy — on first Drive button click | OAuth popup on click; token stored in sessionStorage. | ✓ |
| Eager — connect Drive from toolbar | "Connect Google Drive" first, then export button activates. | |

**User's choice:** Lazy auth (recommended default)
**Notes:** Token persisted in sessionStorage for the session.

---

### File naming

| Option | Description | Selected |
|--------|-------------|----------|
| Recipe name + diet tags | `Banana Bread (Vegan, GF).pdf` | ✓ |
| Recipe name only | `Banana Bread.pdf` | |
| You decide | Claude picks format. | |

**User's choice:** Recipe name + diet tags

---

### Drive failure handling

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error + fallback to Print | `⚠ Drive export failed — use Print to save as PDF instead.` | ✓ |
| Retry prompt | Error + Retry button; suggest Print after two failures. | |
| You decide | Claude handles error UX. | |

**User's choice:** Inline error + fallback to Print (recommended default)

---

## Claude's Discretion

- Substitution popover UX: tooltip (hover) vs. popover (click); icon style; popover content structure
- Print CSS: `@media print` rules, what to hide, typography
- Google Drive API details: MIME type, folder, sharing settings
- Exact column widths and breakpoint values for comparison layout

## Deferred Ideas

None — discussion stayed within Phase 4 scope.
