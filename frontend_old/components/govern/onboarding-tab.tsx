"use client"

import { useState } from "react"
import { Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  action?: string
}

export function OnboardingTab() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: "1",
      title: "Register Your First Agent",
      description: "Connect your AI agent to GovernHQ for governance and monitoring.",
      completed: false,
      action: "Register Agent",
    },
    {
      id: "2",
      title: "Set Up Protection Gates",
      description: "Define decision gates to intercept and approve agent actions.",
      completed: false,
      action: "Configure Gates",
    },
    {
      id: "3",
      title: "Create Policies",
      description: "Establish policies for what your agents can and cannot do.",
      completed: false,
      action: "Create Policy",
    },
    {
      id: "4",
      title: "Enable Monitoring",
      description: "Set up behavioral monitoring and anomaly detection.",
      completed: false,
      action: "Enable Monitoring",
    },
    {
      id: "5",
      title: "Configure Team Access",
      description: "Invite team members and set their roles and permissions.",
      completed: false,
      action: "Add Members",
    },
    {
      id: "6",
      title: "Review Documentation",
      description: "Read our documentation to understand all GovernHQ features.",
      completed: false,
      action: "View Docs",
    },
  ])

  const toggleItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const completedCount = checklist.filter(item => item.completed).length
  const progressPercent = (completedCount / checklist.length) * 100

  return (
    <div className="flex flex-col gap-8">
      {/* Progress Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Get Started with GovernHQ</h2>
          <span className="text-sm text-muted-foreground">{completedCount} of {checklist.length} completed</span>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-govern-green h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer",
              item.completed
                ? "border-govern-green/30 bg-govern-green/5"
                : "border-border hover:border-border/80 hover:bg-secondary/50"
            )}
            onClick={() => toggleItem(item.id)}
          >
            <button
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5",
                item.completed
                  ? "bg-govern-green border-govern-green"
                  : "border-border hover:border-govern-green"
              )}
              onClick={(e) => {
                e.stopPropagation()
                toggleItem(item.id)
              }}
            >
              {item.completed && <Check className="w-3 h-3 text-foreground" />}
            </button>

            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "text-sm font-semibold transition-all",
                item.completed ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {item.description}
              </p>
            </div>

            {item.action && !item.completed && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleItem(item.id)
                }}
                className="flex-shrink-0 mt-0.5 bg-govern-green text-foreground hover:bg-govern-green/90"
              >
                {item.action}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {completedCount === checklist.length && (
        <div className="p-6 rounded-lg border border-govern-green/30 bg-govern-green/5">
          <div className="flex items-center gap-3">
            <Check className="w-6 h-6 text-govern-green" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">You're all set!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your GovernHQ workspace is ready. Start monitoring your agents and enforcing policies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
