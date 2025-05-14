"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RiskBarProps {
  simulationEngine: any
  isRunning: boolean
  onTakeAction: () => void
}

export default function RiskBar({ simulationEngine, isRunning, onTakeAction }: RiskBarProps) {
  const [riskLevel, setRiskLevel] = useState(0)
  const [riskType, setRiskType] = useState<string | null>(null)
  const [interventionTime, setInterventionTime] = useState(0)
  const [maxInterventionTime, setMaxInterventionTime] = useState(60)
  const [isIntervening, setIsIntervening] = useState(false)

  // Update risk level from simulation engine
  useEffect(() => {
    if (!simulationEngine || !isRunning) return

    const updateInterval = setInterval(() => {
      try {
        const risk = simulationEngine.getRiskLevel()
        setRiskLevel(risk.level)
        setRiskType(risk.type)
        setInterventionTime(risk.interventionTime)
        setMaxInterventionTime(risk.maxInterventionTime)
        setIsIntervening(risk.isIntervening)
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
        return "Potential Kick Detected"
      case "lostCirculation":
        return "Lost Circulation"
      case "highPressure":
        return "High Pressure Warning"
      case "pitDepletion":
        return "Pit Level Critical"
      case "equipmentFailure":
        return "Equipment Stress Warning"
      case "wellboreInstability":
        return "Wellbore Instability"
      default:
        return `Warning: ${riskType}`
    }
  }

  // Calculate intervention time percentage
  const getInterventionTimePercentage = () => {
    if (!isIntervening || maxInterventionTime === 0) return 100
    return (interventionTime / maxInterventionTime) * 100
  }

  return (
    <Card
      className={`border-l-4 ${riskLevel >= 80 ? "border-l-red-500 animate-pulse" : getRiskColor().replace("bg-", "border-l-")}`}
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
          {isIntervening && (
            <div className="flex items-center text-xs">
              <Clock className="h-3 w-3 mr-1 text-red-500" />
              <span className="text-red-500">{Math.ceil(interventionTime)}s to respond</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={riskLevel} className="h-2 w-full bg-slate-200">
            <div className={`h-full ${getRiskColor()}`} style={{ width: `${riskLevel}%` }} />
          </Progress>

          <div className="flex justify-between items-center">
            <div className={`text-sm font-medium ${riskLevel >= 80 ? "text-red-600" : ""}`}>{getRiskMessage()}</div>
            {riskLevel >= 80 && (
              <Button size="sm" variant="destructive" className="ml-2 animate-pulse" onClick={onTakeAction}>
                Take Action Now
              </Button>
            )}
          </div>

          {isIntervening && (
            <div className="mt-1">
              <div className="text-xs text-slate-500 mb-1 flex justify-between">
                <span>Intervention Window</span>
                <span>{Math.ceil(interventionTime)}s remaining</span>
              </div>
              <Progress value={getInterventionTimePercentage()} className="h-1.5 w-full bg-slate-200">
                <div className="h-full bg-blue-500" style={{ width: `${getInterventionTimePercentage()}%` }} />
              </Progress>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
