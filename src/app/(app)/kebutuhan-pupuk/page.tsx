"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { BlokSelect } from "@/components/blok-select"
import { useStruktur } from "@/components/use-struktur"
import { saveHistory } from "@/components/calc-save"
import { hitungKebutuhanPupukBlok, PERSEN_SUSUT_DEFAULT } from "@/lib/engine/kebutuhan-pupuk"
import { BERAT_PER_SAK, HARGA_PUPUK_KALIMANTAN } from "@/lib/engine/harga"
import type { PupukBlokItem } from "@/lib/engine/types"

const WILAYAH = ["Kalimantan Barat", "Riau", "Sumatera Utara", "Jambi"]

export default function KebutuhanPupukPage() {
  const struktur = useStruktur()
  const [blokId, setBlokId] = useState("")
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [wilayah, setWilayah] = useState("Kalimantan Barat")
  const [persenSusut, setPersenSusut] = useState(String(PERSEN_SUSUT_DEFAULT))
  const [harga, setHarga] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(HARGA_PUPUK_KALIMANTAN).map(([k, v]) => [k, String(v)]))
  )
  const [result, setResult] = useState<PupukBlokItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [terkirim, setTerkirim] = useState(false)

  const compute = () => {
    const blok = struktur?.flatMap((k) => k.afdelingen.flatMap((a) => a.bloks)).find((b) => b.id === blokId)
    if (!blok) {
      setError("Pilih blok terlebih dahulu")
      return null
    }
    const t = parseNum(tahun)
    if (t == null) {
      setError("Tahun tidak valid")
      return null
    }
    const hargaMap: Record<string, number> = {}
    for (const [k, v] of Object.entries(harga)) {
      const n = parseNum(v)
      if (n != null && n > 0) hargaMap[k] = n
    }
    const r = hitungKebutuhanPupukBlok(
      { tahun_tanam: blok.tahunTanam, jenis_lahan: blok.jenisLahan, jumlah_pokok: blok.jumlahPokok },
      t,
      wilayah,
      hargaMap,
      BERAT_PER_SAK,
      parseNum(persenSusut) ?? PERSEN_SUSUT_DEFAULT
    )
    if (!r.success) {
      setError(r.error!.message)
      return null
    }
    setError(null)
    setResult(r.data!)
    return { blok, t, r: r.data! }
  }

  const simpan = () => {
    const res = compute()
    if (!res) return
    saveHistory(
      "kebutuhan_pupuk",
      { blok_id: res.blok.id, tahun: res.t, wilayah, harga_pupuk: harga, berat_per_sak: BERAT_PER_SAK, persen_susut: parseNum(persenSusut) ?? PERSEN_SUSUT_DEFAULT },
      res.r,
      res.blok.id,
      res.blok.kode
    )
    setTerkirim(true)
    setTimeout(() => setTerkirim(false), 3000)
  }

  const totalKg = result?.reduce((s, i) => s + i.total_kg, 0) ?? 0
  const totalSak = result?.reduce((s, i) => s + i.jumlah_sak, 0) ?? 0
  const totalBiaya = result?.reduce((s, i) => s + i.biaya, 0) ?? 0

  return (
    <>
      <PageHeader
        title="Total Kebutuhan & Biaya Pupuk per Blok"
        description="Angka actionable untuk pengadaan: berapa kg dan sak per jenis pupuk per blok, dengan harga pasar Kalimantan yang bisa di-override."
        category="Pemupukan & Nutrisi"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>Harga default = pasar Kalimantan (non-subsidi, 2026). Ubah sesuai harga pembelian riil.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} />}
            <div className="grid grid-cols-2 gap-4">
              <NumberField id="tahun" label="Tahun" unit="" value={tahun} onChange={setTahun} />
              <NumberField
                id="susut"
                label="Buffer susut"
                unit="%"
                value={persenSusut}
                onChange={setPersenSusut}
                hint="SOP 3-5% (tumpah & sisa sak)."
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Wilayah</Label>
              <Select value={wilayah} onValueChange={(v) => setWilayah(v ?? "Kalimantan Barat")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WILAYAH.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(HARGA_PUPUK_KALIMANTAN).map(([jenis, defaultValue]) => (
                <div key={jenis} className="flex flex-col gap-1.5">
                  <Label htmlFor={`harga-${jenis}`}>Harga {jenis}</Label>
                  <div className="relative">
                    <Input
                      id={`harga-${jenis}`}
                      type="number"
                      inputMode="decimal"
                      value={harga[jenis]}
                      onChange={(e) => setHarga((h) => ({ ...h, [jenis]: e.target.value }))}
                      className="pr-12"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                      Rp/kg
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={compute} className="mt-2 w-full">
              Hitung kebutuhan
            </Button>
            {result && (
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="secondary" className="w-full">Simpan sebagai riwayat pemupukan</Button>} />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Simpan kebutuhan pupuk blok ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ini adalah pencatatan transaksi pengadaan - setiap simpan membuat 1 baris riwayat baru. Total: {totalKg.toLocaleString("id-ID")} kg, {totalSak} sak, Rp {totalBiaya.toLocaleString("id-ID")}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={simpan}>Simpan</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {terkirim && <p className="text-center text-sm text-success">Data pupuk tersimpan</p>}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hasil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error && <p className="text-sm text-danger">{error}</p>}
            {!result && !error && <p className="text-sm text-muted-foreground">Pilih blok, sesuaikan harga, lalu tekan Hitung.</p>}
            {result && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-right">Dasar (kg)</TableHead>
                      <TableHead className="text-right">Susut (kg)</TableHead>
                      <TableHead className="text-right">Total (kg)</TableHead>
                      <TableHead className="text-right">Sak (50 kg)</TableHead>
                      <TableHead className="text-right">Biaya</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.map((item) => (
                      <TableRow key={item.jenis}>
                        <TableCell className="font-medium">{item.jenis}</TableCell>
                        <TableCell className="num text-right">{item.dosis_dasar_kg.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="num text-right">{item.susut_kg.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="num text-right">{item.total_kg.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="num text-right">{item.jumlah_sak}</TableCell>
                        <TableCell className="num text-right">Rp {item.biaya.toLocaleString("id-ID")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex flex-col gap-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total kebutuhan</span>
                    <span className="num font-semibold">{totalKg.toLocaleString("id-ID")} kg ({totalSak} sak)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total estimasi biaya</span>
                    <span className="num text-lg font-semibold text-primary">Rp {totalBiaya.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
