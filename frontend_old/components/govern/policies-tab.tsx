"use client"

import { useState } from "react"
import { Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PolicyModal } from "./policy-modal"
import { cn } from "@/lib/utils"

interface Policy {
  id: string
  name: string
  description: string
  category: string
  status: "active" | "draft" | "archived"
  agentCount: number
  createdAt: string
}

export function PoliciesTab() {
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: "1",
      name: "PII Access Control",
      description: "Restrict access to personally identifiable information",
      category: "Data Protection",
      status: "active",
      agentCount: 5,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "External API Restrictions",
      description: "Block unauthorized external API calls",
      category: "Security",
      status: "active",
      agentCount: 8,
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      name: "Billing Override Protection",
      description: "Prevent agents from overriding billing limits",
      category: "Financial",
      status: "active",
      agentCount: 3,
      createdAt: "2024-01-05",
    },
    {
      id: "4",
      name: "Bulk Operation Limits",
      description: "Limit large batch operations to approved requests",
      category: "Performance",
      status: "draft",
      agentCount: 2,
      createdAt: "2024-01-20",
    },
  ])

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)

  const filtered = policies.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreatePolicy = (data: any) => {
    const newPolicy: Policy = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      category: data.category,
      status: "draft",
      agentCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setPolicies([...policies, newPolicy])
    setModalOpen(false)
  }

  const handleDeletePolicy = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-govern-green"
      case "draft":
        return "text-govern-amber"
      case "archived":
        return "text-muted-foreground"
      default:
        return "text-foreground"
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Policies</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage policies that govern agent behavior
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-govern-green text-foreground hover:bg-govern-green/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Policy
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search policies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Policy Name</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Category</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Agents</TableHead>
            <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((policy) => (
            <TableRow
              key={policy.id}
              className="border-border hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <TableCell className="font-semibold text-foreground">
                <div className="flex flex-col gap-1">
                  <span>{policy.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{policy.description}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{policy.category}</TableCell>
              <TableCell>
                <span className={cn("text-sm font-medium capitalize", getStatusColor(policy.status))}>
                  {policy.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-right text-foreground">{policy.agentCount}</TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => handleDeletePolicy(policy.id)}
                  className="text-govern-red hover:bg-govern-red/10 p-2 rounded transition-colors"
                  title="Delete policy"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No policies found</p>
        </div>
      )}

      <PolicyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleCreatePolicy}
      />
    </div>
  )
}
