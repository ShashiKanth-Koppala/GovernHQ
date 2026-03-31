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

      // Generate random scatter points across the world
      const generatePoints = (count: number) => {
        const points = []
        for (let i = 0; i < count; i++) {
          points.push([
            Math.random() * 360 - 180, // longitude
            Math.random() * 170 - 85,  // latitude
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
            graphic: {
              elements: [
                {
                  type: 'text',
                  left: 'center',
                  top: '38%',
                  style: {
                    text: 'GovernHQ',
                    fontSize: 64,
                    fontWeight: 'bold',
                    fontFamily: 'Mulish, sans-serif',
                    lineDash: [0, 200],
                    lineDashOffset: 0,
                    fill: 'transparent',
                    stroke: '#3b82f6',
                    lineWidth: 1.5,
                  },
                  keyframeAnimation: {
                    duration: 3000,
                    loop: true,
                    keyframes: [
                      {
                        percent: 0.7,
                        style: {
                          fill: 'transparent',
                          lineDashOffset: 200,
                          lineDash: [200, 0],
                        },
                      },
                      {
                        percent: 0.8,
                        style: { fill: 'transparent' },
                      },
                      {
                        percent: 1,
                        style: { fill: '#3b82f6' },
                      },
                    ],
                  },
                },
                {
                  type: 'text',
                  left: 'center',
                  top: '52%',
                  style: {
                    text: 'Govern, monitor, and control your AI agents',
                    fontSize: 16,
                    fontFamily: 'Mulish, sans-serif',
                    fill: '#64748b',
                  },
                },
              ],
            },
            geo: {
              map: 'world',
              roam: false,
              silent: true,
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              itemStyle: {
                areaColor: '#111827',
                borderColor: '#1e293b',
                borderWidth: 0.5,
              },
              emphasis: {
                disabled: true,
              },
            },
            series: [
              {
                type: 'scatter',
                coordinateSystem: 'geo',
                data: generatePoints(300),
                symbolSize: 2,
                itemStyle: {
                  color: '#3b82f6',
                  opacity: 0.4,
                },
                animation: true,
                animationDuration: 3000,
              },
              {
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: generatePoints(15),
                symbolSize: 4,
                rippleEffect: {
                  period: 3,
                  scale: 4,
                  brushType: 'stroke',
                },
                itemStyle: {
                  color: '#10b981',
                  opacity: 0.8,
                },
              },
            ],
          })
        })
        .catch(() => {
          // Fallback without map
          chart.setOption({
            backgroundColor: '#0a0b14',
            graphic: {
              elements: [
                {
                  type: 'text',
                  left: 'center',
                  top: 'center',
                  style: {
                    text: 'GovernHQ',
                    fontSize: 64,
                    fontWeight: 'bold',
                    lineDash: [0, 200],
                    lineDashOffset: 0,
                    fill: 'transparent',
                    stroke: '#3b82f6',
                    lineWidth: 1.5,
                  },
                  keyframeAnimation: {
                    duration: 3000,
                    loop: true,
                    keyframes: [
                      { percent: 0.7, style: { fill: 'transparent', lineDashOffset: 200, lineDash: [200, 0] } },
                      { percent: 0.8, style: { fill: 'transparent' } },
                      { percent: 1, style: { fill: '#3b82f6' } },
                    ],
                  },
                },
              ],
            },
          })
        })

      const handleResize = () => chart?.resize()
      window.addEventListener('resize', handleResize)
    }

    // Load ECharts from CDN
    if ((window as any).echarts) {
      initChart((window as any).echarts)
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js'
      script.onload = () => initChart((window as any).echarts)
      document.head.appendChild(script)
    }

    return () => {
      chart?.dispose()
    }
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
      {/* Full screen world map background */}
      <div ref={chartRef} className="absolute inset-0 w-full h-full" />

      {/* Overlay gradient to darken edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0b14]/40 via-transparent to-[#0a0b14]/60 pointer-events-none" />

      {/* Login form card */}
      <div className="relative z-10 mt-[240px] w-full max-w-md">
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-[#1e293b]/60 rounded-[20px] p-[32px] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
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
