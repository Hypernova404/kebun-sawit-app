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
import { getRiwayat, downloadPDF, hapusRiwayat, hapusRiwayatBanyak } from "@/lib/actions"
import { LABEL_MENU } from "@/lib/label-menu"
import { b64ToBlob, downloadBlob } from "@/lib/client-file"
import JSZip from "jszip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  const [confirmOpen, setConfirmOpen] = useState(false)

  const fetchData = useCallback(async (kategoriFilter: string | null, blokFilter: string | null) => {
    return (await getRiwayat(kategoriFilter, blokFilter)) as Entry[]
  }, [])

  useEffect(() => {
    const kategoriFilter = kategori && kategori !== "__all__" ? kategori : null
    let cancelled = false
    fetchData(kategoriFilter, blok || null).then((data) => {
      if (cancelled) return
      setEntries(data)
      setSelected(new Set())
    })
    return () => {
      cancelled = true
    }
  }, [fetchData, kategori, blok])

  const refresh = useCallback(async () => {
    const kategoriFilter = kategori && kategori !== "__all__" ? kategori : null
    const data = await fetchData(kategoriFilter, blok || null)
    setEntries(data)
    setSelected(new Set())
  }, [fetchData, kategori, blok])

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
    const ids = selected.size > 0 ? [...selected] : entries!.map((e) => e.id)
    const res = await downloadPDF(ids)
    setBusy(false)
    if ("error" in res && res.error) {
      alert(res.error)
      return
    }
    const items = res.items!
    if (items.length === 1) {
      const blob = b64ToBlob(items[0].buffer, "application/pdf")
      downloadBlob(blob, `perhitungan-${items[0].id}.pdf`)
      return
    }
    const zip = new JSZip()
    for (const item of items) {
      zip.file(`perhitungan-${item.id}.pdf`, b64ToBlob(item.buffer, "application/pdf"))
    }
    const blob = await zip.generateAsync({ type: "blob" })
    downloadBlob(blob, `history-perhitungan-${new Date().toISOString().slice(0, 10)}.zip`)
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
    refresh()
  }

  const hapusBanyak = async () => {
    setConfirmOpen(false)
    const ids = selected.size > 0 ? [...selected] : entries!.map((e) => e.id)
    setBusy(true)
    const res = await hapusRiwayatBanyak(ids)
    setBusy(false)
    if (res && "error" in res && res.error) {
      alert(res.error)
      return
    }
    refresh()
  }

  const hapusCount = selected.size > 0 ? selected.size : entries?.length ?? 0

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
            <Button
              onClick={exportPdf}
              disabled={!entries || busy}
              className="whitespace-nowrap min-w-48"
            >
              <Download data-icon="inline-start" />
              {selected.size > 0
                ? `Unduh Terpilih (${selected.size})`
                : `Unduh Semua (${entries?.length ?? 0})`}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText data-icon />
                Daftar riwayat
              </CardTitle>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger
                  disabled={!entries || entries.length === 0 || busy}
                  aria-label={hapusCount > 0 ? `Hapus ${hapusCount} riwayat` : "Hapus riwayat"}
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 data-icon="inline-start" className="size-4" />
                      {selected.size > 0 ? `Hapus ${selected.size} Riwayat` : "Hapus Riwayat"}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {selected.size > 0 ? `Hapus ${selected.size} riwayat` : "Hapus semua riwayat"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {hapusCount} riwayat akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={hapusBanyak}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
                Belum ada riwayat. Jalankan kalkulator mana pun - hasilnya otomatis tersimpan di sini.
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
                      <TableCell>{e.blok_kode ?? "-"}</TableCell>
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
