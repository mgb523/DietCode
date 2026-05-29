import { useState } from "react"
import { Printer, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface IngredientLine {
  quantity: string
  unit: string
  ingredient: string
  preparation: string | null
  substitutionNote: string | null
}

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
  className?: string
}

type DriveState = "idle" | "connecting" | "exporting" | "error"

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file"

function loadGis(): Promise<void> {
  return new Promise(resolve => {
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>)["google"]) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

async function getAccessToken(clientId: string): Promise<string> {
  const cached = sessionStorage.getItem("drive_access_token")
  const expiresAt = sessionStorage.getItem("drive_token_expires_at")
  if (cached && expiresAt && Date.now() < parseInt(expiresAt)) return cached

  await loadGis()

  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response: { access_token?: string; error?: string; expires_in?: number }) => {
        if (response.access_token) {
          sessionStorage.setItem("drive_access_token", response.access_token)
          sessionStorage.setItem(
            "drive_token_expires_at",
            String(Date.now() + ((response.expires_in ?? 3600) * 1000))
          )
          resolve(response.access_token)
        } else {
          reject(new Error(response.error ?? "OAuth failed"))
        }
      },
    })
    client.requestAccessToken()
  })
}

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

function serializeAdaptedRecipe(recipe: TransformedRecipe): string {
  const ingredients = recipe.ingredients
    .map(ing => {
      const qty = ing.quantity ? `${ing.quantity} ` : ""
      const unit = ing.unit ? `${ing.unit} ` : ""
      const prep = ing.preparation ? `, ${ing.preparation}` : ""
      return `<li>${qty}${unit}${ing.ingredient}${prep}</li>`
    })
    .join("\n")

  const instructions = recipe.instructions
    .map(step => `<li>${step}</li>`)
    .join("\n")

  const warnings = recipe.warnings.length > 0
    ? `<section><h2>Notes</h2><ul>${recipe.warnings.map(w => `<li>${w}</li>`).join("\n")}</ul></section>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${recipe.recipeName}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; }
    li { margin-bottom: 0.25rem; }
  </style>
</head>
<body>
  <h1>${recipe.recipeName}</h1>
  <p>${recipe.servings} servings</p>
  <section>
    <h2>Ingredients</h2>
    <ul>${ingredients}</ul>
  </section>
  <section>
    <h2>Instructions</h2>
    <ol>${instructions}</ol>
  </section>
  ${warnings}
</body>
</html>`
}

export function ExportToolbar({ recipe, selectedDiets, className }: Props) {
  const [driveState, setDriveState] = useState<DriveState>("idle")

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  const driveAvailable = Boolean(clientId)

  const fileName = selectedDiets.length > 0
    ? `${recipe.recipeName} (${selectedDiets.join(", ")}).pdf`
    : `${recipe.recipeName}.pdf`

  const handlePrint = () => {
    window.print()
  }

  const handleDrive = async () => {
    if (!clientId) return
    setDriveState("connecting")
    try {
      const token = await getAccessToken(clientId)
      setDriveState("exporting")
      const html = serializeAdaptedRecipe(recipe)
      await uploadToDrive(fileName, html, "text/html", token)
      setDriveState("idle")
    } catch {
      setDriveState("error")
    }
  }

  const driveLabel = driveState === "connecting"
    ? "Connecting..."
    : driveState === "exporting"
    ? "Exporting..."
    : "Export to Drive"

  const driveIsBusy = driveState === "connecting" || driveState === "exporting"

  return (
    <div className={cn("flex flex-wrap gap-2 items-center", className)}>
      <button
        type="button"
        onClick={handlePrint}
        aria-label="Print recipe"
        className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium"
      >
        <Printer className="h-4 w-4 mr-2" />
        Print Recipe
      </button>

      <div className="flex flex-col">
        <button
          type="button"
          onClick={handleDrive}
          disabled={!driveAvailable || driveIsBusy}
          aria-label="Export recipe to Google Drive"
          aria-busy={driveIsBusy}
          className="inline-flex items-center border border-border bg-background hover:bg-muted text-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {driveIsBusy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {driveLabel}
        </button>
        {driveState === "error" && (
          <p role="alert" className="text-sm text-destructive mt-1">
            ⚠ Drive export failed — use Print to save as PDF instead.
          </p>
        )}
      </div>
    </div>
  )
}
