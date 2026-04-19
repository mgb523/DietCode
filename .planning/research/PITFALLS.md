# Pitfalls

**Project:** DietCode
**Researched:** 2026-04-19

---

## Critical Pitfalls

### 1. LLM Silently Breaks Recipe Chemistry (HIGH confidence)

The LLM substitutes a structural ingredient with something functionally incompatible and states it with full confidence: almond flour 1:1 for all-purpose in a cake (no gluten network — structure collapses), flax egg in a meringue (physically impossible), coconut marked as nut-free (FDA classifies coconut as a tree nut).

LLMs have no "I don't know the chemistry here" state. They produce fluent, confident text regardless of correctness.

**Prevention:** Structured JSON output with a mandatory `warnings[]` array that the model must populate whenever it replaces a structural ingredient (leavening, emulsifier, gluten-forming flour, egg as binder or aerator). Use few-shot examples showing hedged substitution language. System prompt must require botanical family disclosure on allergy substitutions.

**Phase:** Core LLM integration — must be designed into the output schema from the start.

---

### 2. Non-Linear Ingredient Scaling (HIGH confidence)

Naive linear scaling (multiply everything by N) is wrong for leavening, salt, strong spices, and thickeners:
- **Leavening** (baking powder, baking soda, yeast): ~75% of linear at 2× batch, ~60% at 4×. Over-leavening causes collapse and metallic/bitter taste.
- **Salt:** Perceived saltiness is non-linear; sub-linear scaling required.
- **Strong spices** (cayenne, cloves, cinnamon): sub-linear.
- **Cook time:** Not multiplicative at all.

**Prevention:** Categorize ingredients before scaling. Apply programmatic sub-linear rules in the backend — do not rely on the LLM to apply these spontaneously. Return a note for each non-linear adjustment. Add a UI warning for scale factors >3× or <0.5×.

**Phase:** Serving-scale feature.

---

### 3. Recipe URL Scraping Brittleness (HIGH confidence)

Four failure categories:
1. JSON-LD present but silently removed on site redesign
2. HTML heuristics break on any redesign
3. JS-rendered SPAs: plain HTTP GET returns empty shell
4. Bot-blocked sites (AllRecipes, Epicurious, NYT Cooking): 403, CAPTCHA, or Cloudflare challenge

Worst failure mode: scraper returns page title and intro text, LLM transforms the fragment into a plausible-looking but invented recipe — silent and dangerous.

**Prevention:**
- Priority chain: (1) parse `ld+json` schema.org/Recipe → (2) Open Graph/meta tags → (3) heuristic HTML via Jsoup → (4) send raw page text to LLM for extraction
- Validate: require non-empty ingredients AND non-empty instructions before proceeding
- Fail loudly with "paste the recipe text instead" — never silently pass empty content to the LLM
- Document JS-rendered site limitation in v1; paste-text input is the fallback

**Phase:** URL import phase. Test against 10+ real URLs including JS-rendered sites before marking complete.

---

## Moderate Pitfalls

### 4. Prompt Injection via Scraped Page Content (MEDIUM confidence)

A malicious recipe page can embed hidden text containing content designed to redirect the LLM — for example, directing the model to report all allergens as absent. Low risk for a personal tool where you control the URLs. Risk increases if ever shared.

**Prevention:** Wrap scraped content in the prompt with explicit untrusted-input framing. Strip invisible DOM elements before sending. Implement this framing from the start as hygiene.

**Phase:** URL import phase, alongside scraping implementation.

---

### 5. Print/PDF Formatting Breaks on Long Recipes (MEDIUM confidence)

Neglected `@media print` CSS causes: orphaned headings, steps split mid-sentence across pages, Flexbox/Grid layout collapse in print. Chrome, Firefox, and Safari render `window.print()` differently. These issues only appear when someone actually prints.

**Prevention:**
- Treat `@media print` styles as first-class alongside screen layout
- `break-inside: avoid` on ingredient groups and instruction steps; `break-after: avoid` on section headings
- Hide all UI chrome in print styles
- Test in all three major browsers before marking complete
- Consider a dedicated `/print` route rendering only recipe content

**Phase:** Export/print phase.

---

### 6. Google Drive API Auth Complexity (HIGH confidence)

OAuth2 for Drive from a local tool requires: OAuth client registration, redirect URI handling, consent screen, token persistence, and handling refresh-token expiry. Apps in "testing" mode require re-authorization every 7 days. The older `GoogleCredential` class is deprecated; the newer library has breaking changes between versions.

**Prevention:** Implement browser print-to-PDF only for v1. This covers 90% of the use case with zero auth complexity. Defer Drive integration until core transformation UX is validated. If Drive is required, use the browser-side Google Drive JS SDK (auth stays in browser session, no backend token storage).

**Phase:** Export phase — treat Drive as a stretch goal.

---

## Minor Pitfalls

### 7. LLM Output Parsing Fragility (HIGH confidence)

Model occasionally wraps JSON in markdown fences, uses different key names, prepends prose, or truncates on long recipes hitting the token limit.

**Prevention:** Use provider JSON mode / native structured output. Always strip markdown fences before parsing. Set `max_tokens` large enough for the longest recipe. Return raw LLM output with an error message on parse failure.

**Phase:** Core LLM integration.

---

### 8. Ingredient Quantity Format Diversity (HIGH confidence)

Fractions (`1/2`, `¾`, `1 ½`), ranges (`2–3 cloves`), approximate (`a pinch`, `to taste`), unit ambiguity (`1 can (14 oz)`), no-quantity entries (`salt and pepper`) all break naive numeric parsers.

**Prevention:** Delegate quantity normalization to the LLM in the structured output schema: request numeric quantity + unit + `qualitative` boolean. For ranges, request midpoint in the quantity field. Pass qualitative quantities through unscaled with a "adjust to taste" annotation.

**Phase:** Core LLM integration — design the schema for this from the start.

---

### 9. CORS in Local Development (MEDIUM confidence)

Vite dev server (port 5173) and Spring Boot (port 8080) cause CORS errors on every API call without explicit configuration.

**Prevention:** Configure a global `WebMvcConfigurer` CORS bean in Spring Boot allowing `http://localhost:5173`, or use Vite's `proxy` config to forward `/api` to port 8080.

**Phase:** Project setup — must be resolved before any API integration work.

---

## Phase-Specific Warnings Summary

| Phase | Pitfall | Mitigation |
|-------|---------|------------|
| Project setup | CORS dev friction | CORS bean or Vite proxy on day one |
| LLM integration | Hallucinated substitutions | Mandatory `warnings[]` in JSON schema; safety rules in system prompt |
| LLM integration | Output parsing fragility | JSON mode; strip markdown fences; adequate max_tokens |
| LLM integration | Quantity format diversity | LLM normalizes quantities in structured output schema |
| URL import | JS-rendered / bot-blocked sites | Fallback chain ending in "paste text instead" |
| URL import | Prompt injection via scraped content | Untrusted-input framing; strip invisible elements |
| Serving scale | Non-linear leavening/salt/spice | Programmatic sub-linear rules; UI warning at >3× |
| Export / print | Print CSS gaps | `@media print` first-class; `break-inside: avoid`; multi-browser test |
| Export / print | Google Drive auth complexity | Browser print-to-PDF first; Drive as stretch goal |
