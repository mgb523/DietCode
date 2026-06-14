# Phase 3: Scale and Import - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 03-scale-and-import
**Areas discussed:** Scaler placement & trigger, Scaler control style, URL input visual feedback, Scraping failure UX

---

## Scaler Placement & Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| In the result card, live update | Scaler appears only after transformation, inline in result card; live rescale on change | |
| In the result card, button-triggered | Same placement, but requires a "Scale" button click | |
| Upfront in the form | Target servings set before submitting the form | ✓ |

**User's choice:** Upfront in the form

---

| Option | Description | Selected |
|--------|-------------|----------|
| One-shot (set upfront, done) | To rescale, re-expand form and resubmit | |
| Also re-scalable in result card | Initial target in form + stepper in result card for post-transform rescaling | ✓ |

**User's choice:** Also re-scalable in result card — both the form field and the result card stepper are present.

---

## Scaler Control Style

| Option | Description | Selected |
|--------|-------------|----------|
| Number input + stepper buttons | +/− buttons flanking a number input; min 1 | ✓ |
| Plain number input | Just a numeric field, no buttons | |
| You decide | Claude picks based on existing patterns | |

**User's choice:** Number input with +/− stepper buttons

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, show original for reference | Show LLM-inferred serving count next to stepper | ✓ |
| No, just the target number | Only current target visible | |

**User's choice:** Show original count alongside target (e.g., "Servings: [8] (original: 4)")

---

## URL Input Visual Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Small badge/icon at top of field | Link icon or "URL detected" chip on textarea when URL detected | ✓ |
| Label changes below the field | Text below textarea updates to "Importing from URL…" | |
| No feedback — silent detection | Detection only at submit time | |

**User's choice:** Small badge/icon at top of textarea

---

| Option | Description | Selected |
|--------|-------------|----------|
| Starts with http:// or https:// | Simple prefix check on input change | ✓ |
| Valid URL parse (URL constructor) | Attempt URL object construction | |

**User's choice:** Prefix check — starts with `http://` or `https://`

---

## Scraping Failure UX

| Option | Description | Selected |
|--------|-------------|----------|
| One generic message | "Couldn't import from this URL — please paste the recipe text instead." | ✓ |
| Distinct messages per failure type | Different text for network error / no JSON-LD / bot-blocked | |

**User's choice:** One generic message for all failure modes

---

| Option | Description | Selected |
|--------|-------------|----------|
| URL stays in the field | Preserved for copy-paste recovery | ✓ |
| Field clears on error | Input resets | |

**User's choice:** URL stays in the field

---

## Claude's Discretion

- Sub-linear scaling coefficients (logarithmic or square-root curve)
- Whether post-result rescaling uses a backend call or pure frontend math
- Exact badge/icon style for URL detection
- Placeholder/label wording for servings field
- Whether form servings field disables when result card scaler is active

## Deferred Ideas

None — discussion stayed within Phase 3 scope.
