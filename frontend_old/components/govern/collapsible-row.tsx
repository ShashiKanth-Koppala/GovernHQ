"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusDot, type Status } from "./status-icon"

interface CollapsibleRowProps {
  status: Status
  agent: string
  intent: string
  time: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleRow({
  status,
  agent,
  intent,
  time,
  children,
  defaultOpen = false,
}: CollapsibleRowProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full py-3 text-left cursor-pointer group"
      >
        <StatusDot status={status} showLabel={false} />
        <span className="font-mono font-semibold text-sm text-foreground shrink-0">{agent}</span>
        <span className="text-sm text-muted-foreground truncate flex-1">{`"${intent}"`}</span>
        <span className="text-xs text-muted-foreground shrink-0">{time}</span>
        <ChevronRight
          className={cn(
            "size-3.5 text-muted-foreground shrink-0 transition-transform duration-150",
            open && "rotate-90"
          )}
        />
      </button>
      {open && (
        <div className="pb-3 pl-5">
          {children}
        </div>
      )}
    </div>
  )
}
