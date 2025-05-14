"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowDown, ArrowUp, Droplets, Gauge, Settings, Sliders } from "lucide-react"
import { useControlStore } from "@/lib/store"

interface ControlPanelProps {
  simulationEngine: any
  isRunning: boolean
  isPaused: boolean
}

export default function ControlPanel({ simulationEngine, isRunning, isPaused }: ControlPanelProps) {
  // Get BOP state from global store
  const { bopOpen, setBopOpen } = useControlStore()

  const [controls, setControls] = useState({
    rop: 50,
    pumpRate: 50,
    rotarySpeed: 60,
    mudWeight: 10,
    chokePosition: 0,
    hookPosition: 0,
    drawworks: "locked",
  })

  // Update controls to simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    try {
      simulationEngine.setControls({
        ...controls,
        bopStatus: bopOpen ? "open" : "closed", // Use global BOP state
      })
    } catch (error) {
      console.error("Error updating controls:", error)
    }
  }, [controls, simulationEngine, bopOpen])

  // Handle control changes
  const handleControlChange = (name: string, value: any) => {
    setControls((prev) => ({ ...prev, [name]: value }))
  }

  // Handle BOP control - now updates global state
  const toggleBOP = () => {
    setBopOpen(!bopOpen)
  }

  // Handle drawworks control
  const toggleDrawworks = () => {
    const newStatus = controls.drawworks === "locked" ? "unlocked" : "locked"
    handleControlChange("drawworks", newStatus)
  }

  // Move hook position
  const moveHook = (direction: "up" | "down") => {
    const newPosition =
      direction === "up" ? Math.max(controls.hookPosition - 10, 0) : Math.min(controls.hookPosition + 10, 100)

    handleControlChange("hookPosition", newPosition)
  }

  return (
    <div className="space-y-4 h-full">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Sliders className="mr-2 h-5 w-5" />
            Drilling Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="drilling" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="drilling">Drilling</TabsTrigger>
              <TabsTrigger value="fluid">Fluid</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
            </TabsList>

            <TabsContent value="drilling" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Rate of Penetration</span>
                  <span>{controls.rop} ft/hr</span>
                </div>
                <Slider
                  value={[controls.rop]}
                  min={0}
                  max={200}
                  step={1}
                  onValueChange={(value) => handleControlChange("rop", value[0])}
                  disabled={!isRunning || isPaused}
                />
              </div>

              <div className="mt-1 text-xs text-slate-500">
                <span className="font-medium">Recommended ROP:</span>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Sand: 50-100 ft/hr</li>
                  <li>Sandstone: 40-80 ft/hr</li>
                  <li>Shale: 30-60 ft/hr</li>
                  <li>Limestone: 25-50 ft/hr</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Rotary Speed</span>
                  <span>{controls.rotarySpeed} RPM</span>
                </div>
                <Slider
                  value={[controls.rotarySpeed]}
                  min={0}
                  max={200}
                  step={5}
                  onValueChange={(value) => handleControlChange("rotarySpeed", value[0])}
                  disabled={!isRunning || isPaused}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Drawworks</span>
                  <Switch
                    checked={controls.drawworks === "unlocked"}
                    onCheckedChange={toggleDrawworks}
                    disabled={!isRunning || isPaused}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveHook("up")}
                    disabled={!isRunning || isPaused || controls.drawworks === "locked"}
                  >
                    <ArrowUp className="h-4 w-4 mr-1" /> Raise
                  </Button>
                  <div className="w-1/2 h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${controls.hookPosition}%` }} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveHook("down")}
                    disabled={!isRunning || isPaused || controls.drawworks === "locked"}
                  >
                    <ArrowDown className="h-4 w-4 mr-1" /> Lower
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fluid" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Pump Rate</span>
                  <span>{controls.pumpRate} gpm</span>
                </div>
                <Slider
                  value={[controls.pumpRate]}
                  min={0}
                  max={1000}
                  step={10}
                  onValueChange={(value) => handleControlChange("pumpRate", value[0])}
                  disabled={!isRunning || isPaused}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Mud Weight</span>
                  <span>{controls.mudWeight} ppg</span>
                </div>
                <Slider
                  value={[controls.mudWeight]}
                  min={8}
                  max={18}
                  step={0.1}
                  onValueChange={(value) => handleControlChange("mudWeight", value[0])}
                  disabled={!isRunning || isPaused}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Choke Position</span>
                  <span>{controls.chokePosition}%</span>
                </div>
                <Slider
                  value={[controls.chokePosition]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleControlChange("chokePosition", value[0])}
                  disabled={!isRunning || isPaused}
                />
              </div>
            </TabsContent>

            <TabsContent value="safety" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Blowout Preventer (BOP)</span>
                  <span className={bopOpen ? "text-green-500" : "text-red-500"}>{bopOpen ? "OPEN" : "CLOSED"}</span>
                </div>
                <Button
                  variant={bopOpen ? "default" : "destructive"}
                  className="w-full"
                  onClick={toggleBOP}
                  disabled={!isRunning || isPaused}
                >
                  {bopOpen ? "Close BOP" : "Open BOP"}
                </Button>
              </div>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800">Emergency Procedures</h4>
                      <p className="text-sm text-red-700 mt-1">In case of kick detection:</p>
                      <ol className="text-sm text-red-700 list-decimal list-inside mt-1">
                        <li>Stop drilling (set ROP to 0)</li>
                        <li>Close the BOP</li>
                        <li>Increase mud weight</li>
                        <li>Monitor well pressures</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {simulationEngine && simulationEngine.getCurrentData().pitLevel < 20 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Low Pit Level Warning</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Pit level is critically low ({Math.round(simulationEngine.getCurrentData().pitLevel)}%). Possible
                    lost circulation. Reduce pump rate and check for fluid loss.
                  </p>
                </div>
              </div>
            </div>
          )}

          {simulationEngine && simulationEngine.getCurrentData().pitLevel === 0 && (
            <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 rounded-md animate-pulse">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800">CRITICAL: NO DRILLING FLUID</h4>
                  <p className="text-sm text-red-700 mt-1">
                    All drilling fluid has been lost. Drilling operations must stop immediately. Risk of wellbore
                    collapse and potential blowout.
                  </p>
                  <div className="mt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        handleControlChange("rop", 0)
                        handleControlChange("pumpRate", 0)
                        handleControlChange("rotarySpeed", 0)
                      }}
                    >
                      Emergency Stop All Operations
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-semibold mb-2 flex items-center">
              <Settings className="h-4 w-4 mr-1" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleControlChange("rop", 0)
                  handleControlChange("rotarySpeed", 0)
                }}
                disabled={!isRunning || isPaused}
              >
                Stop Drilling
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleControlChange("pumpRate", 0)
                }}
                disabled={!isRunning || isPaused}
              >
                Stop Pumps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleControlChange("mudWeight", controls.mudWeight + 0.5)
                }}
                disabled={!isRunning || isPaused}
              >
                <Droplets className="h-4 w-4 mr-1" />
                Increase MW
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleControlChange("chokePosition", 50)
                }}
                disabled={!isRunning || isPaused}
              >
                <Gauge className="h-4 w-4 mr-1" />
                Set Choke 50%
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
