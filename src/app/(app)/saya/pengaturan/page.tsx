import { Calculator, Languages, Ruler, Wallet } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const PREFERENSI = [
  {
    icon: Ruler,
    label: "Satuan luas",
    value: "Hektar (ha)",
    description: "Seluruh kalkulator memakai hektar sebagai satuan luas lahan.",
  },
  {
    icon: Wallet,
    label: "Mata uang",
    value: "Rupiah (Rp)",
    description: "Semua perhitungan biaya dan pendapatan dalam Rupiah.",
  },
  {
    icon: Calculator,
    label: "Format angka",
    value: "Indonesia (id-ID)",
    description: "Pemisah ribuan titik, desimal koma.",
  },
  {
    icon: Languages,
    label: "Bahasa",
    value: "Bahasa Indonesia",
    description: "Seluruh antarmuka aplikasi menggunakan Bahasa Indonesia.",
  },
]

export default function PengaturanPage() {
  return (
    <>
      <PageHeader
        backHref="/saya"
        title="Pengaturan"
        description="Preferensi standar aplikasi SawitDesk."
        category="Akun"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        <Card className="shadow-sm">
          <CardContent className="flex flex-col divide-y divide-border pt-0">
            {PREFERENSI.map((p) => (
              <div key={p.label} className="flex items-center gap-3 px-2 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  <p.icon data-icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                </div>
                <Badge variant="secondary">{p.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
