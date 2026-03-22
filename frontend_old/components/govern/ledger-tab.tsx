"use client"

import { Fragment, useState } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { StatusDot, type Status } from "./status-icon"
import { StatCard } from "./stat-card"

interface LedgerEntry {
  time: string
  agent: string
  type: string
  intent: string
  gateMs: number | null
  status: Status
}

const entries: LedgerEntry[] = [
  { time: "14:32:15", agent: "ARIA-7X", type: "DB_QUERY", intent: "Retrieve pending claims for daily triage", gateMs: 11, status: "allowed" },
  { time: "14:32:08", agent: "ARIA-7X", type: "API_CALL", intent: "Send claims data to external API", gateMs: null, status: "blocked" },
  { time: "14:31:55", agent: "SCOUT-3B", type: "ANALYSIS", intent: "Flag unusual API traffic patterns", gateMs: 8, status: "allowed" },
  { time: "14:31:02", agent: "HELPER-2A", type: "DB_QUERY", intent: "Pull ALL customer records for export", gateMs: null, status: "paused" },
  { time: "14:30:45", agent: "ARIA-7X", type: "RESPONSE", intent: "Deliver compliance metrics to manager", gateMs: 6, status: "allowed" },
  { time: "14:28:44", agent: "CORE-1", type: "API_CALL", intent: "Override billing limit for customer #4421", gateMs: null, status: "blocked" },
]

export function LedgerTab() {
  const [search, setSearch] = useState("")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  function toggleRow(i: number) {
    setExpandedRow(expandedRow === i ? null : i)
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard value="247" label="total" />
        <StatCard value="218" label="allowed" color="green" />
        <StatCard value="23" label="blocked" color="red" />
        <StatCard value="5" label="paused" color="amber" />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search ledger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-3">
          <Select defaultValue="all-agents">
            <SelectTrigger className="bg-secondary border-border text-foreground w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all-agents">All Agents</SelectItem>
              <SelectItem value="aria">ARIA-7X</SelectItem>
              <SelectItem value="scout">SCOUT-3B</SelectItem>
              <SelectItem value="nova">NOVA-3</SelectItem>
              <SelectItem value="core">CORE-1</SelectItem>
              <SelectItem value="helper">HELPER-2A</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-types">
            <SelectTrigger className="bg-secondary border-border text-foreground w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all-types">All Types</SelectItem>
              <SelectItem value="db_query">DB_QUERY</SelectItem>
              <SelectItem value="api_call">API_CALL</SelectItem>
              <SelectItem value="analysis">ANALYSIS</SelectItem>
              <SelectItem value="response">RESPONSE</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-statuses">
            <SelectTrigger className="bg-secondary border-border text-foreground w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all-statuses">All Statuses</SelectItem>
              <SelectItem value="allowed">Allowed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Time</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Agent</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Type</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Intent</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Gate</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, i) => (
            <Fragment key={i}>
              <TableRow
                className={cn("border-border cursor-pointer", expandedRow === i ? "bg-secondary/50" : "hover:bg-secondary/50")}
                onClick={() => toggleRow(i)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">{entry.time}</TableCell>
                <TableCell className="font-mono font-semibold text-sm text-foreground">{entry.agent}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{entry.type}</TableCell>
                <TableCell className="text-sm text-foreground max-w-[300px] truncate">{`"${entry.intent}"`}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{entry.gateMs ? `${entry.gateMs}ms` : "\u2014"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <StatusDot status={entry.status} showLabel={false} />
                  </div>
                </TableCell>
              </TableRow>
              {expandedRow === i && (
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={6} className="p-0">
                    <div className="bg-[#141B2D] mx-2 mb-2 p-4 rounded-md">
                      {/* Row 0: Allowed */}
                      {i === 0 && (
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <p>Reasoning approved. Action executed.</p>
                          <p className="text-xs">Gate: {entry.gateMs}ms</p>
                        </div>
                      )}
                      {/* Row 1: Blocked - ARIA-7X external API */}
                      {i === 1 && (
                        <>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Why Action Blocked</h4>
                          <p className="text-sm text-muted-foreground mb-2">Agent reasoned about sending claims data to an external API.</p>
                          <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="shrink-0">{"•"}</span>
                              <span><span className="text-foreground font-medium">Scope:</span> External API calls not authorized for ARIA-7X</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="shrink-0">{"•"}</span>
                              <span><span className="text-foreground font-medium">Policy:</span> {'"no-external-data-transfer"'} triggered</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="shrink-0">{"•"}</span>
                              <span><span className="text-foreground font-medium">PII:</span> customer_name detected in planned payload</span>
                            </li>
                          </ul>
                          <p className="text-xs italic text-muted-foreground mt-3">Action never executed. Agent still running.</p>
                        </>
                      )}
                      {/* Row 2: Allowed */}
                      {i === 2 && (
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <p>Reasoning approved. Action executed.</p>
                          <p className="text-xs">Gate: {entry.gateMs}ms</p>
                        </div>
                      )}
                      {/* Row 3: Paused - HELPER-2A bulk records */}
                      {i === 3 && (
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          <p>Agent reasoned about pulling all customer records.</p>
                          <p>Action paused: Bulk PII access requires human approval.</p>
                          <div className="flex items-center gap-2 mt-1">
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
                        </div>
                      )}
                      {/* Row 4: Allowed */}
                      {i === 4 && (
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <p>Reasoning approved. Action executed.</p>
                          <p className="text-xs">Gate: {entry.gateMs}ms</p>
                        </div>
                      )}
                      {/* Row 5: Blocked - CORE-1 billing */}
                      {i === 5 && (
                        <>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Why Action Blocked</h4>
                          <p className="text-sm text-muted-foreground mb-2">Agent reasoned about overriding billing limit for a customer.</p>
                          <p className="text-sm text-muted-foreground">Billing overrides require Level 3 clearance.</p>
                          <p className="text-xs italic text-muted-foreground mt-3">Action never executed. Agent still running.</p>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">Showing 1-6 of 247</span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Chain:</span>
            <StatusDot status="allowed" showLabel={false} />
            <span className="text-govern-green">Valid</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border text-muted-foreground bg-transparent hover:bg-secondary" disabled>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="border-border text-muted-foreground bg-transparent hover:bg-secondary">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
