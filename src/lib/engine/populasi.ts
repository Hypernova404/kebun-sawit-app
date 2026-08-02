import { ok, fail, type BibitResult, type DesainBlokResult, type EngineResult, type PopulasiResult, type StatusBlok } from "./types"

export const SIN_60 = Math.sin(Math.PI / 3)

export function tentukanPola(jarak_tanam: number, jarak_baris: number): string {
  if (Math.abs(jarak_tanam - jarak_baris) < 0.01) return "persegi"
  const ratio = Math.min(jarak_tanam, jarak_baris) / Math.max(jarak_tanam, jarak_baris)
  if (Math.abs(ratio - SIN_60) < 0.03) return "segitiga_sama_sisi"
  return "persegi_panjang"
}

export function hitungPopulasi(luas_ha: number, jarak_tanam: number, jarak_baris: number): EngineResult<PopulasiResult> {
  if (luas_ha <= 0 || jarak_tanam <= 0 || jarak_baris <= 0) {
    return fail("INVALID_INPUT", "luas lahan, jarak tanam, dan jarak baris harus > 0")
  }

  const luas_per_pokok = jarak_tanam * jarak_baris
  const sph = 10000 / luas_per_pokok
  const sph_bulat = Math.round(sph)
  const jumlah_pokok = Math.floor(sph * luas_ha)

  const warnings: string[] = []
  if (jarak_tanam < 7 || jarak_tanam > 10) warnings.push(`Jarak tanam ${jarak_tanam} m di luar rentang umum 7-10 m`)
  if (jarak_baris < 7 || jarak_baris > 10) warnings.push(`Jarak baris ${jarak_baris} m di luar rentang umum 7-10 m`)

  return ok({
    pola: tentukanPola(jarak_tanam, jarak_baris),
    jarak_tanam,
    jarak_baris,
    luas_per_pokok: Math.round(luas_per_pokok * 100) / 100,
    sph_desimal: Math.round(sph * 100) / 100,
    populasi_per_ha: sph_bulat,
    jumlah_pokok,
    warning: warnings.length ? warnings.join(". ") + "." : null,
  })
}

export function hitungKebutuhanBibit(jumlah_pokok: number, persen_sulaman = 0.07): EngineResult<BibitResult> {
  if (jumlah_pokok <= 0) {
    return fail("INVALID_INPUT", "jumlah_pokok harus > 0")
  }
  let warning: string | null = null
  if (persen_sulaman < 0.05 || persen_sulaman > 0.1) {
    warning = "Persentase sulaman di luar rentang umum SOP (5-10%)"
  }
  const total_bibit = Math.ceil(jumlah_pokok * (1 + persen_sulaman))
  return ok({ total_bibit, cadangan: total_bibit - jumlah_pokok, warning })
}

export function hitungDesainBlok(luas_kotor_ha: number, luas_jalan_ha: number, luas_parit_ha: number): EngineResult<DesainBlokResult> {
  if (luas_kotor_ha <= 0) {
    return fail("INVALID_INPUT", "luas_kotor_ha harus > 0")
  }
  if (luas_jalan_ha < 0 || luas_parit_ha < 0) {
    return fail("INVALID_INPUT", "luas jalan/parit tidak boleh negatif")
  }
  const luas_efektif = luas_kotor_ha - (luas_jalan_ha + luas_parit_ha)
  if (luas_efektif < 0) {
    return fail("INVALID_INPUT", "luas jalan+parit melebihi luas kotor")
  }
  const rasio_efektif = Math.round((luas_efektif / luas_kotor_ha) * 1000) / 1000
  const status = rasio_efektif >= 0.9 ? "SESUAI STANDAR" : "DI BAWAH TARGET 90%"
  return ok({ luas_efektif: Math.round(luas_efektif * 100) / 100, rasio_efektif, status })
}

export function hitungStatusBlok(tahun_tanam: number, tahun_sekarang: number): EngineResult<{ umur: number; status: StatusBlok }> {
  if (tahun_tanam > tahun_sekarang) {
    return fail("INVALID_INPUT", "tahun_tanam tidak boleh di masa depan")
  }
  const umur = tahun_sekarang - tahun_tanam
  const status: StatusBlok = umur < 3 ? "TBM" : "TM"
  return ok({ umur, status })
}
