# Phase 5: UI Polish - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Elevate the DietCode UI from functional-but-plain to warm, polished, and branded. This phase covers:
- A visual identity with a custom logo and a warm, food-friendly color palette
- Fixing broken interactive states (diet pills, info tooltips)
- Accessibility and typography mechanical fixes from the UI-SPEC
- A manual browser verification plan at the end

New capabilities (recipe history, sharing, nutrition, streaming) belong in v2 — not this phase.

</domain>

<decisions>
## Implementation Decisions

### Color Palette Pivot (supersedes UI-SPEC zinc/neutral direction)

- **D-01:** Shift from the current zinc/neutral monotone to a **warm, food-friendly palette**. The palette should feel earthy and appetizing — warm greens as the primary accent color, with soft amber or orange as a secondary highlight. NOT a full page background change; the page body and cards stay light/white.

- **D-02:** Add a **colored header band** behind the DietCode logo and title. The header band uses the warm accent color (Claude picks the specific hue — warm green or amber gradient). This is the single biggest visual change: the page feels alive immediately on load instead of being all-white.

- **D-03:** The warm accent color replaces zinc-900 (`bg-primary`) as the selected/active color for all interactive states. The existing shadcn CSS variables (`--primary`, `--primary-foreground`) should be overridden in `frontend/src/index.css` to warm values, so all shadcn components pick up the new color automatically. Raw hex/hsl values are Claude's discretion — choose a warm green in the emerald/forest range that reads well on white.

### Branding Logo

- **D-04:** Design a **custom SVG icon** combining three elements: a kale leaf, a colorful fruit (apple, orange, or similar), and a small robot character. The icon should be playful, use the warm palette colors, and work at 32–40px header size. Place it inline in the `<header>` / `<h1>` area, immediately left of the "DietCode" wordmark. The wordmark should be styled in the warm accent color.

- **D-05:** The SVG is created as a new file `frontend/src/assets/dietcode-logo.svg` and imported into the header component. Inline SVG or `<img src>` both acceptable — Claude's discretion based on what's easier to colorize.

### Diet Pill Selected State (supersedes UI-SPEC pill styling)

- **D-06:** Selected diet pills must use a **strong filled warm accent background** (warm green fill, white text) — unambiguously ON. The current zinc-900 primary doesn't read as "selected" clearly. The visual contract:
  - Selected: `bg-[warm-accent] text-white border-[warm-accent]` (solid fill, no ambiguity)
  - Unselected: `bg-background text-foreground border-border hover:bg-muted` (unchanged from current)
  - The pill toggle must pass the "glance test" — someone who hasn't used the app before can tell at a glance which diet they've activated.

### Tooltip → Popover Switch

- **D-07:** Replace all hover-based info icon tooltips with **click-to-open Popovers** (shadcn `Popover` component, already installed). This fixes two problems: transparent/clashing tooltip backgrounds and mobile non-functionality (hover doesn't work on touch). Applies to:
  1. **DietPillGroup info icons** — each diet label has an `Info` icon that opens a tooltip explaining the diet. Switch to Popover.
  2. **SubstitutionPopover** — already named "Popover" but may still use Tooltip internally. Ensure it uses `PopoverContent` with a solid opaque background.
  - Popover content: same text as current tooltip content. No copy changes.
  - Dismiss: clicking outside closes. No close button needed.

### UI-SPEC Mechanical Fixes (7 items — still apply)

- **D-08:** Responsive page padding: `<main className="px-4 py-8">` → `<main className="px-4 sm:px-6 lg:px-8 py-8">`

- **D-09:** Typography consistency: `RecipeCard.tsx` both `h3` tags (`"Ingredients"`, `"Instructions"`) change from `font-semibold` to `font-bold`

- **D-10:** Instruction list readability: `RecipeCard.tsx` instruction `ol` list items — add `leading-relaxed` class

- **D-11:** Error accessibility: `App.tsx` error `<p>` — add `role="alert"` for screen reader announcement on transform errors

- **D-12:** Empty state copy: `App.tsx` — `"Original recipe unavailable."` → `"Original recipe unavailable — paste it above to see the comparison."`

- **D-13:** Focus ring consistency: add `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring` to:
  - `DietPillGroup.tsx` pill buttons (currently no explicit focus ring)
  - `ServingStepper.tsx` +/- buttons (currently no explicit focus ring)
  - `App.tsx` textarea: change `focus:outline-none focus:ring-1 focus:ring-ring` → `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`

### Verification

- **D-14:** Phase 5 ends with a **manual browser verification plan** (same pattern as Phase 4's `04-04-PLAN.md`). The plan is a human-checkable list: visual changes confirmed in browser, selected/unselected pill states verified, popover behavior confirmed, logo renders at correct size, header band visible, responsive padding confirmed at mobile/tablet/desktop.

### Claude's Discretion

- Exact hue/shade of the warm accent color (emerald-600 range recommended; Claude picks)
- Exact amber/orange secondary highlight value
- SVG logo design specifics (proportions, character details, fruit choice)
- Header band height and whether it uses a solid color or a subtle gradient
- Whether the `<header>` becomes a separate component or stays inline in `App.tsx`
- Exact `--primary` and `--primary-foreground` CSS variable values
- Exact Popover trigger (`button` vs `span`) and positioning for diet info icons

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Locked Architecture
- `CLAUDE.md` — Critical design decisions: no WebFlux, shadcn/ui New York style, React useState only, service responsibility table. Read before touching any file.
- `.planning/phases/01-foundation/01-CONTEXT.md` — Locked data model schemas (`IngredientLine`, `TransformedRecipe`). LLM output schema is NOT changed in Phase 5.

### Phase 5 Design Contract (partially superseded)
- `.planning/phases/05-ui-polish/05-UI-SPEC.md` — Full design contract. **Note:** The color/zinc direction in the UI-SPEC is superseded by D-01 through D-03 above. The 7 mechanical fixes (spacing, typography, accessibility) still apply as written in the spec.

### Files to Read Before Modifying
- `frontend/src/App.tsx` — Main layout, form, result rendering. Header lives here. Error paragraph lives here. Changes for D-02 (header band), D-08, D-11, D-12.
- `frontend/src/index.css` — CSS variable definitions and Tailwind v4 import. CSS variable overrides for D-03 go here.
- `frontend/src/components/RecipeCard.tsx` — Typography and ingredient display. Changes for D-09, D-10.
- `frontend/src/components/DietPillGroup.tsx` — Diet pill buttons and info tooltips. Changes for D-06, D-07, D-13.
- `frontend/src/components/ServingStepper.tsx` — +/- buttons. Changes for D-13 (focus ring).
- `frontend/src/components/SubstitutionPopover.tsx` — Substitution info icon. Changes for D-07.
- `frontend/src/components/ComparisonLayout.tsx` — Comparison layout container. Minor mobile spacing review.

### Design System
- `frontend/components.json` — shadcn/ui config (style: new-york, base: zinc currently). Read before any component changes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shadcn/ui Popover` — already installed (`frontend/src/components/ui/popover.tsx`). Ready to use for D-07 tooltip replacements.
- `shadcn/ui Tooltip` — installed; currently used in DietPillGroup. Will be replaced with Popover per D-07.
- `cn()` utility in `frontend/src/lib/utils.ts` — conditional class merging, use for all conditional class changes.
- `lucide-react` — already installed; `Info`, `Loader2`, `Minus`, `Plus` icons in use. May need additional icons for logo area if not using SVG.

### Established Patterns
- **CSS variable theming** — shadcn/ui uses CSS variables in `index.css` (`:root` block). Override `--primary` and `--primary-foreground` here; all components pick up the change automatically.
- **Tailwind v4** — `@import "tailwindcss"` with no config file. Use utility classes directly; no `tailwind.config.js` to update.
- **State in App.tsx** — `useState` only, no context or state library. The header area is currently inline in `App.tsx` return.
- **No WebFlux** — frontend talks to Spring Boot backend via fetch; no streaming in this phase.

### What's Actually Wrong in the Code (from audit)
- `App.tsx:89` — `className="px-4 py-8"` → needs responsive breakpoints (D-08)
- `App.tsx:100` — textarea uses `focus:` not `focus-visible:` (D-13)
- `App.tsx:149-151` — error `<p>` missing `role="alert"` (D-11)
- `App.tsx:204` — "Original recipe unavailable." truncated (D-12)
- `RecipeCard.tsx:140` — `<h3 className="font-semibold mb-2">Ingredients</h3>` (D-09)
- `RecipeCard.tsx:167` — `<h3 className="font-semibold mb-2">Instructions</h3>` (D-09)
- `RecipeCard.tsx:168-171` — instruction `ol` items lack `leading-relaxed` (D-10)
- `DietPillGroup.tsx:62-69` — pill buttons have no `focus-visible:` ring classes (D-13)
- `DietPillGroup.tsx:83` — `TooltipContent` used for diet info; replace with `PopoverContent` (D-07)
- `ServingStepper.tsx:21-49` — +/- buttons have no `focus-visible:` ring classes (D-13)

### Integration Points
- Color changes: `index.css` → `:root { --primary: ...; --primary-foreground: ...; }` affects ALL shadcn buttons, borders, focus rings, active states automatically.
- Header band: wrap the `<h1>` and logo in a colored `<header>` element or add a colored `<div>` around the title area in `App.tsx`.
- Logo SVG: `frontend/src/assets/dietcode-logo.svg` → import in App.tsx or new Header component.

</code_context>

<specifics>
## Specific Ideas

- **Logo concept**: kale leaf (green, textured) + colorful fruit (orange or apple — warm, inviting) + small robot face/head (silver or warm gray, friendly). Should feel like a playful illustration, not a corporate icon. Cartoon-ish is fine.
- **Header band**: a solid warm green or a very subtle green→amber gradient works well. Keep it under 80px tall — this is an accent, not a hero section.
- **Wordmark**: "DietCode" in the warm accent color, `text-2xl font-bold` or larger. The logo SVG sits immediately left.
- **Diet pill visual contract**: after color change, the selected pill should look like a filled badge (like a tag that's been highlighted), not just a slightly darker button. The "I clicked this" affordance must be obvious at a glance.
- **Popover for diet info icons**: the Info icon (3×3px) next to each diet pill label should trigger a popover, not a tooltip. Click to open, click outside to close. The popover should show the diet description in a solid white card.

</specifics>

<deferred>
## Deferred Ideas

- Full brand identity system (logo guidelines, brand colors doc, favicon) — logo SVG covers the immediate need
- Dark mode — not in scope for v1
- Animation/transitions (pill selection animation, form collapse animation) — v2
- Mobile app / PWA — out of scope per REQUIREMENTS.md

</deferred>

---

*Phase: 05-ui-polish*
*Context gathered: 2026-06-14*
