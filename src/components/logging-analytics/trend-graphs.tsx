"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  type ChartOptions,
} from "chart.js"
import "chartjs-adapter-date-fns"
import { Checkbox } from "@/components/ui/checkbox"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale)

interface TrendGraphsProps {
  simulationEngine: any
  isRunning: boolean
}

export default function TrendGraphs({ simulationEngine, isRunning }: TrendGraphsProps) {
  const [graphData, setGraphData] = useState<any[]>([])
  const [xAxisType, setXAxisType] = useState<"time" | "depth">("time")
  const [selectedParameters, setSelectedParameters] = useState<string[]>(["standpipePressure", "pitLevel", "rop"])
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState(0)
  const chartRef = useRef<ChartJS>(null)

  // Parameter display names and colors
  const parameterConfig: Record<string, { label: string; color: string; yAxisID?: string }> = {
    standpipePressure: { label: "Standpipe Pressure (psi)", color: "rgb(75, 192, 192)", yAxisID: "pressure" },
    pumpPressure: { label: "Pump Pressure (psi)", color: "rgb(153, 102, 255)", yAxisID: "pressure" },
    annularPressure: { label: "Annular Pressure (psi)", color: "rgb(255, 159, 64)", yAxisID: "pressure" },
    pitLevel: { label: "Pit Level (%)", color: "rgb(54, 162, 235)", yAxisID: "percent" },
    gasLevel: { label: "Gas Level (%)", color: "rgb(255, 99, 132)", yAxisID: "percent" },
    rop: { label: "ROP (ft/hr)", color: "rgb(255, 205, 86)", yAxisID: "rop" },
    mudWeight: { label: "Mud Weight (ppg)", color: "rgb(201, 203, 207)", yAxisID: "weight" },
    torque: { label: "Torque (ft-lbs)", color: "rgb(153, 102, 255)", yAxisID: "torque" },
    rpm: { label: "RPM", color: "rgb(255, 159, 64)", yAxisID: "rpm" },
    hookload: { label: "Hookload (klbs)", color: "rgb(75, 192, 192)", yAxisID: "hookload" },
    formationPressure: { label: "Formation Pressure (ppg)", color: "rgb(255, 99, 132)", yAxisID: "weight" },
  }

  // Update graph data from simulation engine
  useEffect(() => {
    let updateInterval: NodeJS.Timeout | null = null

    if (simulationEngine) {
      updateInterval = setInterval(() => {
        try {
          const logData = simulationEngine.getLogData()
          if (logData && logData.length > 0) {
            setGraphData(logData)
          }
        } catch (error) {
          console.error("Error updating trend graph data:", error)
        }
      }, 1000)
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    }
  }, [simulationEngine])

  // Apply zoom and pan to the data
  const getVisibleData = () => {
    if (graphData.length === 0) return []

    // Calculate visible window based on zoom and pan
    const totalPoints = graphData.length
    const visiblePoints = Math.max(10, Math.floor(totalPoints / zoomLevel))
    const maxOffset = Math.max(0, totalPoints - visiblePoints)
    const offset = Math.min(maxOffset, Math.floor(maxOffset * (panOffset / 100)))

    return graphData.slice(offset, offset + visiblePoints)
  }

  // Prepare chart data
  const chartData = {
    labels: getVisibleData().map((point) =>
      xAxisType === "time" ? new Date(point.time).toLocaleTimeString() : point.depth.toFixed(1),
    ),
    datasets: selectedParameters.map((param) => ({
      label: parameterConfig[param]?.label || param,
      data: getVisibleData().map((point) => point[param]),
      borderColor: parameterConfig[param]?.color || "rgb(75, 192, 192)",
      backgroundColor: parameterConfig[param]?.color.replace("rgb", "rgba").replace(")", ", 0.2)"),
      borderWidth: 2,
      pointRadius: 1,
      pointHoverRadius: 5,
      yAxisID: parameterConfig[param]?.yAxisID || "default",
      tension: 0.1,
    })),
  }

  // Chart options
  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisType === "time" ? "Time" : "Depth (ft)",
        },
      },
      pressure: {
        type: "linear",
        position: "left",
        title: {
          display: true,
          text: "Pressure (psi)",
        },
        grid: {
          display: true,
        },
      },
      percent: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "Percentage (%)",
        },
        min: 0,
        max: 100,
        grid: {
          display: false,
        },
      },
      rop: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "ROP (ft/hr)",
        },
        grid: {
          display: false,
        },
      },
      weight: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "Weight (ppg)",
        },
        grid: {
          display: false,
        },
      },
      torque: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "Torque (ft-lbs)",
        },
        grid: {
          display: false,
        },
      },
      rpm: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "RPM",
        },
        grid: {
          display: false,
        },
      },
      hookload: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text: "Hookload (klbs)",
        },
        grid: {
          display: false,
        },
      },
      default: {
        type: "linear",
        position: "left",
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      tooltip: {
        mode: "index",
        intersect: false,
      },
      legend: {
        position: "top",
      },
    },
    animation: false,
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  }

  // Export chart as image
  const exportChart = () => {
    if (!chartRef.current) return

    const url = chartRef.current.toBase64Image()
    const a = document.createElement("a")
    a.href = url
    a.download = `trend_graph_${xAxisType}_${new Date().toISOString().split("T")[0]}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Toggle parameter selection
  const toggleParameter = (param: string) => {
    setSelectedParameters((prev) => (prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]))
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Trend Graphs & Pressure Charts</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoomLevel(Math.min(10, zoomLevel + 0.5))}
              disabled={zoomLevel >= 10}
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            <Button variant="outline" size="sm" onClick={exportChart} disabled={graphData.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          <Tabs value={xAxisType} onValueChange={(value) => setXAxisType(value as "time" | "depth")}>
            <TabsList>
              <TabsTrigger value="time">vs Time</TabsTrigger>
              <TabsTrigger value="depth">vs Depth</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={panOffset}
              onChange={(e) => setPanOffset(Number.parseInt(e.target.value))}
              className="w-full"
              disabled={zoomLevel <= 1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Start</span>
              <span>
                <MoveHorizontal className="h-3 w-3 inline" /> Pan
              </span>
              <span>End</span>
            </div>
          </div>
        </div>

        <div className="border rounded-md h-[calc(100vh-350px)]">
          {graphData.length > 0 ? (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data available for plotting
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {Object.keys(parameterConfig).map((param) => (
            <div key={param} className="flex items-center space-x-2">
              <Checkbox
                id={`param-${param}`}
                checked={selectedParameters.includes(param)}
                onCheckedChange={() => toggleParameter(param)}
              />
              <label
                htmlFor={`param-${param}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                style={{ color: parameterConfig[param].color }}
              >
                {parameterConfig[param].label}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
