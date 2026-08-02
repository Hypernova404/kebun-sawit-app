import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight, CircleUser, HelpCircle, Info, Leaf, Map, Settings, History } from "lucide-react"
import { getSessionUser } from "@/lib/session"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { KeluarButton } from "@/components/layout/keluar-button"

const MENU = [
  { href: "/saya/profil", label: "Profil Saya", description: "Data akun dan identitas pengguna", icon: CircleUser },
  { href: "/blok", label: "Data Kebun Saya", description: "Kelola blok, afdeling, dan luas kebunmu", icon: Map },
  { href: "/riwayat", label: "Riwayat Perhitungan Saya", description: "Semua hasil kalkulasi tersimpan", icon: History },
  { href: "/saya/pengaturan", label: "Pengaturan", description: "Preferensi aplikasi", icon: Settings },
  { href: "/saya/bantuan", label: "Bantuan & Panduan", description: "Cara pakai setiap menu kalkulator", icon: HelpCircle },
  { href: "/saya/tentang", label: "Tentang Aplikasi", description: "Informasi SawitDesk dan versi", icon: Info },
]

export default async function SayaPage() {
  const user = await getSessionUser()
  if (!user) redirect("/masuk")

  const initial = (user.name?.trim() ?? user.email?.[0] ?? "S").slice(0, 1).toUpperCase()

  return (
    <>
      <PageHeader
        backHref="/"
        title="Menu Saya"
        description="Profil akun, data kebun, dan pengaturan pribadi kamu."
        category="Akun"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? "Foto profil"} className="size-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{user.name ?? "Pengguna"}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col divide-y divide-border pt-0">
            {MENU.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-2 py-3.5 transition-colors hover:bg-muted"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  <item.icon data-icon className="size-4.5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{item.description}</span>
                </span>
                <ChevronRight data-icon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
            <div className="flex items-center gap-3 px-2 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Leaf data-icon className="size-4.5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">Keluar</span>
                <span className="truncate text-xs text-muted-foreground">Akhiri sesi di perangkat ini</span>
              </span>
              <KeluarButton className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
