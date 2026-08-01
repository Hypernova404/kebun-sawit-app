"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { ResultPanel } from "@/components/result-panel"
import { BlokSelect } from "@/components/blok-select"
import { useStruktur } from "@/components/use-struktur"
import { saveHistory } from "@/components/calc-save"
import { hitungPendapatanPengiriman } from "@/lib/engine/transaksi"
import { HARGA_TBS_KALIMANTAN } from "@/lib/engine/harga"

export default function PengirimanPage() {
  const struktur = useStruktur()
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [blokId, setBlokId] = useState("")
  const [tonase, setTonase] = useState("")
  const [harga, setHarga] = useState(String(HARGA_TBS_KALIMANTAN))
  const [result, setResult] = useState<{ pendapatan: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [terkirim, setTerkirim] = useState(false)

  const compute = (): { pendapatan: number; blok: { id: string; kode: string } } | null => {
    const blok = struktur?.flatMap((k) => k.afdelingen.flatMap((a) => a.bloks)).find((b) => b.id === blokId)
    if (!blok) {
      setError("Pilih blok asal terlebih dahulu")
      return null
    }
    const d = new Date(tanggal)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (isNaN(d.getTime()) || d > today) {
      setError("Tanggal kirim tidak boleh di masa depan")
      return null
    }
    const t = parseNum(tonase)
    const h = parseNum(harga)
    if (t == null || h == null) {
      setError("Isi tonase dan harga dengan angka valid")
      return null
    }
    const r = hitungPendapatanPengiriman(t, h)
    if (!r.success) {
      setError(r.error!.message)
      return null
    }
    setError(null)
    setResult({ pendapatan: r.data! })
    return { pendapatan: r.data!, blok }
  }

  const simpan = () => {
    const res = compute()
    if (!res) return
    const t = parseNum(tonase)!
    const h = parseNum(harga)!
    saveHistory(
      "pengiriman_tbs",
      { tanggal, blok_id: res.blok.id, tonase: t, harga_per_kg: h },
      { pendapatan: res.pendapatan },
      res.blok.id,
      res.blok.kode
    )
    setTerkirim(true)
    setTimeout(() => setTerkirim(false), 3000)
  }

  return (
    <>
      <PageHeader
        title="Pengiriman TBS ke PKS"
        description="Pencatatan transaksi riil: pendapatan = tonase × 1.000 × harga/kg. Harga default mengikuti TBS Kalimantan, sesuaikan dengan SPB PKS."
        category="Produksi & Ekonomi"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input pengiriman</CardTitle>
            <CardDescription>Setiap kiriman dicatat sebagai 1 baris riwayat baru.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tanggal">Tanggal kirim</Label>
              <Input id="tanggal" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
            </div>
            {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} />}
            <NumberField id="tonase" label="Tonase TBS" unit="ton" value={tonase} onChange={setTonase} placeholder="mis. 25.5" />
            <NumberField id="harga" label="Harga per kg saat kirim" unit="Rp" value={harga} onChange={setHarga} hint={`Default Kalimantan: Rp ${HARGA_TBS_KALIMANTAN}/kg.`} />
            <Button onClick={() => compute()} className="mt-2 w-full" variant="secondary">
              Hitung pendapatan
            </Button>
            {result && !error && (
              <AlertDialog>
                <AlertDialogTrigger render={<Button className="w-full">Catat pengiriman</Button>} />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi pencatatan</AlertDialogTitle>
                    <AlertDialogDescription>
                      Kirim {parseNum(tonase)} ton TBS senilai Rp {result.pendapatan.toLocaleString("id-ID")}? Ini transaksi riil dan tidak bisa diulang — pastikan data sesuai SPB.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={simpan}>Catat</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {terkirim && <p className="text-center text-sm text-success">Pengiriman tercatat</p>}
          </CardContent>
        </Card>
        <ResultPanel
          title="Pendapatan pengiriman"
          error={error}
          rows={
            result
              ? [
                  { label: "Pendapatan", value: "Rp " + result.pendapatan.toLocaleString("id-ID"), highlight: true },
                ]
              : []
          }
        />
      </div>
    </>
  )
}
