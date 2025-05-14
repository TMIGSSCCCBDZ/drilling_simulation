"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Gauge, Settings } from "lucide-react"
import { SimulationEngine } from "@/lib/simulation-engine"
import { FormationModel } from "@/lib/formation-model"
import RigVisualization from "@/components/rig-visualization"
import ParameterMonitor from "@/components/parameter-monitor"
import ControlPanel from "@/components/control-panel"
import LoggingAnalytics from "@/components/logging-analytics"
import FormationEditor from "@/components/formation-editor"
import ScenarioManager from "@/components/scenario-manager"
import GameOverScreen from "@/components/game-over-screen"
import FailureAnalysisReport from "@/components/failure-analysis-report"
import EventTimeline from "@/components/event-timeline"
import CheckpointSystem from "@/components/checkpoint-system"
import EnhancedRiskBar from "@/components/enhanced-risk-bar"
import HintSystem from "@/components/hint-system"
import ScenarioCompleteModal from "@/components/scenario-complete-modal"
import { useControlStore, useScenarioStore } from "@/lib/store"

export default function DrillingSim() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [activeTab, setActiveTab] = useState("simulation")
  const [isTrainingMode, setIsTrainingMode] = useState(true)
  const [wellType, setWellType] = useState("vertical")
  const [alerts, setAlerts] = useState<{ type: string; message: string }[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [simulationSpeed, setSimulationSpeed] = useState(1)
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameOverReason, setGameOverReason] = useState("")
  const [gameOverDetails, setGameOverDetails] = useState<any>({})
  const [showFailureReport, setShowFailureReport] = useState(false)
  const [showTroubleshootingModal, setShowTroubleshootingModal] = useState(false)
  const [currentRiskType, setCurrentRiskType] = useState<string | null>(null)
  const [showScenarioCompleteModal, setShowScenarioCompleteModal] = useState(false)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    rop: { avg: 0, min: 0, max: 0 },
    mudWeight: { avg: 0, min: 0, max: 0 },
    kicksHandled: 0,
    bopActivations: 0,
    timeElapsed: 0,
  })

  // Get state from global stores
  const {
    targetDepth,
    setTargetDepth,
    currentScenario,
    setCurrentScenario,
    scenarioActive,
    setScenarioActive,
    setBopOpen,
  } = useControlStore()

  const { scenarios } = useScenarioStore()

  const simulationRef = useRef<any>(null)
  const formationRef = useRef<any>(null)
  const depthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const metricsDataRef = useRef<any[]>([])

  // Function to add alerts
  const addAlert = (type: string, message: string) => {
    setAlerts((prevAlerts) => [...prevAlerts, { type, message }])
  }

  // Initialize simulation engine and formation model
  useEffect(() => {
    if (!isInitialized) {
      simulationRef.current = new SimulationEngine()
      formationRef.current = new FormationModel()

      // Set up default formation layers
      formationRef.current.addLayer({
        name: "Topsoil",
        depth: 0,
        thickness: 500,
        porePressure: 8.5,
        fracturePressure: 12.0,
        permeability: 0.01,
        lithology: "sand",
        kickRisk: 0.05,
      })

      formationRef.current.addLayer({
        name: "Shale",
        depth: 500,
        thickness: 1000,
        porePressure: 9.2,
        fracturePressure: 14.5,
        permeability: 0.001,
        lithology: "shale",
        kickRisk: 0.1,
      })

      formationRef.current.addLayer({
        name: "Reservoir",
        depth: 1500,
        thickness: 800,
        porePressure: 11.0,
        fracturePressure: 15.0,
        permeability: 0.5,
        lithology: "sandstone",
        kickRisk: 0.25,
      })

      formationRef.current.addLayer({
        name: "Overpressured Zone",
        depth: 2300,
        thickness: 500,
        porePressure: 14.0,
        fracturePressure: 16.5,
        permeability: 0.05,
        lithology: "limestone",
        kickRisk: 0.4,
      })

      // Initialize simulation with formation data
      simulationRef.current.setFormation(formationRef.current)
      simulationRef.current.setWellType(wellType)
      simulationRef.current.setTrainingMode(isTrainingMode)

      // Initialize BOP to open
      setBopOpen(true)

      setIsInitialized(true)
    }
  }, [isInitialized, wellType, isTrainingMode, setBopOpen])

  // Add a new useEffect to handle tab changes without resetting simulation
  useEffect(() => {
    // This ensures the simulation state is preserved when switching tabs
    if (isInitialized && simulationRef.current) {
      // Update any UI-specific state that needs to be refreshed when switching tabs
      if (activeTab === "parameters" || activeTab === "logs") {
        // Force a refresh of the data without resetting the simulation
        simulationRef.current.refreshData()
      }
    }
  }, [activeTab, isInitialized])

  // Check for game over state
  useEffect(() => {
    if (!simulationRef.current || !isInitialized) return

    const checkGameOverInterval = setInterval(() => {
      try {
        const gameOver = simulationRef.current.isGameOver()
        if (gameOver && !isGameOver) {
          setIsGameOver(true)
          setGameOverReason(simulationRef.current.getGameOverReason())
          setGameOverDetails(simulationRef.current.getGameOverDetails())
          stopSimulation()

          // Clear depth check interval if it exists
          if (depthCheckIntervalRef.current) {
            clearInterval(depthCheckIntervalRef.current)
            depthCheckIntervalRef.current = null
          }
        }
      } catch (error) {
        console.error("Error checking game over state:", error)
      }
    }, 500)

    return () => clearInterval(checkGameOverInterval)
  }, [simulationRef, isInitialized, isGameOver])

  // Check for target depth reached
  useEffect(() => {
    if (!simulationRef.current || !isInitialized || !scenarioActive || !isRunning) return

    // Clear any existing interval
    if (depthCheckIntervalRef.current) {
      clearInterval(depthCheckIntervalRef.current)
    }

    // Set up new interval to check depth
    depthCheckIntervalRef.current = setInterval(() => {
      try {
        const currentData = simulationRef.current.getCurrentData()
        const currentDepth = currentData.bitDepth

        // Collect metrics data for performance calculation
        metricsDataRef.current.push({
          time: Date.now(),
          rop: currentData.rop,
          mudWeight: currentData.mudWeight,
          bopStatus: currentData.bopStatus,
          gasLevel: currentData.gasLevel,
        })

        // Check if target depth reached
        if (currentDepth >= targetDepth) {
          // Pause simulation
          pauseSimulation()

          // Calculate performance metrics
          const metrics = calculatePerformanceMetrics()
          setPerformanceMetrics(metrics)

          // Show completion modal
          setShowScenarioCompleteModal(true)

          // Clear interval
          clearInterval(depthCheckIntervalRef.current!)
          depthCheckIntervalRef.current = null

          // Set scenario as inactive
          setScenarioActive(false)
        }

        // Check if over-drilling (10% past target)
        if (currentDepth > targetDepth * 1.1) {
          addAlert(
            "warning",
            `You're drilling past the target depth of ${targetDepth.toFixed(0)} ft. Consider stopping.`,
          )
        }
      } catch (error) {
        console.error("Error checking target depth:", error)
      }
    }, 1000)

    return () => {
      if (depthCheckIntervalRef.current) {
        clearInterval(depthCheckIntervalRef.current)
      }
    }
  }, [simulationRef, isInitialized, targetDepth, scenarioActive, isRunning, setScenarioActive])

  // Calculate performance metrics from collected data
  const calculatePerformanceMetrics = () => {
    const data = metricsDataRef.current

    if (data.length === 0) {
      return {
        rop: { avg: 0, min: 0, max: 0 },
        mudWeight: { avg: 0, min: 0, max: 0 },
        kicksHandled: 0,
        bopActivations: 0,
        timeElapsed: 0,
      }
    }

    // Calculate ROP stats
    const rops = data.map((d) => d.rop).filter((v) => v > 0)
    const ropAvg = rops.reduce((sum, val) => sum + val, 0) / (rops.length || 1)
    const ropMin = Math.min(...(rops.length ? rops : [0]))
    const ropMax = Math.max(...(rops.length ? rops : [0]))

    // Calculate mud weight stats
    const mudWeights = data.map((d) => d.mudWeight)
    const mudWeightAvg = mudWeights.reduce((sum, val) => sum + val, 0) / (mudWeights.length || 1)
    const mudWeightMin = Math.min(...(mudWeights.length ? mudWeights : [0]))
    const mudWeightMax = Math.max(...(mudWeights.length ? mudWeights : [0]))

    // Count BOP activations (transitions from open to closed)
    let bopActivations = 0
    for (let i = 1; i < data.length; i++) {
      if (data[i - 1].bopStatus === "open" && data[i].bopStatus === "closed") {
        bopActivations++
      }
    }

    // Count kicks handled (gas level spikes that were subsequently reduced)
    let kicksHandled = 0
    for (let i = 2; i < data.length; i++) {
      if (data[i - 2].gasLevel < 3 && data[i - 1].gasLevel >= 3 && data[i].gasLevel < data[i - 1].gasLevel) {
        kicksHandled++
      }
    }

    // Calculate time elapsed
    const timeElapsed = (data[data.length - 1].time - data[0].time) / 1000

    return {
      rop: { avg: ropAvg, min: ropMin, max: ropMax },
      mudWeight: { avg: mudWeightAvg, min: mudWeightMin, max: mudWeightMax },
      kicksHandled,
      bopActivations,
      timeElapsed,
    }
  }

  // Handle simulation start/stop
  const toggleSimulation = () => {
    if (!isRunning) {
      startSimulation()
    } else {
      if (isPaused) {
        resumeSimulation()
      } else {
        pauseSimulation()
      }
    }
  }

  // Handle "Take Action" button click
  const handleTakeAction = () => {
    if (simulationRef.current) {
      const { type } = simulationRef.current.getRiskLevel()
      setCurrentRiskType(type)
      setShowTroubleshootingModal(true)
    }
  }

  // Handle loading checkpoints
  const handleLoadCheckpoint = (checkpointId: string) => {
    if (simulationRef.current) {
      const success = simulationRef.current.loadCheckpoint(checkpointId)
      if (success) {
        addAlert("info", "Checkpoint loaded successfully")
        setIsGameOver(false)
        setGameOverReason("")
        setGameOverDetails({})
        setShowFailureReport(false)

        // Start simulation if it's not running
        if (!isRunning) {
          startSimulation()
        }
      } else {
        addAlert("error", "Failed to load checkpoint")
      }
    }
  }

  const startSimulation = () => {
    setIsRunning(true)
    setIsPaused(false)
    simulationRef.current.start()
    addAlert("info", "Simulation started")

    // Reset metrics data collection
    metricsDataRef.current = []
  }

  const pauseSimulation = () => {
    setIsPaused(true)
    simulationRef.current.pause()
    addAlert("info", "Simulation paused")
  }

  const resumeSimulation = () => {
    setIsPaused(false)
    simulationRef.current.resume()
    addAlert("info", "Simulation resumed")
  }

  const stopSimulation = () => {
    setIsRunning(false)
    setIsPaused(false)
    simulationRef.current.stop()
    addAlert("info", "Simulation stopped")

    // Clear depth check interval if it exists
    if (depthCheckIntervalRef.current) {
      clearInterval(depthCheckIntervalRef.current)
      depthCheckIntervalRef.current = null
    }

    // Set scenario as inactive
    setScenarioActive(false)
  }

  const resetSimulation = () => {
    stopSimulation()
    simulationRef.current.reset()
    addAlert("info", "Simulation reset")

    // Reset metrics data collection
    metricsDataRef.current = []
  }

  const changeSimulationSpeed = (value: number[]) => {
    const speed = value[0]
    setSimulationSpeed(speed)
    simulationRef.current.setSpeed(speed)
  }

  const toggleTrainingMode = () => {
    const newMode = !isTrainingMode
    setIsTrainingMode(newMode)
    simulationRef.current.setTrainingMode(newMode)
    addAlert("info", `Switched to ${newMode ? "Training" : "Realistic"} Mode`)
  }

  const changeWellType = (type: string) => {
    setWellType(type)
    simulationRef.current.setWellType(type)
    addAlert("info", `Well type changed to ${type}`)
  }

  const loadScenario = (scenario: string, scenarioTargetDepth: number) => {
    setCurrentScenario(scenario)
    setTargetDepth(scenarioTargetDepth)
    simulationRef.current.loadScenario(scenario)
    addAlert("info", `Loaded scenario: ${scenario} with target depth ${scenarioTargetDepth} ft`)

    // Set scenario as active
    setScenarioActive(true)

    // Reset metrics data collection
    metricsDataRef.current = []
  }

  const restartSimulation = () => {
    resetSimulation()
    setIsGameOver(false)
    setGameOverReason("")
    setGameOverDetails({})
    setShowFailureReport(false)
    setShowScenarioCompleteModal(false)
  }

  const showReport = () => {
    setShowFailureReport(true)
  }

  const hideReport = () => {
    setShowFailureReport(false)
  }

  const handleNextScenario = (nextScenarioId: string) => {
    // Close the completion modal
    setShowScenarioCompleteModal(false)

    // Reset the simulation
    resetSimulation()

    // Get the next scenario's target depth
    const nextScenarioConfig = scenarios[nextScenarioId]

    // Load the next scenario
    loadScenario(nextScenarioId, nextScenarioConfig.defaultTargetDepth)

    // Start the simulation
    startSimulation()
  }

  return (
    <div className="flex flex-col gap-4">
      {isGameOver && !showFailureReport && (
        <GameOverScreen
          reason={gameOverReason}
          details={gameOverDetails}
          onRestart={restartSimulation}
          onShowReport={showReport}
          onLoadLastCheckpoint={() => {
            const checkpoints = simulationRef.current?.getCheckpoints() || []
            const lastCheckpoint = checkpoints.find((cp) => cp.automatic) || checkpoints[checkpoints.length - 1]
            if (lastCheckpoint) {
              handleLoadCheckpoint(lastCheckpoint.id)
            }
          }}
        />
      )}

      {showFailureReport && (
        <FailureAnalysisReport details={gameOverDetails} onBack={hideReport} onRestart={restartSimulation} />
      )}

      {showScenarioCompleteModal && (
        <ScenarioCompleteModal
          targetDepth={targetDepth}
          onRestart={restartSimulation}
          onNextScenario={handleNextScenario}
          onClose={() => setShowScenarioCompleteModal(false)}
          performanceMetrics={performanceMetrics}
        />
      )}

      <div
        className={`flex flex-col md:flex-row gap-4 justify-between items-start ${
          isGameOver || showScenarioCompleteModal ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="w-full md:w-3/4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="simulation">Simulation</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
              <TabsTrigger value="logs">Logs & Graphs</TabsTrigger>
              <TabsTrigger value="formation">Formation</TabsTrigger>
              <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
            </TabsList>

            <div className="mb-4">
              <EnhancedRiskBar simulationEngine={simulationRef.current} isRunning={isRunning} />
            </div>

            <TabsContent value="simulation" className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="w-full lg:w-2/3 h-[60vh] bg-slate-800 rounded-lg overflow-hidden relative">
                  <RigVisualization
                    simulationEngine={simulationRef.current}
                    isRunning={isRunning}
                    isGameOver={isGameOver}
                    gameOverReason={gameOverReason}
                  />

                  {scenarioActive && (
                    <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Target Depth: {targetDepth.toFixed(0)} ft
                    </div>
                  )}
                </div>
                <div className="w-full lg:w-1/3">
                  <ControlPanel simulationEngine={simulationRef.current} isRunning={isRunning} isPaused={isPaused} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="parameters">
              <ParameterMonitor simulationEngine={simulationRef.current} isRunning={isRunning} />
            </TabsContent>

            <TabsContent value="logs">
              <LoggingAnalytics simulationEngine={simulationRef.current} isRunning={isRunning} />
            </TabsContent>

            <TabsContent value="formation">
              <FormationEditor formationModel={formationRef.current} simulationEngine={simulationRef.current} />
            </TabsContent>

            <TabsContent value="scenarios">
              <ScenarioManager simulationEngine={simulationRef.current} onLoadScenario={loadScenario} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full md:w-1/4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Simulation Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Training Mode</span>
                <Switch checked={isTrainingMode} onCheckedChange={toggleTrainingMode} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Simulation Speed</span>
                  <span>{simulationSpeed}x</span>
                </div>
                <Slider value={[simulationSpeed]} min={0.5} max={5} step={0.5} onValueChange={changeSimulationSpeed} />
              </div>

              <div className="space-y-2">
                <span>Well Type</span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={wellType === "vertical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeWellType("vertical")}
                  >
                    Vertical
                  </Button>
                  <Button
                    variant={wellType === "deviated" ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeWellType("deviated")}
                  >
                    Deviated
                  </Button>
                  <Button
                    variant={wellType === "horizontal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => changeWellType("horizontal")}
                  >
                    Horizontal
                  </Button>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <Button
                  variant={isRunning ? (isPaused ? "default" : "secondary") : "default"}
                  onClick={toggleSimulation}
                >
                  {!isRunning ? "Start" : isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="destructive" onClick={stopSimulation} disabled={!isRunning}>
                  Stop
                </Button>
                <Button variant="outline" onClick={resetSimulation} className="col-span-2">
                  Reset Simulation
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <CheckpointSystem
              simulationEngine={simulationRef.current}
              isRunning={isRunning}
              onLoadCheckpoint={handleLoadCheckpoint}
            />

            <EventTimeline simulationEngine={simulationRef.current} isRunning={isRunning} />
          </div>

          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Alert key={index} variant={alert.type === "error" ? "destructive" : "default"}>
                {alert.type === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : alert.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Gauge className="h-4 w-4" />
                )}
                <AlertTitle>
                  {alert.type === "error" ? "Error" : alert.type === "warning" ? "Warning" : "Info"}
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      </div>

      <HintSystem simulationEngine={simulationRef.current} isRunning={isRunning} />
    </div>
  )
}
