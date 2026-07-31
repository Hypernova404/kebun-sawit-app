"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowUpRight, Banknote, Droplets, Leaf, PiggyBank } from "lucide-react"
import { getDashboard } from "@/lib/actions"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge, statusVariantFor } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { NAV_GROUPS } from "@/components/layout/nav"

type Dashboard = Awaited<ReturnType<typeof getDashboard>>

function Kpi({ label, value, suffix, icon: Icon, tone }: { label: string; value: string; suffix?: string; icon: typeof Leaf; tone?: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between pt-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`num text-2xl font-semibold tracking-tight ${tone ?? "text-foreground"}`}>
            {value}
            {suffix ? <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span> : null}
          </span>
        </div>
        <span className="rounded-lg bg-muted p-2 text-primary">
          <Icon data-icon />
        </span>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)

  useEffect(() => {
    getDashboard().then(setData)
  }, [])

  return (
    <div className="flex flex-col gap-6 px-6 py-8 lg:px-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Ringkasan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agregasi real-time dari seluruh data yang sudah tercatat — laporan manajemen bulanan.
        </p>
      </div>

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Total luas kebun" value={data.total_luas.toLocaleString("id-ID")} suffix="ha" icon={Leaf} />
          <Kpi label="Produksi TBS bulan ini" value={data.total_produksi_bulan_ini.toLocaleString("id-ID", { maximumFractionDigits: 1 })} suffix="ton" icon={Droplets} />
          <Kpi label="Pendapatan bulan ini" value={"Rp " + data.total_pendapatan_bulan_ini.toLocaleString("id-ID")} icon={Banknote} />
          <Kpi
            label="Laba / rugi bulan ini"
            value={"Rp " + Math.abs(data.estimasi_laba_rugi).toLocaleString("id-ID")}
            icon={PiggyBank}
            tone={data.estimasi_laba_rugi >= 0 ? "text-success" : "text-danger"}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Tren produksi 6 bulan terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            {!data ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.tren_produksi} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tbs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2F5233" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2F5233" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E5E7E2" vertical={false} />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} unit=" t" />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #E5E7E2", fontSize: 13 }}
                      formatter={(v) => [`${Number(v ?? 0).toLocaleString("id-ID")} ton`, "TBS"]}
                    />
                    <Area type="monotone" dataKey="tonase" stroke="#2F5233" strokeWidth={2} fill="url(#tbs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Biaya pupuk bulan ini</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!data ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="num text-3xl font-semibold tracking-tight">Rp {data.total_biaya_pupuk_bulan_ini.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowUpRight data-icon />
                  Harga default: pasar Kalimantan
                </div>
                <StatusBadge
                  status={data.estimasi_laba_rugi >= 0 ? "UNTUNG" : "RUGI"}
                  variant={statusVariantFor(data.estimasi_laba_rugi >= 0 ? "UNTUNG" : "RUGI")}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {NAV_GROUPS.flatMap((g) => g.items).slice(0, 8).map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="shadow-sm transition-shadow hover:shadow">
              <CardContent className="flex items-center gap-3 py-4">
                <span className="rounded-lg bg-muted p-2 text-primary">
                  <item.icon data-icon />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{gLabel(item.href)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function gLabel(href: string): string {
  return NAV_GROUPS.find((g) => g.items.some((i) => i.href === href))?.kategori ?? ""
}
