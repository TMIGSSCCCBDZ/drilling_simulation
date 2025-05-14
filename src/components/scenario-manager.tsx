"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { AlertTriangle, BookOpen, Check, Play, Trophy } from "lucide-react"
import { useControlStore, useScenarioStore, type ScenarioConfig } from "@/lib/store"

interface ScenarioManagerProps {
  simulationEngine: any
  onLoadScenario: (scenario: string, targetDepth: number) => void
}

// Get difficulty badge color
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "bg-green-100 text-green-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "hard":
      return "bg-red-100 text-red-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export default function ScenarioManager({ simulationEngine, onLoadScenario }: ScenarioManagerProps) {
  const { scenarios, completedScenarios } = useScenarioStore()
  const { currentScenario, targetDepth, setTargetDepth } = useControlStore()
  const [selectedScenario, setSelectedScenario] = useState<string | null>(currentScenario)
  const [customTargetDepth, setCustomTargetDepth] = useState<number>(targetDepth)

  // Update custom target depth when selected scenario changes
  useEffect(() => {
    if (selectedScenario && scenarios[selectedScenario]) {
      setCustomTargetDepth(scenarios[selectedScenario].defaultTargetDepth)
    }
  }, [selectedScenario, scenarios])

  // Handle target depth change via slider
  const handleTargetDepthSlider = (value: number[]) => {
    setCustomTargetDepth(value[0])
  }

  // Handle target depth change via input
  const handleTargetDepthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value)) {
      const scenario = scenarios[selectedScenario || "normal"]
      const clampedValue = Math.min(Math.max(value, scenario.minTargetDepth), scenario.maxTargetDepth)
      setCustomTargetDepth(clampedValue)
    }
  }

  // Load selected scenario
  const loadScenario = () => {
    if (!selectedScenario) return

    // Update global target depth
    setTargetDepth(customTargetDepth)

    // Load scenario
    onLoadScenario(selectedScenario, customTargetDepth)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Training Scenarios
        </h2>
        <Button onClick={loadScenario} disabled={!selectedScenario || selectedScenario === currentScenario}>
          <Play className="h-4 w-4 mr-1" />
          Load Scenario
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(scenarios).map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            isSelected={selectedScenario === scenario.id}
            isActive={currentScenario === scenario.id}
            isCompleted={completedScenarios.includes(scenario.id)}
            targetDepth={scenario.id === selectedScenario ? customTargetDepth : scenario.defaultTargetDepth}
            onSelect={() => setSelectedScenario(scenario.id)}
            onTargetDepthChange={handleTargetDepthSlider}
            onTargetDepthInputChange={handleTargetDepthInput}
          />
        ))}
      </div>
    </div>
  )
}

interface ScenarioCardProps {
  scenario: ScenarioConfig
  isSelected: boolean
  isActive: boolean
  isCompleted: boolean
  targetDepth: number
  onSelect: () => void
  onTargetDepthChange: (value: number[]) => void
  onTargetDepthInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function ScenarioCard({
  scenario,
  isSelected,
  isActive,
  isCompleted,
  targetDepth,
  onSelect,
  onTargetDepthChange,
  onTargetDepthInputChange,
}: ScenarioCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? "border-blue-500 shadow-md" : "hover:border-blue-200"}`}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {scenario.name}
              {isActive && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Active</span>
              )}
              {isCompleted && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center">
                  <Trophy className="h-3 w-3 mr-1" />
                  Completed
                </span>
              )}
            </CardTitle>
            <CardDescription>{scenario.description}</CardDescription>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(scenario.difficulty)}`}>
            {scenario.difficulty}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="text-sm font-medium mb-2">Objectives:</h4>
        <ul className="text-sm space-y-1">
          {scenario.objectives.map((objective, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-4 w-4 mr-1 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{objective}</span>
            </li>
          ))}
        </ul>

        {isSelected && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Target Depth (ft):</label>
              <Input
                type="number"
                value={targetDepth}
                onChange={onTargetDepthInputChange}
                className="w-24 text-right"
                min={scenario.minTargetDepth}
                max={scenario.maxTargetDepth}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <Slider
              value={[targetDepth]}
              min={scenario.minTargetDepth}
              max={scenario.maxTargetDepth}
              step={100}
              onValueChange={onTargetDepthChange}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{scenario.minTargetDepth} ft</span>
              <span>{scenario.maxTargetDepth} ft</span>
            </div>
          </div>
        )}

        {scenario.id === "kick" && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-md text-sm flex items-start">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1 mt-0.5 flex-shrink-0" />
            <span>This scenario will test your well control procedures and quick decision making.</span>
          </div>
        )}

        {scenario.id === "blowout" && (
          <div className="mt-3 p-2 bg-red-50 rounded-md text-sm flex items-start">
            <AlertTriangle className="h-4 w-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
            <span>Advanced scenario: Requires thorough understanding of well control principles.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
