import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  value: number
  min?: number
  onChange: (value: number) => void
  originalServings?: number
}

export function ServingStepper({ value, min = 1, onChange, originalServings }: Props) {
  const decrement = () => {
    if (value > min) onChange(Math.max(min, value - 1))
  }
  const increment = () => onChange(value + 1)

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrease servings"
        className={cn(
          "min-w-9 h-9 flex items-center justify-center",
          "border border-border bg-background hover:bg-muted",
          "rounded-l-md transition-colors",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span
        aria-live="polite"
        className="min-w-12 h-9 flex items-center justify-center border-y border-border bg-background text-sm font-normal text-center"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        aria-label="Increase servings"
        className={cn(
          "min-w-9 h-9 flex items-center justify-center",
          "border border-border bg-background hover:bg-muted",
          "rounded-r-md transition-colors"
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
      {originalServings !== undefined && originalServings !== value && (
        <span className="ml-2 text-sm text-muted-foreground">(original: {originalServings})</span>
      )}
    </div>
  )
}
