"use client"

import { useEffect, useState } from "react"
import { getStrukturKebun, type StrukturKebun } from "@/lib/actions"

export function useStruktur() {
  const [struktur, setStruktur] = useState<StrukturKebun[] | null>(null)
  useEffect(() => {
    getStrukturKebun().then(setStruktur)
  }, [])
  return struktur
}
