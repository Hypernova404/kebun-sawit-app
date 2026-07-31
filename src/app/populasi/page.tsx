"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { ResultPanel } from "@/components/result-panel"
import { BlokSelect } from "@/components/blok-select"
import { useStruktur } from "@/components/use-struktur"
import { saveHistory } from "@/components/calc-save"
import { hitungPopulasi, POLA_MAP } from "@/lib/engine/populasi"
import type { PopulasiResult } from "@/lib/engine/types"

export default function PopulasiPage() {
  const struktur = useStruktur()
  const [luas, setLuas] = useState("")
  const [jarak, setJarak] = useState("")
  const [pola, setPola] = useState("segitiga_sama_sisi")
  const [blokId, setBlokId] = useState("")
  const [result, setResult] = useState<PopulasiResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hitung = () => {
    const l = parseNum(luas)
    const j = parseNum(jarak)
    if (l == null || j == null) {
      setError("Isi luas lahan dan jarak tanam dengan angka valid")
      setResult(null)
      return
    }
    const r = hitungPopulasi(l, j, pola)
    if (!r.success) {
      setError(r.error!.message)
      setResult(null)
      return
    }
    setError(null)
    setResult(r.data!)
    saveHistory("populasi", { luas_ha: l, jarak_tanam: j, pola }, r.data!, blokId === "__none__" ? null : blokId || null)
  }

  return (
    <>
      <PageHeader
        title="Populasi & Luas Lahan"
        description="Hitung jumlah pokok dan populasi per hektar berdasarkan pola tanam. Jarak baris dihitung otomatis dari geometri pola."
        category="Perencanaan Tanam"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>Rentang jarak tanam umum industri: 7–10 m</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="luas" label="Luas lahan" unit="ha" value={luas} onChange={setLuas} placeholder="mis. 30" />
            <NumberField id="jarak" label="Jarak tanam" unit="m" value={jarak} onChange={setJarak} placeholder="mis. 9" hint="Di luar 7–10 m muncul peringatan, tetap bisa dihitung." />
            <div className="flex flex-col gap-1.5">
              <Label>Pola tanam</Label>
              <Select value={pola} onValueChange={(v) => setPola(v ?? "segitiga_sama_sisi")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(POLA_MAP).map((p) => (
                    <SelectItem key={p} value={p}>
                      {p === "segitiga_sama_sisi" ? "Segitiga sama sisi" : p === "mata_lima" ? "Mata lima" : "Persegi (bujur sangkar)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mata lima = metode pemancangan, secara geometri identik dengan segitiga sama sisi.
              </p>
            </div>
            {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} allowNone />}
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
