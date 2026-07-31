import { Badge } from "@/components/ui/badge"

export function PageHeader({
  title,
  description,
  category,
}: {
  title: string
  description: string
  category: string
}) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-border bg-background px-6 py-6 lg:px-10">
      <Badge variant="secondary" className="w-fit">
        {category}
      </Badge>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
