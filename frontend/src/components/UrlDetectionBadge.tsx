import { Link2 } from "lucide-react"

interface Props {
  visible: boolean
}

export function UrlDetectionBadge({ visible }: Props) {
  if (!visible) return null
  return (
    <span
      aria-hidden="true"
      className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 bg-muted border border-border rounded-full text-xs text-muted-foreground pointer-events-none"
    >
      <Link2 className="h-3 w-3" />
      URL detected
    </span>
  )
}
