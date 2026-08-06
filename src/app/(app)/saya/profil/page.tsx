import { redirect } from "next/navigation"
import { BadgeCheck, Mail, UserRound } from "lucide-react"
import { getSessionUser } from "@/lib/session"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"

export default async function ProfilPage() {
  const user = await getSessionUser()
  if (!user) redirect("/masuk")

  const initial = (user.name?.trim() ?? user.email?.[0] ?? "S").slice(0, 1).toUpperCase()

  return (
    <>
      <PageHeader
        backHref="/saya"
        title="Profil Saya"
        description="Data akun yang terhubung. Informasi diambil langsung dari akun Google-mu."
        category="Akun"
      />
      <div className="flex flex-col gap-6 px-6 py-6 lg:px-10">
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 pt-8">
            <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-primary text-3xl font-semibold text-primary-foreground">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={user.name ?? "Foto profil"} className="size-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="flex items-center gap-1.5 text-xl font-bold tracking-tight">
                <UserRound data-icon className="size-5 text-muted-foreground" />
                {user.name ?? "Pengguna"}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail data-icon className="size-4" />
                {user.email ?? "-"}
              </p>
              <span className="mt-1 flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                <BadgeCheck data-icon className="size-3.5 text-primary" />
                Masuk dengan Google
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
