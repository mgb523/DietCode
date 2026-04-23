import { useState } from "react"

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder }: Props) {
  const [value, setValue] = useState("")

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/,+$/, "").trim()
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag])
    }
    setValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()  // prevent form submission on Enter; prevent comma appearing in next tag
      addTag(value)
    } else if (e.key === "Backspace" && value === "" && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
      {tags.map(tag => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full text-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter(t => t !== tag))}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(value)}
        placeholder={tags.length === 0 ? placeholder : ""}
      />
    </div>
  )
}
