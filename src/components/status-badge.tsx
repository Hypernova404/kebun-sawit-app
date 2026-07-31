import { cn } from "@/lib/utils"

const STYLES: Record<string, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-danger/10 text-danger",
  neutral: "bg-muted text-muted-foreground",
}

export function StatusBadge({ status, variant = "neutral" }: { status: string; variant?: "success" | "warning" | "error" | "neutral" }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[variant])}>
      {status}
    </span>
  )
}

export function statusVariantFor(status: string): "success" | "warning" | "error" | "neutral" {
  const s = status.toUpperCase()
  if (s.includes("UNTUNG") || s.includes("SESUAI") || s.includes("OK") || s === "TM") return "success"
  if (s.includes("RUGI") || s.includes("DI BAWAH") || s.includes("ERROR")) return "error"
  if (s.includes("TUNDA") || s.includes("WARNING")) return "warning"
  return "neutral"
}
