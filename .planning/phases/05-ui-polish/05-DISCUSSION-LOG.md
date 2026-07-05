# Phase 5: UI Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-14
**Phase:** 05-ui-polish
**Areas discussed:** Additional rough edges, Color direction, Logo format, Diet pill selected state, Tooltip/popover fix, Color amount, Verification approach

---

## Additional Rough Edges (freeform)

User flagged that the UI "needs a ton of work" beyond the 7 UI-SPEC items. Three specific issues:

1. Overall look is "very plain with basic black and white font and very bare-bones buttons" — wants fun, colorful design
2. Info button popups (tooltips) have non-opaque backgrounds that visually clash with content underneath
3. Diet preference selector buttons don't differentiate selected vs. deselected states clearly

**User's choice:** All three issues confirmed as in-scope for Phase 5.

---

## Color Direction

| Option | Description | Selected |
|--------|-------------|----------|
| Warm & food-friendly | Earthy tones, warm greens, soft oranges — feels like a kitchen | ✓ |
| Fresh & clean | Bright accent (teal, sage, lime) on white | |
| Playful & bold | Pops of strong color (coral, indigo, emerald) | |
| You pick the palette | Trust Claude to choose | |

**User's choice:** Warm & food-friendly
**Notes:** Earthy tones, warm greens, soft oranges — reminiscent of kitchen/food apps like Yummly or Whisk

---

## Logo

| Option | Description | Selected |
|--------|-------------|----------|
| Text-only wordmark | "DietCode" styled with accent color | |
| Simple icon + text | Small SVG icon + wordmark | ✓ |
| Skip logo for now | Focus on color/UX first | |
| I'll provide the asset | User has a logo file | |

**User's choice:** Simple icon + text

---

## Logo Icon Style

| Option | Description | Selected |
|--------|-------------|----------|
| Leaf / plant | Green leaf or sprout | |
| Fork / utensil | Fork or fork+knife | |
| Plate / bowl | Simple plate or bowl shape | |
| Let you decide | Claude picks best visual | |

**User's choice:** "kale leaf, a colorful fruit and a robot"
**Notes:** A combination of all three elements — kale (diet/health), fruit (food/color), robot (code/tech). Very "DietCode."

---

## Logo Format

| Option | Description | Selected |
|--------|-------------|----------|
| Emoji trio in header | 🥬🍊🤖 next to wordmark | |
| SVG icon Claude designs | Custom SVG, polished and scalable | ✓ |
| Emoji + styled text | Emoji mark + colored wordmark | |

**User's choice:** SVG icon Claude designs
**Notes:** More polished and scalable than emoji, works at all sizes

---

## Diet Pill Selected State

| Option | Description | Selected |
|--------|-------------|----------|
| Strong filled accent | Solid warm accent background — unmistakably ON | ✓ |
| Checkmark + accent border | Checkmark icon + colored border, lighter | |
| Let you decide | Trust Claude's judgment | |

**User's choice:** Strong filled accent
**Notes:** Must pass "glance test" — clearly ON vs OFF at a glance

---

## Tooltip/Popover Fix

| Option | Description | Selected |
|--------|-------------|----------|
| Switch to click popover | Replace hover tooltip with click Popover (solid background, mobile-friendly) | ✓ |
| Fix tooltip background | Keep hover behavior, override CSS for opaque background | |

**User's choice:** Switch to click popover
**Notes:** Applies to DietPillGroup info icons AND SubstitutionPopover

---

## Color Amount

| Option | Description | Selected |
|--------|-------------|----------|
| Accent touches only | Color on key elements; most UI stays clean/white | |
| Warm background too | Page background shifts to warm off-white/cream | |
| Header band + accents | Colored header band, rest of page stays light | ✓ |

**User's choice:** Header band + accents
**Notes:** Colored header band (warm green or amber) makes the page feel alive immediately; rest stays clean

---

## Verification Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — browser check plan | Final plan is a manual browser checklist (like Phase 4's 04-04) | ✓ |
| No — inline verification | Each plan has its own acceptance criteria, no separate check | |

**User's choice:** Yes — browser check plan
**Notes:** Visual changes need human eyes in browser before phase is marked complete

---

## Claude's Discretion

- Exact hue/shade of warm accent color
- SVG logo design specifics (proportions, character details, fruit choice)
- Header band height and solid vs. gradient treatment
- Whether header becomes a separate component or stays in App.tsx
- Exact CSS variable values for --primary and --primary-foreground

## Deferred Ideas

- Full brand identity system / logo guidelines
- Dark mode
- Animation/transitions (pill selection animation, form collapse)
- Mobile app / PWA
