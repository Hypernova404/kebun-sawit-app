"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { StrukturKebun } from "@/lib/actions"

export function BlokSelect({
  struktur,
  value,
  onChange,
  allowNone = false,
}: {
  struktur: StrukturKebun[]
  value: string
  onChange: (id: string) => void
  allowNone?: boolean
}) {
  const totalBlok = struktur.reduce(
    (s, k) => s + k.afdelingen.reduce((a, af) => a + af.bloks.length, 0),
    0
  )

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="blok">Blok (opsional)</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger id="blok" className="w-full">
          <SelectValue placeholder="Pilih blok - hasil menempel ke blok ini" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {allowNone && (
            <SelectItem value="__none__">Tanpa blok</SelectItem>
          )}
          {struktur.map((k) =>
            k.afdelingen.map((a) =>
              a.bloks.length > 0 ? (
                <SelectGroup key={a.id}>
                  <SelectLabel className="text-xs text-muted-foreground">
                    {k.nama} / {a.kode}
                  </SelectLabel>
                  {a.bloks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.kode} - {b.status}, {b.luasHa} ha
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null
            )
          )}
          {totalBlok === 0 && (
            <SelectItem value="__none__" disabled>
              Tambah blok dulu di menu Data Blok
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
