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
import { hitungKebutuhanPemanen } from "@/lib/engine/manajemen"
import { estimasiProduksi } from "@/lib/engine/produksi"

export default function PemanenPage() {
  const struktur = useStruktur()
  const [luas, setLuas] = useState("")
  const [tonPerHa, setTonPerHa] = useState("")
  const [rotasi, setRotasi] = useState("7")
  const [kapasitas, setKapasitas] = useState("500")
  const [blokId, setBlokId] = useState("")
  const [jumlah, setJumlah] = useState<number | null>(null)
  const [kg, setKg] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const hitung = () => {
    const l = parseNum(luas)
    const t = parseNum(tonPerHa)
    if (l == null || t == null) {
      setError("Isi luas dan produksi dengan angka valid")
      setJumlah(null)
      return
    }
    const r = estimasiProduksi(10, l)
    if (t > (r.data?.ton_per_ha ?? 100) * 2) {
      setWarning("Produksi per ha jauh di atas kurva standar — periksa kembali input")
    } else {
      setWarning(null)
    }
    const totalKg = l * t * 1000
    const rr = hitungKebutuhanPemanen(totalKg, Math.floor(parseNum(rotasi) ?? 7), parseNum(kapasitas) ?? 500)
    if (!rr.success) {
      setError(rr.error!.message)
      setJumlah(null)
      return
    }
    setError(null)
    setJumlah(rr.data!.jumlah_pemanen)
    setKg(totalKg)
    saveHistory(
      "pemanen",
      { luas_ha: l, ton_per_ha: t, rotasi_hari: Math.floor(parseNum(rotasi) ?? 7), kapasitas_per_orang_per_hari: parseNum(kapasitas) ?? 500 },
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
            <CardDescription>Kapasitas pemanen umum 400–600 kg/orang/hari.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="luas" label="Total luas kebun / afdeling" unit="ha" value={luas} onChange={setLuas} placeholder="mis. 600" />
            <NumberField id="ton" label="Estimasi produksi" unit="ton/ha" value={tonPerHa} onChange={setTonPerHa} placeholder="mis. 23" hint="Acuan: kurva Menu Estimasi Produksi." />
            <div className="grid grid-cols-2 gap-4">
              <NumberField id="rotasi" label="Rotasi panen" unit="hari" value={rotasi} onChange={setRotasi} hint="Umum 7 atau 10 hari." />
              <NumberField id="kap" label="Kapasitas pemanen" unit="kg" value={kapasitas} onChange={setKapasitas} />
            </div>
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
            jumlah != null
              ? [
                  { label: "TBS siap panen", value: kg.toLocaleString("id-ID"), unit: "kg" },
                  { label: "Kebutuhan pemanen", value: jumlah.toLocaleString("id-ID"), unit: "orang", highlight: true },
                ]
              : []
          }
        />
      </div>
    </>
  )
}
