import { describe, expect, it } from "vitest"
import {
  hitungPopulasi,
  hitungKebutuhanBibit,
  hitungDesainBlok,
  hitungStatusBlok,
  tentukanPola,
} from "../populasi"

describe("Menu 1 — Populasi", () => {
  it("9m & 7.79m (segitiga sama sisi) → pola terdeteksi, populasi ~143 pokok/ha", () => {
    const r = hitungPopulasi(1, 9, 7.79)
    expect(r.success).toBe(true)
    const d = r.data!
    expect(d.pola).toBe("segitiga_sama_sisi")
    expect(d.jarak_baris).toBe(7.79)
    expect(d.populasi_per_ha).toBeCloseTo(143, 0)
  })

  it("9m & 9m (persegi) → pola persegi, populasi ~123 pokok/ha", () => {
    const r = hitungPopulasi(1, 9, 9)
    expect(r.data!.pola).toBe("persegi")
    expect(r.data!.populasi_per_ha).toBe(123)
    expect(r.data!.jarak_baris).toBe(9)
  })

  it("8m & 8m persegi → populasi ~156 pokok/ha", () => {
    const r = hitungPopulasi(1, 8, 8)
    expect(r.data!.populasi_per_ha).toBe(156)
    expect(r.data!.jarak_baris).toBe(8)
  })

  it("jarak tidak sama & bukan segitiga → persegi panjang", () => {
    const r = hitungPopulasi(1, 9, 7)
    expect(r.data!.pola).toBe("persegi_panjang")
  })

  it("menggunakan Math.floor untuk jumlah_pokok", () => {
    const r = hitungPopulasi(1, 9.2, 7.97)
    expect(r.data!.populasi_per_ha).toBeCloseTo(136, 0)
    expect(r.data!.jumlah_pokok).toBe(Math.floor(10000 / (9.2 * 7.97)))
  })

  it("tanpa double rounding: floor diterapkan di langkah terakhir (sph desimal × luas)", () => {
    const r = hitungPopulasi(150, 9.2, 7.97)
    const sph = 10000 / (9.2 * 7.97)
    expect(r.data!.jumlah_pokok).toBe(Math.floor(sph * 150))
    expect(r.data!.jumlah_pokok).not.toBe(Math.floor(Math.round(sph)) * 150)
  })

  it("SPH dibulatkan round (bukan floor) untuk pelaporan", () => {
    const r = hitungPopulasi(1, 9, 7.79)
    expect(r.data!.populasi_per_ha).toBe(Math.round(10000 / (9 * 7.79)))
  })

  it("warning bila salah satu jarak di luar 7-10m, tetap hitung", () => {
    const r = hitungPopulasi(1, 5, 8)
    expect(r.success).toBe(true)
    expect(r.data!.warning).toContain("di luar rentang umum")
  })

  it("validasi: luas / jarak <= 0 ditolak", () => {
    expect(hitungPopulasi(0, 9, 8).success).toBe(false)
    expect(hitungPopulasi(-1, 9, 8).error?.code).toBe("INVALID_INPUT")
    expect(hitungPopulasi(1, 0, 8).error?.code).toBe("INVALID_INPUT")
    expect(hitungPopulasi(1, 9, -2).error?.code).toBe("INVALID_INPUT")
  })
})

describe("tentukanPola", () => {
  it("a == b → persegi", () => {
    expect(tentukanPola(9, 9)).toBe("persegi")
  })
  it("b ≈ a×0.866 → segitiga sama sisi", () => {
    expect(tentukanPola(9, 7.79)).toBe("segitiga_sama_sisi")
    expect(tentukanPola(7.79, 9)).toBe("segitiga_sama_sisi")
  })
  it("lainnya → persegi panjang", () => {
    expect(tentukanPola(9, 7)).toBe("persegi_panjang")
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
