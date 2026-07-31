import { describe, expect, it } from "vitest"
import { estimasiProduksi, hitungRendemen, lookupKurvaProduksi } from "../produksi"
import { hitungBEP, hitungLabaRugi, hitungPendapatanPengiriman } from "../transaksi"
import { hitungKebutuhanPemanen } from "../manajemen"
import { konversi } from "../konversi"

describe("Menu 6 — Estimasi Produksi", () => {
  it("umur 2 → 0 ton (TBM)", () => {
    const r = estimasiProduksi(2, 30)
    expect(r.data!.total_ton).toBe(0)
    expect(r.data!.warning).toContain("TBM")
  })

  it("umur 10 (puncak) → 26.5 ton/ha × 30 ha", () => {
    const r = estimasiProduksi(10, 30)
    expect(r.data!.ton_per_ha).toBe(26.5)
    expect(r.data!.total_ton).toBe(795)
  })

  it("umur 4 → 14 ton/ha", () => {
    expect(estimasiProduksi(4, 1).data!.ton_per_ha).toBe(14)
  })

  it("umur > 25 → warning replanting", () => {
    expect(estimasiProduksi(26, 30).data!.warning).toContain("replanting")
  })

  it("faktor kelas lahan invalid → error", () => {
    expect(estimasiProduksi(10, 30, 1.5).error?.code).toBe("INVALID_INPUT")
  })
})

describe("Menu 7 — Rendemen", () => {
  it("Tenera matang 25 ton → CPO 22%, kernel 5%", () => {
    const r = hitungRendemen(25, "Tenera", "matang")
    expect(r.data!.cpo_ton).toBeCloseTo(5.5, 1)
    expect(r.data!.kernel_ton).toBeCloseTo(1.25, 2)
  })

  it("Dura matang → CPO lebih rendah (16%)", () => {
    const r = hitungRendemen(25, "Dura", "matang")
    expect(r.data!.cpo_ton).toBeCloseTo(4, 1)
  })

  it("override manual menang, source MANUAL_OVERRIDE", () => {
    const r = hitungRendemen(25, "Tenera", "matang", { cpo: 0.25, kernel: 0.06 })
    expect(r.data!.cpo_ton).toBe(6.25)
    expect(r.data!.source).toBe("MANUAL_OVERRIDE")
  })
})

describe("Menu 8 — Pengiriman TBS", () => {
  it("25 ton × Rp 3.726/kg → Rp 93.150.000", () => {
    const r = hitungPendapatanPengiriman(25, 3726)
    expect(r.data).toBe(93150000)
  })
  it("tonase 0 → INVALID_INPUT", () => {
    expect(hitungPendapatanPengiriman(0, 3726).error?.code).toBe("INVALID_INPUT")
  })
})

describe("Menu 9 — BEP", () => {
  it("margin positif → BEP = biaya tetap / margin", () => {
    const r = hitungBEP(500000000, 3726, 2000)
    expect(r.data).toBe(Math.round(500000000 / 1726 * 100) / 100)
  })
  it("margin <= 0 → DIVISION_BY_ZERO", () => {
    expect(hitungBEP(100, 2000, 2000).error?.code).toBe("DIVISION_BY_ZERO")
    expect(hitungBEP(100, 1500, 2000).error?.code).toBe("DIVISION_BY_ZERO")
  })
  it("laba/rugi: pendapatan > biaya → UNTUNG", () => {
    const r = hitungLabaRugi(100000000, 70000000)
    expect(r.data!.laba_rugi).toBe(30000000)
    expect(r.data!.status).toBe("UNTUNG")
  })
  it("rugi → RUGI", () => {
    expect(hitungLabaRugi(50000000, 70000000).data!.status).toBe("RUGI")
  })
})

describe("Menu 11 — Kebutuhan Pemanen", () => {
  it("600 ha × 23 t/ha, rotasi 7, kapasitas 500 → ceil", () => {
    const totalKg = 600 * 23 * 1000
    const r = hitungKebutuhanPemanen(totalKg, 7, 500)
    expect(r.data!.jumlah_pemanen).toBe(Math.ceil(totalKg / (500 * 7)))
  })
  it("rotasi 0 → DIVISION_BY_ZERO", () => {
    expect(hitungKebutuhanPemanen(10000, 0, 500).error?.code).toBe("DIVISION_BY_ZERO")
  })
})

describe("Menu 12 — Konversi", () => {
  it("30 ha → m2", () => {
    expect(konversi(30, "ha", "m2").data!.nilai).toBe(300000)
  })
  it("1 ha → tumbak (14 m²)", () => {
    expect(konversi(1, "ha", "tumbak", 14).data!.nilai).toBeCloseTo(714.2857, 3)
  })
  it("2 ton → kg", () => {
    expect(konversi(2, "ton", "kg").data!.nilai).toBe(2000)
  })
  it("5 kuintal → kg", () => {
    expect(konversi(5, "kuintal", "kg").data!.nilai).toBe(500)
  })
  it("kombinasi satuan beda grup → NOT_FOUND", () => {
    expect(konversi(1, "ha", "kg").error?.code).toBe("NOT_FOUND")
  })
  it("nilai negatif → INVALID_INPUT", () => {
    expect(konversi(-1, "ha", "m2").error?.code).toBe("INVALID_INPUT")
  })
})

describe("Kurva produksi boundary", () => {
  it("umur 3 → 5, 4 → 14, 5 → 17, 8 → 21.5, 16 → 26.5, 20 → 23.5, 25 → 20", () => {
    expect(lookupKurvaProduksi(3)).toBe(5)
    expect(lookupKurvaProduksi(4)).toBe(14)
    expect(lookupKurvaProduksi(5)).toBe(17)
    expect(lookupKurvaProduksi(8)).toBe(21.5)
    expect(lookupKurvaProduksi(16)).toBe(26.5)
    expect(lookupKurvaProduksi(20)).toBe(23.5)
    expect(lookupKurvaProduksi(25)).toBe(20)
    expect(lookupKurvaProduksi(30)).toBe(16)
  })
})
