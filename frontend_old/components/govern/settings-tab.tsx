"use client"

import { useState } from "react"
import { ChevronRight, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type SettingTab = "organization" | "members" | "api" | "integrations" | "billing"

const settingTabs = [
  { value: "organization" as const, label: "Organization" },
  { value: "members" as const, label: "Members" },
  { value: "api" as const, label: "API Keys" },
  { value: "integrations" as const, label: "Integrations" },
  { value: "billing" as const, label: "Billing" },
]

export function SettingsTab() {
  const [activeTab, setActiveTab] = useState<SettingTab>("organization")
  const [orgName, setOrgName] = useState("Acme Corp")
  const [members, setMembers] = useState([
    { id: "1", name: "John Doe", email: "john@acme.com", role: "Owner" },
    { id: "2", name: "Jane Smith", email: "jane@acme.com", role: "Admin" },
    { id: "3", name: "Bob Johnson", email: "bob@acme.com", role: "Viewer" },
  ])
  const [apiKeys, setApiKeys] = useState([
    { id: "1", name: "Production", key: "gov_prod_xxx", created: "2024-01-10" },
    { id: "2", name: "Development", key: "gov_dev_xxx", created: "2024-01-05" },
  ])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Settings Tabs */}
      <div className="flex gap-1 border-b border-border">
        {settingTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative border-b-2",
              activeTab === tab.value
                ? "text-foreground border-b-govern-green"
                : "text-muted-foreground hover:text-foreground border-b-transparent"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Organization Tab */}
      {activeTab === "organization" && (
        <div className="flex flex-col gap-6 max-w-2xl">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-4">
              Organization Details
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Organization Name</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Organization ID</label>
                <Input
                  value="org_acme_12345"
                  disabled
                  className="bg-secondary border-border text-muted-foreground"
                />
              </div>
              <Button className="w-fit bg-govern-green text-foreground hover:bg-govern-green/90">
                Save Changes
              </Button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-4 text-govern-red">
              Danger Zone
            </h3>
            <Button
              variant="outline"
              className="border-govern-red text-govern-red bg-transparent hover:bg-govern-red/10"
            >
              Delete Organization
            </Button>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="flex flex-col gap-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Team Members</h3>
            <Button className="bg-govern-green text-foreground hover:bg-govern-green/90 gap-2">
              Add Member
            </Button>
          </div>

          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    defaultValue={member.role}
                    className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-govern-green/50"
                  >
                    <option className="bg-card">Owner</option>
                    <option className="bg-card">Admin</option>
                    <option className="bg-card">Viewer</option>
                  </select>
                  <button className="text-govern-red hover:bg-govern-red/10 p-2 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "api" && (
        <div className="flex flex-col gap-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">API Keys</h3>
            <Button className="bg-govern-green text-foreground hover:bg-govern-green/90 gap-2">
              Generate Key
            </Button>
          </div>

          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 rounded-lg border border-border hover:bg-secondary/50 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{apiKey.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">Created {apiKey.created}</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-secondary px-3 py-2 rounded font-mono text-muted-foreground">
                    {apiKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                    className="text-muted-foreground hover:text-foreground p-2 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {copiedKey === apiKey.id && (
                    <span className="text-xs text-govern-green">Copied!</span>
                  )}
                </div>
                <button className="text-govern-red hover:bg-govern-red/10 p-2 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <div className="flex flex-col gap-6 max-w-2xl">
          <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Integrations</h3>
          
          <div className="space-y-3">
            {["Slack", "PagerDuty", "DataDog", "Splunk"].map((integration) => (
              <div key={integration} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground text-sm">{integration}</p>
                  <p className="text-xs text-muted-foreground mt-1">Not connected</p>
                </div>
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary gap-2">
                  Connect
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === "billing" && (
        <div className="flex flex-col gap-6 max-w-2xl">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-4">Billing Plan</h3>
            <div className="p-6 rounded-lg border border-govern-green/30 bg-govern-green/5">
              <p className="text-sm text-foreground font-semibold">Professional Plan</p>
              <p className="text-2xl font-bold text-govern-green mt-2">$499<span className="text-sm text-muted-foreground">/month</span></p>
              <p className="text-sm text-muted-foreground mt-2">Includes up to 100 agents, 5 team members, and 24/7 support</p>
              <Button className="mt-4 border-govern-green text-govern-green bg-transparent hover:bg-govern-green/10 border">
                Upgrade Plan
              </Button>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div>
            <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium mb-4">Billing History</h3>
            <div className="space-y-2">
              {[
                { date: "Jan 15, 2024", amount: "$499.00", status: "Paid" },
                { date: "Dec 15, 2023", amount: "$499.00", status: "Paid" },
              ].map((invoice, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50">
                  <div>
                    <p className="text-sm text-foreground font-medium">{invoice.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-foreground font-semibold">{invoice.amount}</span>
                    <span className="text-xs font-semibold text-govern-green px-2 py-1 rounded bg-govern-green/20">
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
