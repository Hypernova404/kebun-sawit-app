import { generateJadwalTahunan, type BlokUntukJadwal } from "./pemupukan"
import { fail, ok, type EngineResult, type PupukBlokItem } from "./types"

export function hitungKebutuhanPupukBlok(
  blok: BlokUntukJadwal & { jumlah_pokok: number },
  tahun: number,
  wilayah: string,
  harga_pupuk: Record<string, number>,
  berat_per_sak = 50
): EngineResult<PupukBlokItem[]> {
  if (blok.jumlah_pokok <= 0) {
    return fail("INVALID_INPUT", "jumlah_pokok harus > 0")
  }
  const jadwalResult = generateJadwalTahunan(blok, tahun, wilayah)
  if (!jadwalResult.success) return fail(jadwalResult.error!.code, jadwalResult.error!.message)
  if (!jadwalResult.data || jadwalResult.data.length === 0) {
    return fail("NOT_FOUND", "Tidak ada jadwal pemupukan untuk umur blok ini di tahun tersebut")
  }

  const status = tahun - blok.tahun_tanam < 3 ? "TBM" : "TM"
  const hasil: PupukBlokItem[] = []
  for (const item of jadwalResult.data) {
    const harga = harga_pupuk[item.jenis]
    if (harga == null) {
      return fail("NOT_FOUND", `Harga untuk ${item.jenis} belum diisi`)
    }
    const dosis_kg = status === "TBM" ? (item.dosis as number) / 1000 : (item.dosis as number)
    const total_kg = Math.round(dosis_kg * blok.jumlah_pokok * 100) / 100
    const jumlah_sak = Math.ceil(total_kg / berat_per_sak)
    const biaya = Math.round(total_kg * harga)
    hasil.push({ jenis: item.jenis, total_kg, jumlah_sak, biaya })
  }
  return ok(hasil)
}
