# Phase 5: UI Polish - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 8 (7 modified, 1 new)
**Analogs found:** 7 / 8 (SVG logo has no analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `frontend/src/App.tsx` | component (root layout) | request-response | `frontend/src/App.tsx` (self — surgical edits) | exact |
| `frontend/src/index.css` | config (design tokens) | transform | `frontend/src/index.css` (self — CSS variable additions) | exact |
| `frontend/src/components/RecipeCard.tsx` | component | transform | `frontend/src/components/RecipeCard.tsx` (self — surgical edits) | exact |
| `frontend/src/components/DietPillGroup.tsx` | component | event-driven | `frontend/src/components/SubstitutionPopover.tsx` | role-match (both use Popover pattern) |
| `frontend/src/components/ServingStepper.tsx` | component | event-driven | `frontend/src/components/ServingStepper.tsx` (self — surgical edits) | exact |
| `frontend/src/components/SubstitutionPopover.tsx` | component | event-driven | `frontend/src/components/SubstitutionPopover.tsx` (self — verify only) | exact |
| `frontend/src/components/ComparisonLayout.tsx` | component | transform | `frontend/src/components/ComparisonLayout.tsx` (self — verify only) | exact |
| `frontend/src/assets/dietcode-logo.svg` | asset (SVG icon) | n/a | none | no analog |

---

## Pattern Assignments

### `frontend/src/App.tsx` (root layout component, request-response)

**Analog:** Self — 7 surgical line-level changes to the existing file.

**Current imports block** (lines 1–9 of `frontend/src/App.tsx`):
```tsx
import { useState } from "react"
import { RecipeCard } from "@/components/RecipeCard"
import { DietPillGroup } from "@/components/DietPillGroup"
import { TagInput } from "@/components/TagInput"
import { Loader2 } from "lucide-react"
import { UrlDetectionBadge } from "@/components/UrlDetectionBadge"
import { ServingStepper } from "@/components/ServingStepper"
import { ComparisonLayout } from "@/components/ComparisonLayout"
import { ExportToolbar } from "@/components/ExportToolbar"
```

**D-04/D-05 — Logo import addition** (add after existing imports):
```tsx
import dietcodeLogo from "@/assets/dietcode-logo.svg"
```

**D-02 — Header band pattern** (replace `<h1>` at line 90):

Current (line 90):
```tsx
<h1 className="text-2xl font-bold text-center mb-8">DietCode</h1>
```

Target — wrap in a full-bleed header band before `<main>`, or replace the `<h1>` with a styled header block inside `<main>`. Recommended structure (stays inside the `return`, above the `<main>` element):
```tsx
<header className="w-full bg-emerald-700 text-white py-4 px-4 sm:px-6 lg:px-8 mb-8 flex items-center gap-3">
  <img src={dietcodeLogo} alt="" aria-hidden="true" className="h-9 w-9" />
  <span className="text-2xl font-bold text-white">DietCode</span>
</header>
```
Note: The `<h1>` at line 90 is removed when the header band is introduced; the wordmark `<span>` inside `<header>` carries the visual role. Keep semantic `<h1>` if needed for SEO — Claude's discretion per D-02 scope.

**D-08 — Responsive main padding** (line 89):

Current:
```tsx
<main className="px-4 py-8">
```
Target:
```tsx
<main className="px-4 sm:px-6 lg:px-8 py-8">
```

**D-11 — Error paragraph role="alert"** (line 149–151):

Current:
```tsx
{error && (
  <p className="text-sm text-destructive mt-2">⚠ {error}</p>
)}
```
Target:
```tsx
{error && (
  <p role="alert" className="text-sm text-destructive mt-2">⚠ {error}</p>
)}
```

**D-12 — Empty state copy** (line 204–206):

Current:
```tsx
<p className="text-sm text-muted-foreground">
  Original recipe unavailable.
</p>
```
Target:
```tsx
<p className="text-sm text-muted-foreground">
  Original recipe unavailable — paste it above to see the comparison.
</p>
```

**D-13 — Textarea focus-visible** (line 100):

Current:
```tsx
className="w-full resize-y border rounded-md p-3 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
```
Target (replace `focus:` with `focus-visible:`):
```tsx
className="w-full resize-y border rounded-md p-3 text-sm bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
```

---

### `frontend/src/index.css` (design token config, transform)

**Analog:** Self — additive CSS variable block. Pattern: all shadcn CSS variable overrides go in `:root {}` in this file, after the `@import "tailwindcss"` line.

**Current file** (lines 1–21 of `frontend/src/index.css`):
```css
@import "tailwindcss";

@media print {
  body { font-size: 12pt; line-height: 1.5; }
  h1, h2, h3 { font-size: 14pt; font-weight: 700; }
  .recipe-display-name { font-size: 18pt; font-weight: 700; }
}

@page { margin: 1cm; }
```

**D-03 — CSS variable override pattern** (add after `@import` line, before `@media print`):

```css
@import "tailwindcss";

:root {
  /* Warm accent: emerald-700 range — replaces zinc-900 primary */
  --primary: oklch(0.45 0.14 155);           /* ~emerald-700 */
  --primary-foreground: oklch(0.98 0.01 155); /* near-white for contrast */
}
```

Design note: `oklch(0.45 0.14 155)` maps to approximately `#2d7a4f` / Tailwind `emerald-700`. All shadcn components that reference `bg-primary`, `text-primary`, `border-primary` pick this up automatically — no component changes needed for the submit button, Print button, or active pill color inherited from `bg-primary`.

The amber warning block uses raw Tailwind classes (`bg-amber-50 border-amber-200`) and is unaffected by this variable override.

---

### `frontend/src/components/RecipeCard.tsx` (component, transform)

**Analog:** Self — two `font-semibold` → `font-bold` replacements and one `leading-relaxed` addition.

**D-09 — Heading weight consistency** (lines 140 and 167):

Current line 140:
```tsx
<h3 className="font-semibold mb-2">Ingredients</h3>
```
Target:
```tsx
<h3 className="font-bold mb-2">Ingredients</h3>
```

Current line 167:
```tsx
<h3 className="font-semibold mb-2">Instructions</h3>
```
Target:
```tsx
<h3 className="font-bold mb-2">Instructions</h3>
```

**D-10 — Instruction list leading-relaxed** (lines 168–172):

Current:
```tsx
<ol className="list-decimal pl-5 space-y-1">
  {recipe.instructions.map((step, i) => (
    <li key={i}>{step}</li>
  ))}
</ol>
```
Target:
```tsx
<ol className="list-decimal pl-5 space-y-1">
  {recipe.instructions.map((step, i) => (
    <li key={i} className="leading-relaxed">{step}</li>
  ))}
</ol>
```

**No other changes to RecipeCard.tsx.** The `cn()` import at line 5 and all other class strings are unchanged.

---

### `frontend/src/components/DietPillGroup.tsx` (component, event-driven)

**Analog:** `frontend/src/components/SubstitutionPopover.tsx` — exact Popover usage pattern to copy.

**D-07 — Replace Tooltip with Popover for info icons.**

Current import (lines 1–3):
```tsx
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
```
Target (swap Tooltip imports for Popover):
```tsx
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"
```

**D-07 — Popover pattern to copy from SubstitutionPopover** (lines 72–87 of `DietPillGroup.tsx` current, lines 10–30 of `SubstitutionPopover.tsx`):

Current tooltip block inside each pill button (lines 72–87 of `DietPillGroup.tsx`):
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span
      role="img"
      aria-label={`Info about ${opt.label}`}
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center"
    >
      <Info className="h-3 w-3 opacity-60" />
    </span>
  </TooltipTrigger>
  <TooltipContent side="bottom" className="max-w-[220px] text-xs">
    {opt.description}
  </TooltipContent>
</Tooltip>
```

Target (copy SubstitutionPopover's `Popover` + `button` trigger pattern):
```tsx
<Popover>
  <PopoverTrigger asChild>
    <button
      type="button"
      role="img"
      aria-label={`Info about ${opt.label}`}
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center cursor-pointer"
    >
      <Info className="h-3 w-3 opacity-60" />
    </button>
  </PopoverTrigger>
  <PopoverContent side="bottom" className="max-w-[220px] text-xs">
    {opt.description}
  </PopoverContent>
</Popover>
```

**D-06 — Selected pill fill.** The pill `cn()` block (lines 64–69) already reads:
```tsx
selected.includes(opt.value)
  ? "bg-primary text-primary-foreground border-primary"
  : "bg-background text-foreground border-border hover:bg-muted"
```
This is correct — once `--primary` is overridden in `index.css` (D-03), the warm green fill applies automatically. No change needed to this class string.

**D-13 — Focus ring on pill buttons.** The outer `<button>` className (lines 64–69) currently has no `focus-visible:` classes. Add to the static class string:
```tsx
className={cn(
  "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-normal border cursor-pointer transition-colors",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  selected.includes(opt.value)
    ? "bg-primary text-primary-foreground border-primary"
    : "bg-background text-foreground border-border hover:bg-muted"
)}
```

---

### `frontend/src/components/ServingStepper.tsx` (component, event-driven)

**Analog:** Self — add `focus-visible:` ring classes to both buttons.

**D-13 — Focus ring on +/- buttons** (lines 21–49):

Current decrement button `className` (lines 26–31):
```tsx
className={cn(
  "min-w-9 h-9 flex items-center justify-center",
  "border border-border bg-background hover:bg-muted",
  "rounded-l-md transition-colors",
  "disabled:opacity-40 disabled:cursor-not-allowed"
)}
```
Target — add focus-visible line:
```tsx
className={cn(
  "min-w-9 h-9 flex items-center justify-center",
  "border border-border bg-background hover:bg-muted",
  "rounded-l-md transition-colors",
  "disabled:opacity-40 disabled:cursor-not-allowed",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
)}
```

Current increment button `className` (lines 45–49):
```tsx
className={cn(
  "min-w-9 h-9 flex items-center justify-center",
  "border border-border bg-background hover:bg-muted",
  "rounded-r-md transition-colors"
)}
```
Target:
```tsx
className={cn(
  "min-w-9 h-9 flex items-center justify-center",
  "border border-border bg-background hover:bg-muted",
  "rounded-r-md transition-colors",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
)}
```

**No other changes to ServingStepper.tsx.**

---

### `frontend/src/components/SubstitutionPopover.tsx` (component, event-driven)

**Analog:** Self — this file IS the Popover reference pattern.

**D-07 — Verify already uses PopoverContent.** File confirmed correct at lines 1–31: uses `Popover`, `PopoverTrigger asChild`, `PopoverContent` with `bg-popover` (opaque solid via shadcn CSS variable). No changes required. The file serves as the template that DietPillGroup should copy.

Reference pattern (complete file, lines 1–31 of `frontend/src/components/SubstitutionPopover.tsx`):
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"

export function SubstitutionPopover({ substitutionNote, originalIngredient }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={...}
          className="text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center ml-1 align-middle"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[280px] text-sm">
        {/* content */}
      </PopoverContent>
    </Popover>
  )
}
```

---

### `frontend/src/components/ComparisonLayout.tsx` (component, transform)

**Analog:** Self — one-line verify only; current implementation is spec-correct.

**Current implementation** (lines 8–13 of `frontend/src/components/ComparisonLayout.tsx`):
```tsx
export function ComparisonLayout({ children, className }: Props) {
  return (
    <div className={cn("max-w-5xl mx-auto flex flex-col md:flex-row gap-6", className)}>
      {children}
    </div>
  )
}
```

Per UI-SPEC section "Comparison layout" and CONTEXT.md D-08: the `ComparisonLayout` container itself is correct. Child columns in `App.tsx` carry `flex-1 min-w-0` (lines 176, 213) and `Card` internal `p-6` provides mobile breathing room. No change required to this file.

---

### `frontend/src/assets/dietcode-logo.svg` (asset, n/a)

**Analog:** None — no SVG assets exist in the codebase.

**Design contract from D-04/D-05:**
- Three elements: kale leaf (green/textured) + colorful fruit (apple or orange, warm) + small robot face (silver/warm gray, friendly)
- Playful, cartoon-ish — not corporate
- Works at 32–40px (header size)
- Uses warm palette colors (emerald greens + amber/orange)
- Saved as `frontend/src/assets/dietcode-logo.svg`
- Imported in App.tsx as: `import dietcodeLogo from "@/assets/dietcode-logo.svg"`
- Used as `<img src={dietcodeLogo} alt="" aria-hidden="true" className="h-9 w-9" />` inside the header band

**SVG authoring conventions for this project:**
- Viewbox: `viewBox="0 0 40 40"` (40×40 design units)
- No external references — fully self-contained SVG
- Colors: use literal hex values matching the warm palette (e.g., `#2d7a4f` for emerald-700, `#f59e0b` for amber-400)
- No JS/animation — static SVG only

---

## Shared Patterns

### cn() conditional class merging
**Source:** `frontend/src/lib/utils.ts` (lines 1–6)
**Apply to:** All component files that conditionally apply classes
```tsx
import { cn } from "@/lib/utils"
// Usage: className={cn("base-classes", condition && "conditional-class", ...)}
```

### focus-visible ring (keyboard navigation)
**Source:** Established by D-13 — apply uniformly across all interactive buttons
**Apply to:** DietPillGroup pill buttons, ServingStepper +/- buttons, App.tsx textarea
```tsx
"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
```
This matches the shadcn/ui New York style ring convention. The `focus-visible:` pseudo-class (not `focus:`) ensures rings appear only on keyboard navigation, not mouse click.

### Popover pattern (click-to-open info)
**Source:** `frontend/src/components/SubstitutionPopover.tsx` (complete file, lines 1–31)
**Apply to:** DietPillGroup info icons (D-07)
Key: always use `PopoverTrigger asChild` with a `<button type="button">` child; `PopoverContent` from `@/components/ui/popover` renders in a Portal with `bg-popover` (opaque), no tooltip transparency issues.

### CSS variable override
**Source:** `frontend/src/index.css` — pattern established by D-03
**Apply to:** `index.css` only; all shadcn components inherit automatically
```css
:root {
  --primary: oklch(...);
  --primary-foreground: oklch(...);
}
```
Place after `@import "tailwindcss"`, before `@media print`. No component-level color changes needed — this single block propagates to every `bg-primary`, `text-primary`, `border-primary` usage.

### Path aliases
**Source:** `frontend/components.json` aliases block
**Apply to:** All new imports
```
@/components  → frontend/src/components/
@/lib         → frontend/src/lib/
@/assets      → frontend/src/assets/   (for SVG import)
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `frontend/src/assets/dietcode-logo.svg` | asset | n/a | No SVG assets exist in the project; no existing illustration to derive from |

---

## Metadata

**Analog search scope:** `frontend/src/`, `frontend/src/components/`, `frontend/src/components/ui/`
**Files read:** App.tsx, index.css, RecipeCard.tsx, DietPillGroup.tsx, ServingStepper.tsx, SubstitutionPopover.tsx, ComparisonLayout.tsx, components.json, lib/utils.ts, components/ui/popover.tsx
**Pattern extraction date:** 2026-06-14
