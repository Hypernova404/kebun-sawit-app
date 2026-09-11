import { describe, expect, it } from "vitest"
import { parseNum } from "../form-field"

describe("parseNum (format angka Indonesia)", () => {
  it("mengartikan titik ribuan sebagai ribuan, bukan desimal", () => {
    expect(parseNum("4.920")).toBe(4920)
    expect(parseNum("4.920.000")).toBe(4920000)
  })

  it("koma tetap desimal", () => {
    expect(parseNum("4,5")).toBe(4.5)
    expect(parseNum("4,920")).toBe(4.92)
  })

  it("desimal dengan titik tetap valid", () => {
    expect(parseNum("7.8")).toBe(7.8)
    expect(parseNum("10.25")).toBe(10.25)
  })

  it("angka polos tanpa separator", () => {
    expect(parseNum("4290")).toBe(4290)
    expect(parseNum("0")).toBe(0)
  })

  it("input kosong atau tidak valid", () => {
    expect(parseNum("")).toBeNull()
    expect(parseNum("   ")).toBeNull()
    expect(parseNum("abc")).toBeNull()
  })
})