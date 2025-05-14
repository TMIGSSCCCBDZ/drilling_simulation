"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw, FileText, Award, Clock } from "lucide-react"

interface GameOverScreenProps {
  reason: string
  details: any
  onRestart: () => void
  onShowReport: () => void
  onLoadLastCheckpoint: () => void
}

export default function GameOverScreen({
  reason,
  details,
  onRestart,
  onShowReport,
  onLoadLastCheckpoint,
}: GameOverScreenProps) {
  const [showDetails, setShowDetails] = useState(false)

  // Calculate score based on game over details
  const calculateScore = () => {
    if (!details || !details.parameters) return { technical: 0, safety: 0, efficiency: 0, total: 0 }

    // Base scores
    let technical = 50
    let safety = 50
    let efficiency = 50

    // Technical score adjustments
    if (details.parameters.mudWeight < details.parameters.formationPressure) {
      technical -= 20 // Underbalanced drilling without control
    }
    if (details.parameters.standpipePressure > 3000) {
      technical -= 15 // Excessive pump pressure
    }
    if (details.missedWarnings && details.missedWarnings.length > 0) {
      technical -= details.missedWarnings.length * 10 // Missed technical warnings
    }

    // Safety score adjustments
    if (reason.includes("Blowout") || reason.includes("H2S")) {
      safety = 0 // Critical safety failure
    } else if (reason.includes("Kick") || reason.includes("Gas Influx")) {
      safety -= 30 // Serious safety issue
    } else if (reason.includes("Equipment Failure")) {
      safety -= 20 // Equipment damage
    }

    // Efficiency score adjustments
    if (details.elapsedTime < 300) {
      efficiency -= 20 // Failed too quickly
    }
    if (reason.includes("Stuck Pipe") || reason.includes("Collapse")) {
      efficiency -= 25 // Major operational inefficiency
    }

    // Ensure no negative scores
    technical = Math.max(0, technical)
    safety = Math.max(0, safety)
    efficiency = Math.max(0, efficiency)

    // Calculate total score
    const total = Math.round((technical + safety + efficiency) / 3)

    return { technical, safety, efficiency, total }
  }

  const score = calculateScore()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <Card className="w-full max-w-3xl mx-4 border-red-500 shadow-lg animate-in fade-in duration-300">
        <CardHeader className="bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <CardTitle className="text-2xl text-red-700">Simulation Failed</CardTitle>
                <CardDescription className="text-red-600 font-medium text-lg mt-1">{reason}</CardDescription>
              </div>
            </div>
            <div className="flex items-center bg-white rounded-full p-3 shadow-md">
              <Award className="h-6 w-6 text-amber-500 mr-2" />
              <span className="text-2xl font-bold">{score.total}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What Happened:</h3>
              <p className="text-slate-700">
                {details.description || "A critical failure occurred in the drilling operation."}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Consequences:</h3>
              <p className="text-slate-700">
                {details.consequence || "The drilling operation cannot continue safely."}
              </p>
            </div>

            {showDetails && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="font-medium text-slate-700">Technical Score</h4>
                    <div className="mt-2 h-2 w-full bg-slate-200 rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          score.technical > 70 ? "bg-green-500" : score.technical > 40 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score.technical}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right font-medium">{score.technical}/100</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="font-medium text-slate-700">Safety Score</h4>
                    <div className="mt-2 h-2 w-full bg-slate-200 rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          score.safety > 70 ? "bg-green-500" : score.safety > 40 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score.safety}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right font-medium">{score.safety}/100</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="font-medium text-slate-700">Efficiency Score</h4>
                    <div className="mt-2 h-2 w-full bg-slate-200 rounded-full">
                      <div
                        className={`h-full rounded-full ${
                          score.efficiency > 70
                            ? "bg-green-500"
                            : score.efficiency > 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${score.efficiency}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right font-medium">{score.efficiency}/100</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Prevention Tips:</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-700">
                    {details.preventionTips ? (
                      details.preventionTips.map((tip: string, index: number) => <li key={index}>{tip}</li>)
                    ) : (
                      <li>Ensure proper monitoring of all drilling parameters</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3">
              <Button variant="outline" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onShowReport}>
                  <FileText className="h-4 w-4 mr-2" />
                  Failure Analysis
                </Button>
                <Button variant="outline" onClick={onLoadLastCheckpoint}>
                  <Clock className="h-4 w-4 mr-2" />
                  Load Last Safe Point
                </Button>
                <Button onClick={onRestart}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart Simulation
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
