"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Leaf, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"
import { KeluarButton } from "./keluar-button"
import { BOTTOM_NAV, NAV_GROUPS } from "./nav"

export function Sidebar() {
  const pathname = usePathname()
  const activeGroup =
    NAV_GROUPS.find((g) => g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))) ??
    NAV_GROUPS[0]

  return (
    <>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-canvas">
        <Link href="/" className="flex items-center gap-2.5 px-6 h-16 border-b border-border">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Leaf data-icon />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">SawitDesk</span>
            <span className="text-[11px] text-muted-foreground">Manajemen Kebun Kelapa Sawit</span>
          </div>
        </Link>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <LayoutDashboard data-icon />
            Dashboard
          </Link>
          {NAV_GROUPS.map((group) => {
            const open = activeGroup.kategori === group.kategori
            return (
              <details key={group.kategori} open={open} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
                  <group.icon data-icon />
                  <span className="flex-1">{group.kategori}</span>
                  <ChevronDown data-icon className="transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-1 flex flex-col gap-0.5 pl-4">
                  {group.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-secondary text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon data-icon />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </nav>
        <div className="border-t border-border px-4 py-3">
          <KeluarButton />
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background lg:hidden">
        {BOTTOM_NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <item.icon data-icon />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
