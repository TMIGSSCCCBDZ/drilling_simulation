"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowDown,
  ArrowUp,
  BarChart4,
  Droplets,
  Gauge,
  GitBranch,
  Layers,
  Thermometer,
  AlertCircle,
} from "lucide-react"
import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"

interface ParameterMonitorProps {
  simulationEngine: any
  isRunning: boolean
}

export default function ParameterMonitor({ simulationEngine, isRunning }: ParameterMonitorProps) {
  const [parameters, setParameters] = useState({
    rop: 0,
    pumpPressure: 0,
    pitLevel: 0,
    standpipePressure: 0,
    gasLevel: 0,
    bitDepth: 0,
    hookload: 0,
    mudWeight: 0,
    mudTemperature: 0,
    formationPressure: 0,
    annularPressure: 0,
    torque: 0,
    rpm: 0,
  })

  const [historicalData, setHistoricalData] = useState<any[]>([])

  // Update parameters from simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    // Initial data load
    try {
      const data = simulationEngine.getCurrentData()
      if (data) {
        setParameters((prev) => ({
          ...prev,
          rop: data.rop || prev.rop,
          pumpPressure: data.pumpPressure || prev.pumpPressure,
          pitLevel: data.pitLevel || prev.pitLevel,
          standpipePressure: data.standpipePressure || prev.standpipePressure,
          gasLevel: data.gasLevel || prev.gasLevel,
          bitDepth: data.bitDepth || prev.bitDepth,
          hookload: data.hookload || prev.hookload,
          mudWeight: data.mudWeight || prev.mudWeight,
          mudTemperature: data.mudTemperature || prev.mudTemperature,
          formationPressure: data.formationPressure || prev.formationPressure,
          annularPressure: data.annularPressure || prev.annularPressure,
          torque: data.torque || prev.torque,
          rpm: data.rpm || prev.rpm,
        }))

        // Add to historical data
        setHistoricalData((prev) => {
          const newData = [...prev, { ...data, time: new Date().toISOString() }]
          // Keep only the last 100 data points
          return newData.slice(-100)
        })
      }
    } catch (error) {
      console.error("Error loading initial parameter data:", error)
    }

    // Only set up the interval if the simulation is running
    if (!isRunning) return

    const updateInterval = setInterval(() => {
      try {
        const data = simulationEngine.getCurrentData()
        if (data) {
          setParameters((prev) => ({
            ...prev,
            rop: data.rop || prev.rop,
            pumpPressure: data.pumpPressure || prev.pumpPressure,
            pitLevel: data.pitLevel || prev.pitLevel,
            standpipePressure: data.standpipePressure || prev.standpipePressure,
            gasLevel: data.gasLevel || prev.gasLevel,
            bitDepth: data.bitDepth || prev.bitDepth,
            hookload: data.hookload || prev.hookload,
            mudWeight: data.mudWeight || prev.mudWeight,
            mudTemperature: data.mudTemperature || prev.mudTemperature,
            formationPressure: data.formationPressure || prev.formationPressure,
            annularPressure: data.annularPressure || prev.annularPressure,
            torque: data.torque || prev.torque,
            rpm: data.rpm || prev.rpm,
          }))

          // Add to historical data
          setHistoricalData((prev) => {
            const newData = [...prev, { ...data, time: new Date().toISOString() }]
            // Keep only the last 100 data points
            return newData.slice(-100)
          })
        }
      } catch (error) {
        console.error("Error updating parameters:", error)
      }
    }, 500) // Update more frequently

    return () => clearInterval(updateInterval)
  }, [simulationEngine, isRunning])

  // Format value with units
  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(2)} ${unit}`
  }

  // Parameter card component
  const ParameterCard = ({
    title,
    value,
    unit,
    icon: Icon,
    trend = 0,
    min = 0,
    max = 100,
    critical = false,
  }: {
    title: string
    value: number
    unit: string
    icon: any
    trend?: number
    min?: number
    max?: number
    critical?: boolean
  }) => {
    // Calculate percentage for gauge
    const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100)

    return (
      <Card className={critical ? "border-red-500" : ""}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center">
              <Icon className="mr-2 h-4 w-4" />
              {title}
            </span>
            {trend !== 0 && (
              <span className={trend > 0 ? "text-green-500" : "text-red-500"}>
                {trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value, unit)}</div>
          <div className="mt-2 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                percentage > 80 ? "bg-red-500" : percentage > 60 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ParameterCard
          title="Rate of Penetration"
          value={parameters.rop}
          unit="ft/hr"
          icon={ArrowDown}
          max={200}
          trend={1}
        />
        <ParameterCard title="Pump Pressure" value={parameters.pumpPressure} unit="psi" icon={Gauge} max={5000} />
        <ParameterCard
          title="Pit Level"
          value={parameters.pitLevel}
          unit="%"
          icon={Droplets}
          critical={parameters.pitLevel > 90}
        />
        <ParameterCard
          title="Standpipe Pressure"
          value={parameters.standpipePressure}
          unit="psi"
          icon={Gauge}
          max={3000}
        />
        <ParameterCard
          title="Gas Level"
          value={parameters.gasLevel}
          unit="%"
          icon={Thermometer}
          critical={parameters.gasLevel > 5}
        />
        <ParameterCard title="Bit Depth" value={parameters.bitDepth} unit="ft" icon={Layers} max={10000} />
        <ParameterCard title="Hookload" value={parameters.hookload} unit="klbs" icon={GitBranch} max={500} />
        <ParameterCard title="Mud Weight" value={parameters.mudWeight} unit="ppg" icon={Droplets} min={8} max={18} />
      </div>

      {parameters.pitLevel === 0 && (
        <div className="col-span-full mt-2">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="font-bold">CRITICAL ALERT: No Drilling Fluid</p>
                <p className="text-sm">
                  Pit level is at 0%. All drilling fluid has been lost. Drilling operations must stop immediately to
                  prevent wellbore collapse and potential blowout.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart4 className="mr-2 h-5 w-5" />
              Pressure Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer>
                <Chart>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        type="monotone"
                        dataKey="standpipePressure"
                        name="Standpipe Pressure"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line type="monotone" dataKey="pumpPressure" name="Pump Pressure" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="annularPressure" name="Annular Pressure" stroke="#ff7300" />
                      <Line
                        type="monotone"
                        dataKey="formationPressure"
                        name="Formation Pressure"
                        stroke="#ff0000"
                        strokeDasharray="5 5"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Chart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart4 className="mr-2 h-5 w-5" />
              Drilling Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer>
                <Chart>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area type="monotone" dataKey="rop" name="ROP" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area
                        type="monotone"
                        dataKey="torque"
                        name="Torque"
                        stackId="2"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                      />
                      <Area type="monotone" dataKey="rpm" name="RPM" stackId="3" stroke="#ffc658" fill="#ffc658" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Chart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layers className="mr-2 h-5 w-5" />
            Formation-Specific Guidance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-medium">Recommended ROP by Formation Type:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-200 mr-2"></div>
                <span>Sand: 50-100 ft/hr</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-300 mr-2"></div>
                <span>Sandstone: 40-80 ft/hr</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                <span>Shale: 30-60 ft/hr</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-200 mr-2"></div>
                <span>Limestone: 25-50 ft/hr</span>
              </div>
            </div>
            <p className="text-sm text-red-600 mt-2">
              Warning: Exceeding recommended ROP can lead to wellbore instability, kicks, and lost circulation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
