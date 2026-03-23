"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Login } from "@/components/auth/login"
import { Signup } from "@/components/auth/signup"
import { VerifyEmail } from "@/components/auth/verify-email"

type AuthStep = "login" | "signup" | "verify"

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>("login")
  const [signupEmail, setSignupEmail] = useState("")
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">GovernHQ</h1>
      </div>

      {step === "login" && (
        <Login onSignupClick={() => setStep("signup")} />
      )}

      {step === "signup" && (
        <Signup
          onLoginClick={() => setStep("login")}
          onSuccess={() => {
            // In a real app, you'd trigger email sending here
            // For now, just redirect to dashboard after signup
            router.push("/")
          }}
        />
      )}

      {step === "verify" && (
        <VerifyEmail
          email={signupEmail}
          onVerified={() => {
            router.push("/")
          }}
        />
      )}
    </div>
  )
}
