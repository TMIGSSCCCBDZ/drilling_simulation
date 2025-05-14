"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, AlertTriangle, Clock, Info } from "lucide-react"
import { motion } from "framer-motion"

interface EnhancedRiskBarProps {
  simulationEngine: any
  isRunning: boolean
}

export default function EnhancedRiskBar({ simulationEngine, isRunning }: EnhancedRiskBarProps) {
  const [riskLevel, setRiskLevel] = useState(0)
  const [riskType, setRiskType] = useState<string | null>(null)
  const [riskDecay, setRiskDecay] = useState(false)
  const [formationInfo, setFormationInfo] = useState<any>(null)
  const [showFormationTransition, setShowFormationTransition] = useState(false)
  const previousDepthRef = useRef(0)

  // Update risk level from simulation engine
  useEffect(() => {
    if (!simulationEngine || !isRunning) return

    const updateInterval = setInterval(() => {
      try {
        // Get risk data
        const risk = simulationEngine.getRiskLevel()
        setRiskLevel(risk.level)
        setRiskType(risk.type)
        setRiskDecay(risk.decaying)

        // Check for formation transitions
        const currentData = simulationEngine.getCurrentData()
        if (currentData && currentData.bitDepth) {
          // Get current formation
          const currentFormation = simulationEngine.getFormationAtDepth(currentData.bitDepth)

          // Check if we've crossed a formation boundary
          if (
            currentFormation &&
            Math.floor(currentData.bitDepth / 100) !== Math.floor(previousDepthRef.current / 100) &&
            Math.floor(currentData.bitDepth / 100) * 100 === Math.floor(currentFormation.depth)
          ) {
            setFormationInfo(currentFormation)
            setShowFormationTransition(true)

            // Hide formation transition notification after 5 seconds
            setTimeout(() => {
              setShowFormationTransition(false)
            }, 5000)
          }

          previousDepthRef.current = currentData.bitDepth
        }
      } catch (error) {
        console.error("Error updating risk level:", error)
      }
    }, 500)

    return () => clearInterval(updateInterval)
  }, [simulationEngine, isRunning])

  // Get risk color based on level
  const getRiskColor = () => {
    if (riskLevel < 30) return "bg-green-500"
    if (riskLevel < 60) return "bg-yellow-500"
    if (riskLevel < 80) return "bg-orange-500"
    return "bg-red-500"
  }

  // Get risk message based on type
  const getRiskMessage = () => {
    if (!riskType) return "Normal Operations"

    switch (riskType) {
      case "kick":
        return "Potential Kick Risk"
      case "lostCirculation":
        return "Lost Circulation Risk"
      case "highPressure":
        return "High Pressure Risk"
      case "pitDepletion":
        return "Pit Level Critical"
      case "equipmentFailure":
        return "Equipment Stress Risk"
      case "wellboreInstability":
        return "Wellbore Instability Risk"
      default:
        return `Risk: ${riskType}`
    }
  }

  return (
    <>
      <Card
        className={`border-l-4 ${
          riskLevel >= 80 ? "border-l-red-500 animate-pulse" : getRiskColor().replace("bg-", "border-l-")
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <div className="flex items-center">
              {riskLevel >= 60 ? (
                <AlertTriangle className={`mr-2 h-4 w-4 ${riskLevel >= 80 ? "text-red-500" : "text-yellow-500"}`} />
              ) : (
                <AlertCircle className="mr-2 h-4 w-4 text-slate-500" />
              )}
              <span>Operation Risk Level</span>
            </div>
            {riskDecay && (
              <div className="flex items-center text-xs">
                <Clock className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">Risk decreasing</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="relative h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getRiskColor()}`}
                initial={{ width: `${riskLevel}%` }}
                animate={{ width: `${riskLevel}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className={`text-sm font-medium ${riskLevel >= 80 ? "text-red-600" : ""}`}>{getRiskMessage()}</div>
              <div className="text-sm font-medium">{riskLevel}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formation transition notification */}
      {showFormationTransition && formationInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm"
        >
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">
                Entering {formationInfo.name || "New Formation"} at {formationInfo.depth}ft
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {formationInfo.lithology === "shale" && "Shale formation - monitor wellbore stability closely"}
                {formationInfo.lithology === "sandstone" && "Sandstone formation - potential for high permeability"}
                {formationInfo.lithology === "limestone" && "Limestone formation - may require higher WOB"}
                {formationInfo.lithology === "salt" &&
                  "Salt formation - risk of washouts, maintain proper mud properties"}
                {!formationInfo.lithology && "Adjust parameters for new formation properties"}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-blue-700">
                <div>Pore Pressure: {formationInfo.porePressure?.toFixed(1)} ppg</div>
                <div>Fracture Pressure: {formationInfo.fracturePressure?.toFixed(1)} ppg</div>
                <div>Permeability: {formationInfo.permeability?.toFixed(3)} mD</div>
                <div>Kick Risk: {formationInfo.kickRisk ? (formationInfo.kickRisk * 100).toFixed(0) + "%" : "Low"}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}
