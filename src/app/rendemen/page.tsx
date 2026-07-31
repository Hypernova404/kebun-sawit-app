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
import { hitungRendemen } from "@/lib/engine/produksi"
import { Badge } from "@/components/ui/badge"
import type { RendemenResult } from "@/lib/engine/types"

export default function RendemenPage() {
  const struktur = useStruktur()
  const [tonase, setTonase] = useState("")
  const [varietas, setVarietas] = useState("Tenera")
  const [matang, setMatang] = useState("matang")
  const [cpoOv, setCpoOv] = useState("")
  const [kernelOv, setKernelOv] = useState("")
  const [blokId, setBlokId] = useState("")
  const [result, setResult] = useState<RendemenResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hitung = () => {
    const t = parseNum(tonase)
    if (t == null) {
      setError("Isi tonase TBS dengan angka valid")
      setResult(null)
      return
    }
    const override =
      cpoOv.trim() !== "" || kernelOv.trim() !== ""
        ? {
            cpo: (parseNum(cpoOv) ?? 0) / 100,
            kernel: (parseNum(kernelOv) ?? 0) / 100,
          }
        : null
    const r = hitungRendemen(t, varietas, matang, override)
    if (!r.success) {
      setError(r.error!.message)
      setResult(null)
      return
    }
    setError(null)
    setResult(r.data!)
    saveHistory("rendemen", { tonase_TBS: t, varietas, tingkat_matang: matang, override_persen: override }, r.data!, blokId === "__none__" ? null : blokId || null)
  }

  return (
    <>
      <PageHeader
        title="Rendemen CPO & Kernel"
        description="Konversi standar PKS: rendemen tergantung varietas dan tingkat kematangan buah saat panen. Buah mentah kena denda potongan harga."
        category="Produksi & Ekonomi"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription>Default: Tenera matang ≈ 22% CPO, 5% kernel; Dura matang ≈ 16% CPO.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <NumberField id="tonase" label="Tonase TBS" unit="ton" value={tonase} onChange={setTonase} placeholder="mis. 25" />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Varietas</Label>
                <Select value={varietas} onValueChange={(v) => setVarietas(v ?? "Tenera")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tenera">Tenera</SelectItem>
                    <SelectItem value="Dura">Dura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tingkat kematangan</Label>
                <Select value={matang} onValueChange={(v) => setMatang(v ?? "matang")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="matang">Matang</SelectItem>
                    <SelectItem value="mengkal">Mengkal</SelectItem>
                    <SelectItem value="mentah">Mentah</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Override manual (persen, opsional):</p>
            <div className="grid grid-cols-2 gap-4">
              <NumberField id="cpo" label="Rendemen CPO" unit="%" value={cpoOv} onChange={setCpoOv} />
              <NumberField id="kernel" label="Rendemen kernel" unit="%" value={kernelOv} onChange={setKernelOv} />
            </div>
            {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} allowNone />}
            <Button onClick={hitung} className="mt-2 w-full">
              Hitung
            </Button>
          </CardContent>
        </Card>
        <ResultPanel
          title="Hasil konversi"
          error={error}
          rows={
            result
              ? [
                  { label: "CPO", value: result.cpo_ton.toLocaleString("id-ID"), unit: "ton", highlight: true },
                  { label: "Kernel", value: result.kernel_ton.toLocaleString("id-ID"), unit: "ton" },
                  { label: "Sumber rendemen", value: result.source === "MANUAL_OVERRIDE" ? "Manual (override)" : "Tabel default" },
                ]
              : []
          }
        />
        {result && (
          <Badge variant="secondary" className="w-fit">
            {result.source === "MANUAL_OVERRIDE" ? "Manual override" : "Default"}
          </Badge>
        )}
      </div>
    </>
  )
}
