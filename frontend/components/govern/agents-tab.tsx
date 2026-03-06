"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, Search, ChevronRight, Trash2 } from "lucide-react"
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
}

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

function toStatusDot(status: Agent["status"]): "allowed" | "paused" | "blocked" {
  if (status === "active") return "allowed"
  if (status === "blocked") return "blocked"
  return "paused"
}

function getRiskColor(risk: Agent["risk_profile"]): string {
  if (risk === "high") return "text-govern-red"
  if (risk === "medium") return "text-govern-amber"
  return "text-govern-green"
}

export function AgentsTab() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [identityOpen, setIdentityOpen] = useState(false)
  const [metadataOpen, setMetadataOpen] = useState(false)

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

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  const selected = agents.find((a) => a.id === selectedId) ?? null

  function handleRowClick(id: string) {
    if (selectedId === id) {
      setSelectedId(null)
    } else {
      setSelectedId(id)
      setIdentityOpen(false)
      setMetadataOpen(false)
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

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/agents/${id}`, { method: "DELETE" })
      setAgents((prev) => prev.filter((a) => a.id !== id))
      if (selectedId === id) setSelectedId(null)
    } catch {
      // leave state unchanged on failure
    }
  }

  const blockedCount = agents.filter((a) => a.status === "blocked").length

  return (
    <div className="flex flex-col gap-8">

      {blockedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-govern-amber/30 bg-govern-amber/5 px-4 py-3">
          <AlertTriangle className="size-4 text-govern-amber shrink-0" />
          <span className="text-sm text-govern-amber">
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
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
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
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono font-semibold text-sm text-foreground">{agent.name}</span>
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
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(agent.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <button
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
                {selected.description && (
                  <div className="flex gap-2">
                    <span className="text-muted-foreground min-w-36">Description:</span>
                    <span className="text-foreground">{selected.description}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* METADATA */}
          {Object.keys(selected.metadata).length > 0 && (
            <div>
              <button
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
