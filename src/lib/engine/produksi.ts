import { fail, ok, type EngineResult, type ProduksiResult, type RendemenResult } from "./types"

const KURVA_PRODUKSI: [number, number, number][] = [
  [3, 4, 6],
  [4, 12, 16],
  [5, 15, 19],
  [6, 20, 23],
  [7, 24, 28],
  [9, 23, 30],
  [17, 22, 25],
  [21, 18, 22],
  [26, 14, 18],
]

export function lookupKurvaProduksi(umur_tahun: number): [number, number] {
  for (let i = 0; i < KURVA_PRODUKSI.length; i++) {
    const [min, low, high] = KURVA_PRODUKSI[i]
    const nextMin = KURVA_PRODUKSI[i + 1]?.[0]
    if (umur_tahun >= min && (nextMin == null || umur_tahun < nextMin)) {
      return [low, high]
    }
  }
  return [0, 0]
}

// Indeks musiman produksi TBS Indonesia: rendah Jan–Mar, puncak Sep–Nov
const INDEKS_MUSIMAN: number[] = [0.8, 0.74, 0.8, 0.9, 1.01, 1.06, 1.12, 1.17, 1.22, 1.17, 1.06, 0.96]

export function faktorMusiman(bulan: number): number {
  if (bulan < 1 || bulan > 12) {
    throw new Error("bulan harus 1-12")
  }
  return INDEKS_MUSIMAN[bulan - 1]
}

export function estimasiProduksi(umur_tahun: number, luas_ha: number, faktor_kelas_lahan = 1.0): EngineResult<ProduksiResult> {
  if (luas_ha <= 0) {
    return fail("INVALID_INPUT", "luas_ha harus > 0")
  }
  if (umur_tahun < 3) {
    return ok({ ton_per_ha: 0, ton_per_ha_min: 0, ton_per_ha_max: 0, total_ton: 0, warning: "TBM belum berproduksi" })
  }
  if (faktor_kelas_lahan < 0.5 || faktor_kelas_lahan > 1.0) {
    return fail("INVALID_INPUT", "faktor_kelas_lahan harus antara 0.5-1.0")
  }
  const [low, high] = lookupKurvaProduksi(umur_tahun)
  const base = Math.round(((low + high) / 2) * 100) / 100
  const total_ton = Math.round(base * faktor_kelas_lahan * luas_ha * 100) / 100
  const warning = umur_tahun > 25 ? "Umur > 25 tahun, produktivitas menurun — pertimbangkan replanting" : null
  return ok({
    ton_per_ha: base,
    ton_per_ha_min: low,
    ton_per_ha_max: high,
    total_ton,
    warning,
  })
}

export function estimasiProduksiBulanan(
  umur_tahun: number,
  luas_ha: number,
  bulan: number,
  faktor_kelas_lahan = 1.0
): EngineResult<{ ton_bulan_ini: number; ton_per_ha_bulan_ini: number; indeks_musiman: number }> {
  const r = estimasiProduksi(umur_tahun, luas_ha, faktor_kelas_lahan)
  if (!r.success) return fail(r.error!.code, r.error!.message)
  if (bulan < 1 || bulan > 12) {
    return fail("INVALID_INPUT", "bulan harus 1-12")
  }
  const indeks = faktorMusiman(bulan)
  const ton_per_ha_bulan_ini = Math.round(((r.data!.ton_per_ha * indeks) / 12) * 100) / 100
  const ton_bulan_ini = Math.round((r.data!.total_ton * indeks) / 12 * 100) / 100
  return ok({ ton_bulan_ini, ton_per_ha_bulan_ini, indeks_musiman: indeks })
}

const TABEL_RENDEMEN: Record<string, Record<string, { cpo: number; kernel: number }>> = {
  Tenera: {
    matang: { cpo: 0.22, kernel: 0.05 },
    mengkal: { cpo: 0.17, kernel: 0.04 },
    mentah: { cpo: 0.12, kernel: 0.03 },
  },
  Dura: {
    matang: { cpo: 0.16, kernel: 0.04 },
    mengkal: { cpo: 0.12, kernel: 0.03 },
    mentah: { cpo: 0.09, kernel: 0.02 },
  },
}

export function hitungRendemen(
  tonase_TBS: number,
  varietas: string,
  tingkat_matang: string,
  override_persen: { cpo: number; kernel: number } | null = null
): EngineResult<RendemenResult> {
  if (tonase_TBS <= 0) {
    return fail("INVALID_INPUT", "tonase_TBS harus > 0")
  }
  const ref = TABEL_RENDEMEN[varietas]?.[tingkat_matang]
  if (!ref && !override_persen) {
    return fail("NOT_FOUND", "Kombinasi varietas/tingkat kematangan tidak ada di tabel referensi, isi override_persen manual")
  }
  const persen_cpo = override_persen?.cpo ?? ref!.cpo
  const persen_kernel = override_persen?.kernel ?? ref!.kernel
  return ok({
    cpo_ton: Math.round(tonase_TBS * persen_cpo * 100) / 100,
    kernel_ton: Math.round(tonase_TBS * persen_kernel * 100) / 100,
    source: override_persen ? "MANUAL_OVERRIDE" : "DEFAULT_TABLE",
  })
}
