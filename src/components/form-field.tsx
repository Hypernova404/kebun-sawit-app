import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  placeholder,
  step = "any",
  min,
  hint,
}: {
  id: string
  label: string
  unit?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  step?: string
  min?: number
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(unit && "pr-14")}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function parseNum(v: string): number | null {
  if (v.trim() === "") return null
  const n = Number(v.replace(",", "."))
  return Number.isFinite(n) ? n : null
}
