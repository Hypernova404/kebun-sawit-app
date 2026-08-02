import { ArrowLeftRight, FlaskConical, Map, TrendingUp, TreePine, type LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const BANTUAN: { kategori: string; icon: LucideIcon; isi: string[] }[] = [
  {
    kategori: "Perencanaan Tanam",
    icon: TreePine,
    isi: [
      "Populasi & Luas Lahan: hitung jumlah pohon ideal berdasarkan luas kebun dan jarak tanam.",
      "Kebutuhan Bibit: perkirakan jumlah bibit termasuk cadangan penyulaman.",
      "Desain Blok & Jalan: susun pembagian blok, afdeling, dan jalan produksi.",
    ],
  },
  {
    kategori: "Pemupukan & Nutrisi",
    icon: FlaskConical,
    isi: [
      "Dosis & Jadwal: hitung dosis pupuk per pohon sesuai umur tanaman dan jadwal aplikasi.",
      "Kebutuhan & Biaya: total kebutuhan pupuk dan estimasi biaya per blok.",
    ],
  },
  {
    kategori: "Produksi & Ekonomi",
    icon: TrendingUp,
    isi: [
      "Estimasi Produksi TBS: proyeksi tandan buah segar berdasarkan populasi dan potensi.",
      "Rendemen CPO & Kernel: hitung rendemen dari hasil olahan pabrik.",
      "Pengiriman TBS ke PKS: rencana pengiriman dan tonase ke pabrik kelapa sawit.",
      "Pendapatan & BEP: analisis pendapatan dan titik impas usaha kebun.",
    ],
  },
  {
    kategori: "Manajemen Kebun",
    icon: Map,
    isi: [
      "Data Blok Kebun: kelola data blok, afdeling, dan riwayat per blok.",
      "Rotasi Panen & Pemanen: atur rotasi panen dan kebutuhan tenaga pemanen.",
    ],
  },
  {
    kategori: "Alat Bantu & Referensi",
    icon: ArrowLeftRight,
    isi: [
      "Konversi Satuan: ubah satuan luas, berat, dan hasil antar unit.",
      "Riwayat & Laporan: semua hasil kalkulasi tersimpan otomatis dan bisa diunduh jadi PDF.",
    ],
  },
]

export default function BantuanPage() {
  return (
    <>
      <PageHeader
        backHref="/saya"
        title="Bantuan & Panduan"
        description="Panduan singkat untuk setiap menu kalkulator SawitDesk."
        category="Akun"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        {BANTUAN.map((g) => (
          <Card key={g.kategori} className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <g.icon data-icon className="size-5 text-primary" />
                {g.kategori}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {g.isi.map((t) => (
                <p key={t} className="text-sm text-muted-foreground">
                  {t}
                </p>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
