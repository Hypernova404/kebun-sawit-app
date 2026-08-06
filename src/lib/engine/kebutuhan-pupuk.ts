import { generateJadwalTahunan, type BlokUntukJadwal } from "./pemupukan"
import { HARGA_PUPUK_KALIMANTAN } from "./harga"
import { fail, ok, type EngineResult, type PupukBlokItem } from "./types"

export const PERSEN_SUSUT_DEFAULT = 5 // buffer pupuk tumpah/sisa sak di lapangan

export function hitungKebutuhanPupukBlok(
  blok: BlokUntukJadwal & { jumlah_pokok: number },
  tahun: number,
  wilayah: string,
  harga_pupuk: Record<string, number>,
  berat_per_sak = 50,
  persen_susut = PERSEN_SUSUT_DEFAULT
): EngineResult<PupukBlokItem[]> {
  if (blok.jumlah_pokok <= 0) {
    return fail("INVALID_INPUT", "jumlah_pokok harus > 0")
  }
  if (persen_susut < 0 || persen_susut > 15) {
    return fail("INVALID_INPUT", "persen_susut harus antara 0-15%")
  }
  const jadwalResult = generateJadwalTahunan(blok, tahun, wilayah)
  if (!jadwalResult.success) return fail(jadwalResult.error!.code, jadwalResult.error!.message)
  if (!jadwalResult.data || jadwalResult.data.length === 0) {
    return fail("NOT_FOUND", "Tidak ada jadwal pemupukan untuk umur blok ini di tahun tersebut")
  }

  const status = tahun - blok.tahun_tanam < 3 ? "TBM" : "TM"
  const hasil: PupukBlokItem[] = []
  for (const item of jadwalResult.data) {
    const harga = harga_pupuk[item.jenis] ?? HARGA_PUPUK_KALIMANTAN[item.jenis]
    if (harga == null) {
      return fail("NOT_FOUND", `Harga untuk ${item.jenis} belum diisi dan tidak ada default`)
    }
    const dosis_kg = status === "TBM" ? (item.dosis as number) / 1000 : (item.dosis as number)
    const dosis_dasar_kg = Math.round(dosis_kg * blok.jumlah_pokok * 100) / 100
    const total_kg = Math.round(dosis_dasar_kg * (1 + persen_susut / 100) * 100) / 100
    const jumlah_sak = Math.ceil(total_kg / berat_per_sak)
    const biaya = Math.round(total_kg * harga)
    hasil.push({
      jenis: item.jenis,
      dosis_dasar_kg,
      susut_kg: Math.round((total_kg - dosis_dasar_kg) * 100) / 100,
      total_kg,
      jumlah_sak,
      biaya,
    })
  }
  return ok(hasil)
}
