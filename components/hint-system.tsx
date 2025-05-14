"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, ArrowUp, Gauge, Droplets, RotateCcw } from "lucide-react"

interface HintSystemProps {
  simulationEngine: any
  isRunning: boolean
}

interface Hint {
  id: string
  message: string
  type: "warning" | "critical" | "info"
  icon: React.ReactNode
  parameter?: string
  targetValue?: number
  direction?: "increase" | "decrease"
  timestamp: number
}

export default function HintSystem({ simulationEngine, isRunning }: HintSystemProps) {
  const [hints, setHints] = useState<Hint[]>([])
  const [currentData, setCurrentData] = useState<any>({})
  const [previousData, setPreviousData] = useState<any>({})

  // Update data from simulation engine
  useEffect(() => {
    if (!simulationEngine || !isRunning) return

    const updateInterval = setInterval(() => {
      try {
        const data = simulationEngine.getCurrentData()
        if (data) {
          setPreviousData(currentData)
          setCurrentData(data)
        }
      } catch (error) {
        console.error("Error updating hint system data:", error)
      }
    }, 500)

    return () => clearInterval(updateInterval)
  }, [simulationEngine, isRunning, currentData])

  // Generate hints based on current conditions
  useEffect(() => {
    if (!simulationEngine || !isRunning || !currentData || Object.keys(currentData).length === 0) return

    const newHints: Hint[] = []

    // Check for high standpipe pressure
    if (currentData.standpipePressure > 2500) {
      newHints.push({
        id: "high-standpipe",
        message: "High standpipe pressure – consider reducing RPM or pump rate",
        type: "warning",
        icon: <Gauge className="h-5 w-5" />,
        parameter: "rotarySpeed",
        targetValue: 50,
        direction: "decrease",
        timestamp: Date.now(),
      })
    }

    // Check for low pit level
    if (currentData.pitLevel < 30) {
      newHints.push({
        id: "low-pit",
        message: "Low pit level – check for lost circulation, reduce pump rate",
        type: "critical",
        icon: <Droplets className="h-5 w-5" />,
        parameter: "pumpRate",
        targetValue: 30,
        direction: "decrease",
        timestamp: Date.now(),
      })
    }

    // Check for gas influx
    if (currentData.gasLevel > 3) {
      newHints.push({
        id: "gas-influx",
        message:
          currentData.gasLevel > 5
            ? "Critical gas influx – close BOP immediately"
            : "Gas detected – increase mud weight and monitor closely",
        type: currentData.gasLevel > 5 ? "critical" : "warning",
        icon: <AlertTriangle className="h-5 w-5" />,
        parameter: currentData.gasLevel > 5 ? "bopStatus" : "mudWeight",
        targetValue: currentData.gasLevel > 5 ? "closed" : currentData.mudWeight + 0.5,
        direction: currentData.gasLevel > 5 ? undefined : "increase",
        timestamp: Date.now(),
      })
    }

    // Check for high torque
    if (currentData.torque > 80) {
      newHints.push({
        id: "high-torque",
        message: "High torque detected – reduce RPM to prevent drill string damage",
        type: "warning",
        icon: <RotateCcw className="h-5 w-5" />,
        parameter: "rotarySpeed",
        targetValue: Math.max(30, currentData.rpm * 0.7),
        direction: "decrease",
        timestamp: Date.now(),
      })
    }

    // Check for formation pressure approaching mud weight
    const hydrostaticPressure = currentData.mudWeight * 0.052 * currentData.bitDepth
    if (currentData.formationPressure > hydrostaticPressure * 0.9) {
      newHints.push({
        id: "underbalanced",
        message: "Formation pressure approaching mud weight – increase mud weight",
        type: "warning",
        icon: <ArrowUp className="h-5 w-5" />,
        parameter: "mudWeight",
        targetValue: currentData.mudWeight + 0.5,
        direction: "increase",
        timestamp: Date.now(),
      })
    }

    // Update hints - add new ones and keep existing ones that are still relevant
    setHints((prevHints) => {
      // Keep hints that are still relevant and not resolved
      const existingHints = prevHints.filter((hint) => {
        // Check if the hint has been resolved
        if (hint.parameter && hint.targetValue !== undefined) {
          if (hint.parameter === "bopStatus") {
            return currentData[hint.parameter] !== hint.targetValue
          } else if (hint.direction === "decrease") {
            return currentData[hint.parameter] > hint.targetValue
          } else if (hint.direction === "increase") {
            return currentData[hint.parameter] < hint.targetValue
          }
        }

        // Keep hints that don't have specific resolution criteria for 10 seconds
        return Date.now() - hint.timestamp < 10000
      })

      // Add new hints that don't already exist
      const combinedHints = [...existingHints]
      newHints.forEach((newHint) => {
        if (!existingHints.some((hint) => hint.id === newHint.id)) {
          combinedHints.push(newHint)
        }
      })

      return combinedHints
    })
  }, [currentData, simulationEngine, isRunning])

  // Check if user has taken action to resolve hints
  useEffect(() => {
    if (
      !previousData ||
      Object.keys(previousData).length === 0 ||
      !currentData ||
      Object.keys(currentData).length === 0
    )
      return

    // Check for parameter changes that might resolve hints
    const parameterChanges = Object.keys(currentData).filter((key) => previousData[key] !== currentData[key])

    if (parameterChanges.length > 0) {
      // Check if any hints should be resolved based on user actions
      setHints((prevHints) =>
        prevHints.filter((hint) => {
          if (!hint.parameter || !parameterChanges.includes(hint.parameter)) {
            return true // Keep hints that don't relate to changed parameters
          }

          // Check if the parameter change resolves the hint
          if (hint.parameter === "bopStatus") {
            return currentData[hint.parameter] !== hint.targetValue
          } else if (hint.direction === "decrease") {
            return currentData[hint.parameter] > hint.targetValue
          } else if (hint.direction === "increase") {
            return currentData[hint.parameter] < hint.targetValue
          }

          return true
        }),
      )
    }
  }, [previousData, currentData])

  // Get background color based on hint type
  const getHintBackground = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-100 border-red-300 text-red-800"
      case "warning":
        return "bg-yellow-100 border-yellow-300 text-yellow-800"
      default:
        return "bg-blue-100 border-blue-300 text-blue-800"
    }
  }

  // Get icon color based on hint type
  const getIconColor = (type: string) => {
    switch (type) {
      case "critical":
        return "text-red-500"
      case "warning":
        return "text-yellow-500"
      default:
        return "text-blue-500"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {hints.map((hint) => (
          <motion.div
            key={`${hint.id}-${hint.timestamp}`}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`p-3 rounded-lg border shadow-md flex items-start ${getHintBackground(hint.type)}`}
          >
            <div className={`mr-2 ${getIconColor(hint.type)}`}>{hint.icon}</div>
            <div className="flex-1">{hint.message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
