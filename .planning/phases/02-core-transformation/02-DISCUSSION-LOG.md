# Phase 2: Core Transformation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-21
**Phase:** 02-core-transformation
**Areas discussed:** App layout & flow, Constraint panel UI, LLM loading state, RecipeCard refinements

---

## App Layout & Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Top-to-bottom, single page | Textarea → constraints → button → result, all vertical | ✓ |
| Side-by-side (form left, result right) | Two-column desktop layout | |

**Form visibility after success:**

| Option | Description | Selected |
|--------|-------------|----------|
| Stay visible, scrolled above | Form always accessible | |
| Collapse / hide on success | Result takes over; re-expand to retry | ✓ |

---

## Constraint Panel UI

**Diet profiles:**

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle pills / badges | Clickable chips in a row, highlight on select | ✓ |
| Checkboxes with labels | Standard form checkboxes | |

**Ingredient exclusions:**

| Option | Description | Selected |
|--------|-------------|----------|
| Free-text tag input | Type + Enter to add removable tags | ✓ |
| Predefined common list | Fixed pills for dairy/gluten/nuts/etc. | |

**User clarification:** Label should be "Ingredients to omit or replace" (not "Intolerances"). LLM should interpret entries broadly and handle typos (e.g. "peenut" → peanuts).

---

## LLM Loading State

| Option | Description | Selected |
|--------|-------------|----------|
| Spinner + disabled button | Button shows ⧗ Transforming..., disabled during call | ✓ |
| Skeleton card placeholder | Grey shimmer in result area | |

**Error handling:**

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error below button | ⚠ message below submit, form stays visible | ✓ |
| Error replaces result area | Error shown in result card zone | |

---

## RecipeCard Refinements

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal polish only | Bold quantity+unit in ingredient lines | ✓ |
| Leave as Phase 1 | No changes | |

---

## Deferred Ideas

None.
