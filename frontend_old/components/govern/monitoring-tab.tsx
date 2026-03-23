"use client"

import { useState } from "react"
import { AlertTriangle, Activity, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "./stat-card"
import { cn } from "@/lib/utils"

export function MonitoringTab() {
  const [anomalySensitivity, setAnomalySensitivity] = useState(70)
  const [riskThreshold, setRiskThreshold] = useState(65)
  const [monitoringEnabled, setMonitoringEnabled] = useState(true)

  const anomalies = [
    { agent: "HELPER-2A", type: "Repeated queries", severity: "high", time: "2 min ago" },
    { agent: "FRAUD-DET", type: "Unusual API patterns", severity: "medium", time: "5 min ago" },
    { agent: "SCOUT-3B", type: "High request volume", severity: "medium", time: "8 min ago" },
  ]

  const performanceMetrics = [
    { label: "Avg Decision Time", value: "8.2ms", trend: "down" },
    { label: "Gate Pass Rate", value: "99.7%", trend: "up" },
    { label: "Actions Blocked", value: "23 today", trend: "up" },
    { label: "System Uptime", value: "99.99%", trend: "stable" },
  ]

  return (
    <div className="flex flex-col gap-10">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard value="2" label="anomalies detected" color="red" />
        <StatCard value="52" label="agents monitored" color="green" />
        <StatCard value="8.2ms" label="avg gate latency" />
        <StatCard value="99.97%" label="availability" color="green" />
      </div>

      <div className="h-px bg-border" />

      {/* Monitoring Settings */}
      <div className="flex flex-col gap-6">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
          Monitoring Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Monitoring Toggle */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Enable Monitoring</label>
              <button
                onClick={() => setMonitoringEnabled(!monitoringEnabled)}
                className={cn(
                  "relative inline-flex w-12 h-6 rounded-full transition-colors",
                  monitoringEnabled ? "bg-govern-green" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block w-5 h-5 transform rounded-full bg-white transition-transform",
                    monitoringEnabled ? "translate-x-6" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {monitoringEnabled ? "Active" : "Inactive"} — behavioral monitoring and anomaly detection
            </p>
          </div>

          {/* Risk Threshold Slider */}
          <div className="flex flex-col gap-4">
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
            <p className="text-xs text-muted-foreground">
              Trigger alerts when risk score exceeds threshold
            </p>
          </div>

          {/* Anomaly Sensitivity Slider */}
          <div className="flex flex-col gap-4">
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
            <p className="text-xs text-muted-foreground">
              Higher sensitivity = more frequent alerts
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Performance Metrics */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
          Performance Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {performanceMetrics.map((metric) => (
            <div key={metric.label} className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{metric.label}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-lg font-semibold text-foreground">{metric.value}</span>
                {metric.trend === "up" && <TrendingUp className="w-4 h-4 text-govern-green" />}
                {metric.trend === "down" && <TrendingUp className="w-4 h-4 text-govern-red rotate-180" />}
                {metric.trend === "stable" && <Activity className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Detected Anomalies */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
          Recent Anomalies ({anomalies.length})
        </h3>
        <div className="space-y-2">
          {anomalies.map((anomaly, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                anomaly.severity === "high"
                  ? "bg-govern-red/20"
                  : "bg-govern-amber/20"
              )}>
                <AlertTriangle className={cn(
                  "w-4 h-4",
                  anomaly.severity === "high"
                    ? "text-govern-red"
                    : "text-govern-amber"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold text-foreground">{anomaly.agent}</p>
                <p className="text-sm text-muted-foreground">{anomaly.type}</p>
              </div>

              <div className="text-right shrink-0">
                <span className={cn(
                  "text-xs font-semibold uppercase px-2 py-1 rounded",
                  anomaly.severity === "high"
                    ? "bg-govern-red/20 text-govern-red"
                    : "bg-govern-amber/20 text-govern-amber"
                )}>
                  {anomaly.severity}
                </span>
                <p className="text-xs text-muted-foreground mt-1">{anomaly.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
