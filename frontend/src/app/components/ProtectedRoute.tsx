"use client"

import { useEffect } from "react"
import { useNavigate, Outlet } from "react-router"
import { useAuth } from "@/lib/auth-context"

export function ProtectedRoute() {
    const { user, isLoading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoading && !user) {
            navigate("/auth")
        }
    }, [user, isLoading, navigate])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return <Outlet />
}
