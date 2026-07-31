import PDFDocument from "pdfkit"

export type RiwayatEntry = {
  id: string
  jenis_menu: string
  tanggal: Date
  data_input: unknown
  data_hasil: unknown
  blok_kode?: string | null
}

const LABEL_MENU: Record<string, string> = {
  populasi: "Populasi & Luas Lahan",
  bibit: "Kebutuhan Bibit",
  desain_blok: "Desain Blok & Jalan Produksi",
  pemupukan: "Dosis & Jadwal Pemupukan",
  kebutuhan_pupuk: "Total Kebutuhan & Biaya Pupuk",
  produksi: "Estimasi Produksi TBS",
  rendemen: "Rendemen CPO & Kernel",
  pengiriman_tbs: "Pengiriman TBS ke PKS",
  bep: "Pendapatan & BEP",
  pemanen: "Rotasi Panen & Kebutuhan Pemanen",
  konversi: "Konversi Satuan",
}

export function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID")
}

function drawTable(doc: PDFKit.PDFDocument, entries: { key: string; label: string; value: string }[], startY: number) {
  let y = startY
  for (const e of entries) {
    doc.font("Helvetica").fontSize(9).fillColor("#6B7280").text(e.label, 72, y, { width: 160 })
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111111").text(e.value, 240, y, { width: 280, align: "right" })
    y += 18
  }
  return y
}

export async function generatePDF(entries: RiwayatEntry[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 72, size: "A4" })
  const chunks: Buffer[] = []
  doc.on("data", (c: Buffer) => chunks.push(c))

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#2F5233").text("Laporan Riwayat Kalkulasi — Kebun Kelapa Sawit", 72, 72)
  doc.font("Helvetica").fontSize(9).fillColor("#6B7280")
    .text(`Dibuat: ${new Date().toLocaleString("id-ID")}  |  ${entries.length} entri`, 72, 96)

  let y = 130
  for (const entry of entries) {
    if (y > 700) {
      doc.addPage()
      y = 72
    }
    doc.moveTo(72, y).lineTo(540, y).strokeColor("#E5E7E2").stroke()
    y += 16
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111")
      .text(LABEL_MENU[entry.jenis_menu] ?? entry.jenis_menu, 72, y)
    doc.font("Helvetica").fontSize(9).fillColor("#6B7280")
      .text(`${entry.tanggal.toLocaleString("id-ID")}${entry.blok_kode ? "  ·  Blok " + entry.blok_kode : ""}`, 400, y, { width: 140, align: "right" })
    y += 26

    const input = entry.data_input as Record<string, unknown>
    const hasil = entry.data_hasil as Record<string, unknown>
    const rows: { key: string; label: string; value: string }[] = []
    const formatValue = (v: unknown): string => {
      if (v == null) return "-"
      if (typeof v === "number") return v.toLocaleString("id-ID", { maximumFractionDigits: 2 })
      if (typeof v === "boolean") return v ? "Ya" : "Tidak"
      if (Array.isArray(v)) return v.length > 0 ? `Tabel (${v.length} baris)` : "—"
      return String(v)
    }
    for (const [k, v] of Object.entries(input)) {
      rows.push({ key: k, label: k.replaceAll("_", " "), value: formatValue(v) })
    }
    for (const [k, v] of Object.entries(hasil)) {
      if (Array.isArray(v) || typeof v === "object") {
        rows.push({ key: k, label: k.replaceAll("_", " "), value: JSON.stringify(v) })
      } else {
        rows.push({ key: k, label: k.replaceAll("_", " "), value: formatValue(v) })
      }
    }
    y = drawTable(doc, rows.slice(0, 12), y) + 8
  }

  doc.end()
  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
  })
}
