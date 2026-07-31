"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
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
import {
  cekJarakAntagonis,
  generateJadwalTahunan,
  getDosisTBM,
  getDosisTM,
  JENIS_PUPUK,
  validasiWaktuAplikasi,
} from "@/lib/engine/pemupukan"
import { hitungStatusBlok } from "@/lib/engine/populasi"
import { statusVariantFor, StatusBadge } from "@/components/status-badge"
import type { JadwalItem, RainRecord } from "@/lib/engine/types"

const WILAYAH = ["Kalimantan Barat", "Riau", "Sumatera Utara", "Jambi"]
const JENIS_LAHAN = ["mineral", "gambut", "pasir", "eks_lalang"]

const TABS = ["Jadwal blok", "Lookup dosis", "Validasi aplikasi", "Pupuk antagonis"] as const

export default function PemupukanPage() {
  const struktur = useStruktur()
  const [tab, setTab] = useState<(typeof TABS)[number]>("Jadwal blok")

  const [blokId, setBlokId] = useState("")
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [wilayah, setWilayah] = useState("Kalimantan Barat")
  const [jadwal, setJadwal] = useState<JadwalItem[] | null>(null)
  const [jadwalErr, setJadwalErr] = useState<string | null>(null)

  const [mode, setMode] = useState<"TBM" | "TM">("TBM")
  const [umur, setUmur] = useState("12")
  const [jenisLookup, setJenisLookup] = useState("Urea")
  const [jenisLahan, setJenisLahan] = useState("mineral")
  const [override, setOverride] = useState("")
  const [lookupResult, setLookupResult] = useState<{ dosis: number | null; source: string; warning?: string } | null>(null)
  const [lookupErr, setLookupErr] = useState<string | null>(null)

  const [jenisHujan, setJenisHujan] = useState("Urea")
  const [hujan7, setHujan7] = useState<string[]>(["25", "10", "0", "0", "0", "0", "12"])
  const [hujanKemarin, setHujanKemarin] = useState("20")
  const [aplikasiResult, setAplikasiResult] = useState<string | null>(null)

  const [pupukA, setPupukA] = useState("Kalium")
  const [pupukB, setPupukB] = useState("Magnesium")
  const [jarakHari, setJarakHari] = useState("2")
  const [antagonisResult, setAntagonisResult] = useState<string | null>(null)

  const runJadwal = () => {
    setJadwalErr(null)
    setJadwal(null)
    const blok = struktur?.flatMap((k) => k.afdelingen.flatMap((a) => a.bloks)).find((b) => b.id === blokId)
    if (!blok) {
      setJadwalErr("Pilih blok terlebih dahulu")
      return
    }
    const t = parseNum(tahun)
    if (t == null) {
      setJadwalErr("Tahun tidak valid")
      return
    }
    const status = hitungStatusBlok(blok.tahunTanam, t)
    if (!status.success) {
      setJadwalErr(status.error!.message)
      return
    }
    const r = generateJadwalTahunan({ tahun_tanam: blok.tahunTanam, jenis_lahan: blok.jenisLahan }, t, wilayah)
    if (!r.success) {
      setJadwalErr(r.error!.message)
      return
    }
    const data = r.data!
    setJadwal(data)
    saveHistory("pemupukan", { blok_id: blok.id, tahun: t, wilayah, status_blok: status.data!.status }, data, blok.id)
  }

  const runLookup = () => {
    setLookupErr(null)
    setLookupResult(null)
    const u = parseNum(umur)
    if (u == null) {
      setLookupErr("Umur tidak valid")
      return
    }
    let r
    if (mode === "TBM") {
      r = getDosisTBM(Math.floor(u), jenisLookup, jenisLahan)
    } else {
      const ov = override.trim() === "" ? null : parseNum(override)
      r = getDosisTM(Math.floor(u), jenisLookup, ov)
    }
    if (!r.success) {
      setLookupErr(r.error!.message)
      return
    }
    setLookupResult({ dosis: r.data!.dosis, source: r.data!.source, warning: r.data!.warning })
  }

  const runAplikasi = () => {
    const records: RainRecord[] = hujan7.map((v, i) => ({
      tanggal: `hari-${7 - i}`,
      curah_hujan_mm: parseNum(v) ?? 0,
    }))
    const kemarin = parseNum(hujanKemarin) ?? 0
    const r = validasiWaktuAplikasi(jenisHujan, records, kemarin)
    setAplikasiResult(r.data!)
  }

  const runAntagonis = () => {
    const r = cekJarakAntagonis(pupukA, pupukB, parseNum(jarakHari) ?? 0)
    setAntagonisResult(r.data!)
  }

  return (
    <>
      <PageHeader
        title="Dosis & Jadwal Pemupukan"
        description="Referensi dosis TBM per bulan dan TM per kelompok umur (SOP Agro-07/03 & BRMP Babel), jadwal semester per wilayah, serta validasi waktu aplikasi."
        category="Pemupukan & Nutrisi"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
              {t}
            </Button>
          ))}
        </div>

        {tab === "Jadwal blok" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Generate jadwal tahunan</CardTitle>
                <CardDescription>Dosis per jenis pupuk sesuai umur blok; TBM otomatis memakai tabel per bulan, TM memakai kelompok umur.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {struktur && <BlokSelect struktur={struktur} value={blokId} onChange={setBlokId} />}
                <NumberField id="tahun" label="Tahun rencana" unit="" value={tahun} onChange={setTahun} />
                <div className="flex flex-col gap-1.5">
                  <Label>Wilayah kebun</Label>
                  <Select value={wilayah} onValueChange={(v) => setWilayah(v ?? "Kalimantan Barat")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WILAYAH.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={runJadwal} className="mt-2 w-full">
                  Generate jadwal
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Jadwal tahunan</CardTitle>
              </CardHeader>
              <CardContent>
                {jadwalErr && <p className="text-sm text-danger">{jadwalErr}</p>}
                {!jadwal && !jadwalErr && (
                  <p className="text-sm text-muted-foreground">Belum ada jadwal. Pilih blok lalu tekan Generate.</p>
                )}
                {jadwal && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="text-right">Dosis</TableHead>
                        <TableHead className="text-right">Frekuensi</TableHead>
                        <TableHead>Sumber</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jadwal.map((item) => (
                        <TableRow key={item.jenis}>
                          <TableCell className="font-medium">{item.jenis}</TableCell>
                          <TableCell className="num text-right">{item.dosis} g/kg</TableCell>
                          <TableCell className="num text-right">{item.frekuensi}×/thn</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.dosis_source === "LSU_OVERRIDE" ? "Override LSU" : item.dosis_source}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {jadwal && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Semester I: {jadwal[0]?.jadwal_semester.semester_1.bulan} · Semester II: {jadwal[0]?.jadwal_semester.semester_2.bulan} · Hindari: {jadwal[0]?.jadwal_semester.bulan_dihindari.join(", ") || "—"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "Lookup dosis" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Lookup dosis</CardTitle>
                <CardDescription>TBM: tabel per bulan sejak tanam (gram/pokok). TM: kelompok umur (kg/pokok/tahun), override LSU diprioritaskan.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex gap-2">
                  {(["TBM", "TM"] as const).map((m) => (
                    <Button key={m} variant={mode === m ? "default" : "outline"} size="sm" onClick={() => setMode(m)}>
                      {m === "TBM" ? "TBM (bulan)" : "TM (tahun)"}
                    </Button>
                  ))}
                </div>
                <NumberField id="umur" label={mode === "TBM" ? "Umur (bulan sejak tanam)" : "Umur (tahun)"} unit="" value={umur} onChange={setUmur} />
                <div className="flex flex-col gap-1.5">
                  <Label>Jenis pupuk</Label>
                  <Select value={jenisLookup} onValueChange={(v) => setJenisLookup(v ?? "Urea")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_PUPUK.map((j) => (
                        <SelectItem key={j} value={j}>
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {mode === "TBM" ? (
                  <div className="flex flex-col gap-1.5">
                    <Label>Jenis lahan</Label>
                    <Select value={jenisLahan} onValueChange={(v) => setJenisLahan(v ?? "mineral")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {JENIS_LAHAN.map((j) => (
                          <SelectItem key={j} value={j}>
                            {j}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <NumberField id="override" label="Override dosis LSU (kg/pokok, opsional)" unit="kg" value={override} onChange={setOverride} hint="Kosongkan untuk memakai tabel default." />
                )}
                <Button onClick={runLookup} className="mt-2 w-full">
                  Cari dosis
                </Button>
              </CardContent>
            </Card>
            <ResultPanel
              title="Hasil lookup"
              error={lookupErr}
              warning={lookupResult?.warning ?? null}
              rows={
                lookupResult
                  ? [
                      { label: "Dosis", value: lookupResult.dosis == null ? "—" : lookupResult.dosis.toLocaleString("id-ID"), unit: mode === "TBM" ? "g/pokok" : "kg/pokok", highlight: true },
                      { label: "Sumber", value: lookupResult.source === "LSU_OVERRIDE" ? "Rekomendasi LSU" : lookupResult.source === "DEFAULT_TABLE" ? "Tabel default" : "Tabel TBM" },
                    ]
                  : []
              }
            />
          </div>
        )}

        {tab === "Validasi aplikasi" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Go / no-go aplikasi</CardTitle>
                <CardDescription>Urea: hentikan bila 3 hari kering berturut-turut. Lainnya: 7 hari. Tunda 1 hari bila hujan kemarin &gt; 60 mm.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Jenis pupuk</Label>
                  <Select value={jenisHujan} onValueChange={(v) => setJenisHujan(v ?? "Urea")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {JENIS_PUPUK.map((j) => (
                        <SelectItem key={j} value={j}>
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {hujan7.map((v, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">H-{7 - i}</Label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={v}
                        onChange={(e) => {
                          const next = [...hujan7]
                          next[i] = e.target.value
                          setHujan7(next)
                        }}
                        className="h-9 w-full rounded-md border border-input bg-background px-2 text-center text-sm"
                      />
                    </div>
                  ))}
                </div>
                <NumberField id="kemarin" label="Curah hujan kemarin" unit="mm" value={hujanKemarin} onChange={setHujanKemarin} />
                <Button onClick={runAplikasi} className="mt-2 w-full">
                  Validasi
                </Button>
              </CardContent>
            </Card>
            <ResultPanel
              title="Keputusan aplikasi"
              rows={
                aplikasiResult
                  ? [
                      {
                        label: "Status",
                        value: aplikasiResult,
                        highlight: true,
                      },
                    ]
                  : []
              }
            />
            {aplikasiResult && (
              <div className="-mt-4 flex items-center gap-2">
                <StatusBadge status={aplikasiResult} variant={statusVariantFor(aplikasiResult)} />
              </div>
            )}
          </div>
        )}

        {tab === "Pupuk antagonis" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Cek jarak antagonis</CardTitle>
                <CardDescription>
                  Pasangan antagonis: Amonium (non-Urea) ↔ Alkalis, Kalium ↔ Magnesium, Kalium ↔ Kaptan. Jarak minimal 3 hari.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Pupuk A</Label>
                  <Select value={pupukA} onValueChange={(v) => setPupukA(v ?? "Kalium")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Urea", "Amonium(non-Urea)", "Kalium", "Magnesium", "Alkalis", "Kaptan"].map((j) => (
                        <SelectItem key={j} value={j}>
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Pupuk B</Label>
                  <Select value={pupukB} onValueChange={(v) => setPupukB(v ?? "Magnesium")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Urea", "Amonium(non-Urea)", "Kalium", "Magnesium", "Alkalis", "Kaptan"].map((j) => (
                        <SelectItem key={j} value={j}>
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <NumberField id="jarak" label="Jarak hari rencana aplikasi" unit="hari" value={jarakHari} onChange={setJarakHari} />
                <Button onClick={runAntagonis} className="mt-2 w-full">
                  Cek
                </Button>
              </CardContent>
            </Card>
            <ResultPanel
              title="Hasil cek antagonis"
              rows={antagonisResult ? [{ label: "Status", value: antagonisResult, highlight: true }] : []}
            />
            {antagonisResult && (
              <div className="-mt-4 flex items-center gap-2">
                <StatusBadge status={antagonisResult} variant={antagonisResult.includes("WARNING") ? "warning" : "success"} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
