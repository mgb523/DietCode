# Phase 4: Output and Polish - Research

**Researched:** 2026-05-24
**Domain:** React frontend output surface — before/after comparison layout, substitution popovers, browser print CSS, Google Drive OAuth2 + REST API upload
**Confidence:** HIGH

---

## Summary

Phase 4 completes the output surface with four capabilities: (1) before/after comparison view, (2) per-substitution rationale popovers, (3) browser print-to-PDF, and (4) Google Drive PDF export via OAuth2. All user decisions are locked in 04-CONTEXT.md; no design alternatives need to be explored.

The backend work is minimal: add two nullable fields (`originalIngredients`, `originalInstructions`) to `TransformedRecipe`, populate them in `RecipeController` from the `RecipeDocument` already in hand, and update the LLM system prompt in `TransformationService` to request `substitutionNote` for each substituted ingredient. The `IngredientLine.substitutionNote` field already exists in both the Kotlin model and the frontend TypeScript interface — the LLM just needs to be instructed to populate it.

The frontend work is the bulk of the phase: restructure `App.tsx` and `RecipeCard.tsx` into a comparison layout, add the `ExportToolbar` and `SubstitutionPopover` custom components, install `shadcn/popover` (one CLI command), wire `window.print()` for OUT-03, and implement the GIS token flow + Drive REST API multipart upload for OUT-04. A `VITE_GOOGLE_CLIENT_ID` environment variable must be documented as a setup requirement.

**Primary recommendation:** Split into four plans — (1) backend data model + prompt extension, (2) comparison layout restructure, (3) substitution popovers, (4) export toolbar (print + Drive). Plans 2 and 3 can be merged if plan granularity is set to coarse.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Extend `TransformedRecipe` with `originalIngredients: List<IngredientLine>?` and `originalInstructions: List<String>?`, populated by `RecipeController` from `RecipeDocument` before returning. LLM schema is NOT changed.

**D-02:** Both `originalIngredients` and `originalInstructions` are included for a complete side-by-side comparison.

**D-03:** The before/after comparison is always shown immediately after transformation — no toggle required. It replaces the current single-card result view.

**D-04:** Layout is side-by-side columns at `md:` breakpoint and wider; stacks vertically on mobile. The comparison view expands past the current `max-w-2xl` constraint. The `max-w-2xl` constraint continues to apply to the form, toolbar, and standalone card on mobile.

**D-05:** A toolbar row sits between "Edit / start over" and the comparison cards. It contains the Print and Google Drive buttons. Always visible when the result is showing.

**D-06:** Both Print and Google Drive export the adapted recipe only.

**D-07:** Lazy OAuth — OAuth popup opens on the first click. Access token stored in `sessionStorage`.

**D-08:** Drive filename: `{recipeName} ({diet tags}).pdf` or `{recipeName}.pdf` if no diets.

**D-09:** Drive export failure shows inline error below the Drive button: `"Drive export failed — use Print to save as PDF instead."` Print is always the fallback.

### Claude's Discretion

- Substitution popover UX: whether to use `tooltip.tsx` (hover) or install `shadcn/popover` (click); icon style; exactly what the popover shows
- Print CSS: `@media print` rules — what to hide, typography sizing, page margins
- Google Drive API details: MIME type, folder placement, sharing settings
- Exact column widths and breakpoint values for the side-by-side layout

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 4 scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRANS-05 | Each substituted ingredient has an annotation explaining why it was swapped, accessible via an info icon popover (not shown inline) | LLM system prompt extension + `substitutionNote` field already in model; `shadcn/popover` click-to-open; `Info` icon from lucide-react |
| OUT-02 | User can view a before/after comparison showing the original recipe alongside the adapted version | Backend adds `originalIngredients`/`originalInstructions` fields to `TransformedRecipe`; frontend restructures to two-column layout with `max-w-5xl` container |
| OUT-03 | User can print the recipe or save it as PDF via browser print dialog (`window.print()` + `@media print` CSS) | `window.print()` is zero-dependency; `print:hidden` Tailwind v4 variant works natively; `@page { margin: 1cm }` in index.css |
| OUT-04 | User can export the recipe as a PDF directly to Google Drive via OAuth2 | Google Identity Services (GIS) token client for browser OAuth popup; Drive REST API v3 multipart upload; no PDF blob generation — Drive export = HTML content serialized to a text/html file or the print CSS PDF workflow |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Before/after data model | API / Backend | — | `RecipeController` already has `RecipeDocument` in scope; copying fields at response time is a controller concern |
| LLM substitution notes | API / Backend | — | `TransformationService` owns the prompt; `substitutionNote` is LLM-generated data |
| Comparison layout | Browser / Client | — | Pure rendering concern; no server round-trip |
| Substitution popover | Browser / Client | — | Click-to-open UI component; data already in recipe payload |
| Print export | Browser / Client | — | `window.print()` is browser-native; no server involvement |
| Drive OAuth flow | Browser / Client | — | GIS token model is browser-side; access token never touches backend |
| Drive PDF upload | Browser / Client | — | Drive REST API called directly from browser with Bearer token |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `shadcn/ui` popover | via `npx shadcn@latest add popover` | Click-to-open substitution note display | Already installed design system; Radix-based focus trap + Escape-to-close built in |
| `@radix-ui/react-popover` | 1.1.15 (already in node_modules) | Underlying primitive for shadcn popover | Already installed as transitive dep of `radix-ui` umbrella package |
| `lucide-react` | 1.8.0 (installed) | `Info`, `Printer`, `Loader2` icons | Already used in project; no new install needed |
| `radix-ui` (umbrella) | 1.4.3 (installed) | Provides Popover namespace (`Popover.*`) | Same import pattern as existing `tooltip.tsx` |

[VERIFIED: npm view @radix-ui/react-popover version → 1.1.15; npm list radix-ui → 1.4.3; cat node_modules/radix-ui/dist/index.mjs confirms `export * as Popover from "@radix-ui/react-popover"`]

### Supporting (no new installs)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fraction.js` | 5.3.4 (installed) | Client-side quantity scaling in comparison view | Already used in `RecipeCard.tsx`; reuse in adapted column |
| `window.print()` | Browser built-in | Trigger browser print dialog for PDF save | OUT-03; zero dependencies |
| Google Identity Services (GIS) | Loaded via `<script src="https://accounts.google.com/gsi/client">` | Browser-side OAuth2 token acquisition | OUT-04; loaded dynamically at Drive export time |
| Google Drive REST API v3 | `https://www.googleapis.com/upload/drive/v3/files` | Multipart upload of PDF content | OUT-04; called via `fetch` with Bearer token |

[VERIFIED: package.json confirms fraction.js 5.3.4, lucide-react 1.8.0 installed; window.print() is Web API standard]

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `shadcn/popover` (click) | `shadcn/tooltip` (hover, already installed) | UI-SPEC locked click-to-open (ROADMAP success criterion 2); tooltip is hover-only — not suitable for mobile |
| `window.print()` | `html2canvas` + `jsPDF` | window.print() is zero-dependency and produces a real PDF via browser engine; html2canvas renders to image (not searchable text, large file, adds ~300KB deps) |
| GIS token flow (browser) | Backend OAuth proxy | Browser-side GIS avoids storing refresh tokens on any server; single-user app; no backend changes needed |
| Drive multipart upload | GAPI `gapi.client.drive` library | GAPI adds ~100KB; raw `fetch` with `FormData` achieves the same; CLAUDE.md prefers minimal dependencies |

**Installation:**
```bash
cd frontend && npx shadcn@latest add popover
```
This is the only new install needed for the entire phase. [VERIFIED: `@radix-ui/react-popover` already in node_modules as transitive dep]

**Version verification:**
```bash
npm view @radix-ui/react-popover version   # 1.1.15
npm view lucide-react version              # 1.16.0 (registry); project has 1.8.0
```

---

## Architecture Patterns

### System Architecture Diagram

```
User action: click "Transform Recipe"
        │
        ▼
[App.tsx: POST /api/recipe/transform]
        │
        ▼ (backend)
RecipeIngestionService.ingest(input)
        │ → RecipeDocument { name, rawIngredients, instructions, servings }
        ▼
TransformationService.transform(recipeDoc, dietProfiles, intolerances)
        │  LLM system prompt now includes: "populate substitutionNote for each
        │  substituted ingredient with reason for swap"
        │ → TransformedRecipe { recipeName, ingredients[{quantity,unit,ingredient,
        │     preparation,substitutionNote}], instructions, servings, warnings }
        ▼
RecipeController: copy recipeDoc.rawIngredients → originalIngredients
                  copy recipeDoc.instructions   → originalInstructions (split on \n)
        │
        ▼ (frontend response)
App.tsx: setRecipe(data), setFormCollapsed(true)
        │
        ├──► ExportToolbar
        │       ├── Print button → window.print()
        │       └── Drive button → GIS.requestAccessToken() → Drive REST upload
        │
        └──► ComparisonLayout (max-w-5xl)
                ├── "Original" column (left)
                │       RecipeCard (read-only, no stepper)
                │       Shows originalIngredients + originalInstructions
                │       Falls back to empty-state copy if null
                │
                └── "Adapted" column (right)
                        RecipeCard (with ServingStepper, substitution popovers)
                        Each ing.substitutionNote != null → Info icon
                        Click Info icon → SubstitutionPopover
                                "Substituted for: {original ingredient name}"
                                "{substitutionNote}"
```

### Recommended Project Structure

```
frontend/src/
├── components/
│   ├── ComparisonLayout.tsx     # Two-column wrapper; max-w-5xl; flex-col md:flex-row
│   ├── ExportToolbar.tsx        # Print + Drive buttons; Drive OAuth state machine
│   ├── SubstitutionPopover.tsx  # Info icon trigger + Popover content
│   ├── RecipeCard.tsx           # Extended: accepts originalIngredients prop for original column
│   └── ui/
│       ├── card.tsx             # existing
│       ├── tooltip.tsx          # existing
│       └── popover.tsx          # NEW — added by npx shadcn@latest add popover
├── App.tsx                      # Updated: TransformedRecipe interface + comparison layout
└── index.css                    # Updated: @media print rules + @page margin
```

### Pattern 1: Shadcn Popover (Click-to-Open)

**What:** Radix `Popover.Root` wrapping an `Info` icon trigger and content with substitution rationale.

**When to use:** When hover (`Tooltip`) is insufficient — mobile users cannot hover; ROADMAP requires click.

**Example:**
```tsx
// Source: https://ui.shadcn.com/docs/components/popover (shadcn/ui official)
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"

// SubstitutionPopover.tsx
interface Props {
  substitutionNote: string
  originalIngredient?: string
}

export function SubstitutionPopover({ substitutionNote, originalIngredient }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Why this ingredient was substituted`}
          className="text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center ml-1"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[280px] text-sm">
        {originalIngredient && (
          <p className="font-medium mb-1">Substituted for: {originalIngredient}</p>
        )}
        <p>{substitutionNote}</p>
      </PopoverContent>
    </Popover>
  )
}
```

### Pattern 2: GIS Token Flow + Drive Multipart Upload

**What:** Google Identity Services implicit/token model to get a short-lived Bearer token, then POST a multipart/related body to Drive REST API.

**When to use:** Browser-side OAuth2 for personal-use app; no backend OAuth proxy needed.

**Example:**
```typescript
// Source: https://developers.google.com/identity/oauth2/web/guides/use-token-model
// Source: https://developers.google.com/workspace/drive/api/guides/manage-uploads

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"

// Load GIS script dynamically (called once on Drive button first click)
function loadGis(): Promise<void> {
  return new Promise(resolve => {
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

// Get token — opens OAuth popup on first call, silent on repeat if token cached
async function getAccessToken(clientId: string): Promise<string> {
  const cached = sessionStorage.getItem("drive_access_token")
  if (cached) return cached

  await loadGis()

  return new Promise((resolve, reject) => {
    // @ts-ignore (google global injected by GIS script)
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.access_token) {
          sessionStorage.setItem("drive_access_token", response.access_token)
          resolve(response.access_token)
        } else {
          reject(new Error(response.error ?? "OAuth failed"))
        }
      },
    })
    client.requestAccessToken()
  })
}

// Upload HTML content as PDF to Drive
// Note: Drive does NOT convert HTML to PDF server-side for application/pdf MIME type.
// The correct approach for Drive export of a recipe is to upload the serialized
// adapted recipe HTML as text/html (Drive can render it) OR use the browser's
// print-to-PDF capability manually. See Pitfall 3 below for details.
async function uploadToDrive(
  fileName: string,
  content: string,
  mimeType: string,
  accessToken: string
): Promise<void> {
  const metadata = { name: fileName }
  const body = new FormData()
  body.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
  body.append("file", new Blob([content], { type: mimeType }), fileName)

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body,
    }
  )
  if (!res.ok) throw new Error(`Drive upload failed: ${res.status}`)
}
```

### Pattern 3: TransformedRecipe Extension (Backend)

**What:** Add two nullable fields to the Kotlin data class; populate in `RecipeController`.

**Example:**
```kotlin
// TransformedRecipe.kt
data class TransformedRecipe(
    val recipeName: String,
    val ingredients: List<IngredientLine>,
    val instructions: List<String>,
    val servings: Int,
    val originalServings: Int = 0,
    val warnings: List<String>,
    // Phase 4 additions
    val originalIngredients: List<IngredientLine>? = null,
    val originalInstructions: List<String>? = null,
)

// RecipeController.kt — copy recipeDoc fields into response
val llmServings = transformed.servings
val withOriginals = transformed.copy(
    originalIngredients = recipeDoc.rawIngredients.map { raw ->
        // Parse raw ingredient string into IngredientLine shape for display
        IngredientLine(quantity = "", unit = "", ingredient = raw, preparation = null, substitutionNote = null)
    },
    originalInstructions = recipeDoc.instructions.lines().filter { it.isNotBlank() }
)
return request.targetServings
    ?.takeIf { it > 0 && it != withOriginals.servings }
    ?.let { scalingService.scale(withOriginals.copy(originalServings = llmServings), it) }
    ?: withOriginals.copy(originalServings = llmServings)
```

### Pattern 4: Print CSS

**What:** `@media print` rules in `index.css` + Tailwind `print:hidden` utility class on elements to hide.

**Example:**
```css
/* index.css — alongside existing @import "tailwindcss" */
@media print {
  body {
    font-size: 12pt;
    line-height: 1.5;
  }
  h1, h2, h3 {
    font-size: 14pt;
    font-weight: 700;
  }
  .recipe-display-name {
    font-size: 18pt;
    font-weight: 700;
  }
}

@page {
  margin: 1cm;
}
```
```tsx
// Elements hidden in print via Tailwind v4 print:hidden (no config needed)
<form className="print:hidden"> ... </form>
<button className="print:hidden">Edit / start over</button>
<ExportToolbar className="print:hidden" />

// Original column hidden in print
<section aria-label="Original recipe" className="print:hidden"> ... </section>

// "Adapted" column label hidden in print
<p className="print:hidden">Adapted</p>

// ServingStepper hidden in print; static serving count shown instead
<ServingStepper className="print:hidden" ... />
<span className="hidden print:block">{currentServings} servings</span>
```
[VERIFIED: Tailwind v4 `print:hidden` generates `@media print { display: none }` natively, no config required — confirmed via official Tailwind docs]

### Anti-Patterns to Avoid

- **Using `Tooltip` for substitution notes:** Tooltip is hover-only — fails on mobile and violates ROADMAP success criterion 2 ("clicking it opens a popover"). Use `Popover`.
- **Calling the LLM for Drive export:** Drive export is a pure client-side serialization task. No new LLM call.
- **Storing the OAuth refresh token:** GIS implicit/token model does not provide refresh tokens. Store only the short-lived access token in `sessionStorage`. Do not try to persist across sessions.
- **Loading GIS script in `<head>` unconditionally:** Lazy-load only when Drive button is first clicked (D-07). Avoid loading Google scripts on every page view.
- **Using `gapi.client` Drive library:** Adds ~100KB bundle weight. Raw `fetch` with `FormData` achieves the same multipart upload with zero additional dependencies.
- **Passing raw ingredient strings as `IngredientLine` with parsed fields:** The original recipe ingredients come from `RecipeDocument.rawIngredients` which are plain strings (not structured). Map them to `IngredientLine(quantity="", unit="", ingredient=rawString, ...)` for display. The original column is display-only; no scaling is applied.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Click-to-open popover with focus trap + Escape | Custom modal/popover | `shadcn/popover` (Radix primitive) | Focus management, portal rendering, Escape-to-close, click-outside dismiss — all built in |
| Print CSS media query | Custom CSS media query in component | Tailwind `print:hidden` + `@media print` in index.css | `print:hidden` is native to Tailwind v4; avoids inline style conflicts |
| OAuth2 PKCE flow | Custom auth redirect handler | GIS `initTokenClient` | GIS handles popup, consent, token lifecycle; avoids CORS issues with token endpoint |
| PDF generation from HTML | html2canvas + jsPDF | `window.print()` (for OUT-03) | Browser PDF engine produces searchable text, proper fonts, correct layout — html2canvas renders to image |

**Key insight:** The browser's print engine is the most faithful HTML-to-PDF converter available in a browser context. `window.print()` leverages it at zero dependency cost. The Google Drive "export as PDF" use case is satisfied by instructing the user to use "Save as PDF" in the browser print dialog (via OUT-03), or by uploading the rendered HTML content directly to Drive (Drive renders HTML natively when opened).

---

## Critical Architecture Decision: Drive Export File Format

This is the most nuanced aspect of Phase 4 and requires explicit treatment.

**The problem:** OUT-04 says "export as PDF to Google Drive." But a browser cannot programmatically generate a true PDF blob from DOM content without a third-party library (html2canvas + jsPDF) or a headless browser. `window.print()` can save as PDF but does not produce a `Blob` the code can upload.

**The correct approach (consistent with CLAUDE.md "zero dependencies"):**

Upload the adapted recipe as an HTML file to Drive. Use `mimeType: "text/html"` and filename `{recipeName}.html` (or keep `.pdf` extension with `text/html` content — Drive will render it). When the user opens the file in Drive, Google Docs/Drive renders HTML files natively.

**Alternative approach (if the user specifically needs PDF on Drive):**
Two-step: (1) user prints to PDF via OUT-03 (browser print dialog → Save as PDF → downloads to computer), (2) user uploads the downloaded PDF to Drive manually. This is out-of-phase complexity.

**Recommended decision for planner:** Upload as `text/html` with filename `{recipeName} ({tags}).html`. The file opens in Drive and renders correctly. Document this in the UI-SPEC as "saved to Drive as an HTML file that opens in Google Docs." This satisfies OUT-04's intent without html2canvas/jsPDF.

[RESOLVED — user confirmed] Upload HTML content with `.pdf` extension (e.g. `Recipe.pdf`). Drive renders HTML files natively. No jsPDF needed. Matches D-08 exactly.

---

## Common Pitfalls

### Pitfall 1: `originalInstructions` is a single string in `RecipeDocument`

**What goes wrong:** `RecipeDocument.instructions` is a `String`, not a `List<String>`. Splitting on `\n` and filtering blanks produces the list — but for pasted text (not scraped), the full raw text is stored, which may include ingredient lines, the recipe title, and unformatted prose.

**Why it happens:** The text-path ingestion stores the full raw paste as a `String` fallback (by design — the LLM handles parsing). The URL scraping path produces structured instruction steps.

**How to avoid:** In `RecipeController`, split `recipeDoc.instructions` on `\n`, filter blanks. The original instructions column shows whatever was parsed — for pasted text this may be messy, which is expected (it's the raw original).

**Warning signs:** Empty `originalInstructions` list when the original column should show steps.

### Pitfall 2: `originalIngredients` as raw strings vs. `IngredientLine`

**What goes wrong:** `RecipeDocument.rawIngredients` is `List<String>`. `TransformedRecipe.originalIngredients` is typed as `List<IngredientLine>?`. You must map each raw string to an `IngredientLine` with empty `quantity`/`unit` and the raw string as `ingredient`.

**Why it happens:** The original recipe was never parsed by the structured extractor — only the LLM-adapted version gets the structured schema.

**How to avoid:** In `RecipeController`, map: `rawIngredients.map { IngredientLine(quantity="", unit="", ingredient=it, preparation=null, substitutionNote=null) }`. The original column renders `ing.ingredient` only (no quantity formatting).

**Warning signs:** Jackson serialization error if you try to pass `List<String>` to a `List<IngredientLine>?` field.

### Pitfall 3: GIS token expiry mid-session

**What goes wrong:** GIS access tokens expire in ~1 hour. A user who exports at the start of a session and again 90 minutes later will get a 401 from Drive API even though `sessionStorage` still has the token.

**Why it happens:** `sessionStorage` persists the token string without an expiry check. The GIS callback includes `expires_in` but it's easy to ignore.

**How to avoid:** Store `expires_at = Date.now() + (response.expires_in * 1000)` alongside the token. On Drive button click, check `Date.now() < expires_at` before using cached token; if expired, call `requestAccessToken()` again. Alternatively, always call `requestAccessToken()` and rely on GIS returning a cached token silently (GIS handles this when the user has already consented).

**Warning signs:** Drive export fails with 401 after an extended session.

### Pitfall 4: LLM `substitutionNote` population rate

**What goes wrong:** The LLM populates `substitutionNote` only for ingredients it actually substituted. For ingredients that were kept unchanged, `substitutionNote` should be `null`. If the prompt is ambiguous, the LLM may provide empty strings (`""`) instead of `null`, which would render a `SubstitutionPopover` for non-substituted ingredients.

**Why it happens:** LLMs tend to fill all fields with something when instructed without explicit "leave null" guidance.

**How to avoid:** Add explicit instruction to system prompt: `"Set substitutionNote to null (omit the field) for any ingredient that was NOT substituted. Only populate substitutionNote when the ingredient was changed from the original."` In frontend, treat both `null` and `""` as "no popover": `ing.substitutionNote && ing.substitutionNote.length > 0`.

**Warning signs:** Every ingredient shows an Info icon, including ingredients that were not changed.

### Pitfall 5: `max-w-2xl` container constraint leaking into comparison view

**What goes wrong:** The outer `<main className="max-w-2xl mx-auto">` in `App.tsx` constrains everything. The comparison layout requires `max-w-5xl` — if it's nested inside `max-w-2xl`, both columns will be squished.

**Why it happens:** The form wrapper applies `max-w-2xl` at the `<main>` level.

**How to avoid:** In `App.tsx`, restructure so the `max-w-2xl` applies only to the form section. The comparison view (`ComparisonLayout`) renders at `max-w-5xl mx-auto` outside the `max-w-2xl` constraint — either by widening `<main>` or by making `<main>` max-w-none and applying `max-w-2xl` to the form directly.

**Warning signs:** Side-by-side columns look identical in width to the old single-card view.

### Pitfall 6: Print CSS breaks comparison view

**What goes wrong:** If the original column is hidden via `print:hidden`, the Flexbox gap between columns may still create blank space on the printed page.

**Why it happens:** `print:hidden` sets `display: none` but adjacent flex siblings may retain margin/gap.

**How to avoid:** The `ComparisonLayout` flex container should use `gap-6` between columns. When the original column is `display: none`, the single remaining column automatically fills the container width. Test in Chrome, Firefox, and Safari print preview before marking OUT-03 complete (noted as a concern in STATE.md).

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### Backend: TransformedRecipe with new fields
```kotlin
// Source: Codebase inspection — TransformedRecipe.kt current shape
// Phase 4 adds two nullable fields with null defaults (backward compatible)
data class TransformedRecipe(
    val recipeName: String,
    val ingredients: List<IngredientLine>,
    val instructions: List<String>,
    val servings: Int,
    val originalServings: Int = 0,
    val warnings: List<String>,
    val originalIngredients: List<IngredientLine>? = null,  // NEW
    val originalInstructions: List<String>? = null,          // NEW
)
```

### Backend: LLM prompt extension for substitutionNote
```kotlin
// Source: Codebase inspection — TransformationService.kt system prompt
// Add to existing SCHEMA RULES section:
"""
- substitutionNote: if this ingredient was substituted or significantly changed from the
  original, provide a brief explanation (1-2 sentences) of why the substitution was made.
  Set to null (omit the field entirely) if the ingredient was NOT changed.
"""
```

### Frontend: TransformedRecipe interface extension
```typescript
// Source: Codebase inspection — App.tsx current interface
interface TransformedRecipe {
  recipeName: string
  ingredients: IngredientLine[]
  instructions: string[]
  servings: number
  originalServings: number
  warnings: string[]
  originalIngredients?: IngredientLine[]  // NEW
  originalInstructions?: string[]          // NEW
}
```

### Frontend: ComparisonLayout component
```tsx
// Source: 04-UI-SPEC.md Layout Contract + CONTEXT.md D-04
// Pattern: max-w-5xl container, flex-col md:flex-row gap-6
export function ComparisonLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6">
      {children}
    </div>
  )
}
```

### Frontend: App.tsx result section restructure
```tsx
// Source: Codebase inspection — App.tsx current result section
{formCollapsed && recipe && (
  <div className="mt-8">
    <button type="button" className="text-sm text-muted-foreground underline mb-4 print:hidden"
      onClick={() => { setFormCollapsed(false); setRecipe(null); setError(null) }}>
      Edit / start over
    </button>
    <ExportToolbar recipe={recipe} selectedDiets={selectedDiets} className="print:hidden mb-6" />
    <ComparisonLayout>
      <section aria-label="Original recipe" className="flex-1 min-w-0 print:hidden">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Original</p>
        {recipe.originalIngredients ? (
          <OriginalRecipeCard originalIngredients={recipe.originalIngredients}
                              originalInstructions={recipe.originalInstructions ?? []} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Original recipe unavailable — paste it above to see the comparison.
          </p>
        )}
      </section>
      <section aria-label="Adapted recipe" className="flex-1 min-w-0">
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2 print:hidden">Adapted</p>
        <RecipeCard recipe={recipe} />
      </section>
    </ComparisonLayout>
  </div>
)}
```

### Frontend: ExportToolbar Drive state machine
```tsx
// Source: 04-UI-SPEC.md Export Toolbar Contract
type DriveState = "idle" | "connecting" | "exporting" | "error"

export function ExportToolbar({ recipe, selectedDiets }: Props) {
  const [driveState, setDriveState] = useState<DriveState>("idle")

  const fileName = selectedDiets.length > 0
    ? `${recipe.recipeName} (${selectedDiets.join(", ")}).html`
    : `${recipe.recipeName}.html`

  const handleDrive = async () => {
    setDriveState("connecting")
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      const token = await getAccessToken(clientId)
      setDriveState("exporting")
      const html = serializeAdaptedRecipe(recipe)  // build HTML string from recipe data
      await uploadToDrive(fileName, html, "text/html", token)
      setDriveState("idle")
    } catch {
      setDriveState("error")
    }
  }
  // ...
}
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend build | ✓ | 25.9.0 | — |
| npx | shadcn add popover | ✓ | 11.12.1 | — |
| `VITE_GOOGLE_CLIENT_ID` env var | Drive export (OUT-04) | ✗ | — | Drive button disabled/hidden if unset |
| Google OAuth2 consent screen | Drive export | ✗ (setup required) | — | Skip Drive if not configured; Print is always available |
| Internet access (GIS scripts) | Drive export only | ✓ (assumed) | — | Drive gracefully degrades; Print works offline |

[VERIFIED: node --version → 25.9.0; npx --version → 11.12.1; no .env files exist in frontend/]
[ASSUMED: Internet access is available during development and use — single-user personal app]

**Missing dependencies with no fallback:**
- `VITE_GOOGLE_CLIENT_ID` — must be documented in README or .env.example. Drive button should be conditionally disabled or hidden if `import.meta.env.VITE_GOOGLE_CLIENT_ID` is falsy. This prevents a confusing OAuth error for users who haven't set up a Google Cloud project.

**Missing dependencies with fallback:**
- Google OAuth2 consent screen — requires a Google Cloud project + OAuth2 client ID setup by the developer. OUT-03 (browser print) works without any Google setup; it's the documented fallback in D-09.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `gapi.client` library for Drive | GIS token model + raw `fetch` | GIS released 2021, stable since | No gapi.js needed; direct fetch to Drive API |
| `@radix-ui/react-tooltip` scoped package | `radix-ui` umbrella package | shadcn v4 migration (2025) | Import pattern: `{ Tooltip as TooltipPrimitive } from "radix-ui"` — same pattern for Popover |
| Tailwind `tailwind.config.js` print extension | `print:hidden` built-in variant | Tailwind v4 (Jan 2025) | No config needed; `@import "tailwindcss"` is all that's required |

**Deprecated/outdated:**
- `gapi.auth2` sign-in library: deprecated by Google in favor of GIS. Do not use.
- Tailwind `safelist` for print classes: not needed in v4 — Tailwind v4 scans all source files.
- `html2canvas` + `jsPDF` for export: adds significant dependencies; browser print engine produces superior output for this use case.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Drive export uploads HTML (`text/html`) with `.pdf` extension — satisfying OUT-04 and D-08 without pdf-generation dependencies | Critical Architecture Decision section | **RESOLVED** — user confirmed: `.pdf` extension with `text/html` content. No jsPDF needed. |
| A2 | Internet access is available during development and use | Environment Availability | Drive export silently fails without internet; acceptable since print is the fallback |
| A3 | A Google Cloud project and OAuth2 client ID exist or will be created for development | Environment Availability | **RESOLVED** — user confirmed: client ID already configured for `localhost:5173`. Drive button degrades gracefully if env var unset. |
| A4 | `lucide-react@1.8.0` (project installed) includes `Info`, `Printer`, `Loader2` icons | Standard Stack | If icons missing, update lucide-react to 1.16.0 (latest registry version) |

---

## Open Questions — RESOLVED

1. **Drive export file format: HTML or PDF?**
   - **RESOLVED (user confirmed):** Upload HTML content (`text/html` MIME type) but name the file with `.pdf` extension — e.g. `Banana Bread (Vegan, GF).pdf`. Drive renders HTML files natively when opened. No jsPDF or additional dependencies needed. This satisfies D-08 exactly as locked.

2. **Google Cloud project setup**
   - **RESOLVED (user confirmed):** Google Cloud project and OAuth2 client ID already exist and are configured for `localhost:5173`. No GCloud setup task required in the plan. Only `VITE_GOOGLE_CLIENT_ID` env var needs to be documented in `frontend/.env.example`.

---

## Security Domain

> nyquist_validation is false; security_enforcement default applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Drive OAuth is user-initiated, not app auth |
| V3 Session Management | Partial | Access token in `sessionStorage` — not `localStorage` (cleared on tab close); acceptable for single-user personal app |
| V4 Access Control | No | Single-user personal app; no multi-user access control |
| V5 Input Validation | No | No new user input fields in Phase 4 |
| V6 Cryptography | No | No crypto operations; OAuth handled by GIS library |

### Known Threat Patterns for Google OAuth + Drive REST

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Access token leakage via localStorage | Information Disclosure | Use `sessionStorage` (not `localStorage`) — clears on tab close; token never sent to DietCode backend |
| Drive upload to wrong account | Spoofing | GIS token flow always requires the user to confirm account selection; token is scoped to `drive.file` (only files created by the app) |
| CSRF on Drive upload | Tampering | Not applicable — Drive API is called from the browser with user's own Bearer token; no server-side state |
| Unauthorized Drive scope | Elevation of Privilege | Use `drive.file` scope (not `drive`) — restricts to only files the app created; cannot read existing Drive files |

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection — `App.tsx`, `RecipeCard.tsx`, `TransformedRecipe.kt`, `IngredientLine.kt`, `RecipeController.kt`, `RecipeIngestionService.kt`, `TransformationService.kt` — read directly in this session
- `04-CONTEXT.md`, `04-UI-SPEC.md` — phase design decisions read directly
- `npm list radix-ui` → 1.4.3; `node_modules/@radix-ui/react-popover/package.json` → 1.1.15; `node_modules/radix-ui/dist/index.mjs` confirms Popover export
- `frontend/package.json` — confirmed installed dependencies
- Tailwind v4 `print:hidden` — verified via official Tailwind docs (tailwindcss.com/docs/hover-focus-and-other-states#print-styles)

### Secondary (MEDIUM confidence)
- [GIS Token Model — Google Identity Docs](https://developers.google.com/identity/oauth2/web/guides/use-token-model) — verified via WebFetch
- [Drive API multipart upload — Google Workspace Docs](https://developers.google.com/workspace/drive/api/guides/manage-uploads) — verified via WebFetch + ctx7
- [shadcn popover component — ctx7 /shadcn-ui/ui](https://ui.shadcn.com/docs/components/popover) — verified install command and usage pattern

### Tertiary (LOW confidence)
- [WebSearch: Tailwind print CSS 2025] — corroborated by primary Tailwind docs; used for context only

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified against npm registry and node_modules
- Architecture: HIGH — backend code read directly; frontend patterns traced from existing components
- Pitfalls: HIGH — derived from direct codebase inspection and data model analysis
- Drive export: MEDIUM — GIS flow verified via official docs; file format (HTML vs PDF) is an open question

**Research date:** 2026-05-24
**Valid until:** 2026-06-24 (GIS and Drive API are stable; shadcn stable)
