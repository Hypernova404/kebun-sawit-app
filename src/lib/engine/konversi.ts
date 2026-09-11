import { fail, ok, type EngineResult, type KonversiResult } from "./types"

function keM2(nilai: number, satuan: string, tumbak: number): number | null {
  switch (satuan) {
    case "ha": return nilai * 10000
    case "m2": return nilai
    case "tumbak": return nilai * tumbak
    default: return null
  }
}

function keKg(nilai: number, satuan: string): number | null {
  switch (satuan) {
    case "ton": return nilai * 1000
    case "kg": return nilai
    case "kuintal": return nilai * 100
    default: return null
  }
}

export function faktorKonversi(dari_satuan: string, ke_satuan: string, konfigurasi_tumbak: number): number | null {
  const luas = ["ha", "m2", "tumbak"]
  const berat = ["ton", "kg", "kuintal"]
  if (luas.includes(dari_satuan) && luas.includes(ke_satuan)) {
    const a = keM2(1, dari_satuan, konfigurasi_tumbak)!
    const b = keM2(1, ke_satuan, konfigurasi_tumbak)!
    return a / b
  }
  if (berat.includes(dari_satuan) && berat.includes(ke_satuan)) {
    const a = keKg(1, dari_satuan)!
    const b = keKg(1, ke_satuan)!
    return a / b
  }
  return null
}

export function konversi(nilai: number, dari_satuan: string, ke_satuan: string, konfigurasi_tumbak = 14): EngineResult<KonversiResult> {
  if (nilai < 0) {
    return fail("INVALID_INPUT", "nilai tidak boleh negatif")
  }
  const faktor = faktorKonversi(dari_satuan, ke_satuan, konfigurasi_tumbak)
  if (faktor == null) {
    return fail("NOT_FOUND", "Kombinasi satuan tidak didukung")
  }
  return ok({
    nilai: Math.round(nilai * faktor * 10000) / 10000,
    dari_satuan,
    ke_satuan,
    faktor,
  })
}
