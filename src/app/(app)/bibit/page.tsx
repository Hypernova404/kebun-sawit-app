"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { ResultPanel } from "@/components/result-panel"
import { saveHistory } from "@/components/calc-save"
import { hitungKebutuhanBibit } from "@/lib/engine/populasi"
import type { BibitResult } from "@/lib/engine/types"

export default function BibitPage() {
  const [pokok, setPokok] = useState("")
  const [persen, setPersen] = useState("7")
  const [result, setResult] = useState<BibitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hitung = () => {
    const p = parseNum(pokok)
    const ps = parseNum(persen)
    if (p == null || ps == null) {
      setError("Isi jumlah pokok dan persentase sulaman dengan angka valid")
      setResult(null)
      return
    }
    const r = hitungKebutuhanBibit(Math.floor(p), ps / 100)
    if (!r.success) {
      setError(r.error!.message)
      setResult(null)
      return
    }
    setError(null)
    setResult(r.data!)
    saveHistory("bibit", { jumlah_pokok: Math.floor(p), persen_sulaman: ps / 100 }, r.data!)
  }

  return (
    <>
      <PageHeader
        title="Kebutuhan Bibit"
        description="Hitung total bibit termasuk cadangan sulaman untuk mengganti pokok yang mati/gagal tumbuh pasca tanam."
        category="Perencanaan Tanam"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>Cadangan sulaman standar SOP: 5–10%</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="pokok" label="Jumlah pokok (dari Menu Populasi)" unit="pokok" value={pokok} onChange={setPokok} />
            <NumberField id="persen" label="Cadangan sulaman" unit="%" value={persen} onChange={setPersen} hint="Default 7%." />
            <Button onClick={hitung} className="mt-2 w-full">
              Hitung
            </Button>
          </CardContent>
        </Card>
        <ResultPanel
          title="Hasil perhitungan"
          error={error}
          warning={result?.warning ?? null}
          rows={
            result
              ? [
                  { label: "Total bibit yang dibutuhkan", value: result.total_bibit.toLocaleString("id-ID"), unit: "bibit", highlight: true },
                  { label: "Cadangan sulaman", value: result.cadangan.toLocaleString("id-ID"), unit: "bibit" },
                ]
              : []
          }
        />
      </div>
    </>
  )
}
