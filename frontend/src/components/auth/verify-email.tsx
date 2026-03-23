"use client"

import { useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"

interface VerifyEmailProps {
  email: string
  onVerified: () => void
}

export function VerifyEmail({ email, onVerified }: VerifyEmailProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [resentEmail, setResentEmail] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Mock verification - any code works
    setTimeout(() => {
      onVerified()
      setIsLoading(false)
    }, 500)
  }

  const handleResend = () => {
    setResentEmail(true)
    setTimeout(() => setResentEmail(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
        <p className="text-sm text-muted-foreground">
          We've sent a verification code to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Verification Code</label>
          <Input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-mono text-center text-lg tracking-widest"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || code.length < 6}
          className="w-full bg-govern-green text-foreground hover:bg-govern-green/90 font-semibold disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Verify Email"}
        </Button>
      </form>

      <div className="flex flex-col gap-3 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">Didn't receive a code?</p>
        <Button
          onClick={handleResend}
          variant="outline"
          className="border-border text-foreground hover:bg-secondary"
        >
          {resentEmail ? "Code sent!" : "Resend Code"}
        </Button>
      </div>
    </div>
  )
}
