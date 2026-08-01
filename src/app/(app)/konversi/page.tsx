"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/page-header"
import { NumberField, parseNum } from "@/components/form-field"
import { ResultPanel } from "@/components/result-panel"
import { saveHistory } from "@/components/calc-save"
import { konversi } from "@/lib/engine/konversi"

const LUAS = ["ha", "m2", "tumbak"]
const BERAT = ["ton", "kg", "kuintal"]

export default function KonversiPage() {
  const [nilai, setNilai] = useState("")
  const [grup, setGrup] = useState<"luas" | "berat">("luas")
  const [dari, setDari] = useState("ha")
  const [ke, setKe] = useState("m2")
  const [tumbak, setTumbak] = useState("14")
  const [result, setResult] = useState<{ nilai: number; faktor: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const gantiGrup = (g: "luas" | "berat") => {
    setGrup(g)
    const s = g === "luas" ? LUAS : BERAT
    setDari(s[0])
    setKe(s[1])
  }

  const hitung = () => {
    const n = parseNum(nilai)
    if (n == null) {
      setError("Isi nilai dengan angka valid")
      return
    }
    const t = parseNum(tumbak) ?? 14
    const r = konversi(n, dari, ke, t)
    if (!r.success) {
      setError(r.error!.message)
      return
    }
    setError(null)
    setResult({ nilai: r.data!.nilai, faktor: r.data!.faktor })
    saveHistory("konversi", { nilai: n, dari_satuan: dari, ke_satuan: ke, konfigurasi_tumbak: t }, r.data!)
  }

  return (
    <>
      <PageHeader
        title="Konversi Satuan"
        description="Alat bantu berdiri sendiri: luas (ha ↔ m² ↔ tumbak) dan berat (ton ↔ kg ↔ kuintal). Nilai 1 tumbak bervariasi per daerah."
        category="Alat Bantu & Referensi"
      />
      <div className="grid gap-6 px-6 py-6 lg:px-10 xl:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Input</CardTitle>
            <CardDescription></CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(["luas", "berat"] as const).map((g) => (
                <Button key={g} variant={grup === g ? "default" : "outline"} size="sm" onClick={() => gantiGrup(g)}>
                  {g === "luas" ? "Luas" : "Berat"}
                </Button>
              ))}
            </div>
            <NumberField id="nilai" label="Nilai" unit="" value={nilai} onChange={setNilai} placeholder="mis. 30" />
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Dari</Label>
                <Select value={dari} onValueChange={(v) => setDari(v ?? grup === "luas" ? "ha" : "ton")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(grup === "luas" ? LUAS : BERAT).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Ke</Label>
                <Select value={ke} onValueChange={(v) => setKe(v ?? grup === "luas" ? "m2" : "kg")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(grup === "luas" ? LUAS : BERAT).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {grup === "luas" && (
              <NumberField id="tumbak" label="Nilai 1 tumbak" unit="m²" value={tumbak} onChange={setTumbak} hint="Kalimantan Barat umumnya 14 m² (bisa diubah per daerah)." />
            )}
            <Button onClick={hitung} className="mt-2 w-full">
              Konversi
            </Button>
          </CardContent>
        </Card>
        <ResultPanel
          title="Hasil konversi"
          error={error}
          rows={
            result
              ? [
                  { label: "Hasil", value: result.nilai.toLocaleString("id-ID", { maximumFractionDigits: 4 }), unit: ke, highlight: true },
                  { label: "Faktor konversi", value: result.faktor.toLocaleString("id-ID", { maximumFractionDigits: 4 }) },
                ]
              : []
          }
        />
      </div>
    </>
  )
}
