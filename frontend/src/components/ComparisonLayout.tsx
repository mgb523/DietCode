import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  className?: string
}

export function ComparisonLayout({ children, className }: Props) {
  return (
    <div className={cn("max-w-5xl mx-auto flex flex-col md:flex-row gap-6", className)}>
      {children}
    </div>
  )
}
