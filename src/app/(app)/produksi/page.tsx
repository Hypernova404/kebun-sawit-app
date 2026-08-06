"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { ResultPanel } from "@/components/result-panel"
import { BlokSelect } from "@/components/blok-select"
import { useStruktur } from "@/components/use-struktur"
import { saveHistory } from "@/components/calc-save"
import { estimasiProduksi, estimasiProduksiBulanan } from "@/lib/engine/produksi"
import type { ProduksiResult } from "@/lib/engine/types"

const KELAS_LAHAN = [
  { v: "1", label: "Kelas I (1.0) - lahan ideal" },
  { v: "0.9", label: "Kelas II (0.9)" },
  { v: "0.8", label: "Kelas III (0.8)" },
  { v: "0.7", label: "Kelas IV (0.7)" },
]

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export default function ProduksiPage() {
  const struktur = useStruktur()
  const [umur, setUmur] = useState("")
  const [luas, setLuas] = useState("")
  const [kelas, setKelas] = useState("1")
  const [bulan, setBulan] = useState(() => String(new Date().getMonth() + 1))
  const [blokId, setBlokId] = useState("")
  const [result, setResult] = useState<ProduksiResult | null>(null)
  const [bulanan, setBulanan] = useState<ReturnType<typeof estimasiProduksiBulanan>["data"] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hitung = () => {
    const u = parseNum(umur)
    const l = parseNum(luas)
    if (u == null || l == null) {
      setError("Isi umur dan luas dengan angka valid")
      setResult(null)
      setBulanan(null)
      return
    }
    const r = estimasiProduksi(Math.floor(u), l, parseNum(kelas) ?? 1)
    if (!r.success) {
      setError(r.error!.message)
      setResult(null)
      setBulanan(null)
      return
    }
    const rb = estimasiProduksiBulanan(Math.floor(u), l, parseInt(bulan, 10) || new Date().getMonth() + 1, parseNum(kelas) ?? 1)
    setError(null)
    setResult(r.data!)
    setBulanan(rb.data ?? null)
    saveHistory(
      "produksi",
      { umur_tahun: Math.floor(u), luas_ha: l, faktor_kelas_lahan: parseNum(kelas) ?? 1, bulan: parseInt(bulan, 10) || new Date().getMonth() + 1 },
      { ...r.data!, bulanan: rb.data ?? null },
      blokId === "__none__" ? null : blokId || null
    )
  }

  return (
    <>
      <PageHeader
        title="Estimasi Produksi (TBS/ha)"
        description="Kurva produksi standar PPKS/Marihat & IOPRI: proyeksi target produksi tahunan per blok tanpa menunggu data aktual."
        category="Produksi & Ekonomi"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>Umur di bawah 3 tahun (TBM) otomatis menghasilkan 0 ton.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="umur" label="Umur tanaman" unit="tahun" value={umur} onChange={setUmur} placeholder="mis. 10" />
            <NumberField id="luas" label="Luas" unit="ha" value={luas} onChange={setLuas} placeholder="mis. 30" />
            <div className="flex flex-col gap-1.5">
              <Label>Kelas lahan (opsional)</Label>
              <Select value={kelas} onValueChange={(v) => setKelas(v ?? "1")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KELAS_LAHAN.map((k) => (
                    <SelectItem key={k.v} value={k.v}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Proyeksi bulan (opsional)</Label>
              <Select value={bulan} onValueChange={(v) => setBulan(v ?? "1")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BULAN.map((b, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} allowNone />}
            <Button onClick={hitung} className="mt-2 w-full">
              Hitung
            </Button>
          </CardContent>
        </Card>
        <ResultPanel
          title="Hasil estimasi"
          error={error}
          warning={result?.warning ?? null}
          rows={
            result
              ? [
                  { label: "Produksi per ha (tengah)", value: result.ton_per_ha.toLocaleString("id-ID"), unit: "ton/ha" },
                  { label: "Rentang per ha", value: `${result.ton_per_ha_min.toLocaleString("id-ID")} – ${result.ton_per_ha_max.toLocaleString("id-ID")}`, unit: "ton/ha" },
                  { label: "Total produksi", value: result.total_ton.toLocaleString("id-ID"), unit: "ton", highlight: true },
                  ...(bulanan
                    ? [
                        {
                          label: `Proyeksi ${BULAN[(parseInt(bulan, 10) || 1) - 1]} (×${bulanan.indeks_musiman.toLocaleString("id-ID")})`,
                          value: bulanan.ton_bulan_ini.toLocaleString("id-ID"),
                          unit: "ton",
                        },
                      ]
                    : []),
                ]
              : []
          }
        />
      </div>
    </>
  )
}
