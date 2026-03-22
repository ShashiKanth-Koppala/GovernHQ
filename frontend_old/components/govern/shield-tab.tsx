"use client"

import { useState } from "react"
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

const protectionLayers = [
  {
    number: 1,
    name: "GATE",
    description: "Intercepts reasoning. Blocks bad actions. Agent keeps running.",
    status: "allowed" as const,
    stats: "8,432 reasoning evaluated \u00B7 23 actions blocked \u00B7 5 actions paused \u00B7 11ms avg",
  },
  {
    number: 2,
    name: "MONITOR",
    description: "Watches reasoning patterns. Blocks bad agents.",
    status: "allowed" as const,
    stats: "2 anomalies today \u00B7 2 agents blocked",
  },
  {
    number: 3,
    name: "EMERGENCY",
    description: "Instantly blocks all agents.",
    statusLabel: "Standby",
    status: null,
    stats: "Measured latency: 8ms",
  },
]

const blockedAgents = [
  {
    status: "blocked" as const,
    agent: "HELPER-2A",
    intent: "Anomaly threshold exceeded",
    time: "14:32:07",
  },
  {
    status: "blocked" as const,
    agent: "FRAUD-DET",
    intent: "Reasoning loop \u2014 same query 47 times",
    time: "14:30:23",
  },
  {
    status: "blocked" as const,
    agent: "GHOST-X9",
    intent: "Identity verification failed",
    time: "Yesterday",
  },
]

export function ShieldTab() {
  const [protectOpen, setProtectOpen] = useState(false)
  const [blockedOpen, setBlockedOpen] = useState(true)
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [enforcementMode, setEnforcementMode] = useState("strict")
  const [riskThreshold, setRiskThreshold] = useState(70)
  const [anomalySensitivity, setAnomalySensitivity] = useState(75)
  const [failMode, setFailMode] = useState("block")

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
              className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-govern-green/50"
            >
              <option value="block" className="bg-card">Block</option>
              <option value="allow" className="bg-card">Allow</option>
              <option value="pause" className="bg-card">Pause</option>
            </select>
            <p className="text-xs text-muted-foreground">Default on error</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <StatCard value="3" label="blocked agents" color="red" />
        <StatCard value="8ms" label="block latency" color="green" sublabel="target <10ms" />
        <StatCard value="8,432" label="reasoning evaluated today" />
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
            {protectionLayers.map((layer) => (
              <div key={layer.number} className="flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-muted-foreground font-mono">{layer.number} {"\u2014"}</span>
                  <span className="font-mono font-semibold text-foreground">{layer.name}</span>
                  <span className="text-sm text-muted-foreground">{layer.description}</span>
                  <span className="ml-auto shrink-0">
                    {layer.status ? (
                      <StatusDot status={layer.status} />
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-muted-foreground" />
                        <span className="text-sm text-foreground">{layer.statusLabel}</span>
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-10">{layer.stats}</p>
              </div>
            ))}
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
            {/* HELPER-2A */}
            <CollapsibleRow
              status={blockedAgents[0].status}
              agent={blockedAgents[0].agent}
              intent={blockedAgents[0].intent}
              time={blockedAgents[0].time}
            >
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p>Blocked by: Monitor</p>
                <p>Trust score dropped to 34.</p>
                <p>Repeated anomalous reasoning pattern detected.</p>
                <p className="text-xs italic mt-1">Agent cannot reason or act until re-allowed.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit mt-2 border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10"
                >
                  Allow Agent
                </Button>
              </div>
            </CollapsibleRow>
            {/* FRAUD-DET */}
            <CollapsibleRow
              status={blockedAgents[1].status}
              agent={blockedAgents[1].agent}
              intent={blockedAgents[1].intent}
              time={blockedAgents[1].time}
            >
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p>Blocked by: Monitor</p>
                <p>Agent submitted identical reasoning 47 times in 3 minutes.</p>
                <p>Possible reasoning loop or prompt injection.</p>
                <p className="text-xs italic mt-1">Agent cannot reason or act until re-allowed.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit mt-2 border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10"
                >
                  Allow Agent
                </Button>
              </div>
            </CollapsibleRow>
            {/* GHOST-X9 */}
            <CollapsibleRow
              status={blockedAgents[2].status}
              agent={blockedAgents[2].agent}
              intent={blockedAgents[2].intent}
              time={blockedAgents[2].time}
            >
              <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                <p>Blocked by: System</p>
                <p>Agent could not verify identity.</p>
                <p>Credentials permanently revoked. Cannot be re-allowed.</p>
              </div>
            </CollapsibleRow>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setConfirmText(""); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Block All Agents</DialogTitle>
            <DialogDescription>
              This will immediately block all 52 agents. No agent will be able to reason or act until manually re-allowed. Type <span className="font-mono font-semibold text-foreground">BLOCK ALL</span> to confirm.
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
              onClick={() => { setDialogOpen(false); setConfirmText(""); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-govern-red text-foreground hover:bg-govern-red/80 font-semibold disabled:opacity-40"
              disabled={confirmText !== "BLOCK ALL"}
              onClick={() => { setDialogOpen(false); setConfirmText(""); }}
            >
              Confirm Block All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
