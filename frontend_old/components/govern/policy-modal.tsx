"use client"

import { useState } from "react"
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

interface PolicyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { name: string; description: string; category: string }) => void
}

const categories = [
  "Data Protection",
  "Security",
  "Financial",
  "Performance",
  "Compliance",
  "Custom",
]

export function PolicyModal({ open, onOpenChange, onSave }: PolicyModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("Data Protection")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Policy name is required")
      return
    }

    if (!description.trim()) {
      setError("Description is required")
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      category,
    })

    setName("")
    setDescription("")
    setCategory("Data Protection")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("")
      setDescription("")
      setCategory("Data Protection")
      setError("")
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Policy</DialogTitle>
          <DialogDescription>
            Define a new policy to govern your AI agent behavior
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded-md bg-govern-red/10 border border-govern-red/30">
              <p className="text-sm text-govern-red">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Policy Name</label>
            <Input
              placeholder="e.g., PII Access Control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              placeholder="Describe what this policy controls and enforces..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-govern-green/50 resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-md bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-govern-green/50"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-card">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-border text-muted-foreground bg-transparent hover:bg-secondary"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-govern-green text-foreground hover:bg-govern-green/90"
            >
              Create Policy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
