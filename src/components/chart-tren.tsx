"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export type TrenProduksi = { bulan: string; tonase: number }

export default function ChartTren({ data }: { data: TrenProduksi[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
  )
}
