import { cn } from "@/lib/utils"

export type Status = "allowed" | "blocked" | "paused"

const dotColorMap: Record<Status, string> = {
  allowed: "bg-govern-green",
  blocked: "bg-govern-red",
  paused: "bg-govern-amber",
}

const labelMap: Record<Status, string> = {
  allowed: "Allowed",
  blocked: "Blocked",
  paused: "Paused",
}

export function StatusDot({ status, showLabel = true }: { status: Status; showLabel?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-2 rounded-full shrink-0", dotColorMap[status])} />
      {showLabel && (
        <span className="text-sm text-foreground">{labelMap[status]}</span>
      )}
    </span>
  )
}
