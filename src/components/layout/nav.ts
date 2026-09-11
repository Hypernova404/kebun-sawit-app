import {
  Calculator,
  History,
  LayoutDashboard,
  Sprout,
  TreePine,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { href: string; label: string; icon: LucideIcon }
export type NavGroup = { kategori: string; icon: LucideIcon; items: NavItem[] }

export const NAV_GROUPS: NavGroup[] = [
  {
    kategori: "Kalkulator",
    icon: Calculator,
    items: [
      { href: "/populasi", label: "Perhitungan Populasi", icon: TreePine },
      { href: "/bibit", label: "Kebutuhan Bibit", icon: Sprout },
    ],
  },
  {
    kategori: "Riwayat",
    icon: History,
    items: [{ href: "/riwayat", label: "Riwayat Hitungan", icon: History }],
  },
]

export const BOTTOM_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/populasi", label: "Populasi", icon: TreePine },
  { href: "/bibit", label: "Bibit", icon: Sprout },
  { href: "/riwayat", label: "Riwayat", icon: History },
]