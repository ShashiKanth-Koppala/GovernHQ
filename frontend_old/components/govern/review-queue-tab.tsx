"use client"

import { useState } from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CollapsibleRow } from "./collapsible-row"
import { StatCard } from "./stat-card"
import { cn } from "@/lib/utils"

interface ReviewItem {
  id: string
  agent: string
  intent: string
  reason: string
  waitTime: string
  priority: "high" | "medium" | "low"
}

export function ReviewQueueTab() {
  const [items, setItems] = useState<ReviewItem[]>([
    {
      id: "1",
      agent: "ARIA-7X",
      intent: "Pull ALL customer records for export",
      reason: "Bulk PII access requires human approval",
      waitTime: "5 min",
      priority: "high",
    },
    {
      id: "2",
      agent: "SCOUT-3B",
      intent: "Send report to partner API endpoint",
      reason: "External API call requires approval",
      waitTime: "8 min",
      priority: "high",
    },
    {
      id: "3",
      agent: "NOVA-3",
      intent: "Update customer billing information",
      reason: "Financial operation requires verification",
      waitTime: "12 min",
      priority: "medium",
    },
    {
      id: "4",
      agent: "CORE-1",
      intent: "Create batch database backup",
      reason: "Large operation exceeds rate limits",
      waitTime: "2 min",
      priority: "medium",
    },
  ])

  const handleApprove = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleReject = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const highPriorityCount = items.filter(i => i.priority === "high").length

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard value={items.length.toString()} label="pending reviews" />
        <StatCard value={highPriorityCount.toString()} label="high priority" color="red" />
        <StatCard value="2h 34m" label="avg decision time" />
        <StatCard value="94%" label="approval rate" color="green" />
      </div>

      <div className="h-px bg-border" />

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="text-4xl">✓</div>
          </div>
          <h3 className="text-foreground font-semibold mb-2">All caught up!</h3>
          <p className="text-muted-foreground">No pending reviews. Your agents are running smoothly.</p>
        </div>
      ) : (
        <div>
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Pending Actions ({items.length})
          </h3>
          <div className="space-y-1">
            {items.map((item) => (
              <CollapsibleRow
                key={item.id}
                status="paused"
                agent={item.agent}
                intent={item.intent}
                time={item.waitTime}
              >
                <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-semibold shrink-0 mt-1",
                      item.priority === "high"
                        ? "bg-govern-red/20 text-govern-red"
                        : item.priority === "medium"
                          ? "bg-govern-amber/20 text-govern-amber"
                          : "bg-govern-green/20 text-govern-green"
                    )}>
                      {item.priority.toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-1">Action Details</p>
                      <p>{item.reason}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>Waiting for {item.waitTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      className="border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10 border"
                      onClick={() => handleApprove(item.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      className="border-govern-red text-govern-red bg-transparent hover:bg-govern-red/10 border"
                      onClick={() => handleReject(item.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-muted-foreground bg-transparent hover:bg-secondary ml-auto"
                    >
                      Defer
                    </Button>
                  </div>
                </div>
              </CollapsibleRow>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
