import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function PageHeader({
  title,
  description,
  category,
  backHref,
}: {
  title: string
  description: string
  category: string
  backHref?: string
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border bg-background px-6 py-6 lg:px-10">
      {backHref ? (
        <Link
          href={backHref}
          className="mb-1 flex w-fit items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft data-icon className="size-4" />
          Kembali
        </Link>
      ) : null}
      <Badge variant="secondary" className="w-fit">
        {category}
      </Badge>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
