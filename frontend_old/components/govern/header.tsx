"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export function Header() {
  const [orgDropdown, setOrgDropdown] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [envDropdown, setEnvDropdown] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()
  const [userInitials, setUserInitials] = useState("JD")

  useEffect(() => {
    if (user && user.name) {
      const names = user.name.split(" ")
      const initials = names.map(n => n[0]).join("").toUpperCase().slice(0, 2)
      setUserInitials(initials || "U")
    }
  }, [user])

  const handleLogout = () => {
    logout()
    router.push("/auth")
  }

  return (
    <header className="border-b border-border bg-card px-8 py-4">
      <div className="flex items-center justify-between h-10">
        <div className="flex items-center gap-4">
          {/* Organization Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setOrgDropdown(!orgDropdown)
                setUserDropdown(false)
                setEnvDropdown(false)
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-sm cursor-pointer"
            >
              <span className="text-foreground font-medium">Acme Corp</span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", orgDropdown && "rotate-180")} />
            </button>
            {orgDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                  Acme Corp
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                  Add Organization
                </button>
              </div>
            )}
          </div>

          {/* Environment Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setEnvDropdown(!envDropdown)
                setOrgDropdown(false)
                setUserDropdown(false)
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-sm cursor-pointer"
            >
              <span className="text-muted-foreground text-sm">Production</span>
              <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", envDropdown && "rotate-180")} />
            </button>
            {envDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                  Production
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-secondary transition-colors">
                  Staging
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-secondary transition-colors">
                  Development
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdown(!userDropdown)
              setOrgDropdown(false)
              setEnvDropdown(false)
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-secondary transition-colors text-sm cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-govern-green/20 flex items-center justify-center">
              <span className="text-xs font-semibold text-govern-green">{userInitials}</span>
            </div>
            <span className="text-muted-foreground text-sm">{user?.email || "user@example.com"}</span>
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", userDropdown && "rotate-180")} />
          </button>
          {userDropdown && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-50">
              <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                Profile
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-secondary transition-colors">
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-govern-red hover:bg-secondary transition-colors border-t border-border"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
