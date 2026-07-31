import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type Row = { label: string; value: string | number; highlight?: boolean; unit?: string }

export function ResultPanel({
  title,
  rows,
  warning,
  error,
}: {
  title: string
  rows: Row[]
  warning?: string | null
  error?: string | null
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle data-icon />
            <AlertTitle>Terjadi kesalahan</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {warning && !error && (
          <Alert>
            <AlertTriangle data-icon />
            <AlertTitle>Perhatian</AlertTitle>
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}
        {!error && rows.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4 py-2">
                <span className="text-sm text-muted-foreground">{r.label}</span>
                <span className={`num text-right text-sm font-semibold ${r.highlight ? "text-primary text-lg" : "text-foreground"}`}>
                  {r.value}
                  {r.unit ? <span className="ml-1 text-xs font-normal text-muted-foreground">{r.unit}</span> : null}
                </span>
              </div>
            ))}
          </div>
        )}
        {!error && rows.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-sm text-success">
            <CheckCircle2 data-icon />
            Selesai — tekan tombol Hitung untuk melihat hasil.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
