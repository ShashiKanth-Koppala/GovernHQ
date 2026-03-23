"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginProps {
  onSignupClick: () => void
}

export function Login({ onSignupClick }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!email || !password) {
        setError("Please fill in all fields")
        return
      }
      await login(email, password)
    } catch (err) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Welcome to GovernHQ</h1>
        <p className="text-sm text-muted-foreground">Govern, monitor, and control your AI agents</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-md bg-govern-red/10 border border-govern-red/30">
            <p className="text-sm text-govern-red">{error}</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-govern-green text-foreground hover:bg-govern-green/90 font-semibold disabled:opacity-50"
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Don't have an account?</span>
        <button
          onClick={onSignupClick}
          className="text-govern-green hover:text-govern-green/80 font-medium transition-colors cursor-pointer"
        >
          Sign up
        </button>
      </div>
    </div>
  )
}
