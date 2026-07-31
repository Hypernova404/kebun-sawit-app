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
import { hitungBEP, hitungLabaRugi } from "@/lib/engine/transaksi"
import { StatusBadge, statusVariantFor } from "@/components/status-badge"

export default function BepPage() {
  const struktur = useStruktur()
  const [tetap, setTetap] = useState("")
  const [jual, setJual] = useState("")
  const [variabel, setVariabel] = useState("")
  const [pendapatan, setPendapatan] = useState("")
  const [biaya, setBiaya] = useState("")
  const [blokId, setBlokId] = useState("")
  const [bep, setBep] = useState<number | null>(null)
  const [lr, setLr] = useState<{ laba_rugi: number; status: "UNTUNG" | "RUGI" } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hitung = () => {
    const f = parseNum(tetap)
    const j = parseNum(jual)
    const v = parseNum(variabel)
    if (f == null || j == null || v == null) {
      setError("Isi biaya tetap, harga jual, dan biaya variabel")
      return
    }
    const r = hitungBEP(f, j, v)
    if (!r.success) {
      setError(r.error!.message)
      setBep(null)
      return
    }
    setError(null)
    setBep(r.data!)
    saveHistory("bep", { biaya_tetap: f, harga_jual_per_unit: j, biaya_variabel_per_unit: v }, { bep: r.data! }, blokId === "__none__" ? null : blokId || null)
  }

  const hitungLaba = () => {
    const p = parseNum(pendapatan)
    const b = parseNum(biaya)
    if (p == null || b == null) {
      setError("Isi total pendapatan dan total biaya")
      return
    }
    const r = hitungLabaRugi(p, b)
    setLr(r.data!)
    setError(null)
  }

  return (
    <>
      <PageHeader
        title="Pendapatan & BEP"
        description="Titik impas produksi di mana kebun mulai untung — kunci untuk kebun baru/replanting menilai kapan investasi kembali."
        category="Produksi & Ekonomi"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Break Even Point</CardTitle>
              <CardDescription>BEP = biaya tetap ÷ (harga jual − biaya variabel)</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <NumberField id="tetap" label="Biaya tetap" unit="Rp" value={tetap} onChange={setTetap} placeholder="mis. 500000000" />
              <div className="grid grid-cols-2 gap-4">
                <NumberField id="jual" label="Harga jual per unit" unit="Rp" value={jual} onChange={setJual} placeholder="mis. 3726" />
                <NumberField id="variabel" label="Biaya variabel / unit" unit="Rp" value={variabel} onChange={setVariabel} placeholder="mis. 2000" />
              </div>
              {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} allowNone />}
              <Button onClick={hitung} className="mt-2 w-full">
                Hitung BEP
              </Button>
            </CardContent>
          </Card>
          <ResultPanel
            title="Hasil BEP"
            error={error}
            rows={
              bep != null
                ? [{ label: "BEP (unit produksi)", value: bep.toLocaleString("id-ID"), unit: "unit", highlight: true }]
                : []
            }
          />
        </div>
        <div className="flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Laba / rugi</CardTitle>
              <CardDescription>Bisa diisi dari akumulasi Menu Pengiriman TBS dan Menu Kebutuhan Pupuk.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <NumberField id="pendapatan" label="Total pendapatan" unit="Rp" value={pendapatan} onChange={setPendapatan} placeholder="mis. 100000000" />
              <NumberField id="biaya" label="Total biaya operasional" unit="Rp" value={biaya} onChange={setBiaya} placeholder="mis. 70000000" />
              <Button onClick={hitungLaba} className="mt-2 w-full" variant="secondary">
                Hitung laba / rugi
              </Button>
            </CardContent>
          </Card>
          {lr && (
            <div className="flex flex-col gap-3">
              <ResultPanel
                title="Hasil laba / rugi"
                rows={[
                  { label: "Laba / rugi", value: "Rp " + Math.abs(lr.laba_rugi).toLocaleString("id-ID"), highlight: true },
                ]}
              />
              <StatusBadge status={lr.status} variant={statusVariantFor(lr.status)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
