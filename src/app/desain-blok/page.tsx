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
import { hitungDesainBlok } from "@/lib/engine/populasi"
import { StatusBadge, statusVariantFor } from "@/components/status-badge"
import type { DesainBlokResult } from "@/lib/engine/types"

export default function DesainBlokPage() {
  const struktur = useStruktur()
  const [kotor, setKotor] = useState("")
  const [jalan, setJalan] = useState("")
  const [parit, setParit] = useState("")
  const [blokId, setBlokId] = useState("")
  const [result, setResult] = useState<DesainBlokResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hitung = () => {
    const k = parseNum(kotor)
    const j = parseNum(jalan)
    const p = parseNum(parit)
    if (k == null || j == null || p == null) {
      setError("Isi luas kotor, jalan, dan parit dengan angka valid")
      setResult(null)
      return
    }
    const r = hitungDesainBlok(k, j, p)
    if (!r.success) {
      setError(r.error!.message)
      setResult(null)
      return
    }
    setError(null)
    setResult(r.data!)
    saveHistory("desain_blok", { luas_kotor_ha: k, luas_jalan_ha: j, luas_parit_ha: p }, r.data!, blokId === "__none__" ? null : blokId || null)
  }

  return (
    <>
      <PageHeader
        title="Desain Blok & Jalan Produksi"
        description="Hitung luas efektif tanam setelah dikurangi jalan produksi dan parit/drainase. Target rasio efektif minimal 90%."
        category="Perencanaan Tanam"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>Konversi otomatis lebar × panjang dilakukan manual sebelum input.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="kotor" label="Luas kotor blok" unit="ha" value={kotor} onChange={setKotor} placeholder="mis. 30" />
            <NumberField id="jalan" label="Luas jalan produksi" unit="ha" value={jalan} onChange={setJalan} placeholder="mis. 1.5" />
            <NumberField id="parit" label="Luas parit / drainase" unit="ha" value={parit} onChange={setParit} placeholder="mis. 1" />
            {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} allowNone />}
            <Button onClick={hitung} className="mt-2 w-full">
              Hitung
            </Button>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <ResultPanel
            title="Hasil perhitungan"
            error={error}
            rows={
              result
                ? [
                    { label: "Luas efektif tanam", value: result.luas_efektif.toLocaleString("id-ID"), unit: "ha", highlight: true },
                    { label: "Rasio luas efektif", value: (result.rasio_efektif * 100).toLocaleString("id-ID"), unit: "%" },
                  ]
                : []
            }
          />
          {result && (
            <div className="flex items-center gap-2">
              <StatusBadge status={result.status} variant={statusVariantFor(result.status)} />
              <span className="text-xs text-muted-foreground">
                {result.status === "SESUAI STANDAR" ? "Desain blok memenuhi target efisiensi lahan." : "Kurangi luas jalan/parit untuk mencapai rasio ≥ 90%."}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
