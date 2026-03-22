"use client"

import { cn } from "@/lib/utils"

interface SidebarNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { value: "dashboard", label: "Dashboard", icon: "📊" },
  { value: "agents", label: "Agents", icon: "🤖" },
  { value: "ledger", label: "Ledger", icon: "📝" },
  { value: "shield", label: "Shield", icon: "🛡️" },
  { value: "onboarding", label: "Onboarding", icon: "🚀" },
  { value: "policies", label: "Policies", icon: "📋" },
  { value: "review-queue", label: "Review Queue", icon: "✓" },
  { value: "monitoring", label: "Monitoring", icon: "📈" },
  { value: "settings", label: "Settings", icon: "⚙️" },
]

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 p-6">
      {/* Logo */}
      <div className="mb-8 pb-8 border-b border-border">
        <h1 className="font-bold text-lg text-foreground tracking-tight">GovernHQ</h1>
      </div>

      {/* Nav Items */}
      {navItems.map((item) => (
        <button
          key={item.value}
          onClick={() => onTabChange(item.value)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left cursor-pointer",
            activeTab === item.value
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          )}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
