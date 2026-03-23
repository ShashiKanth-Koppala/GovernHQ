"use client"

import { Button } from "@/components/ui/button"
import { StatCard } from "./stat-card"
import { CollapsibleRow } from "./collapsible-row"

const decisions = [
  {
    status: "blocked" as const,
    agent: "ARIA-7X",
    intent: "Send claims data to external API",
    time: "2 min ago",
  },
  {
    status: "paused" as const,
    agent: "HELPER-2A",
    intent: "Pull ALL customer records for export",
    time: "5 min ago",
  },
  {
    status: "paused" as const,
    agent: "SCOUT-3B",
    intent: "Send report to partner API",
    time: "8 min ago",
  },
  {
    status: "allowed" as const,
    agent: "ARIA-7X",
    intent: "Retrieve pending claims for daily triage",
    time: "2 min ago",
  },
  {
    status: "allowed" as const,
    agent: "SCOUT-3B",
    intent: "Flag unusual API traffic patterns",
    time: "4 min ago",
  },
  {
    status: "allowed" as const,
    agent: "NOVA-3",
    intent: "Generate compliance summary for Q4",
    time: "6 min ago",
  },
  {
    status: "blocked" as const,
    agent: "CORE-1",
    intent: "Override billing limit for customer #4421",
    time: "12 min ago",
  },
]

function ActionButtons() {
  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        className="h-6 text-xs px-3 border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10"
      >
        Allow
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-6 text-xs px-3 border-govern-red text-govern-red bg-transparent hover:bg-govern-red/10"
      >
        Block
      </Button>
    </div>
  )
}

export function DashboardTab() {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard value="52" label="agents" />
        <StatCard value="8,404" label="allowed" color="green" />
        <StatCard value="23" label="blocked" color="red" />
        <StatCard value="2" label="paused" color="amber" />
      </div>

      <div className="h-px bg-border" />

      <div>
        {decisions.map((d, i) => (
          <CollapsibleRow key={i} status={d.status} agent={d.agent} intent={d.intent} time={d.time}>
            {i === 0 && (
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p>Reasoning evaluated: Agent wanted to send data externally.</p>
                <p>Action blocked: External calls not in scope for this agent.</p>
                <p className="text-xs italic mt-1">Action never executed. Agent still running.</p>
              </div>
            )}
            {i === 1 && (
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p>Reasoning evaluated: Agent wants bulk access to all customer records.</p>
                <p>Action paused: Bulk PII access requires human approval.</p>
                <ActionButtons />
              </div>
            )}
            {i === 2 && (
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p>Reasoning evaluated: Agent wants to call external partner API.</p>
                <p>Action paused: External API requires human approval.</p>
                <ActionButtons />
              </div>
            )}
            {i === 3 && (
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>Reasoning approved. Action executed.</p>
                <p className="text-xs">Gate: 11ms</p>
              </div>
            )}
            {i === 4 && (
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>Reasoning approved. Action executed.</p>
                <p className="text-xs">Gate: 8ms</p>
              </div>
            )}
            {i === 5 && (
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <p>Reasoning approved. Action executed.</p>
                <p className="text-xs">Gate: 9ms</p>
              </div>
            )}
            {i === 6 && (
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p>Reasoning evaluated: Agent wanted to override billing limit.</p>
                <p>Action blocked: Billing overrides require Level 3 clearance.</p>
                <p className="text-xs italic mt-1">Action never executed. Agent still running.</p>
              </div>
            )}
          </CollapsibleRow>
        ))}
      </div>

      <div className="flex justify-end">
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          Show more
        </button>
      </div>
    </div>
  )
}
