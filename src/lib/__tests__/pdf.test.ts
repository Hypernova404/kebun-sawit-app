import { describe, expect, it } from "vitest"
import { generatePDF } from "../pdf"

function decode(bytes: Uint8Array): string {
  let s = ""
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return s
}

describe("generatePDF", () => {
  const entries = [
    {
      id: "1",
      jenis_menu: "populasi",
      tanggal: new Date("2026-08-01T10:00:00Z"),
      data_input: { luas_ha: 30, jarak_tanam: 9, jarak_baris: 7.8 },
      data_hasil: { pola: "segitiga sama sisi", jumlah_pokok: 4269, warning: null },
      blok_kode: "A1-01",
    },
    {
      id: "2",
      jenis_menu: "bep",
      tanggal: new Date("2026-08-01T11:00:00Z"),
      data_input: { harga_tbs: 2800 },
      data_hasil: { bep: 1250000 },
      blok_kode: null,
    },
  ]

  it("menghasilkan PDF dengan header dan EOF", async () => {
    const pdf = await generatePDF(entries)
    expect(decode(pdf.slice(0, 8))).toBe("%PDF-1.4")
    expect(decode(pdf.slice(-6))).toBe("%%EOF\n")
  })

  it("setiap offset xref menunjuk ke objek yang benar (byte-accurate)", async () => {
    const pdf = await generatePDF(entries)
    const text = decode(pdf)
    const xrefPos = Number(text.match(/startxref\n(\d+)/)![1])
    const xrefBody = text.slice(xrefPos + 6) // skip "xref\n"
    const rows = xrefBody.split("\n").filter((l) => /^\d{10} \d{5} n/.test(l))
    expect(rows.length).toBeGreaterThanOrEqual(5)
    rows.forEach((row, i) => {
      const offset = Number(row.slice(0, 10))
      expect(decode(pdf.slice(offset, offset + 8))).toBe(`${i + 1} 0 obj\n`)
    })
  })

  it("stream konten punya karakter non-ASCII WinAnsi tanpa merusak offset", async () => {
    const pdf = await generatePDF(entries)
    const text = decode(pdf)
    // em-dash (—) dan titik tengah (·) dijudul/Blok jadi byte WinAnsi tunggal
    expect(text.includes("\x97")).toBe(true) // —
    expect(text.includes("\xb7")).toBe(true) // ·
    // konten stream hanya berisi byte ASCII + WinAnsi (0x80-0xBF); tidak boleh ada byte ≥ 0xC0 (penanda UTF-8 multibyte)
    const streamMatch = text.match(/stream\n([\s\S]*?)\nendstream/)
    const stream = streamMatch![1]
    for (let i = 0; i < stream.length; i++) {
      expect(stream.charCodeAt(i) < 0xc0).toBe(true)
    }
  })

  it("semua entri masuk ke halaman pertama (tanpa halaman kosong berisi judul saja)", async () => {
    const pdf = await generatePDF(entries)
    const text = decode(pdf)
    const streams = [...text.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((m) => m[1])
    const all = streams.join("\n")
    expect(all).toContain("jumlah pokok")
    expect(all).toContain("Blok A1-01")
    expect(all).toContain("harga tbs")
  })

  it("offset startxref benar: semua objek terbaca", async () => {
    const pdf = await generatePDF(entries)
    const text = decode(pdf)
    const startxref = Number(text.match(/startxref\n(\d+)/)![1])
    expect(decode(pdf.slice(startxref, startxref + 4))).toBe("xref")
  })

  it("struktur objek valid: Kids tidak self-reference, /Contents menunjuk stream yang benar", async () => {
    const pdf = await generatePDF(entries)
    const text = decode(pdf)
    const objBodies = [...text.matchAll(/(\d+) 0 obj\n([\s\S]*?)\nendobj\n/g)].map((m) => ({
      n: Number(m[1]),
      body: m[2],
    }))
    const byNum = new Map(objBodies.map((o) => [o.n, o.body]))

    // Kids Pages (objek 2) tidak boleh memuat referensi ke objek 2 (loop)
    const pagesObj = byNum.get(2)!
    const kids = pagesObj.match(/\/Kids \[([^\]]*)\]/)![1]
    expect(kids).not.toContain("2 0 R")

    // setiap halaman: /Parent = 2 0 R, /Contents menunjuk objek stream yang isinya ada
    for (const o of objBodies) {
      if (!/\/Type \/Page[^s]/.test(o.body)) continue
      expect(o.body).toContain("/Parent 2 0 R")
      const contentRef = o.body.match(/\/Contents (\d+) 0 R/)![1]
      const streamObj = byNum.get(Number(contentRef))
      expect(streamObj).toBeDefined()
      expect(streamObj).toContain("/Length")
      expect(streamObj).toContain("stream")
      expect(streamObj).toContain("endstream")
    }

    // jumlah objek = 4 (Catalog, Pages, 2 font) + 2 × jumlah halaman (page + stream konten)
    const pageCount = objBodies.filter((o) => /\/Type \/Page[^s]/.test(o.body)).length
    expect(objBodies.length).toBe(4 + 2 * pageCount)
  })
})
