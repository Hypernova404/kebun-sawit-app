"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download } from "lucide-react"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getRiwayat, downloadPDF } from "@/lib/actions"
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

export default function RiwayatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [entry, setEntry] = useState<Entry | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    getRiwayat().then((data) => {
      const found = (data as Entry[]).find((e) => e.id === id)
      if (found) setEntry(found)
    })
  }, [id])

  if (id && !entry) return null

  const exportPdf = async () => {
    if (!entry) return
    setBusy(true)
    const res = await downloadPDF([entry.id])
    setBusy(false)
    if ("error" in res && res.error) {
      alert(res.error)
      return
    }
    const blob = b64ToBlob(res.buffer as string, "application/pdf")
    downloadBlob(blob, `riwayat-${entry.jenis_menu}-${new Date(entry.tanggal).toISOString().slice(0, 10)}.pdf`)
  }

  const renderValue = (v: unknown, depth = 0): string => {
    if (v == null) return "—"
    if (typeof v === "number") return v.toLocaleString("id-ID", { maximumFractionDigits: 4 })
    if (typeof v === "boolean") return v ? "Ya" : "Tidak"
    if (typeof v === "string") return v
    if (Array.isArray(v)) return JSON.stringify(v, null, 2)
    if (typeof v === "object") return JSON.stringify(v, null, 2)
    return String(v)
  }

  const rows = (obj: unknown) =>
    obj && typeof obj === "object" && !Array.isArray(obj)
      ? Object.entries(obj as Record<string, unknown>)
      : []

  return (
    <div className="flex flex-col gap-6 px-6 py-8 lg:px-10">
      <div className="flex items-center justify-between">
        <Link href="/riwayat" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft data-icon />
          Riwayat
        </Link>
        <Button onClick={exportPdf} disabled={busy || !entry}>
          <Download data-icon="inline-start" />
          Download PDF
        </Button>
      </div>

      {!entry ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{LABEL_MENU[entry.jenis_menu] ?? entry.jenis_menu}</Badge>
            <span className="text-sm text-muted-foreground">
              {new Date(entry.tanggal).toLocaleString("id-ID")}
              {entry.blok_kode ? ` · Blok ${entry.blok_kode}` : ""}
            </span>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Input</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border">
                {rows(entry.data_input).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 py-2">
                    <span className="text-xs text-muted-foreground capitalize">{k.replaceAll("_", " ")}</span>
                    <pre className="text-sm whitespace-pre-wrap break-all">{renderValue(v)}</pre>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Hasil</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col divide-y divide-border">
                {rows(entry.data_hasil).map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 py-2">
                    <span className="text-xs text-muted-foreground capitalize">{k.replaceAll("_", " ")}</span>
                    <pre className="text-sm whitespace-pre-wrap break-all">{renderValue(v)}</pre>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
