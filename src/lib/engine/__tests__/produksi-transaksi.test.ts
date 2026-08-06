import { describe, expect, it } from "vitest"
import { estimasiProduksi, estimasiProduksiBulanan, hitungRendemen, lookupKurvaProduksi } from "../produksi"
import { hitungBEP, hitungLabaRugi, hitungPendapatanPengiriman, hitungPendapatanSortasi } from "../transaksi"
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

  it("hasil memuat rentang min-max", () => {
    const r = estimasiProduksi(10, 1)
    expect(r.data!.ton_per_ha_min).toBe(23)
    expect(r.data!.ton_per_ha_max).toBe(30)
    expect(r.data!.ton_per_ha).toBe(26.5)
  })
})

describe("Menu 6b — Faktor musiman produksi", () => {
  it("Januari (0.80) dan September (1.22) menaikkan/menurunkan proyeksi bulanan", () => {
    const jan = estimasiProduksiBulanan(10, 30, 1)
    const sep = estimasiProduksiBulanan(10, 30, 9)
    expect(jan.data!.indeks_musiman).toBe(0.8)
    expect(sep.data!.indeks_musiman).toBe(1.22)
    expect(jan.data!.ton_bulan_ini).toBeLessThan(sep.data!.ton_bulan_ini)
    expect(jan.data!.ton_bulan_ini).toBeCloseTo((26.5 * 0.8) / 12 * 30, 1)
  })
  it("bulan 13 → INVALID_INPUT", () => {
    expect(estimasiProduksiBulanan(10, 30, 13).error?.code).toBe("INVALID_INPUT")
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
  it("tanpa sortasi → pendapatan = nilai kotor", () => {
    const r = hitungPendapatanSortasi(25, 3726, { persen_mentah: 0, persen_mengkal: 0, persen_busuk: 0 })
    expect(r.data!.pendapatan).toBe(93150000)
    expect(r.data!.tonase_bersih).toBe(25)
    expect(r.data!.potongan_rp).toBe(0)
  })
  it("10% mentah → potongan 50% × 10% = 5% nilai", () => {
    const r = hitungPendapatanSortasi(25, 3726, { persen_mentah: 10, persen_mengkal: 0, persen_busuk: 0 })
    expect(r.data!.kg_dipotong).toBe(1250) // 25.000 kg × 5%
    expect(r.data!.tonase_bersih).toBe(23.75)
    expect(r.data!.potongan_rp).toBe(4657500)
    expect(r.data!.pendapatan).toBe(88492500)
  })
  it("10% mengkal → potongan 15% × 10% = 1,5% nilai", () => {
    const r = hitungPendapatanSortasi(25, 3726, { persen_mentah: 0, persen_mengkal: 10, persen_busuk: 0 })
    expect(r.data!.potongan_persen).toBeCloseTo(1.5, 2)
    expect(r.data!.pendapatan).toBe(91752750)
  })
  it("100% busuk → tidak dibayar", () => {
    const r = hitungPendapatanSortasi(25, 3726, { persen_mentah: 0, persen_mengkal: 0, persen_busuk: 100 })
    expect(r.data!.pendapatan).toBe(0)
    expect(r.data!.kg_dipotong).toBe(25000)
  })
  it("total sortasi > 100% → INVALID_INPUT", () => {
    expect(hitungPendapatanSortasi(25, 3726, { persen_mentah: 60, persen_mengkal: 50, persen_busuk: 0 }).error?.code).toBe("INVALID_INPUT")
  })
  it("persentase negatif → INVALID_INPUT", () => {
    expect(hitungPendapatanSortasi(25, 3726, { persen_mentah: -1, persen_mengkal: 0, persen_busuk: 0 }).error?.code).toBe("INVALID_INPUT")
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
  it("600 ha × 23 t/ha, rotasi 7, kapasitas 800 → ceil", () => {
    const totalKg = 600 * 23 * 1000
    const r = hitungKebutuhanPemanen({ total_kg_siap_panen: totalKg, rotasi_hari: 7, kapasitas_per_orang_per_hari: 800 })
    expect(r.data!.jumlah_pemanen).toBe(Math.ceil(totalKg / (800 * 7)))
    expect(r.data!.kapasitas_efektif).toBe(800)
  })
  it("berbukit (0.8) → kapasitas efektif 640 dan pemanen lebih banyak", () => {
    const totalKg = 600 * 23 * 1000
    const datar = hitungKebutuhanPemanen({ total_kg_siap_panen: totalKg, rotasi_hari: 7 })
    const bukit = hitungKebutuhanPemanen({ total_kg_siap_panen: totalKg, rotasi_hari: 7, topografi: "berbukit" })
    expect(bukit.data!.kapasitas_efektif).toBe(640)
    expect(bukit.data!.jumlah_pemanen).toBeGreaterThan(datar.data!.jumlah_pemanen)
  })
  it("umur > 15 thn → faktor 0.85 + warning", () => {
    const r = hitungKebutuhanPemanen({ total_kg_siap_panen: 100000, rotasi_hari: 7, umur_tahun: 20 })
    expect(r.data!.faktor_kinerja).toBe(0.85)
    expect(r.data!.warning).toContain("15")
  })
  it("batasan hanca: jumlah pohon membatasi → diambil max", () => {
    // 85.000 pokok, rotasi 7 → 12.143 pokok/hari; 300 pokok/pemanen → 41 pemanen
    const r = hitungKebutuhanPemanen({ total_kg_siap_panen: 100000, rotasi_hari: 7, jumlah_pokok: 85000 })
    expect(r.data!.jumlah_dari_pohon).toBe(41)
    expect(r.data!.jumlah_pemanen).toBe(Math.max(Math.ceil(100000 / (800 * 7)), 41))
  })
  it("rotasi 0 → DIVISION_BY_ZERO", () => {
    expect(hitungKebutuhanPemanen({ total_kg_siap_panen: 10000, rotasi_hari: 0 }).error?.code).toBe("DIVISION_BY_ZERO")
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
  it("umur 3 → [4,6], 4 → [12,16], 5 → [15,19], 7-8 → [24,28], 16 → [23,30], 20 → [22,25], 25 → [18,22], 30 → [14,18]", () => {
    expect(lookupKurvaProduksi(3)).toEqual([4, 6])
    expect(lookupKurvaProduksi(4)).toEqual([12, 16])
    expect(lookupKurvaProduksi(5)).toEqual([15, 19])
    expect(lookupKurvaProduksi(7)).toEqual([24, 28])
    expect(lookupKurvaProduksi(8)).toEqual([24, 28])
    expect(lookupKurvaProduksi(16)).toEqual([23, 30])
    expect(lookupKurvaProduksi(20)).toEqual([22, 25])
    expect(lookupKurvaProduksi(25)).toEqual([18, 22])
    expect(lookupKurvaProduksi(30)).toEqual([14, 18])
  })
})
