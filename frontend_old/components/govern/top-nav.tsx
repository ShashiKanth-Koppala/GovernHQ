import { cn } from "@/lib/utils"

const tabs = [
  { value: "dashboard", label: "Dashboard" },
  { value: "agents", label: "Agents" },
  { value: "ledger", label: "Ledger" },
  { value: "shield", label: "Shield" },
]

interface TopNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-14">
        <span className="font-bold text-foreground tracking-tight">GovernHQ</span>
        <nav className="flex items-center gap-1" role="tablist" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "px-3 py-2 text-sm transition-colors relative cursor-pointer",
                activeTab === tab.value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span className="absolute bottom-0 left-3 right-3 h-px bg-foreground" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
