import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

export function DietPillGroup({ selected, onChange }: Props) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DIET_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-normal border cursor-pointer transition-colors",
            selected.includes(opt.value)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted"
          )}
        >
          {opt.label}
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                role="img"
                aria-label={`Info about ${opt.label}`}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center"
              >
                <Info className="h-3 w-3 opacity-60" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-xs">
              {opt.description}
            </TooltipContent>
          </Tooltip>
        </button>
      ))}
    </div>
  )
}
