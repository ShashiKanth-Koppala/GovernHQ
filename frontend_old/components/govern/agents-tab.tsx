"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, Search, ChevronRight, Trash2, ShieldCheck, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { StatusDot } from "./status-icon"
import { supabase } from "@/lib/supabase"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentScope {
  databases?: string[]
  apis?: string[]
  pii_level?: "none" | "masked" | "full"
  max_rows?: number
  external_calls?: boolean
}

interface Agent {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: "active" | "inactive" | "blocked"
  source: "n8n" | "zapier"
  metadata: Record<string, unknown>
  risk_profile: "low" | "medium" | "high"
  created_at: string
  verified: boolean
  trust_score: number
  gate_rate: number | null
  scope: AgentScope | null
}

interface LedgerEvent {
  id: string
  action: string
  status: "allow" | "pause" | "block"
  created_at: string
  metadata: Record<string, unknown>
}

interface ScopeForm {
  databases: string
  apis: string
  pii_level: "none" | "masked" | "full"
  max_rows: number
  external_calls: boolean
}

const EMPTY_SCOPE_FORM: ScopeForm = {
  databases: "",
  apis: "",
  pii_level: "none",
  max_rows: 1000,
  external_calls: true,
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const API = process.env.NEXT_PUBLIC_API_URL

async function getToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

async function apiFetch(path: string, options?: RequestInit) {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function toStatusDot(status: Agent["status"]): "allowed" | "paused" | "blocked" {
  if (status === "active") return "allowed"
  if (status === "blocked") return "blocked"
  return "paused"
}

function toDecisionDot(status: LedgerEvent["status"]): "allowed" | "paused" | "blocked" {
  if (status === "allow") return "allowed"
  if (status === "block") return "blocked"
  return "paused"
}

function getRiskColor(risk: Agent["risk_profile"]): string {
  if (risk === "high") return "text-govern-red"
  if (risk === "medium") return "text-govern-amber"
  return "text-govern-green"
}

function getTrustColor(score: number): string {
  if (score >= 80) return "text-govern-green"
  if (score >= 50) return "text-govern-amber"
  return "text-govern-red"
}

function scopeFromAgent(scope: AgentScope | null | undefined): ScopeForm {
  return {
    databases:      (scope?.databases ?? []).join(", "),
    apis:           (scope?.apis ?? []).join(", "),
    pii_level:      scope?.pii_level ?? "none",
    max_rows:       scope?.max_rows ?? 1000,
    external_calls: scope?.external_calls ?? true,
  }
}

function isScopeEmpty(scope: AgentScope | null | undefined): boolean {
  if (!scope) return true
  const { databases, apis, pii_level, max_rows, external_calls } = scope
  return (
    (!databases || databases.length === 0) &&
    (!apis || apis.length === 0) &&
    (pii_level === undefined || pii_level === null) &&
    max_rows === undefined &&
    external_calls === undefined
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentsTab() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Detail panel section open states
  const [identityOpen, setIdentityOpen] = useState(false)
  const [intelligenceOpen, setIntelligenceOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  // Recent actions
  const [recentActions, setRecentActions] = useState<LedgerEvent[]>([])
  const [recentActionsLoading, setRecentActionsLoading] = useState(false)

  // Scope editor form state
  const [scopeEdit, setScopeEdit] = useState<ScopeForm>(EMPTY_SCOPE_FORM)
  const [scopeSaving, setScopeSaving] = useState(false)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const json = await apiFetch("/agents")
      setAgents(json.data ?? [])
    } catch {
      setError("Failed to load agents.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  // Fetch recent actions when a new agent is selected
  useEffect(() => {
    if (!selectedId) {
      setRecentActions([])
      return
    }
    setRecentActionsLoading(true)
    apiFetch(`/monitoring/ledger?agent_id=${selectedId}&limit=5`)
      .then((json) => setRecentActions(json.data?.rows ?? []))
      .catch(() => setRecentActions([]))
      .finally(() => setRecentActionsLoading(false))
  }, [selectedId])

  // Initialise scope editor form when selection changes
  useEffect(() => {
    const agent = agents.find((a) => a.id === selectedId)
    setScopeEdit(agent ? scopeFromAgent(agent.scope) : EMPTY_SCOPE_FORM)
  }, [selectedId, agents])

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )
  const selected = agents.find((a) => a.id === selectedId) ?? null
  const unverifiedCount = agents.filter((a) => !a.verified).length
  const blockedCount = agents.filter((a) => a.status === "blocked").length

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleRowClick(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
    } else {
      setSelectedId(id)
      setIdentityOpen(false)
      setIntelligenceOpen(false)
      setScopeOpen(false)
      setMetadataOpen(false)
      setActionsOpen(false)
    }
  }

  async function handleStatusToggle(agent: Agent) {
    const newStatus = agent.status === "blocked" ? "active" : "blocked"
    try {
      const json = await apiFetch(`/agents/${agent.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: json.data.status } : a))
      )
    } catch {
      // leave state unchanged on failure
    }
  }

  async function handleVerifiedToggle(agent: Agent) {
    const newVerified = !agent.verified
    try {
      await apiFetch(`/agents/${agent.id}`, {
        method: "PATCH",
        body: JSON.stringify({ verified: newVerified }),
      })
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, verified: newVerified } : a))
      )
    } catch {
      // leave state unchanged on failure
    }
  }

  async function handleScopeSave() {
    if (!selected) return
    setScopeSaving(true)
    const scope: AgentScope = {
      databases:      scopeEdit.databases.split(",").map((s) => s.trim()).filter(Boolean),
      apis:           scopeEdit.apis.split(",").map((s) => s.trim()).filter(Boolean),
      pii_level:      scopeEdit.pii_level,
      max_rows:       scopeEdit.max_rows,
      external_calls: scopeEdit.external_calls,
    }
    try {
      const json = await apiFetch(`/agents/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({ scope }),
      })
      setAgents((prev) =>
        prev.map((a) => (a.id === selected.id ? { ...a, scope: json.data.scope } : a))
      )
    } catch {
      // leave state unchanged on failure
    } finally {
      setScopeSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/agents/${id}`, { method: "DELETE" })
      setAgents((prev) => prev.filter((a) => a.id !== id))
      if (selectedId === id) setSelectedId(null)
    } catch {
      // leave state unchanged on failure
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-8">

      {/* Gap #12 — Unverified agent alert banner */}
      {unverifiedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-govern-amber/30 bg-govern-amber/5 px-4 py-3">
          <AlertTriangle className="size-4 text-govern-amber shrink-0" />
          <span className="text-sm text-govern-amber">
            {unverifiedCount} unverified agent{unverifiedCount !== 1 ? "s" : ""} — verify identity before allowing sensitive operations
          </span>
        </div>
      )}

      {blockedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-govern-red/30 bg-govern-red/5 px-4 py-3">
          <AlertTriangle className="size-4 text-govern-red shrink-0" />
          <span className="text-sm text-govern-red">
            {blockedCount} blocked agent{blockedCount !== 1 ? "s" : ""} in your organization
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Agents</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Registered agents in your organization
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {error && (
        <p className="text-sm text-govern-red">{error}</p>
      )}

      {!loading && !error && (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Agent</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Source</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Risk</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Trust</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Gate Rate</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((agent) => (
              <TableRow
                key={agent.id}
                onClick={() => handleRowClick(agent.id)}
                className={cn(
                  "border-border cursor-pointer transition-colors",
                  selectedId === agent.id ? "bg-secondary/80" : "hover:bg-secondary/50"
                )}
              >
                {/* Verified badge inline with name */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-sm text-foreground">{agent.name}</span>
                      {agent.verified ? (
                        <span title="Verified"><ShieldCheck className="size-3.5 text-govern-green shrink-0" /></span>
                      ) : (
                        <span title="Unverified"><ShieldAlert className="size-3.5 text-muted-foreground/50 shrink-0" /></span>
                      )}
                    </div>
                    {agent.description && (
                      <span className="text-xs text-muted-foreground">{agent.description}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell><StatusDot status={toStatusDot(agent.status)} /></TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">{agent.source}</TableCell>
                <TableCell className={cn("text-sm font-medium capitalize", getRiskColor(agent.risk_profile))}>
                  {agent.risk_profile}
                </TableCell>
                <TableCell>
                  <span className={cn("text-sm font-mono font-medium", getTrustColor(agent.trust_score ?? 100))}>
                    {agent.trust_score ?? 100}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground font-mono">
                  {agent.gate_rate !== null && agent.gate_rate !== undefined
                    ? `${agent.gate_rate}%`
                    : <span className="text-muted-foreground/40">—</span>
                  }
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleDelete(agent.id)}
                    className="text-govern-red hover:bg-govern-red/10 p-2 rounded transition-colors"
                    title="Delete agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No agents found</p>
        </div>
      )}

      {selected && (
        <div className="flex flex-col gap-6 pt-2">
          <h3 className="font-mono font-semibold text-foreground">{selected.name}</h3>

          {/* IDENTITY */}
          <div>
            <button
              type="button"
              onClick={() => setIdentityOpen(!identityOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", identityOpen && "rotate-90")} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Identity</span>
            </button>
            {identityOpen && (
              <div className="flex flex-col gap-2.5 text-sm mt-3 pl-6">
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-36">Status:</span>
                  <StatusDot status={toStatusDot(selected.status)} />
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-36">Source:</span>
                  <span className="font-mono text-foreground">{selected.source}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-36">Risk Profile:</span>
                  <span className={cn("font-medium capitalize", getRiskColor(selected.risk_profile))}>
                    {selected.risk_profile}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-muted-foreground min-w-36">Verified:</span>
                  {selected.verified ? (
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-3.5 text-govern-green" />
                      <span className="text-govern-green text-xs">Verified</span>
                      <button
                        type="button"
                        onClick={() => handleVerifiedToggle(selected)}
                        className="text-xs text-muted-foreground hover:text-govern-red ml-2 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-3.5 text-muted-foreground/50" />
                      <span className="text-muted-foreground text-xs">Unverified</span>
                      <button
                        type="button"
                        onClick={() => handleVerifiedToggle(selected)}
                        className="text-xs text-govern-green hover:text-govern-green/80 ml-2 transition-colors"
                      >
                        Mark verified
                      </button>
                    </div>
                  )}
                </div>
                {selected.description && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground min-w-36">Description:</span>
                    <span className="text-foreground">{selected.description}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INTELLIGENCE (Trust Score + Gate Rate) */}
          <div>
            <button
              type="button"
              onClick={() => setIntelligenceOpen(!intelligenceOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", intelligenceOpen && "rotate-90")} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Intelligence</span>
            </button>
            {intelligenceOpen && (
              <div className="flex flex-col gap-2.5 text-sm mt-3 pl-6">
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-36">Trust Score:</span>
                  <span className={cn("font-mono font-medium", getTrustColor(selected.trust_score ?? 100))}>
                    {selected.trust_score ?? 100} / 100
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-36">Gate Rate:</span>
                  {selected.gate_rate !== null && selected.gate_rate !== undefined ? (
                    <span className="font-mono text-foreground">{selected.gate_rate}% allowed</span>
                  ) : (
                    <span className="text-muted-foreground/50 text-xs">No events yet</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Gap #7 — SCOPE EDITOR */}
          <div>
            <button
              type="button"
              onClick={() => setScopeOpen(!scopeOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", scopeOpen && "rotate-90")} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Scope</span>
            </button>
            {scopeOpen && (
              <div className="mt-3 pl-6 flex flex-col gap-3">
                {isScopeEmpty(selected.scope) && (
                  <p className="text-xs text-muted-foreground/60 italic mb-1">
                    No scope defined — agent is unrestricted.
                  </p>
                )}

                {/* Databases */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Databases (comma-separated)</label>
                  <Input
                    value={scopeEdit.databases}
                    onChange={(e) => setScopeEdit((prev) => ({ ...prev, databases: e.target.value }))}
                    placeholder="orders_db, analytics_db"
                    className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>

                {/* APIs */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">APIs (comma-separated)</label>
                  <Input
                    value={scopeEdit.apis}
                    onChange={(e) => setScopeEdit((prev) => ({ ...prev, apis: e.target.value }))}
                    placeholder="stripe, sendgrid"
                    className="h-8 text-xs bg-secondary border-border text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>

                {/* PII Level */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">PII Level</label>
                  <select
                    title="PII Level"
                    value={scopeEdit.pii_level}
                    onChange={(e) => setScopeEdit((prev) => ({ ...prev, pii_level: e.target.value as ScopeForm["pii_level"] }))}
                    className="h-8 text-xs bg-secondary border border-border rounded-md px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-border"
                  >
                    <option value="none">None — no PII access</option>
                    <option value="masked">Masked — PII redacted</option>
                    <option value="full">Full — unrestricted PII access</option>
                  </select>
                </div>

                {/* Max Rows */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Max Rows</label>
                  <Input
                    type="number"
                    min={0}
                    value={scopeEdit.max_rows}
                    onChange={(e) => setScopeEdit((prev) => ({ ...prev, max_rows: parseInt(e.target.value) || 0 }))}
                    placeholder="1000"
                    className="h-8 text-xs bg-secondary border-border text-foreground"
                  />
                </div>

                {/* External Calls toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">External Calls:</span>
                  <button
                    type="button"
                    onClick={() => setScopeEdit((prev) => ({ ...prev, external_calls: !prev.external_calls }))}
                    className={cn(
                      "text-xs font-medium px-2.5 py-0.5 rounded border transition-colors",
                      scopeEdit.external_calls
                        ? "text-govern-green border-govern-green/40 hover:bg-govern-green/10"
                        : "text-govern-red border-govern-red/40 hover:bg-govern-red/10"
                    )}
                  >
                    {scopeEdit.external_calls ? "Allowed" : "Blocked"}
                  </button>
                </div>

                {/* Save */}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleScopeSave}
                  disabled={scopeSaving}
                  className="w-fit mt-1"
                >
                  {scopeSaving ? "Saving..." : "Save Scope"}
                </Button>
              </div>
            )}
          </div>

          {/* METADATA */}
          {Object.keys(selected.metadata).length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setMetadataOpen(!metadataOpen)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", metadataOpen && "rotate-90")} />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Metadata</span>
              </button>
              {metadataOpen && (
                <div className="flex flex-col gap-2.5 text-sm mt-3 pl-6">
                  {Object.entries(selected.metadata).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-muted-foreground min-w-36 capitalize">{key}:</span>
                      <span className="font-mono text-xs text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Actions */}
          <div>
            <button
              type="button"
              onClick={() => setActionsOpen(!actionsOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", actionsOpen && "rotate-90")} />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Recent Actions</span>
            </button>
            {actionsOpen && (
              <div className="mt-3 pl-6">
                {recentActionsLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : recentActions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No actions recorded.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {recentActions.map((evt) => (
                      <div key={evt.id} className="flex items-center gap-3 text-xs">
                        <StatusDot status={toDecisionDot(evt.status)} />
                        <span className="text-foreground flex-1 truncate" title={evt.action}>
                          {evt.action}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {new Date(evt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BLOCK / ALLOW */}
          <div>
            {selected.status === "blocked" ? (
              <Button
                variant="outline"
                size="sm"
                className="border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10"
                onClick={() => handleStatusToggle(selected)}
              >
                Allow Agent
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-govern-red text-govern-red bg-transparent hover:bg-govern-red/10"
                onClick={() => handleStatusToggle(selected)}
              >
                Block Agent
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
