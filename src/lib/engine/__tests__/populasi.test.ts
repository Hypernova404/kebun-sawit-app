import { describe, expect, it } from "vitest"
import {
  hitungPopulasi,
  hitungKebutuhanBibit,
  hitungDesainBlok,
  hitungStatusBlok,
} from "../populasi"

describe("Menu 1 — Populasi", () => {
  it("9m segitiga sama sisi → jarak baris 7.79m, populasi ~143 pokok/ha", () => {
    const r = hitungPopulasi(1, 9, "segitiga_sama_sisi")
    expect(r.success).toBe(true)
    const d = r.data!
    expect(d.jarak_baris).toBeCloseTo(7.79, 1)
    expect(d.populasi_per_ha).toBeCloseTo(143, 0)
  })

  it("mata_lima identik dengan segitiga sama sisi", () => {
    const a = hitungPopulasi(1, 9, "mata_lima").data!
    const b = hitungPopulasi(1, 9, "segitiga_sama_sisi").data!
    expect(a.jumlah_pokok).toBe(b.jumlah_pokok)
    expect(a.populasi_per_ha).toBe(b.populasi_per_ha)
  })

  it("8m persegi → populasi ~156 pokok/ha", () => {
    const r = hitungPopulasi(1, 8, "persegi")
    expect(r.data!.populasi_per_ha).toBeCloseTo(156, 0)
    expect(r.data!.jarak_baris).toBe(8)
  })

  it("menggunakan Math.floor untuk jumlah_pokok", () => {
    const r = hitungPopulasi(1, 9.2, "segitiga_sama_sisi")
    expect(r.data!.populasi_per_ha).toBeCloseTo(136, 0)
    expect(r.data!.jumlah_pokok).toBe(Math.floor(10000 / r.data!.luas_per_pokok))
  })

  it("warning bila jarak tanam di luar 7-10m, tetap hitung", () => {
    const r = hitungPopulasi(1, 5, "persegi")
    expect(r.success).toBe(true)
    expect(r.data!.warning).toContain("di luar rentang umum")
  })

  it("validasi: luas <= 0 ditolak", () => {
    expect(hitungPopulasi(0, 9, "persegi").success).toBe(false)
    expect(hitungPopulasi(-1, 9, "persegi").error?.code).toBe("INVALID_INPUT")
  })

  it("pola tidak dikenal ditolak", () => {
    expect(hitungPopulasi(1, 9, "hexagonal").error?.code).toBe("INVALID_INPUT")
  })
})

describe("Menu 2 — Kebutuhan Bibit", () => {
  it("7% sulaman → ceil", () => {
    const r = hitungKebutuhanBibit(1000, 0.07)
    expect(r.data!.total_bibit).toBe(1070)
    expect(r.data!.cadangan).toBe(70)
  })

  it("selalu ceil: 1 pokok, 0.05 → 2 bibit", () => {
    expect(hitungKebutuhanBibit(1, 0.05).data!.total_bibit).toBe(2)
  })

  it("warning bila persen di luar 5-10%", () => {
    expect(hitungKebutuhanBibit(100, 0.03).data!.warning).toContain("5-10%")
    expect(hitungKebutuhanBibit(100, 0.07).data!.warning).toBeNull()
  })
})

describe("Menu 3 — Desain Blok", () => {
  it("rasio 90% → SESUAI STANDAR", () => {
    const r = hitungDesainBlok(30, 2, 1)
    expect(r.data!.luas_efektif).toBe(27)
    expect(r.data!.rasio_efektif).toBe(0.9)
    expect(r.data!.status).toBe("SESUAI STANDAR")
  })

  it("rasio < 90% → DI BAWAH TARGET", () => {
    const r = hitungDesainBlok(30, 3, 2)
    expect(r.data!.status).toBe("DI BAWAH TARGET 90%")
  })

  it("jalan+parit melebihi luas kotor → error", () => {
    expect(hitungDesainBlok(30, 20, 15).error?.code).toBe("INVALID_INPUT")
  })
})

describe("Status blok otomatis", () => {
  it("umur < 3 → TBM", () => {
    expect(hitungStatusBlok(2025, 2026).data!.status).toBe("TBM")
  })
  it("umur >= 3 → TM", () => {
    expect(hitungStatusBlok(2023, 2026).data!.status).toBe("TM")
  })
  it("tahun tanam masa depan → error", () => {
    expect(hitungStatusBlok(2027, 2026).error?.code).toBe("INVALID_INPUT")
  })
})
