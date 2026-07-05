import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"

const DIET_OPTIONS = [
  {
    value: "KETO",
    label: "Keto",
    description: "Very low carb, high fat. Replaces grains, sugar, and starchy vegetables with fats and proteins to keep the body in ketosis.",
  },
  {
    value: "VEGAN",
    label: "Vegan",
    description: "No animal products of any kind — no meat, fish, dairy, eggs, or honey. Replaces with plant-based alternatives.",
  },
  {
    value: "VEGETARIAN",
    label: "Vegetarian",
    description: "Ovo-lacto vegetarian: no meat or fish, but dairy and eggs are allowed. Replaces meat with plant proteins, legumes, or eggs.",
  },
  {
    value: "GLUTEN_FREE",
    label: "GF",
    description: "Eliminates wheat, barley, rye, and anything containing gluten. Essential for celiac disease and gluten sensitivity.",
  },
  {
    value: "PALEO",
    label: "Paleo",
    description: "Mimics ancestral eating: meat, fish, eggs, vegetables, fruit, nuts. Excludes grains, legumes, dairy, and processed foods.",
  },
  {
    value: "WHOLE30",
    label: "Whole30",
    description: "30-day reset eliminating sugar, alcohol, grains, legumes, soy, and dairy. Focus on whole, minimally processed foods.",
  },
]

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

const MUTUALLY_EXCLUSIVE = new Set(["VEGAN", "VEGETARIAN"])

export function DietPillGroup({ selected, onChange }: Props) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else if (MUTUALLY_EXCLUSIVE.has(value)) {
      // Selecting vegan or vegetarian deselects the other
      onChange([...selected.filter(v => !MUTUALLY_EXCLUSIVE.has(v)), value])
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DIET_OPTIONS.map(opt => {
        const isSelected = selected.includes(opt.value)
        return (
          // Outer div acts as the pill container — avoids nested <button> (invalid HTML)
          <div
            key={opt.value}
            className={cn(
              "flex items-center rounded-full border text-sm font-normal transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border"
            )}
          >
            {/* Label button — toggles diet selection */}
            <button
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                "pl-3 pr-1 py-1 rounded-l-full cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
                !isSelected && "hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
            {/* Info icon — opens popover with diet description */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Info about ${opt.label}`}
                  className={cn(
                    "pr-2 pl-0.5 py-1 rounded-r-full inline-flex items-center cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
                    !isSelected && "hover:bg-muted"
                  )}
                >
                  <Info className="h-3 w-3 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" className="max-w-[220px] text-xs">
                {opt.description}
              </PopoverContent>
            </Popover>
          </div>
        )
      })}
    </div>
  )
}
