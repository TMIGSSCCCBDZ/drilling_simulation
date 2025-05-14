"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Gauge, Droplets, Layers, Thermometer } from "lucide-react"

interface ParametersDashboardProps {
  simulationEngine: any
  isRunning: boolean
}

interface ParameterStats {
  current: number
  min: number
  max: number
  unit: string
  name: string
  icon: React.ReactNode
  dangerLow?: number
  dangerHigh?: number
  warningLow?: number
  warningHigh?: number
}

export default function ParametersDashboard({ simulationEngine, isRunning }: ParametersDashboardProps) {
  const [parameters, setParameters] = useState<Record<string, ParameterStats>>({
    depth: { current: 0, min: 0, max: 0, unit: "ft", name: "Depth", icon: <Layers className="h-4 w-4" /> },
    rop: {
      current: 0,
      min: 0,
      max: 0,
      unit: "ft/hr",
      name: "ROP",
      icon: <ArrowDown className="h-4 w-4" />,
      dangerHigh: 150,
      warningHigh: 120,
    },
    mudWeight: {
      current: 0,
      min: 0,
      max: 0,
      unit: "ppg",
      name: "Mud Weight",
      icon: <Droplets className="h-4 w-4" />,
      dangerLow: 8.5,
      dangerHigh: 16,
      warningLow: 9,
      warningHigh: 15,
    },
    pumpPressure: {
      current: 0,
      min: 0,
      max: 0,
      unit: "psi",
      name: "Pump Pressure",
      icon: <Gauge className="h-4 w-4" />,
      dangerHigh: 4000,
      warningHigh: 3500,
    },
    gasLevel: {
      current: 0,
      min: 0,
      max: 0,
      unit: "%",
      name: "Gas Cut",
      icon: <Thermometer className="h-4 w-4" />,
      dangerHigh: 5,
      warningHigh: 3,
    },
    standpipePressure: {
      current: 0,
      min: 0,
      max: 0,
      unit: "psi",
      name: "Standpipe",
      icon: <Gauge className="h-4 w-4" />,
      dangerHigh: 3500,
      warningHigh: 3000,
    },
    pitLevel: {
      current: 0,
      min: 0,
      max: 0,
      unit: "%",
      name: "Pit Level",
      icon: <Droplets className="h-4 w-4" />,
      dangerLow: 20,
      warningLow: 30,
    },
    torque: {
      current: 0,
      min: 0,
      max: 0,
      unit: "ft-lbs",
      name: "Torque",
      icon: <ArrowUp className="h-4 w-4" />,
      dangerHigh: 90,
      warningHigh: 80,
    },
  })

  // Update parameters from simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    const updateInterval = setInterval(() => {
      try {
        const data = simulationEngine.getCurrentData()
        if (data) {
          // Update each parameter
          setParameters((prev) => {
            const updated = { ...prev }

            // Update each parameter that exists in the data
            Object.keys(updated).forEach((key) => {
              if (data[key] !== undefined) {
                updated[key] = {
                  ...updated[key],
                  current: data[key],
                  min: Math.min(updated[key].min || data[key], data[key]),
                  max: Math.max(updated[key].max || data[key], data[key]),
                }
              }
            })

            return updated
          })
        }
      } catch (error) {
        console.error("Error updating parameters dashboard:", error)
      }
    }, 500)

    return () => clearInterval(updateInterval)
  }, [simulationEngine])

  // Get status color based on parameter value
  const getStatusColor = (param: ParameterStats) => {
    const { current, dangerLow, dangerHigh, warningLow, warningHigh } = param

    if ((dangerLow !== undefined && current <= dangerLow) || (dangerHigh !== undefined && current >= dangerHigh)) {
      return "text-red-500"
    }

    if ((warningLow !== undefined && current <= warningLow) || (warningHigh !== undefined && current >= warningHigh)) {
      return "text-orange-500"
    }

    return "text-green-500"
  }

  // Get background color based on parameter value
  const getBackgroundColor = (param: ParameterStats) => {
    const { current, dangerLow, dangerHigh, warningLow, warningHigh } = param

    if ((dangerLow !== undefined && current <= dangerLow) || (dangerHigh !== undefined && current >= dangerHigh)) {
      return "bg-red-50"
    }

    if ((warningLow !== undefined && current <= warningLow) || (warningHigh !== undefined && current >= warningHigh)) {
      return "bg-orange-50"
    }

    return ""
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Drilling Parameters Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Object.entries(parameters).map(([key, param]) => (
            <Card key={key} className={`${getBackgroundColor(param)}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <div className={`mr-2 ${getStatusColor(param)}`}>{param.icon}</div>
                    <span className="text-sm font-medium">{param.name}</span>
                  </div>
                  <span className={`text-xs font-medium ${getStatusColor(param)}`}>
                    {param.current.toFixed(1)} {param.unit}
                  </span>
                </div>

                <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      getStatusColor(param) === "text-red-500"
                        ? "bg-red-500"
                        : getStatusColor(param) === "text-orange-500"
                          ? "bg-orange-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(100, (param.current / (param.max || 1)) * 100)}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>Min: {param.min.toFixed(1)}</span>
                  <span>Max: {param.max.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
