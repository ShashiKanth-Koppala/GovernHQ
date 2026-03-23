"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { StatCard } from "./stat-card"
import { StatusDot } from "./status-icon"
import { CollapsibleRow } from "./collapsible-row"
import { supabase } from "@/lib/supabase"

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

interface ShieldStats {
  blocked_agents: number
  active_agents: number
  reasoning_evaluated: number
  gate_blocked: number
  gate_paused: number
  avg_gate_ms: number | null
  avg_block_latency_ms: number | null
  anomalies_today: number
}

interface BlockedAgent {
  id: string
  name: string
  blocked_reason: string
  blocked_by: string
  blocked_at: string | null
}

const DEFAULT_STATS: ShieldStats = {
  blocked_agents: 0,
  active_agents: 0,
  reasoning_evaluated: 0,
  gate_blocked: 0,
  gate_paused: 0,
  avg_gate_ms: null,
  avg_block_latency_ms: null,
  anomalies_today: 0,
}

function formatBlockedAt(blockedAt: string | null): string {
  if (!blockedAt) return "Unknown"
  try {
    const d = new Date(blockedAt)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toTimeString().slice(0, 8)
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
    return d.toLocaleDateString()
  } catch {
    return "Unknown"
  }
}

export function ShieldTab() {
  const [protectOpen, setProtectOpen] = useState(false)
  const [blockedOpen, setBlockedOpen] = useState(true)
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  // Live data
  const [stats, setStats] = useState<ShieldStats>(DEFAULT_STATS)
  const [blockedAgents, setBlockedAgents] = useState<BlockedAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [allowingId, setAllowingId] = useState<string | null>(null)
  const [blockingAll, setBlockingAll] = useState(false)

  // Settings controls
  const [enforcementMode, setEnforcementMode] = useState("strict")
  const [riskThreshold, setRiskThreshold] = useState(70)
  const [anomalySensitivity, setAnomalySensitivity] = useState(75)
  const [failMode, setFailMode] = useState("block")
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, blockedRes, settingsRes] = await Promise.all([
        apiFetch("/shield/stats"),
        apiFetch("/shield/blocked"),
        apiFetch("/settings"),
      ])
      if (statsRes.data) setStats(statsRes.data)
      if (blockedRes.data) setBlockedAgents(blockedRes.data.agents || [])
      if (settingsRes.data) {
        const s = settingsRes.data
        setRiskThreshold(Math.round((s.risk_threshold ?? 0.70) * 100))
        setAnomalySensitivity(Math.round((s.anomaly_sensitivity ?? 0.75) * 100))
        // Map backend enum → UI labels
        const modeMap: Record<string, string> = { active: "strict", monitor: "balanced", shadow: "permissive" }
        setEnforcementMode(modeMap[s.enforcement_mode] ?? "strict")
        setFailMode(s.fail_mode === "closed" ? "block" : "allow")
      }
    } catch {
      // fail silently — zeros shown
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSaveSettings = async () => {
    setSettingsSaving(true)
    setSettingsSaved(false)
    try {
      const modeMap: Record<string, string> = { strict: "active", balanced: "monitor", permissive: "shadow" }
      await apiFetch("/settings", {
        method: "PATCH",
        body: JSON.stringify({
          risk_threshold:      riskThreshold / 100,
          anomaly_sensitivity: anomalySensitivity / 100,
          enforcement_mode:    modeMap[enforcementMode] ?? "active",
          fail_mode:           failMode === "block" ? "closed" : "open",
        }),
      })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch {
      // ignore
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleAllow = async (agentId: string) => {
    setAllowingId(agentId)
    try {
      await apiFetch(`/shield/agents/${agentId}/allow`, { method: "POST" })
      await fetchData()
    } catch {
      // ignore
    } finally {
      setAllowingId(null)
    }
  }

  const handleBlockAll = async () => {
    if (confirmText !== "BLOCK ALL") return
    setBlockingAll(true)
    try {
      await apiFetch("/shield/block-all", { method: "POST" })
      setDialogOpen(false)
      setConfirmText("")
      await fetchData()
    } catch {
      // ignore
    } finally {
      setBlockingAll(false)
    }
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Control Panel */}
      <div className="p-6 rounded-lg border border-govern-green/30 bg-govern-green/5">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-6">Protection Controls</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Enforcement Mode */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-foreground">Enforcement Mode</label>
            <select
              value={enforcementMode}
              onChange={(e) => setEnforcementMode(e.target.value)}
              aria-label="Enforcement Mode"
              className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-govern-green/50"
            >
              <option value="strict" className="bg-card">Strict</option>
              <option value="balanced" className="bg-card">Balanced</option>
              <option value="permissive" className="bg-card">Permissive</option>
            </select>
            <p className="text-xs text-muted-foreground">How strictly to enforce policies</p>
          </div>

          {/* Risk Threshold */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Risk Threshold</label>
              <span className="text-sm font-mono text-govern-amber">{riskThreshold}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(Number(e.target.value))}
              aria-label="Risk Threshold"
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-govern-amber"
            />
            <p className="text-xs text-muted-foreground">Trigger on suspicious behavior</p>
          </div>

          {/* Anomaly Sensitivity */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Anomaly Sensitivity</label>
              <span className="text-sm font-mono text-govern-red">{anomalySensitivity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={anomalySensitivity}
              onChange={(e) => setAnomalySensitivity(Number(e.target.value))}
              aria-label="Anomaly Sensitivity"
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-govern-red"
            />
            <p className="text-xs text-muted-foreground">Higher = more alerts</p>
          </div>

          {/* Fail Mode */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-foreground">Fail Mode</label>
            <select
              value={failMode}
              onChange={(e) => setFailMode(e.target.value)}
              aria-label="Fail Mode"
              className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-govern-green/50"
            >
              <option value="block" className="bg-card">Block</option>
              <option value="allow" className="bg-card">Allow</option>
            </select>
            <p className="text-xs text-muted-foreground">Default on error</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            type="button"
            size="sm"
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            className="bg-govern-green text-foreground hover:bg-govern-green/90"
          >
            {settingsSaving ? "Saving…" : settingsSaved ? "Saved ✓" : "Save Controls"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <StatCard value={String(stats.blocked_agents)} label="blocked agents" color="red" />
        <StatCard
          value={stats.avg_gate_ms !== null ? `${stats.avg_gate_ms}ms` : "--"}
          label="avg gate latency"
          color="green"
          sublabel="target <10ms"
        />
        <StatCard value={stats.reasoning_evaluated.toLocaleString()} label="reasoning evaluated today" />
      </div>

      {/* HOW GOVERNHQ PROTECTS */}
      <div>
        <button
          onClick={() => setProtectOpen(!protectOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", protectOpen && "rotate-90")} />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">How GovernHQ Protects</span>
        </button>
        {protectOpen && (
          <div className="flex flex-col gap-6 mt-4 pl-6">
            {/* Layer 1 — GATE */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground font-mono">1 {"\u2014"}</span>
                <span className="font-mono font-semibold text-foreground">GATE</span>
                <span className="text-sm text-muted-foreground">Intercepts reasoning. Blocks bad actions. Agent keeps running.</span>
                <span className="ml-auto shrink-0"><StatusDot status="allowed" /></span>
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                {stats.reasoning_evaluated.toLocaleString()} reasoning evaluated
                {" \u00B7 "}{stats.gate_blocked} actions blocked
                {" \u00B7 "}{stats.gate_paused} actions paused
                {stats.avg_gate_ms !== null ? ` \u00B7 ${stats.avg_gate_ms}ms avg` : ""}
              </p>
            </div>
            {/* Layer 2 — MONITOR */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground font-mono">2 {"\u2014"}</span>
                <span className="font-mono font-semibold text-foreground">MONITOR</span>
                <span className="text-sm text-muted-foreground">Watches reasoning patterns. Blocks bad agents.</span>
                <span className="ml-auto shrink-0"><StatusDot status="allowed" /></span>
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                {stats.anomalies_today} anomalies today{" \u00B7 "}{stats.blocked_agents} agents blocked
              </p>
            </div>
            {/* Layer 3 — EMERGENCY */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-muted-foreground font-mono">3 {"\u2014"}</span>
                <span className="font-mono font-semibold text-foreground">EMERGENCY</span>
                <span className="text-sm text-muted-foreground">Instantly blocks all agents.</span>
                <span className="ml-auto shrink-0">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-muted-foreground" />
                    <span className="text-sm text-foreground">Standby</span>
                  </span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-10">
                {stats.avg_block_latency_ms !== null ? `Avg block latency: ${stats.avg_block_latency_ms}ms` : "No block events recorded"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* BLOCKED AGENTS */}
      <div>
        <button
          onClick={() => setBlockedOpen(!blockedOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", blockedOpen && "rotate-90")} />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Blocked Agents</span>
        </button>
        {blockedOpen && (
          <div className="mt-2 pl-6">
            <p className="text-sm text-muted-foreground mb-4">
              Agents blocked entirely. Cannot reason or act until re-allowed.
            </p>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : blockedAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No agents currently blocked.</p>
            ) : (
              blockedAgents.map((agent) => (
                <CollapsibleRow
                  key={agent.id}
                  status="blocked"
                  agent={agent.name}
                  intent={agent.blocked_reason}
                  time={formatBlockedAt(agent.blocked_at)}
                >
                  <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                    <p>Blocked by: {agent.blocked_by}</p>
                    <p>{agent.blocked_reason}</p>
                    <p className="text-xs italic mt-1">Agent cannot reason or act until re-allowed.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit mt-2 border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10"
                      disabled={allowingId === agent.id}
                      onClick={() => handleAllow(agent.id)}
                    >
                      {allowingId === agent.id ? "Allowing…" : "Allow Agent"}
                    </Button>
                  </div>
                </CollapsibleRow>
              ))
            )}
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* EMERGENCY */}
      <div>
        <button
          onClick={() => setEmergencyOpen(!emergencyOpen)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <ChevronRight className={cn("size-4 text-muted-foreground transition-transform duration-150", emergencyOpen && "rotate-90")} />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Emergency</span>
        </button>
        {emergencyOpen && (
          <div className="mt-4 pl-6 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Block All Agents</h3>
            <p className="text-sm text-muted-foreground">
              Instantly block every agent. Revoke all credentials. Stop all reasoning and actions.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Requires confirmation</span>
              <Button
                type="button"
                size="sm"
                className="bg-govern-red text-foreground hover:bg-govern-red/80 font-semibold"
                onClick={() => setDialogOpen(true)}
              >
                Block All Agents
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmText("") }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Block All Agents</DialogTitle>
            <DialogDescription>
              This will immediately block all {stats.active_agents} active agents. No agent will be able to reason or act until manually re-allowed. Type <span className="font-mono font-semibold text-foreground">BLOCK ALL</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type BLOCK ALL"
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono"
          />
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground bg-transparent hover:bg-secondary"
              onClick={() => { setDialogOpen(false); setConfirmText("") }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-govern-red text-foreground hover:bg-govern-red/80 font-semibold disabled:opacity-40"
              disabled={confirmText !== "BLOCK ALL" || blockingAll}
              onClick={handleBlockAll}
            >
              {blockingAll ? "Blocking…" : "Confirm Block All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
