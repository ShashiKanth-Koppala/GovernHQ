import { cn } from "@/lib/utils"

type StatColor = "default" | "green" | "red" | "amber"

const colorMap: Record<StatColor, string> = {
  default: "text-foreground",
  green: "text-govern-green",
  red: "text-govern-red",
  amber: "text-govern-amber",
}

interface StatCardProps {
  value: string
  label: string
  color?: StatColor
  sublabel?: string
}

export function StatCard({ value, label, color = "default", sublabel }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-6">
      <span className={cn("text-3xl font-semibold tracking-tight font-mono", colorMap[color])}>
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{label}</span>
      {sublabel && (
        <span className="text-xs text-muted-foreground">{sublabel}</span>
      )}
    </div>
  )
}
