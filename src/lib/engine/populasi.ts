import { ok, fail, type BibitResult, type DesainBlokResult, type EngineResult, type PopulasiResult, type StatusBlok } from "./types"

export const POLA_MAP: Record<string, "triangular" | "square"> = {
  segitiga_sama_sisi: "triangular",
  mata_lima: "triangular",
  persegi: "square",
}

const SIN_60 = Math.sin(Math.PI / 3)

export function hitungPopulasi(luas_ha: number, jarak_tanam: number, pola: string): EngineResult<PopulasiResult> {
  if (luas_ha <= 0 || jarak_tanam <= 0) {
    return fail("INVALID_INPUT", "luas_ha dan jarak_tanam harus > 0")
  }
  const tipe = POLA_MAP[pola]
  if (!tipe) {
    return fail("INVALID_INPUT", "pola tidak dikenali")
  }

  let jarak_baris: number
  let luas_per_pokok: number
  if (tipe === "triangular") {
    jarak_baris = jarak_tanam * SIN_60
    luas_per_pokok = jarak_tanam ** 2 * SIN_60
  } else {
    jarak_baris = jarak_tanam
    luas_per_pokok = jarak_tanam ** 2
  }

  const jumlah_pokok = Math.floor((luas_ha * 10000) / luas_per_pokok)
  const populasi_per_ha = Math.round((10000 / luas_per_pokok) * 10) / 10
  const warning = jarak_tanam < 7 || jarak_tanam > 10 ? "Jarak tanam di luar rentang umum industri (7-10m)" : null

  return ok({
    pola,
    jarak_tanam,
    jarak_baris: Math.round(jarak_baris * 100) / 100,
    luas_per_pokok: Math.round(luas_per_pokok * 100) / 100,
    jumlah_pokok,
    populasi_per_ha,
    warning,
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
