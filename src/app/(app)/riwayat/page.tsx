"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Download, FileText, Filter, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { getRiwayat, downloadPDF, hapusRiwayat } from "@/lib/actions"
import { LABEL_MENU } from "@/lib/label-menu"
import { b64ToBlob, downloadBlob } from "@/lib/client-file"

type Entry = {
  id: string
  jenis_menu: string
  tanggal: Date
  data_input: unknown
  data_hasil: unknown
  blok_kode: string | null
}

const KATEGORI = Object.keys(LABEL_MENU)

export default function RiwayatPage() {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [kategori, setKategori] = useState("")
  const [blok, setBlok] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setEntries(null)
    const kategoriFilter = kategori && kategori !== "__all__" ? kategori : null
    getRiwayat(kategoriFilter, blok || null).then((data) => {
      setEntries(data as Entry[])
      setSelected(new Set())
    })
  }, [kategori, blok])

  useEffect(() => {
    load()
  }, [load])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exportPdf = async () => {
    setBusy(true)
    const ids = selected.size > 0 ? [...selected] : entries!.slice(0, 20).map((e) => e.id)
    const res = await downloadPDF(ids)
    setBusy(false)
    if ("error" in res && res.error) {
      alert(res.error)
      return
    }
    const blob = b64ToBlob(res.buffer as string, "application/pdf")
    downloadBlob(blob, `riwayat-kalkulasi-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const hapus = async (id: string) => {
    if (!confirm("Hapus entri riwayat ini? Tindakan ini tidak bisa dibatalkan.")) return
    setBusy(true)
    const res = await hapusRiwayat(id)
    setBusy(false)
    if (res && "error" in res && res.error) {
      alert(res.error)
      return
    }
    load()
  }

  return (
    <>
      <PageHeader
        title="Riwayat & Laporan"
        description="Satu menu terpusat untuk seluruh histori kalkulasi dari semua menu. Pilih entri lalu unduh PDF gabungan."
        category="Alat Bantu & Referensi"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        <Card className="shadow-sm">
          <CardContent className="flex flex-wrap items-end gap-4 pt-5">
            <div className="flex min-w-48 flex-1 flex-col gap-1.5">
              <Label className="flex items-center gap-1.5">
                <Filter data-icon className="size-3.5" />
                Kategori menu
              </Label>
              <Select value={kategori} onValueChange={(v) => setKategori(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua kategori</SelectItem>
                  {KATEGORI.map((k) => (
                    <SelectItem key={k} value={k}>
                      {LABEL_MENU[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-w-40 flex-1 flex-col gap-1.5">
              <Label htmlFor="fb">Filter blok (kode)</Label>
              <Input id="fb" placeholder="mis. A1-01" value={blok} onChange={(e) => setBlok(e.target.value)} />
            </div>
            <Button onClick={exportPdf} disabled={!entries || busy}>
              <Download data-icon="inline-start" />
              {selected.size > 0 ? `Unduh PDF (${selected.size} entri)` : "Unduh PDF (20 terbaru)"}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText data-icon />
              Daftar riwayat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!entries ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada riwayat. Jalankan kalkulator mana pun — hasilnya otomatis tersimpan di sini.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Menu</TableHead>
                    <TableHead>Blok</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id} className={selected.has(e.id) ? "bg-secondary/60" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="size-4 accent-[#2f5233]"
                          checked={selected.has(e.id)}
                          onChange={() => toggle(e.id)}
                          aria-label={`Pilih entri ${e.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{LABEL_MENU[e.jenis_menu] ?? e.jenis_menu}</Badge>
                      </TableCell>
                      <TableCell>{e.blok_kode ?? "—"}</TableCell>
                      <TableCell>{new Date(e.tanggal).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link href={`/riwayat/${e.id}`} className="text-sm text-primary hover:underline">
                            Buka
                          </Link>
                          <button
                            onClick={() => hapus(e.id)}
                            disabled={busy}
                            className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                            aria-label={`Hapus entri ${e.id}`}
                          >
                            <Trash2 data-icon className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
