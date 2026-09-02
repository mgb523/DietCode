import { useState } from "react"
import { Printer, Loader2, ExternalLink, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type IngredientLine,
  isToTaste,
  rescaleIngredients,
  shouldShowUnit,
} from "@/lib/scaling"

// ── Types ────────────────────────────────────────────────────────────────────

interface TransformedRecipe {
  recipeName: string
  ingredients: IngredientLine[]
  instructions: string[]
  servings: number
  originalServings: number
  warnings: string[]
}

interface Props {
  recipe: TransformedRecipe
  selectedDiets: string[]
  /** Must match RecipeCard's currentServings so the PDF shows the same quantities. */
  currentServings: number
  className?: string
}

type DriveState =
  | { status: "idle" }
  | { status: "connecting" }
  | { status: "converting" }   // uploading HTML → Google Doc
  | { status: "exporting" }    // fetching PDF bytes
  | { status: "uploading" }    // uploading PDF file
  | { status: "done"; url: string }
  | { status: "error"; detail: string }

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"

// ── Google Identity Services OAuth2 ─────────────────────────────────────────

function loadGis(): Promise<void> {
  return new Promise(resolve => {
    if ((window as unknown as Record<string, unknown>)["google"]) { resolve(); return }
    const s = document.createElement("script")
    s.src = "https://accounts.google.com/gsi/client"
    s.onload = () => resolve()
    document.head.appendChild(s)
  })
}

async function getAccessToken(clientId: string): Promise<string> {
  const cached    = sessionStorage.getItem("drive_access_token")
  const expiresAt = sessionStorage.getItem("drive_token_expires_at")
  if (cached && expiresAt && Date.now() < parseInt(expiresAt)) return cached

  await loadGis()

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (r: { access_token?: string; error?: string; expires_in?: number }) => {
        if (r.access_token) {
          sessionStorage.setItem("drive_access_token", r.access_token)
          sessionStorage.setItem(
            "drive_token_expires_at",
            String(Date.now() + (r.expires_in ?? 3600) * 1000),
          )
          resolve(r.access_token)
        } else {
          reject(new Error(r.error ?? "OAuth failed"))
        }
      },
    })
    client.requestAccessToken()
  })
}

// ── Drive upload helpers ─────────────────────────────────────────────────────

/** Multipart upload with JSON metadata + file blob. */
async function driveMultipartUpload(
  metadata: Record<string, unknown>,
  fileBlob: Blob,
  token: string,
  fields = "id",
): Promise<Record<string, string>> {
  const form = new FormData()
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }))
  form.append("file", fileBlob)

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${fields}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form },
  )
  if (!res.ok) throw new Error(`Drive upload failed (${res.status})`)
  return res.json()
}

/**
 * Full pipeline:
 *  1. Upload HTML → Google Doc (Drive converts automatically)
 *  2. Export Google Doc → PDF bytes
 *  3. Upload PDF as a named Drive file
 *  4. Delete the intermediate Google Doc (best-effort cleanup)
 *
 * Returns the PDF file's web-view URL.
 */
async function uploadPdfToDrive(
  fileName: string,
  html: string,
  token: string,
  onStep: (s: DriveState) => void,
): Promise<string> {
  // ── 1. HTML → Google Doc ──────────────────────────────────────────────────
  onStep({ status: "converting" })
  const { id: docId } = await driveMultipartUpload(
    { name: fileName, mimeType: "application/vnd.google-apps.document" },
    new Blob([html], { type: "text/html" }),
    token,
  )

  try {
    // ── 2. Export Google Doc as PDF ──────────────────────────────────────────
    onStep({ status: "exporting" })
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}/export?mimeType=application/pdf`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!exportRes.ok) throw new Error(`PDF export failed (${exportRes.status})`)
    const pdfBlob = await exportRes.blob()

    // ── 3. Upload PDF ────────────────────────────────────────────────────────
    onStep({ status: "uploading" })
    const { id: pdfId } = await driveMultipartUpload(
      { name: `${fileName}.pdf`, mimeType: "application/pdf" },
      pdfBlob,
      token,
      "id",
    )

    return `https://drive.google.com/file/d/${pdfId}/view`
  } finally {
    // ── 4. Delete temp Google Doc (fire-and-forget) ──────────────────────────
    fetch(`https://www.googleapis.com/drive/v3/files/${docId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => { /* ignore cleanup errors */ })
  }
}

// ── HTML serializer ──────────────────────────────────────────────────────────

function buildRecipeHtml(
  recipe: TransformedRecipe,
  scaledIngredients: IngredientLine[],
  currentServings: number,
  selectedDiets: string[],
): string {
  const dietBadges = selectedDiets.length > 0
    ? `<p class="diets">${selectedDiets.map(d =>
        `<span class="diet-tag">${d.toLowerCase().replace(/_/g, " ")}</span>`
      ).join(" ")}</p>`
    : ""

  const measuredLines = scaledIngredients.filter(ing => !isToTaste(ing))
  const toTasteLines  = scaledIngredients.filter(isToTaste)

  const ingredientLis = measuredLines.map(ing => {
    const qty  = ing.quantity ? `<strong>${ing.quantity}</strong> ` : ""
    const unit = shouldShowUnit(ing.unit, ing.ingredient) ? `${ing.unit} ` : ""
    const prep = ing.preparation ? `, ${ing.preparation}` : ""
    return `<li>${qty}${unit}${ing.ingredient ?? ""}${prep}</li>`
  }).join("\n        ")

  const toTasteLis = toTasteLines.map(ing =>
    `<li>${ing.ingredient ?? ""}${ing.preparation ? `, ${ing.preparation}` : ""}</li>`
  ).join("\n        ")

  const toTasteSection = toTasteLines.length > 0
    ? `<h2>To taste</h2><ul>${toTasteLis}</ul>`
    : ""

  const instructionLis = recipe.instructions.map(s => `<li>${s}</li>`).join("\n        ")

  const notesSection = recipe.warnings.length > 0
    ? `<div class="notes">
        <h2>Notes</h2>
        <ul>${recipe.warnings.map(w => `<li>${w}</li>`).join("\n        ")}</ul>
      </div>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${recipe.recipeName}</title>
  <style>
    body        { font-family: Georgia, serif; max-width: 680px; margin: 2rem auto; color: #111; line-height: 1.5; }
    h1          { font-size: 1.8rem; margin: 0 0 0.2rem; }
    .meta       { color: #555; font-size: 0.9rem; margin-bottom: 1rem; }
    .diets      { margin: 0 0 1rem; }
    .diet-tag   { display: inline-block; background: #f0fdf4; border: 1px solid #86efac;
                  border-radius: 4px; padding: 0.1rem 0.45rem; font-size: 0.78rem;
                  margin-right: 0.3rem; font-family: sans-serif; }
    h2          { font-size: 1.05rem; font-weight: bold; margin: 1.4rem 0 0.4rem;
                  border-bottom: 1px solid #ddd; padding-bottom: 0.2rem; }
    ul, ol      { padding-left: 1.4rem; margin: 0 0 0.5rem; }
    li          { margin-bottom: 0.35rem; }
    .notes      { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;
                  padding: 0.75rem 1rem; margin-top: 1.5rem; }
    .notes h2   { border: none; margin-top: 0; }
  </style>
</head>
<body>
  <h1>${recipe.recipeName}</h1>
  <p class="meta">${currentServings} serving${currentServings !== 1 ? "s" : ""}</p>
  ${dietBadges}
  <h2>Ingredients</h2>
  <ul>
    ${ingredientLis}
  </ul>
  ${toTasteSection}
  <h2>Instructions</h2>
  <ol>
    ${instructionLis}
  </ol>
  ${notesSection}
</body>
</html>`
}

// ── Component ────────────────────────────────────────────────────────────────

// ── Feature flag — set to true when Google Cloud project is ready ─────────────
const DRIVE_ENABLED: boolean = false

const DRIVE_LABELS: Record<DriveState["status"], string> = {
  idle:       "Export to Drive",
  connecting: "Connecting…",
  converting: "Converting…",
  exporting:  "Rendering PDF…",
  uploading:  "Uploading…",
  done:       "Saved to Drive",
  error:      "Export to Drive",
}

export function ExportToolbar({ recipe, selectedDiets, currentServings, className }: Props) {
  const [driveState, setDriveState] = useState<DriveState>({ status: "idle" })

  const clientId    = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const driveReady  = Boolean(clientId)
  const isBusy      = ["connecting", "converting", "exporting", "uploading"].includes(driveState.status)
  const isDone      = driveState.status === "done"

  const fileName = selectedDiets.length > 0
    ? `${recipe.recipeName} (${selectedDiets.join(", ")})`
    : recipe.recipeName

  const handlePrint = () => window.print()

  const handleDrive = async () => {
    if (!clientId || isBusy) return
    setDriveState({ status: "connecting" })
    try {
      const token = await getAccessToken(clientId)

      // Rescale ingredients to whatever the stepper is showing right now.
      const scaledIngredients = rescaleIngredients(
        recipe.ingredients,
        recipe.servings,
        currentServings,
      )
      const html = buildRecipeHtml(recipe, scaledIngredients, currentServings, selectedDiets)

      const url = await uploadPdfToDrive(fileName, html, token, setDriveState)
      setDriveState({ status: "done", url })
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error"
      setDriveState({ status: "error", detail })
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>

      {/* ── Print ────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handlePrint}
        aria-label="Print recipe"
        className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
      >
        <Printer className="h-4 w-4 mr-2" />
        Print Recipe
      </button>

      {/* ── Drive export — re-enable by setting DRIVE_ENABLED = true ────── */}
      {DRIVE_ENABLED && <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={isDone ? () => setDriveState({ status: "idle" }) : handleDrive}
            disabled={!driveReady || isBusy}
            aria-label={isDone ? "Export again to Google Drive" : "Export recipe PDF to Google Drive"}
            aria-busy={isBusy}
            className={cn(
              "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
              "border border-border bg-background hover:bg-muted text-foreground",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              isDone && "border-green-500 text-green-700 hover:bg-green-50",
            )}
          >
            {isBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isDone && <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />}
            {DRIVE_LABELS[driveState.status]}
          </button>

          {/* "Open" link appears next to button on success */}
          {isDone && driveState.status === "done" && (
            <a
              href={driveState.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
            >
              Open <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Status messages */}
        {!driveReady && (
          <p className="text-xs text-muted-foreground mt-1">
            Set <code>VITE_GOOGLE_CLIENT_ID</code> in <code>.env.local</code> to enable Drive export.
          </p>
        )}
        {driveState.status === "error" && (
          <p role="alert" className="text-sm text-destructive mt-1">
            ⚠ {driveState.detail} — use Print to save as PDF instead.
          </p>
        )}
      </div>}

    </div>
  )
}
