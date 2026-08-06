import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge, statusVariantFor } from "@/components/status-badge"
import { getDetailBlok } from "@/lib/actions"

export default async function DetailBlokPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = await getDetailBlok(id)
  if (!detail) notFound()

  const info = detail.info_dasar
  const totalPanen = detail.riwayat_panen_bulan_ini.reduce((s, p) => {
    const input = (p.data_input as { tonase?: number }).tonase ?? 0
    return s + input
  }, 0)

  return (
    <div className="flex flex-col gap-6 px-6 py-8 lg:px-10">
      <Link href="/blok" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft data-icon />
        Data Blok Kebun
      </Link>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Blok {info.kode}</h1>
          <StatusBadge status={detail.status.status} variant={statusVariantFor(detail.status.status)} />
        </div>
        <p className="text-sm text-muted-foreground">
          {info.kebun} / Afdeling {info.afdeling} - umur {detail.status.umur} tahun
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Luas</p>
            <p className="num mt-1 text-xl font-semibold">{info.luas_ha.toLocaleString("id-ID")} ha</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Jumlah pokok</p>
            <p className="num mt-1 text-xl font-semibold">{info.jumlah_pokok.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Panen bulan berjalan</p>
            <p className="num mt-1 text-xl font-semibold">{totalPanen.toLocaleString("id-ID")} ton</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Varietas / lahan</p>
            <p className="mt-1 text-xl font-semibold">
              {info.varietas ?? "-"} <span className="text-sm font-normal text-muted-foreground">/ {info.jenis_lahan}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Riwayat pemupukan terakhir</CardTitle>
          <CardDescription>Data dari Menu Kebutuhan & Biaya Pupuk</CardDescription>
        </CardHeader>
        <CardContent>
          {!detail.riwayat_pupuk_terakhir ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Package data-icon />
              Belum ada riwayat pemupukan untuk blok ini.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Jumlah sak</TableHead>
                  <TableHead className="text-right">Total biaya</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const item = detail.riwayat_pupuk_terakhir as unknown as {
                    tanggal: string
                    data_hasil: { total_kg?: number; jumlah_sak?: number; biaya?: number }[] | { biaya?: number }
                  }
                  const hasil = item.data_hasil
                  const sak = Array.isArray(hasil) ? hasil.reduce((s, i) => s + (i.jumlah_sak ?? 0), 0) : 0
                  const biaya = Array.isArray(hasil)
                    ? hasil.reduce((s, i) => s + (i.biaya ?? 0), 0)
                    : (hasil.biaya ?? 0)
                  return (
                    <TableRow>
                      <TableCell>{new Date(item.tanggal).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="num text-right">{sak.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="num text-right">Rp {biaya.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  )
                })()}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Pengiriman TBS bulan berjalan</CardTitle>
          <CardDescription>Dari Menu Pengiriman TBS ke PKS</CardDescription>
        </CardHeader>
        <CardContent>
          {detail.riwayat_panen_bulan_ini.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Belum ada pengiriman bulan ini.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Tonase (ton)</TableHead>
                  <TableHead className="text-right">Harga (Rp/kg)</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.riwayat_panen_bulan_ini.map((p, i) => {
                  const input = p.data_input as { tonase?: number; harga_per_kg?: number }
                  const hasil = p.data_hasil as { pendapatan?: number }
                  return (
                    <TableRow key={i}>
                      <TableCell>{new Date(p.tanggal).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="num text-right">{input.tonase}</TableCell>
                      <TableCell className="num text-right">{input.harga_per_kg}</TableCell>
                      <TableCell className="num text-right">Rp {(hasil.pendapatan ?? 0).toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
