"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, LandPlot, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { StatusBadge, statusVariantFor } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getStrukturKebun, hapusBlok, tambahAfdeling, tambahBlok, tambahKebun, type StrukturKebun } from "@/lib/actions"
import { WILAYAH } from "./wilayah"

export default function BlokPage() {
  const [struktur, setStruktur] = useState<StrukturKebun[] | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const refresh = () => getStrukturKebun().then(setStruktur)
  useEffect(() => {
    refresh()
  }, [])

  // kebun
  const [namaKebun, setNamaKebun] = useState("")
  const [lokasiKebun, setLokasiKebun] = useState("")
  const [wilayah, setWilayah] = useState("Kalimantan Barat")
  // afdeling
  const [kebunIdAfd, setKebunIdAfd] = useState("")
  const [kodeAfd, setKodeAfd] = useState("")
  const [namaAfd, setNamaAfd] = useState("")
  const [luasAfd, setLuasAfd] = useState("")
  // blok
  const [afdId, setAfdId] = useState("")
  const [kodeBlok, setKodeBlok] = useState("")
  const [luasBlok, setLuasBlok] = useState("")
  const [tahunBlok, setTahunBlok] = useState(String(new Date().getFullYear()))
  const [pokokBlok, setPokokBlok] = useState("")
  const [varietas, setVarietas] = useState("Tenera")
  const [jenisLahan, setJenisLahan] = useState("mineral")

  const run = async (fn: () => Promise<{ error?: string } | void | undefined>) => {
    const res = await fn()
    if (res && "error" in res && res.error) setMsg(res.error)
    else setMsg(null)
    await refresh()
  }

  return (
    <>
      <PageHeader
        title="Data Blok Kebun"
        description="Struktur Kebun → Afdeling → Blok. Status TBM/TM dihitung otomatis dari tahun tanam, tidak pernah disimpan manual."
        category="Manajemen Kebun"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        {msg && <p className="text-sm text-danger">{msg}</p>}

        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger render={<Button><Plus data-icon="inline-start" />Tambah Kebun</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah kebun</DialogTitle>
                <DialogDescription>Unit perusahaan terbesar, mis. Kebun Sungai Deras.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nk">Nama kebun</Label>
                  <Input id="nk" value={namaKebun} onChange={(e) => setNamaKebun(e.target.value)} placeholder="Kebun Sungai Deras" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lk">Lokasi</Label>
                  <Input id="lk" value={lokasiKebun} onChange={(e) => setLokasiKebun(e.target.value)} placeholder="Kalimantan Barat" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Wilayah jadwal pemupukan</Label>
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
              </div>
              <DialogFooter>
                <Button onClick={() => run(() => tambahKebun(namaKebun, lokasiKebun, wilayah))}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="secondary"><Plus data-icon="inline-start" />Tambah Afdeling</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah afdeling</DialogTitle>
                <DialogDescription>Unit kerja di bawah kebun, luas umum 500–800 ha.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Kebun</Label>
                  <Select value={kebunIdAfd} onValueChange={(v) => setKebunIdAfd(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kebun" />
                    </SelectTrigger>
                    <SelectContent>
                      {(struktur ?? []).map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ka">Kode</Label>
                    <Input id="ka" value={kodeAfd} onChange={(e) => setKodeAfd(e.target.value)} placeholder="A1" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="la">Luas</Label>
                    <Input id="la" type="number" value={luasAfd} onChange={(e) => setLuasAfd(e.target.value)} placeholder="600" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="na">Nama (opsional)</Label>
                  <Input id="na" value={namaAfd} onChange={(e) => setNamaAfd(e.target.value)} placeholder="Afdeling Utara" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => run(() => tambahAfdeling(kebunIdAfd, kodeAfd, namaAfd, Number(luasAfd)))}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger render={<Button variant="secondary"><Plus data-icon="inline-start" />Tambah Blok</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah blok</DialogTitle>
                <DialogDescription>Unit terkecil, luas umum 25–30 ha. Populasi bisa diisi dari Menu Populasi.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Afdeling</Label>
                  <Select value={afdId} onValueChange={(v) => setAfdId(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih afdeling" />
                    </SelectTrigger>
                    <SelectContent>
                      {(struktur ?? []).flatMap((k) =>
                        k.afdelingen.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {k.nama} / {a.kode}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kb">Kode blok (unik)</Label>
                    <Input id="kb" value={kodeBlok} onChange={(e) => setKodeBlok(e.target.value)} placeholder="A1-01" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="lb">Luas</Label>
                    <Input id="lb" type="number" value={luasBlok} onChange={(e) => setLuasBlok(e.target.value)} placeholder="30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tb">Tahun tanam</Label>
                    <Input id="tb" type="number" value={tahunBlok} onChange={(e) => setTahunBlok(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="pb">Jumlah pokok</Label>
                    <Input id="pb" type="number" value={pokokBlok} onChange={(e) => setPokokBlok(e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                    <Label>Jenis lahan</Label>
                    <Select value={jenisLahan} onValueChange={(v) => setJenisLahan(v ?? "mineral")}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["mineral", "gambut", "pasir", "eks_lalang"].map((j) => (
                          <SelectItem key={j} value={j}>
                            {j}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    run(() =>
                      tambahBlok({
                        afdelingId: afdId,
                        kode: kodeBlok,
                        luasHa: Number(luasBlok),
                        tahunTanam: Number(tahunBlok),
                        jumlahPokok: Number(pokokBlok) || 0,
                        varietas,
                        jenisLahan,
                      })
                    )
                  }
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!struktur ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        ) : struktur.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="rounded-full bg-muted p-4 text-muted-foreground">
                <LandPlot data-icon />
              </span>
              <p className="text-sm text-muted-foreground">Belum ada kebun. Mulai dengan menambah kebun pertama Anda.</p>
              <Button onClick={() => setMsg("")}>+ Tambah Kebun</Button>
            </CardContent>
          </Card>
        ) : (
          struktur.map((k) => (
            <Card key={k.id} className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">{k.nama}</CardTitle>
                <CardDescription>
                  {k.lokasi ?? "-"} · Wilayah pemupukan: {k.wilayah}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {k.afdelingen.map((a) => (
                  <div key={a.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Afdeling {a.kode}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {a.luasHa} ha
                        </span>
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Blok</TableHead>
                          <TableHead className="text-right">Luas (ha)</TableHead>
                          <TableHead className="text-right">Pokok</TableHead>
                          <TableHead>Varietas</TableHead>
                          <TableHead>Lahan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {a.bloks.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell>
                              <Link href={`/blok/${b.id}`} className="flex items-center gap-1 font-medium text-primary hover:underline">
                                {b.kode}
                                <ChevronRight data-icon className="size-3.5" />
                              </Link>
                            </TableCell>
                            <TableCell className="num text-right">{b.luasHa}</TableCell>
                            <TableCell className="num text-right">{b.jumlahPokok.toLocaleString("id-ID")}</TableCell>
                            <TableCell>{b.varietas ?? "-"}</TableCell>
                            <TableCell>{b.jenisLahan}</TableCell>
                            <TableCell>
                              <StatusBadge status={b.status} variant={statusVariantFor(b.status)} />
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label={`Hapus blok ${b.kode}`}><Trash2 data-icon /></Button>} />
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus blok {b.kode}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Riwayat kalkulasi blok ini ikut terhapus permanen. Tindakan tidak bisa dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => run(() => hapusBlok(b.id))}>Hapus</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                        {a.bloks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              Belum ada blok di afdeling ini
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
