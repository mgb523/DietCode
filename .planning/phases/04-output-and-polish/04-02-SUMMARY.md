---
phase: 04-output-and-polish
plan: "02"
subsystem: frontend-comparison-layout
tags: [frontend, react, tailwind, shadcn, print-css, comparison-view]
dependency_graph:
  requires: [04-01]
  provides: [shadcn-popover, comparison-layout, print-css-foundation]
  affects: [plan-03-substitution-popovers, plan-04-export-toolbar]
tech_stack:
  added: [shadcn/popover, @radix-ui/react-popover]
  patterns: [cn-className-prop, print-hidden-utility, comparison-layout-wrapper, md-breakpoint-flex]
key_files:
  created:
    - frontend/src/components/ui/popover.tsx
    - frontend/src/components/ComparisonLayout.tsx
  modified:
    - frontend/src/App.tsx
    - frontend/src/components/RecipeCard.tsx
    - frontend/src/index.css
decisions:
  - "shadcn CLI placed popover.tsx in frontend/@/components/ui/ (literal path alias) instead of frontend/src/components/ui/ — manually moved to correct location; erroneous directory removed"
  - "RecipeCard Card element uses cn('mx-auto', className) without a base max-w — callers are responsible for constraining width; this is intentional per D-04"
  - "ServingStepper wrapped in print:hidden div (not className prop) since ServingStepper has no className prop — avoids changing ServingStepper in this plan"
  - "originalIngredients column renders ing.ingredient only (no quantity/unit) since original recipe lines are raw strings mapped to IngredientLine with quantity='' and unit=''"
metrics:
  duration: "~3 min"
  completed_date: "2026-05-29"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 5
---

# Phase 4 Plan 02: Comparison Layout, shadcn Popover, and Print CSS Summary

**One-liner:** Two-column before/after comparison view at md: breakpoint with shadcn Popover installed, RecipeCard className prop, and @media print CSS foundation for print-to-PDF.

## What Was Built

Three frontend changes that together deliver the comparison view (OUT-02) and print CSS foundation (OUT-03):

1. **popover.tsx** — shadcn Popover component installed via CLI (Radix umbrella import pattern matching tooltip.tsx). Required by Plan 03 (SubstitutionPopover). Exports `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`, `PopoverHeader`, `PopoverTitle`, `PopoverDescription`.

2. **ComparisonLayout.tsx** — Pure layout wrapper with `max-w-5xl mx-auto flex flex-col md:flex-row gap-6`. Accepts optional `className` prop via `cn()`. Stacks vertically on mobile, side-by-side at `md:` and wider.

3. **App.tsx** — TransformedRecipe interface extended with `originalIngredients?: IngredientLine[]` and `originalInstructions?: string[]`. `max-w-2xl` moved from `<main>` to a form wrapper `<div>` so the comparison view can expand. Result section restructured with `ComparisonLayout` containing two `<section>` elements with `aria-label="Original recipe"` (print:hidden) and `aria-label="Adapted recipe"`. Edit/start over button and original column have `print:hidden`. Adapted label paragraph has `print:hidden`.

4. **RecipeCard.tsx** — Added `import { cn }`, extended `Props` with `className?: string`, updated `Card` to `className={cn("mx-auto", className)}`. ServingStepper wrapped in `print:hidden` div with a `hidden print:block` static serving count span alongside it.

5. **index.css** — Appended `@media print` with 12pt body font, 1.5 line-height, 14pt headings, and `@page { margin: 1cm }`.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: shadcn Popover + ComparisonLayout | d48881a | popover.tsx, ComparisonLayout.tsx |
| Task 2: App.tsx comparison layout | ae67756 | App.tsx |
| Task 3: RecipeCard className + print CSS | d60e762 | RecipeCard.tsx, index.css |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI path resolution in worktree**
- **Found during:** Task 1
- **Issue:** `npx shadcn@latest add popover --yes` created `frontend/@/components/ui/popover.tsx` (treating `@/` as a literal directory) instead of `frontend/src/components/ui/popover.tsx`
- **Fix:** Copied the correctly generated file content to `frontend/src/components/ui/popover.tsx` and removed the erroneous `frontend/@/` directory
- **Files modified:** frontend/src/components/ui/popover.tsx (created at correct path)
- **Commit:** d48881a

**2. [Rule 3 - Blocking] Task 2 TypeScript error before Task 3**
- **Found during:** Task 2 verification
- **Issue:** App.tsx passes `className="max-w-none"` to RecipeCard but RecipeCard did not yet accept `className` prop — TypeScript error TS2322. Task 3 resolves this.
- **Fix:** Implemented Task 3 immediately before committing Task 2 (Task 2 build passed after Task 3 changes applied). Committed in order: Task 2, then Task 3.
- **Impact:** No plan deviation — tasks are sequential and Task 3 was always the fix. Both committed with passing build.

## Known Stubs

None — all new UI elements are wired to real data. The ExportToolbar comment (`{/* ExportToolbar placeholder — added in Plan 03 */}`) is a documentation note, not a rendered stub.

## Threat Flags

No new threat surface. T-04-04 (originalIngredients rendered as React text nodes) and T-04-05 (ComparisonLayout pure rendering) are accepted per plan's threat model.

## Self-Check: PASSED

- frontend/src/components/ui/popover.tsx — FOUND
- frontend/src/components/ComparisonLayout.tsx — FOUND
- frontend/src/App.tsx — FOUND (modified)
- frontend/src/components/RecipeCard.tsx — FOUND (modified)
- frontend/src/index.css — FOUND (modified)
- Commit d48881a — FOUND
- Commit ae67756 — FOUND
- Commit d60e762 — FOUND
- npm run build — BUILD SUCCESSFUL (0 TypeScript errors)
