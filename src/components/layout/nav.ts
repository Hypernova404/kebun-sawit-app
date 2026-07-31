import {
  ArrowLeftRight,
  FlaskConical,
  History,
  LayoutDashboard,
  LayoutGrid,
  Map,
  Package,
  Percent,
  Scale,
  Sprout,
  TreePine,
  TrendingUp,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { href: string; label: string; icon: LucideIcon }
export type NavGroup = { kategori: string; icon: LucideIcon; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    kategori: "Perencanaan Tanam",
    icon: TreePine,
    items: [
      { href: "/populasi", label: "Populasi & Luas Lahan", icon: TreePine },
      { href: "/bibit", label: "Kebutuhan Bibit", icon: Sprout },
      { href: "/desain-blok", label: "Desain Blok & Jalan", icon: LayoutGrid },
    ],
  },
  {
    kategori: "Pemupukan & Nutrisi",
    icon: FlaskConical,
    items: [
      { href: "/pemupukan", label: "Dosis & Jadwal", icon: FlaskConical },
      { href: "/kebutuhan-pupuk", label: "Kebutuhan & Biaya", icon: Package },
    ],
  },
  {
    kategori: "Produksi & Ekonomi",
    icon: TrendingUp,
    items: [
      { href: "/produksi", label: "Estimasi Produksi TBS", icon: TrendingUp },
      { href: "/rendemen", label: "Rendemen CPO & Kernel", icon: Percent },
      { href: "/pengiriman", label: "Pengiriman TBS ke PKS", icon: Truck },
      { href: "/bep", label: "Pendapatan & BEP", icon: Scale },
    ],
  },
  {
    kategori: "Manajemen Kebun",
    icon: Map,
    items: [
      { href: "/blok", label: "Data Blok Kebun", icon: Map },
      { href: "/pemanen", label: "Rotasi Panen & Pemanen", icon: Users },
    ],
  },
  {
    kategori: "Alat Bantu & Referensi",
    icon: ArrowLeftRight,
    items: [
      { href: "/konversi", label: "Konversi Satuan", icon: ArrowLeftRight },
      { href: "/riwayat", label: "Riwayat & Laporan", icon: History },
    ],
  },
]

export const BOTTOM_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pemupukan", label: "Pupuk", icon: FlaskConical },
  { href: "/pengiriman", label: "Kirim TBS", icon: Truck },
  { href: "/blok", label: "Blok", icon: Map },
  { href: "/riwayat", label: "Riwayat", icon: History },
]
