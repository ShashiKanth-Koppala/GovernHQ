"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { SidebarLayout } from "@/components/layouts/sidebar-layout"
import { DashboardTab } from "@/components/govern/dashboard-tab"
import { AgentsTab } from "@/components/govern/agents-tab"
import { LedgerTab } from "@/components/govern/ledger-tab"
import { ShieldTab } from "@/components/govern/shield-tab"
import { OnboardingTab } from "@/components/govern/onboarding-tab"
import { PoliciesTab } from "@/components/govern/policies-tab"
import { ReviewQueueTab } from "@/components/govern/review-queue-tab"
import { MonitoringTab } from "@/components/govern/monitoring-tab"
import { SettingsTab } from "@/components/govern/settings-tab"

export default function GovernHQ() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && <DashboardTab />}
      {activeTab === "agents" && <AgentsTab />}
      {activeTab === "ledger" && <LedgerTab />}
      {activeTab === "shield" && <ShieldTab />}
      {activeTab === "onboarding" && <OnboardingTab />}
      {activeTab === "policies" && <PoliciesTab />}
      {activeTab === "review-queue" && <ReviewQueueTab />}
      {activeTab === "monitoring" && <MonitoringTab />}
      {activeTab === "settings" && <SettingsTab />}
    </SidebarLayout>
  )
}
