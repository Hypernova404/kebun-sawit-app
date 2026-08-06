"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { ResultPanel } from "@/components/result-panel"
import { BlokSelect } from "@/components/blok-select"
import { useStruktur } from "@/components/use-struktur"
import { saveHistory } from "@/components/calc-save"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { hitungKebutuhanPemanen, FAKTOR_TOPOGRAFI } from "@/lib/engine/manajemen"
import { estimasiProduksi } from "@/lib/engine/produksi"

export default function PemanenPage() {
  const struktur = useStruktur()
  const [luas, setLuas] = useState("")
  const [tonPerHa, setTonPerHa] = useState("")
  const [rotasi, setRotasi] = useState("7")
  const [kapasitas, setKapasitas] = useState("800")
  const [topografi, setTopografi] = useState("datar")
  const [umur, setUmur] = useState("")
  const [pokok, setPokok] = useState("")
  const [blokId, setBlokId] = useState("")
  const [result, setResult] = useState<ReturnType<typeof hitungKebutuhanPemanen>["data"] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const hitung = () => {
    const l = parseNum(luas)
    const t = parseNum(tonPerHa)
    if (l == null || t == null) {
      setError("Isi luas dan produksi dengan angka valid")
      setResult(null)
      return
    }
    const r = estimasiProduksi(10, l)
    if (t > (r.data?.ton_per_ha ?? 100) * 2) {
      setWarning("Produksi per ha jauh di atas kurva standar — periksa kembali input")
    } else {
      setWarning(null)
    }
    const totalKg = l * t * 1000
    const rr = hitungKebutuhanPemanen({
      total_kg_siap_panen: totalKg,
      rotasi_hari: Math.floor(parseNum(rotasi) ?? 7),
      kapasitas_per_orang_per_hari: parseNum(kapasitas) ?? 800,
      topografi,
      umur_tahun: parseNum(umur) ?? null,
      jumlah_pokok: parseNum(pokok) ?? null,
    })
    if (!rr.success) {
      setError(rr.error!.message)
      setResult(null)
      return
    }
    setError(null)
    setResult(rr.data!)
    if (rr.data!.warning && !warning) setWarning(rr.data!.warning)
    saveHistory(
      "pemanen",
      {
        luas_ha: l,
        ton_per_ha: t,
        rotasi_hari: Math.floor(parseNum(rotasi) ?? 7),
        kapasitas_per_orang_per_hari: parseNum(kapasitas) ?? 800,
        topografi,
        umur_tahun: parseNum(umur) ?? null,
        jumlah_pokok: parseNum(pokok) ?? null,
      },
      rr.data!,
      blokId === "__none__" ? null : blokId || null
    )
  }

  return (
    <>
      <PageHeader
        title="Rotasi Panen & Kebutuhan Pemanen"
        description="Perencanaan tenaga kerja panen: buah matang harus dipanen tepat rotasi — telat menurunkan rendemen, buru-buru menghasilkan buah mentah yang kena denda PKS."
        category="Manajemen Kebun"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>
              Kapasitas pemanen umum 600–1.200 kg/orang/hari (datar), 400–800 kg (berbukit). Basis pohon: ±300 pohon/pemanen/hari pada rotasi 7 hari.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="luas" label="Total luas kebun / afdeling" unit="ha" value={luas} onChange={setLuas} placeholder="mis. 600" />
            <NumberField id="ton" label="Estimasi produksi" unit="ton/ha" value={tonPerHa} onChange={setTonPerHa} placeholder="mis. 23" hint="Acuan: kurva Menu Estimasi Produksi." />
            <div className="grid grid-cols-2 gap-4">
              <NumberField id="rotasi" label="Rotasi panen" unit="hari" value={rotasi} onChange={setRotasi} hint="Umum 7 atau 10 hari." />
              <NumberField id="kap" label="Kapasitas pemanen" unit="kg" value={kapasitas} onChange={setKapasitas} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Topografi</Label>
                <Select value={topografi} onValueChange={(v) => setTopografi(v ?? "datar")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FAKTOR_TOPOGRAFI).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {k === "datar" ? "Datar (100%)" : `Berbukit (${v * 100}%)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <NumberField id="umur" label="Umur tanaman" unit="thn" value={umur} onChange={setUmur} placeholder="mis. 12" hint="> 15 thn: kapasitas -15%." />
            </div>
            <NumberField id="pokok" label="Jumlah pokok total (opsional)" unit="pokok" value={pokok} onChange={setPokok} placeholder="mis. 85000" hint="Untuk cek batas hanca: ±300 pohon/pemanen/hari." />
            {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} allowNone />}
            <Button onClick={hitung} className="mt-2 w-full">
              Hitung
            </Button>
          </CardContent>
        </Card>
        <ResultPanel
          title="Kebutuhan tenaga kerja"
          error={error}
          warning={warning}
          rows={
            result
              ? [
                  { label: "TBS siap panen", value: result.total_kg_siap_panen.toLocaleString("id-ID"), unit: "kg" },
                  { label: "Kapasitas efektif", value: result.kapasitas_efektif.toLocaleString("id-ID"), unit: "kg/orang/hari" },
                  ...(result.jumlah_dari_pohon != null
                    ? [{ label: "Batasan hanca (pohon)", value: result.jumlah_dari_pohon.toLocaleString("id-ID"), unit: "orang" }]
                    : []),
                  { label: "Kebutuhan pemanen", value: result.jumlah_pemanen.toLocaleString("id-ID"), unit: "orang", highlight: true },
                ]
              : []
          }
        />
      </div>
    </>
  )
}
