import { cn } from "@/lib/utils"

const DIET_OPTIONS = [
  { value: "KETO", label: "Keto" },
  { value: "VEGAN", label: "Vegan" },
  { value: "GLUTEN_FREE", label: "GF" },
  { value: "PALEO", label: "Paleo" },
  { value: "WHOLE30", label: "Whole30" },
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
            "flex items-center px-3 py-1 rounded-full text-sm font-normal border cursor-pointer transition-colors",
            selected.includes(opt.value)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
