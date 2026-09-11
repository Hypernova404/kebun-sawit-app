"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { ResultPanel } from "@/components/result-panel"
import { saveHistory } from "@/components/calc-save"
import { hitungPopulasi } from "@/lib/engine/populasi"
import type { PopulasiResult } from "@/lib/engine/types"

const POLA_LABEL: Record<string, string> = {
  persegi: "Persegi (bujur sangkar)",
  segitiga_sama_sisi: "Segitiga sama sisi",
  persegi_panjang: "Persegi panjang",
}

export default function PopulasiPage() {
  const [luas, setLuas] = useState("")
  const [jarak, setJarak] = useState("")
  const [jarakBaris, setJarakBaris] = useState("")
  const [result, setResult] = useState<PopulasiResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hitung = () => {
    const l = parseNum(luas)
    const j = parseNum(jarak)
    const jb = parseNum(jarakBaris)
    if (l == null || j == null || jb == null) {
      setError("Isi luas lahan, jarak tanam, dan jarak baris dengan angka valid")
      setResult(null)
      return
    }
    const r = hitungPopulasi(l, j, jb)
    if (!r.success) {
      setError(r.error!.message)
      setResult(null)
      return
    }
    setError(null)
    setResult(r.data!)
    saveHistory("populasi", { luas_ha: l, jarak_tanam: j, jarak_baris: jb }, r.data!)
  }

  return (
    <>
      <PageHeader
        title="Populasi & Luas Lahan"
        description="Hitung jumlah pokok dan populasi per hektar. Jarak tanam dan jarak baris diisi manual, pola tanam terdeteksi otomatis dari kedua jarak tersebut."
        category="Perencanaan Tanam"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>Rentang jarak tanam umum industri: 7–10 m</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="luas" label="Luas lahan" unit="ha" value={luas} onChange={setLuas} />
            <NumberField id="jarak" label="Jarak antar tanaman" unit="m" value={jarak} onChange={setJarak} hint="Di luar 7–10 m muncul peringatan, tetap bisa dihitung." />
            <NumberField id="jarak-baris" label="Jarak antar baris" unit="m" value={jarakBaris} onChange={setJarakBaris} hint="Diisi manual - jarak antar baris tanaman di lapangan." />
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
                  { label: "Pola tanam", value: POLA_LABEL[result.pola] ?? result.pola, unit: "" },
                  { label: "Jarak antar tanaman", value: result.jarak_tanam.toLocaleString("id-ID"), unit: "m" },
                  { label: "Jarak antar baris", value: result.jarak_baris.toLocaleString("id-ID"), unit: "m" },
                  { label: "Luas per pokok", value: result.luas_per_pokok.toLocaleString("id-ID"), unit: "m²" },
                  { label: "Populasi per ha", value: result.populasi_per_ha.toLocaleString("id-ID"), unit: "pokok/ha" },
                  { label: "Jumlah pokok", value: result.jumlah_pokok.toLocaleString("id-ID"), unit: "pokok", highlight: true },
                ]
              : []
          }
        />
      </div>
    </>
  )
}
