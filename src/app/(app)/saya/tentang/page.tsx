import { Leaf } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TentangPage() {
  return (
    <>
      <PageHeader
        backHref="/saya"
        title="Tentang Aplikasi"
        description="Informasi umum SawitDesk."
        category="Akun"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-10 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Leaf data-icon className="size-8" />
            </span>
            <div className="flex flex-col items-center gap-1.5">
              <h2 className="text-xl font-bold tracking-tight">SawitDesk</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Aplikasi manajemen kebun kelapa sawit: perencanaan tanam, pemupukan, produksi, hingga
                analisis pendapatan dan BEP. Data setiap pengguna tersimpan aman dan terisolasi per akun.
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary">Versi 0.1.0</Badge>
                <Badge variant="secondary">Next.js 16</Badge>
                <Badge variant="secondary">Prisma + Turso</Badge>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 border-t border-border pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Tim Pengembang
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {["Dani Supriadi", "Jeri RajaGukGuk", "Primashita Rahmadina", "Mega Lisanti Sinurat"].map((nama) => (
                  <Badge key={nama} variant="outline" className="text-xs">
                    {nama}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
