"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "@/lib/auth-context"
import { Login } from "@/components/auth/login"
import { Signup } from "@/components/auth/signup"
import { VerifyEmail } from "@/components/auth/verify-email"

type AuthStep = "login" | "signup" | "verify"

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>("login")
  const [signupEmail, setSignupEmail] = useState("")
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/")
    }
  }, [user, isLoading, navigate])

  useEffect(() => {
    if (!chartRef.current) return

    let chart: any = null

    const initChart = (echarts: any) => {
      if (!chartRef.current) return

      chart = echarts.init(chartRef.current, null, { renderer: 'canvas' })

      const generatePoints = (count: number) => {
        const points = []
        for (let i = 0; i < count; i++) {
          points.push([
            Math.random() * 360 - 180,
            Math.random() * 170 - 85,
          ])
        }
        return points
      }

      fetch('https://cdn.jsdelivr.net/npm/echarts/map/json/world.json')
        .then(r => r.json())
        .then(worldJson => {
          echarts.registerMap('world', worldJson)
          chart.setOption({
            backgroundColor: '#0a0b14',
            geo: {
              map: 'world',
              roam: false,
              silent: true,
              left: 0, right: 0, top: 0, bottom: 0,
              itemStyle: {
                areaColor: '#111827',
                borderColor: '#1e293b',
                borderWidth: 0.5,
              },
              emphasis: { disabled: true },
            },
            series: [
              {
                type: 'scatter',
                coordinateSystem: 'geo',
                data: generatePoints(300),
                symbolSize: 2,
                itemStyle: { color: '#3b82f6', opacity: 0.4 },
              },
              {
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: generatePoints(15),
                symbolSize: 4,
                rippleEffect: { period: 3, scale: 4, brushType: 'stroke' },
                itemStyle: { color: '#10b981', opacity: 0.8 },
              },
            ],
          })
        })
        .catch(() => { chart.setOption({ backgroundColor: '#0a0b14' }) })

      const handleResize = () => chart?.resize()
      window.addEventListener('resize', handleResize)
    }

    const loadEcharts = () => {
  if ((window as any).echarts) {
    initChart((window as any).echarts)
    return
  }
  // Check if script already exists
  const existing = document.querySelector('script[src*="echarts"]')
  if (existing) {
    // Script exists but may not be loaded yet — poll for it
    const poll = setInterval(() => {
      if ((window as any).echarts) {
        clearInterval(poll)
        initChart((window as any).echarts)
      }
    }, 100)
    setTimeout(() => clearInterval(poll), 5000)
    return
  }
  const script = document.createElement('script')
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js'
  script.async = true
  script.onload = () => initChart((window as any).echarts)
  script.onerror = () => console.warn('ECharts failed to load')
  document.head.appendChild(script)
}

loadEcharts()

    return () => { chart?.dispose() }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* World map background */}
      <div ref={chartRef} className="absolute inset-0 w-full h-full" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b14]/50 via-transparent to-[#0a0b14]/70 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">

        {/* Big GovernHQ heading */}
        <h1
          className="text-[88px] font-bold tracking-tight mb-[40px]"
          style={{
            WebkitTextStroke: '1.5px #3b82f6',
            color: 'transparent',
            animation: 'governFill 3s ease-in-out infinite',
          }}
        >
          GovernHQ
        </h1>

        <style>{`
          @keyframes governFill {
            0%   { color: transparent; -webkit-text-fill-color: transparent; }
            70%  { color: transparent; -webkit-text-fill-color: transparent; }
            85%  { color: transparent; -webkit-text-fill-color: transparent; }
            100% { color: #3b82f6; -webkit-text-fill-color: #3b82f6; }
          }
        `}</style>

        {/* Login form card — Welcome and subtitle are INSIDE the Login component already */}
        <div className="w-full bg-[#0f172a]/85 backdrop-blur-xl border border-[#1e293b]/60 rounded-[20px] p-[32px] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          {step === "login" && (
            <Login onSignupClick={() => setStep("signup")} />
          )}
          {step === "signup" && (
            <Signup
              onLoginClick={() => setStep("login")}
              onSuccess={() => navigate("/")}
            />
          )}
          {step === "verify" && (
            <VerifyEmail
              email={signupEmail}
              onVerified={() => navigate("/")}
            />
          )}
        </div>
      </div>
    </div>
  )
}
