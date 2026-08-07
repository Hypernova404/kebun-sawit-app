import { describe, expect, it } from "vitest"
import { BOTTOM_NAV, NAV_GROUPS } from "../nav"

describe("navigasi sidebar", () => {
  it("setiap link di bottom nav mobile juga tersedia di sidebar desktop", () => {
    const desktopLinks = [
      ...NAV_GROUPS.flatMap((g) => g.items),
      { href: "/", label: "Dashboard", icon: null as never },
    ]
    for (const mobile of BOTTOM_NAV) {
      const found = desktopLinks.some((d) => d.href === mobile.href)
      expect(found, `href ${mobile.href} (${mobile.label}) tidak ada di navigasi desktop`).toBe(true)
    }
  })
})
