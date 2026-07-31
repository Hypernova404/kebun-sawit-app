import { describe, expect, it } from "vitest"
import {
  cekJarakAntagonis,
  generateJadwalTahunan,
  getDosisTBM,
  getDosisTM,
  hitungHariKering,
  jadwalSemester,
  validasiWaktuAplikasi,
} from "../pemupukan"
import { hitungKebutuhanPupukBlok } from "../kebutuhan-pupuk"
import { HARGA_PUPUK_KALIMANTAN } from "../harga"

describe("Menu 4a — Dosis TBM", () => {
  it("bulan 1 Urea = 200 g", () => {
    expect(getDosisTBM(1, "Urea").data!.dosis).toBe(200)
  })
  it("lubang tanam (0) RP/TSP = 350 g", () => {
    expect(getDosisTBM(0, "RP/TSP").data!.dosis).toBe(350)
  })
  it("bulan tanpa jadwal → 0, bukan error", () => {
    const r = getDosisTBM(2, "Urea")
    expect(r.success).toBe(true)
    expect(r.data!.dosis).toBe(0)
  })
  it("umur di luar 0-36 → INVALID_INPUT", () => {
    expect(getDosisTBM(37, "Urea").error?.code).toBe("INVALID_INPUT")
  })
  it("jenis lahan eks_lalang → dosis lebih tinggi (faktor 1.3)", () => {
    expect(getDosisTBM(1, "Urea", "eks_lalang").data!.dosis).toBe(260)
  })
})

describe("Menu 4b — Dosis TM", () => {
  it("umur 5, Urea → 2.0 kg (kelompok 3-8)", () => {
    expect(getDosisTM(5, "Urea").data!.dosis).toBe(2.0)
  })
  it("umur 10, MOP → 2.25 (kelompok 9-13)", () => {
    expect(getDosisTM(10, "MOP").data!.dosis).toBe(2.25)
  })
  it("override LSU diprioritaskan", () => {
    const r = getDosisTM(10, "Urea", 3.1)
    expect(r.data!.dosis).toBe(3.1)
    expect(r.data!.source).toBe("LSU_OVERRIDE")
  })
  it("umur < 3 → error, pakai getDosisTBM", () => {
    expect(getDosisTM(2, "Urea").error?.code).toBe("INVALID_INPUT")
  })
  it("umur > 25 → replanting candidate dengan warning", () => {
    const r = getDosisTM(26, "Urea")
    expect(r.data!.dosis).toBeNull()
    expect(r.data!.warning).toContain("replanting")
  })
})

describe("Menu 4c — Jadwal & validasi", () => {
  it("wilayah Kalimantan Barat terkonfigurasi", () => {
    const r = jadwalSemester("Kalimantan Barat")
    expect(r.success).toBe(true)
    expect(r.data!.semester_1.bulan).toBe("Februari - Maret")
  })
  it("wilayah tak dikenal → NOT_FOUND", () => {
    expect(jadwalSemester("Jakarta").error?.code).toBe("NOT_FOUND")
  })

  it("Urea 3 hari kering → TUNDA", () => {
    const records = [
      { tanggal: "h1", curah_hujan_mm: 30 },
      { tanggal: "h2", curah_hujan_mm: 0 },
      { tanggal: "h3", curah_hujan_mm: 0 },
      { tanggal: "h4", curah_hujan_mm: 0 },
      { tanggal: "h5", curah_hujan_mm: 0 },
      { tanggal: "h6", curah_hujan_mm: 5 },
      { tanggal: "h7", curah_hujan_mm: 20 },
    ]
    expect(validasiWaktuAplikasi("Urea", records, 10).data).toContain("TUNDA")
    expect(hitungHariKering(records)).toBe(4)
  })

  it("7 hari kering → TUNDA untuk MOP", () => {
    const kering = Array.from({ length: 7 }, (_, i) => ({ tanggal: `h${i}`, curah_hujan_mm: 0 }))
    expect(validasiWaktuAplikasi("MOP", kering, 0).data).toContain("TUNDA")
  })

  it("hujan kemarin > 60mm → TUNDA 1 HARI", () => {
    const basah = Array.from({ length: 7 }, (_, i) => ({ tanggal: `h${i}`, curah_hujan_mm: 25 }))
    expect(validasiWaktuAplikasi("MOP", basah, 70).data).toContain("TUNDA 1 HARI")
  })

  it("kondisi normal → APLIKASI OK", () => {
    const records = [
      { tanggal: "h1", curah_hujan_mm: 25 },
      { tanggal: "h2", curah_hujan_mm: 0 },
      { tanggal: "h3", curah_hujan_mm: 0 },
      { tanggal: "h4", curah_hujan_mm: 0 },
      { tanggal: "h5", curah_hujan_mm: 0 },
      { tanggal: "h6", curah_hujan_mm: 30 },
      { tanggal: "h7", curah_hujan_mm: 12 },
    ]
    expect(validasiWaktuAplikasi("MOP", records, 20).data).toBe("APLIKASI OK")
  })

  it("Kalium + Magnesium jarak 2 hari → WARNING", () => {
    expect(cekJarakAntagonis("Kalium", "Magnesium", 2).data).toContain("WARNING")
  })
  it("Kalium + Magnesium jarak 3 hari → OK", () => {
    expect(cekJarakAntagonis("Kalium", "Magnesium", 3).data).toBe("OK")
  })
})

describe("generateJadwalTahunan + Menu 5", () => {
  const blok = { tahun_tanam: 2016, jenis_lahan: "mineral" as const, jumlah_pokok: 4290 }

  it("blok TM umur 10 tahun → jadwal dengan frekuensi Urea 2x", () => {
    const r = generateJadwalTahunan(blok, 2026, "Kalimantan Barat")
    expect(r.success).toBe(true)
    const urea = r.data!.find((i) => i.jenis === "Urea")
    expect(urea!.dosis).toBe(2.5)
    expect(urea!.frekuensi).toBe(2)
    expect(r.data!.length).toBeGreaterThan(0)
  })

  it("kebutuhan pupuk blok menghitung kg, sak (ceil), dan biaya", () => {
    const r = hitungKebutuhanPupukBlok(blok, 2026, "Kalimantan Barat", HARGA_PUPUK_KALIMANTAN)
    expect(r.success).toBe(true)
    const urea = r.data!.find((i) => i.jenis === "Urea")!
    expect(urea.total_kg).toBeCloseTo(2.5 * 4290, 1)
    expect(urea.jumlah_sak).toBe(Math.ceil(urea.total_kg / 50))
    expect(urea.biaya).toBe(Math.round(urea.total_kg * HARGA_PUPUK_KALIMANTAN.Urea))
  })

  it("harga pupuk belum diisi → NOT_FOUND", () => {
    const r = hitungKebutuhanPupukBlok(blok, 2026, "Kalimantan Barat", { Urea: 100 })
    expect(r.success).toBe(false)
    expect(r.error!.code).toBe("NOT_FOUND")
  })

  it("blok TBM → dosis gram dikonversi ke kg", () => {
    const tbm = { tahun_tanam: 2025, jenis_lahan: "mineral" as const, jumlah_pokok: 143 }
    const r = hitungKebutuhanPupukBlok(tbm, 2026, "Kalimantan Barat", HARGA_PUPUK_KALIMANTAN)
    expect(r.success).toBe(true)
    expect(r.data!.length).toBeGreaterThan(0)
  })
})
