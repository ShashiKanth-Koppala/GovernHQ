"use client"

import { Fragment, useCallback, useEffect, useState } from "react"
import { Search, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react"
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
import { supabase } from "@/lib/supabase"

const API = process.env.NEXT_PUBLIC_API_URL

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function apiFetch(path: string) {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

interface LedgerRow {
  id: string
  agent_id: string
  action: string
  status: "allow" | "pause" | "block"
  metadata: Record<string, unknown> | null
  created_at: string
  organization_id: string
  action_type: string | null
  prev_hash: string | null
}

interface Metrics {
  total: number
  allowed: number
  blocked: number
  paused: number
  agents_monitored: number
  avg_gate_ms: number | null
}

interface ChainIntegrity {
  ok: boolean
  chained_rows: number
  total_rows: number
  broken_at: string | null
  checked_at: string
  message?: string
}

const ACTION_TYPES = ["DB_QUERY", "DB_WRITE", "API_CALL", "FILE_IO", "NOTIFICATION", "AGENT_ACTION"] as const

function dbStatusToStatus(s: string): Status {
  if (s === "allow") return "allowed"
  if (s === "block") return "blocked"
  if (s === "pause") return "paused"
  return "allowed"
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toTimeString().slice(0, 8)
  } catch {
    return "—"
  }
}

function formatCheckedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString()
  } catch {
    return iso
  }
}

const LIMIT = 20

export function LedgerTab() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "allow" | "pause" | "block">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all-types")
  const [offset, setOffset] = useState(0)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [total, setTotal] = useState(0)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [chain, setChain] = useState<ChainIntegrity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (
    status: string,
    off: number,
    actionType: string,
  ) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(off) })
      if (status !== "all") params.set("status", status)
      if (actionType !== "all-types") params.set("action_type", actionType)

      const [ledgerRes, metricsRes, chainRes] = await Promise.all([
        apiFetch(`/monitoring/ledger?${params}`),
        apiFetch("/monitoring/metrics"),
        apiFetch("/monitoring/chain-integrity"),
      ])
      setRows(ledgerRes.data.rows)
      setTotal(ledgerRes.data.total)
      setMetrics(metricsRes.data)
      setChain(chainRes.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(statusFilter, offset, typeFilter)
  }, [fetchData, statusFilter, offset, typeFilter])

  function handleStatusChange(val: string) {
    setStatusFilter(val as "all" | "allow" | "pause" | "block")
    setOffset(0)
    setExpandedRow(null)
  }

  function handleTypeChange(val: string) {
    setTypeFilter(val)
    setOffset(0)
    setExpandedRow(null)
  }

  const filteredRows = search.trim()
    ? rows.filter((r) => r.action.toLowerCase().includes(search.toLowerCase()))
    : rows

  const hasPrev = offset > 0
  const hasNext = offset + LIMIT < total

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard value={metrics ? String(metrics.total) : "—"} label="total" />
        <StatCard value={metrics ? String(metrics.allowed) : "—"} label="allowed" color="green" />
        <StatCard value={metrics ? String(metrics.blocked) : "—"} label="blocked" color="red" />
        <StatCard value={metrics ? String(metrics.paused) : "—"} label="paused" color="amber" />
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
          {/* TODO: wire agent filter — requires separate agents fetch */}
          <Select defaultValue="all-agents">
            <SelectTrigger className="bg-secondary border-border text-foreground w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all-agents">All Agents</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="bg-secondary border-border text-foreground w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all-types">All Types</SelectItem>
              {ACTION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="bg-secondary border-border text-foreground w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="allow">Allowed</SelectItem>
              <SelectItem value="block">Blocked</SelectItem>
              <SelectItem value="pause">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-govern-red">{error}</p>}

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
          {loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                Loading…
              </TableCell>
            </TableRow>
          )}
          {!loading && filteredRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">
                No entries found.
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            filteredRows.map((row) => {
              const status = dbStatusToStatus(row.status)
              const gateMs = row.metadata?.gate_ms
              const isExpanded = expandedRow === row.id
              return (
                <Fragment key={row.id}>
                  <TableRow
                    className={cn(
                      "border-border cursor-pointer",
                      isExpanded ? "bg-secondary/50" : "hover:bg-secondary/50"
                    )}
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {formatTime(row.created_at)}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-sm text-foreground">
                      {row.agent_id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {row.action_type ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-foreground max-w-[300px] truncate">
                      {`"${row.action}"`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {typeof gateMs === "number" ? `${gateMs}ms` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <StatusDot status={status} showLabel={false} />
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="border-border hover:bg-transparent">
                      <TableCell colSpan={6} className="p-0">
                        <div className="bg-[#141B2D] mx-2 mb-2 p-4 rounded-md">
                          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                            <p>
                              <span className="text-foreground font-medium">Intent:</span> {row.action}
                            </p>
                            <p>
                              <span className="text-foreground font-medium">Decision:</span> {row.status}
                            </p>
                            {row.action_type && (
                              <p>
                                <span className="text-foreground font-medium">Type:</span>{" "}
                                <span className="font-mono">{row.action_type}</span>
                              </p>
                            )}
                            {typeof gateMs === "number" && (
                              <p className="text-xs">Gate: {gateMs}ms</p>
                            )}
                            {row.prev_hash && (
                              <p className="text-xs font-mono text-muted-foreground/60">
                                prev: {row.prev_hash.slice(0, 16)}…
                              </p>
                            )}
                            {row.status === "pause" && (
                              <div className="flex items-center gap-2 mt-1">
                                {/* TODO: implement allow/block action endpoints */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs px-3 border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10"
                                  disabled
                                >
                                  Allow
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 text-xs px-3 border-govern-red text-govern-red bg-transparent hover:bg-govern-red/10"
                                  disabled
                                >
                                  Block
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {total === 0
            ? "No entries"
            : `Showing ${offset + 1}–${Math.min(offset + LIMIT, total)} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground bg-transparent hover:bg-secondary"
            disabled={!hasPrev || loading}
            onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-border text-muted-foreground bg-transparent hover:bg-secondary"
            disabled={!hasNext || loading}
            onClick={() => setOffset((o) => o + LIMIT)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Chain Integrity Indicator */}
      <div className="h-px bg-border" />
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
        {chain === null ? (
          <span>Checking chain integrity…</span>
        ) : chain.chained_rows === 0 ? (
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted-foreground" />
            Chain not yet established — {chain.total_rows} unchained rows (migration 000006 required)
          </span>
        ) : chain.ok ? (
          <span className="flex items-center gap-2 text-govern-green">
            <ShieldCheck className="size-3.5" />
            Chain intact — {chain.chained_rows} of {chain.total_rows} rows verified
          </span>
        ) : (
          <span className="flex items-center gap-2 text-govern-red">
            <ShieldAlert className="size-3.5" />
            Chain broken — tamper detected at row {chain.broken_at?.slice(0, 8)}
            {chain.chained_rows > 0 && ` (${chain.chained_rows} rows checked)`}
          </span>
        )}
        {chain && chain.checked_at && (
          <span>Checked {formatCheckedAt(chain.checked_at)}</span>
        )}
      </div>
    </div>
  )
}
