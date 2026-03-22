"use client"

import { Header } from "@/components/govern/header"
import { SidebarNav } from "@/components/govern/sidebar-nav"

interface SidebarLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SidebarLayout({ children, activeTab, onTabChange }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-card fixed left-0 top-0 h-screen overflow-y-auto">
        <SidebarNav activeTab={activeTab} onTabChange={onTabChange} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-56 flex flex-col">
        <Header />
        <main className="flex-1 px-8 py-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
