import { fail, ok, type EngineResult, type KebutuhanPemanenResult } from "./types"

export const FAKTOR_TOPOGRAFI: Record<string, number> = {
  datar: 1.0,
  berbukit: 0.8,
}

export const FAKTOR_UMUR_POHON = { ambang_tahun: 15, faktor: 0.85 } as const

export function faktorUmurPohon(umur_tahun: number | null): number {
  if (umur_tahun == null) return 1.0
  return umur_tahun > FAKTOR_UMUR_POHON.ambang_tahun ? FAKTOR_UMUR_POHON.faktor : 1.0
}

export type HitungPemanenParams = {
  total_kg_siap_panen: number
  rotasi_hari: number
  kapasitas_per_orang_per_hari?: number
  topografi?: string
  umur_tahun?: number | null
  jumlah_pokok?: number | null
  pohon_per_pemanen_per_hari?: number
}

export function hitungKebutuhanPemanen(params: HitungPemanenParams): EngineResult<KebutuhanPemanenResult> {
  const { total_kg_siap_panen, rotasi_hari } = params
  const kapasitas = params.kapasitas_per_orang_per_hari ?? 800
  const topografi = params.topografi ?? "datar"
  const pohon_per_pemanen = params.pohon_per_pemanen_per_hari ?? 300
  if (total_kg_siap_panen <= 0) {
    return fail("INVALID_INPUT", "total_kg_siap_panen harus > 0")
  }
  if (rotasi_hari <= 0 || kapasitas <= 0 || pohon_per_pemanen <= 0) {
    return fail("DIVISION_BY_ZERO", "rotasi_hari, kapasitas, dan pohon per pemanen harus > 0")
  }
  const faktor_topografi = FAKTOR_TOPOGRAFI[topografi]
  if (faktor_topografi == null) {
    return fail("INVALID_INPUT", `Topografi tidak dikenal: ${topografi}`)
  }
  const faktor_umur = faktorUmurPohon(params.umur_tahun ?? null)
  const faktor_kinerja = faktor_topografi * faktor_umur
  const kapasitas_efektif = kapasitas * faktor_kinerja

  const jumlah_dari_tonase = Math.ceil(total_kg_siap_panen / (kapasitas_efektif * rotasi_hari))

  let jumlah_dari_pohon: number | null = null
  if (params.jumlah_pokok != null && params.jumlah_pokok > 0) {
    const pohon_per_hari = params.jumlah_pokok / rotasi_hari
    jumlah_dari_pohon = Math.ceil(pohon_per_hari / pohon_per_pemanen)
  }

  const jumlah_pemanen =
    jumlah_dari_pohon == null ? jumlah_dari_tonase : Math.max(jumlah_dari_tonase, jumlah_dari_pohon)

  const warning =
    params.umur_tahun != null && params.umur_tahun > FAKTOR_UMUR_POHON.ambang_tahun
      ? `Pohon di atas ${FAKTOR_UMUR_POHON.ambang_tahun} tahun cenderung lebih tinggi — kapasitas dipangkas ${(1 - FAKTOR_UMUR_POHON.faktor) * 100}%`
      : null

  return ok({
    jumlah_pemanen,
    total_kg_siap_panen,
    kapasitas_efektif: Math.round(kapasitas_efektif * 100) / 100,
    jumlah_dari_tonase,
    jumlah_dari_pohon,
    faktor_kinerja: Math.round(faktor_kinerja * 100) / 100,
    warning,
  })
}
