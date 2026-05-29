import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"

interface Props {
  substitutionNote: string
  originalIngredient?: string
}

export function SubstitutionPopover({ substitutionNote, originalIngredient }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={originalIngredient
            ? `Why ${originalIngredient} was substituted`
            : "Why this ingredient was substituted"}
          className="text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center ml-1 align-middle"
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
