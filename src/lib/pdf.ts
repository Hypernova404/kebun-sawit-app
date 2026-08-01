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

const PAGE_W = 595.28
const PAGE_H = 841.89
const M = 72
const MAX_Y = 700

const WIN_ANSI: Record<string, string> = {
  "\u2014": "\x97",
  "\u2013": "\x96",
  "\u00b7": "\xb7",
  "\u2022": "\x95",
  "\u201c": "\x93",
  "\u201d": "\x94",
  "\u2018": "\x91",
  "\u2019": "\x92",
  "\u20ac": "\x80",
  "\u00a9": "\xa9",
  "\u00ae": "\xae",
  "\u00b0": "\xb0",
  "\u00e0": "\xe0",
  "\u00e8": "\xe8",
  "\u00e9": "\xe9",
  "\u00ec": "\xec",
  "\u00ed": "\xed",
  "\u00f2": "\xf2",
  "\u00f3": "\xf3",
  "\u00f9": "\xf9",
  "\u00fa": "\xfa",
  "\u00fc": "\xfc",
  "\u00f1": "\xf1",
  "\u00df": "\xdf",
  "\u00e1": "\xe1",
  "\u00e2": "\xe2",
  "\u00e3": "\xe3",
  "\u00f5": "\xf5",
  "\u00f6": "\xf6",
  "\u00f8": "\xf8",
}

function esc(s: string): string {
  let out = ""
  for (const ch of s) {
    if (ch === "\\") out += "\\\\"
    else if (ch === "(") out += "\\("
    else if (ch === ")") out += "\\)"
    else if (ch.charCodeAt(0) < 128) out += ch
    else out += WIN_ANSI[ch] ?? "?"
  }
  return out
}

function textOp(font: string, size: number, x: number, y: number, color: string, s: string): string {
  return `BT /${font} ${size} Tf ${color} rg ${x.toFixed(2)} ${y.toFixed(2)} Td (${esc(s)}) Tj ET`
}

function textRight(font: string, size: number, right: number, y: number, color: string, s: string): string {
  const width = s.length * size * 0.5
  return textOp(font, size, right - width, y, color, s)
}

export async function generatePDF(entries: RiwayatEntry[]): Promise<Uint8Array> {
  const pages: string[] = []
  let content: string[] = []
  let y = 0

  const newPage = (): void => {
    if (content.length > 0) pages.push(content.join("\n"))
    content = []
    y = PAGE_H - M
  }

  newPage()

  content.push(textOp("F2", 16, M, y, "0.184 0.322 0.2", "Laporan Riwayat Kalkulasi — Kebun Kelapa Sawit"))
  y -= 22
  content.push(
    textOp("F1", 9, M, y, "0.42 0.447 0.502", `Dibuat: ${new Date().toLocaleString("id-ID")}  |  ${entries.length} entri`),
  )
  y -= 30

  for (const entry of entries) {
    if (y < MAX_Y + 18) {
      newPage()
    }
    y -= 16
    content.push(`72 ${y.toFixed(2)} m 540 ${y.toFixed(2)} l 0.898 0.906 0.886 RG 0.7 w S`)
    y -= 16
    content.push(textOp("F2", 11, M, y, "0.067 0.067 0.067", LABEL_MENU[entry.jenis_menu] ?? entry.jenis_menu))
    content.push(
      textRight(
        "F1",
        9,
        540,
        y,
        "0.42 0.447 0.502",
        `${entry.tanggal.toLocaleString("id-ID")}${entry.blok_kode ? "  ·  Blok " + entry.blok_kode : ""}`,
      ),
    )
    y -= 26

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

    for (const row of rows.slice(0, 12)) {
      content.push(textOp("F1", 9, M, y, "0.42 0.447 0.502", row.label))
      content.push(textRight("F2", 9, 520, y, "0.067 0.067 0.067", row.value))
      y -= 18
    }
    y -= 8
  }

  if (content.length > 0) pages.push(content.join("\n"))

  const objects: string[] = []
  const pageRefs: number[] = []
  for (let i = 0; i < pages.length; i++) {
    pageRefs.push(2 + i)
  }
  const fontRef = 2 + pages.length
  const fontBoldRef = fontRef + 1
  const contentStartRef = fontBoldRef + 1

  objects.push("<< /Type /Catalog /Pages 2 0 R >>")
  const kids = pageRefs.map((r) => `${r} 0 R`).join(" ")
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`)
  for (let i = 0; i < pages.length; i++) {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRef} 0 R /F2 ${fontBoldRef} 0 R >> >> /Contents ${contentStartRef + i} 0 R >>`)
  }
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
  for (const p of pages) {
    objects.push(`<< /Length ${p.length} >>\nstream\n${p}\nendstream`)
  }

  let out = "%PDF-1.4\n"
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) {
    out += `${String(off).padStart(10, "0")} 00000 n \n`
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  return new TextEncoder().encode(out)
}
