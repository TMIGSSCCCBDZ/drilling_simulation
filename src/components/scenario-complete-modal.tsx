"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ChevronRight, RotateCcw, Trophy } from "lucide-react"
import { useScenarioStore, useControlStore } from "@/lib/store"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface ScenarioCompleteModalProps {
  targetDepth: number
  onRestart: () => void
  onNextScenario: (scenarioId: string) => void
  onClose: () => void
  performanceMetrics: {
    rop: { avg: number; min: number; max: number }
    mudWeight: { avg: number; min: number; max: number }
    kicksHandled: number
    bopActivations: number
    timeElapsed: number
  }
}

export default function ScenarioCompleteModal({
  targetDepth,
  onRestart,
  onNextScenario,
  onClose,
  performanceMetrics,
}: ScenarioCompleteModalProps) {
  const { scenarios, addCompletedScenario } = useScenarioStore()
  const { currentScenario } = useControlStore()

  const currentScenarioConfig = scenarios[currentScenario]
  const nextScenarioId = currentScenarioConfig?.nextScenario
  const nextScenario = nextScenarioId ? scenarios[nextScenarioId] : null

  // Trigger confetti effect when modal opens
  useEffect(() => {
    // Mark scenario as completed
    addCompletedScenario(currentScenario)

    // Trigger confetti
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.1, 0.3) },
      })

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.1, 0.3) },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [addCompletedScenario, currentScenario])

  // Format time elapsed
  const formatTimeElapsed = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <Card className="w-full max-w-lg mx-4 shadow-lg animate-in fade-in duration-300">
        <CardHeader className="bg-green-50 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
              <CardTitle className="text-2xl text-green-700">Scenario Complete!</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="bg-green-100 rounded-full p-6">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold">Congratulations!</h3>
              <p className="text-slate-700 mt-1">You've successfully drilled to {targetDepth.toFixed(0)} ft.</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Objectives Met:</h3>
              <ul className="space-y-1">
                {currentScenarioConfig.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-md">
              <h3 className="text-md font-semibold">Performance Metrics:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Avg. ROP:</span> {performanceMetrics.rop.avg.toFixed(1)} ft/hr
                </div>
                <div>
                  <span className="font-medium">Avg. Mud Weight:</span> {performanceMetrics.mudWeight.avg.toFixed(1)}{" "}
                  ppg
                </div>
                <div>
                  <span className="font-medium">Kicks Handled:</span> {performanceMetrics.kicksHandled}
                </div>
                <div>
                  <span className="font-medium">BOP Activations:</span> {performanceMetrics.bopActivations}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Time Elapsed:</span> {formatTimeElapsed(performanceMetrics.timeElapsed)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4 bg-slate-50">
          <Button variant="outline" onClick={onRestart}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart Scenario
          </Button>

          {nextScenario ? (
            <Button onClick={() => onNextScenario(nextScenarioId)}>
              Next Scenario: {nextScenario.name}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onClose}>Return to Simulator</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
