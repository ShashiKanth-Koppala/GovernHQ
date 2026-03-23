"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { StatCard } from "./stat-card"
import { CollapsibleRow } from "./collapsible-row"
import { supabase } from "@/lib/supabase"
import { type Status } from "./status-icon"

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
  action_type: string | null
}

interface Metrics {
  total: number
  allowed: number
  blocked: number
  paused: number
  agents_monitored: number
}

function dbStatusToStatus(s: string): Status {
  if (s === "allow") return "allowed"
  if (s === "block") return "blocked"
  if (s === "pause") return "paused"
  return "allowed"
}

function relativeTime(iso: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  } catch {
    return "—"
  }
}

const PAGE_SIZE = 7

export function DashboardTab() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [rows, setRows] = useState<LedgerRow[]>([])
  const [offset, setOffset] = useState(PAGE_SIZE)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [metricsRes, ledgerRes] = await Promise.all([
        apiFetch("/monitoring/metrics"),
        apiFetch(`/monitoring/ledger?limit=${PAGE_SIZE}&offset=0`),
      ])
      setMetrics(metricsRes.data)
      setRows(ledgerRes.data.rows)
      setHasMore(ledgerRes.data.total > PAGE_SIZE)
      setOffset(PAGE_SIZE)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  async function handleShowMore() {
    try {
      const res = await apiFetch(`/monitoring/ledger?limit=${PAGE_SIZE}&offset=${offset}`)
      const newRows: LedgerRow[] = res.data.rows
      setRows((r) => [...r, ...newRows])
      const newOffset = offset + PAGE_SIZE
      setOffset(newOffset)
      setHasMore(newOffset < res.data.total)
    } catch {
      // silent — existing rows stay
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard value={metrics ? String(metrics.agents_monitored) : "—"} label="agents" />
        <StatCard value={metrics ? String(metrics.allowed) : "—"} label="allowed" color="green" />
        <StatCard value={metrics ? String(metrics.blocked) : "—"} label="blocked" color="red" />
        <StatCard value={metrics ? String(metrics.paused) : "—"} label="paused" color="amber" />
      </div>

      <div className="h-px bg-border" />

      {error && <p className="text-sm text-govern-red">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!loading && (
        <div>
          {rows.map((row) => {
            const status = dbStatusToStatus(row.status)
            const gateMs = row.metadata?.gate_ms
            return (
              <CollapsibleRow
                key={row.id}
                status={status}
                agent={row.agent_id.slice(0, 8)}
                intent={row.action}
                time={relativeTime(row.created_at)}
              >
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {row.action_type && (
                    <p className="text-xs font-mono">{row.action_type}</p>
                  )}
                  {row.status === "allow" && (
                    <>
                      <p>Reasoning approved. Action executed.</p>
                      {typeof gateMs === "number" && <p className="text-xs">Gate: {gateMs}ms</p>}
                    </>
                  )}
                  {row.status === "block" && (
                    <>
                      <p>Action blocked by Gate policy.</p>
                      {typeof row.metadata?.risk_score === "number" && (
                        <p className="text-xs">Risk score: <span className="text-govern-red font-mono">{row.metadata.risk_score}</span></p>
                      )}
                      {typeof row.metadata?.block_latency_ms === "number" && (
                        <p className="text-xs">Block latency: {row.metadata.block_latency_ms}ms</p>
                      )}
                      {Array.isArray(row.metadata?.policy_matches) && (row.metadata.policy_matches as string[]).length > 0 && (
                        <p className="text-xs">Policy: {(row.metadata.policy_matches as string[]).join(", ")}</p>
                      )}
                      <p className="text-xs italic mt-1">Action never executed. Agent still running.</p>
                    </>
                  )}
                  {row.status === "pause" && (
                    <>
                      <p>Action paused: requires human approval.</p>
                      {typeof row.metadata?.risk_score === "number" && (
                        <p className="text-xs">Risk score: <span className="text-govern-amber font-mono">{row.metadata.risk_score}</span></p>
                      )}
                      {Array.isArray(row.metadata?.policy_matches) && (row.metadata.policy_matches as string[]).length > 0 && (
                        <p className="text-xs">Policy: {(row.metadata.policy_matches as string[]).join(", ")}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
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
                    </>
                  )}
                  {row.metadata?.anomaly_reason && (
                    <p className="text-xs text-govern-amber mt-1">Anomaly: {String(row.metadata.anomaly_reason)}</p>
                  )}
                  {row.metadata?.trace_id && (
                    <p className="text-xs font-mono text-muted-foreground/60">{String(row.metadata.trace_id)}</p>
                  )}
                </div>
              </CollapsibleRow>
            )
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={handleShowMore}
          >
            Show more
          </button>
        </div>
      )}
    </div>
  )
}
