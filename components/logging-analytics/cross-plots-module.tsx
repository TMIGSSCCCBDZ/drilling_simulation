"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Scatter } from "react-chartjs-2"
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend, type ChartOptions } from "chart.js"

// Register ChartJS components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

interface CrossPlotsModuleProps {
  simulationEngine: any
  isRunning: boolean
}

export default function CrossPlotsModule({ simulationEngine, isRunning }: CrossPlotsModuleProps) {
  const [plotData, setPlotData] = useState<any[]>([])
  const [xParameter, setXParameter] = useState("depth")
  const [yParameter, setYParameter] = useState("rop")
  const [colorParameter, setColorParameter] = useState("none")
  const [availableParameters, setAvailableParameters] = useState<string[]>([])
  const chartRef = useRef<ChartJS>(null)

  // Parameter display names mapping
  const parameterLabels: Record<string, string> = {
    depth: "Depth (ft)",
    rop: "Rate of Penetration (ft/hr)",
    pumpPressure: "Pump Pressure (psi)",
    standpipePressure: "Standpipe Pressure (psi)",
    pitLevel: "Pit Level (%)",
    gasLevel: "Gas Level (%)",
    mudWeight: "Mud Weight (ppg)",
    formationPressure: "Formation Pressure (ppg)",
    annularPressure: "Annular Pressure (psi)",
    torque: "Torque (ft-lbs)",
    rpm: "RPM",
    hookload: "Hookload (klbs)",
    chokePosition: "Choke Position (%)",
  }

  // Update plot data from simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    const updateInterval = setInterval(() => {
      try {
        const logData = simulationEngine.getLogData()
        if (logData && logData.length > 0) {
          setPlotData(logData)

          // Get available parameters from the first log entry
          if (availableParameters.length === 0 && logData.length > 0) {
            const params = Object.keys(logData[0]).filter(
              (key) => typeof logData[0][key] === "number" && key !== "time",
            )
            setAvailableParameters(params)
          }
        }
      } catch (error) {
        console.error("Error updating cross plot data:", error)
      }
    }, 1000)

    return () => clearInterval(updateInterval)
  }, [simulationEngine, availableParameters])

  // Prepare chart data
  const chartData = {
    datasets: [
      {
        label: `${parameterLabels[yParameter] || yParameter} vs ${parameterLabels[xParameter] || xParameter}`,
        data: plotData.map((point) => ({
          x: point[xParameter],
          y: point[yParameter],
        })),
        backgroundColor:
          colorParameter === "none"
            ? "rgba(75, 192, 192, 0.6)"
            : plotData.map((point) => {
                // Color based on the selected parameter
                const value = point[colorParameter]
                const max = Math.max(...plotData.map((p) => p[colorParameter]))
                const min = Math.min(...plotData.map((p) => p[colorParameter]))
                const normalized = (value - min) / (max - min) // 0 to 1

                // Generate color from blue to red
                const r = Math.floor(normalized * 255)
                const b = Math.floor((1 - normalized) * 255)
                return `rgba(${r}, 100, ${b}, 0.6)`
              }),
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  }

  // Chart options
  const chartOptions: ChartOptions<"scatter"> = {
    scales: {
      x: {
        title: {
          display: true,
          text: parameterLabels[xParameter] || xParameter,
        },
      },
      y: {
        title: {
          display: true,
          text: parameterLabels[yParameter] || yParameter,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = plotData[context.dataIndex]
            let label = `${parameterLabels[xParameter] || xParameter}: ${point[xParameter].toFixed(2)}, ${parameterLabels[yParameter] || yParameter}: ${point[yParameter].toFixed(2)}`

            if (colorParameter !== "none") {
              label += `, ${parameterLabels[colorParameter] || colorParameter}: ${point[colorParameter].toFixed(2)}`
            }

            return label
          },
        },
      },
      legend: {
        display: true,
      },
    },
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
  }

  // Export chart as image
  const exportChart = () => {
    if (!chartRef.current) return

    const url = chartRef.current.toBase64Image()
    const a = document.createElement("a")
    a.href = url
    a.download = `crossplot_${xParameter}_vs_${yParameter}_${new Date().toISOString().split("T")[0]}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Cross-Plots Analysis</CardTitle>
          <Button variant="outline" size="sm" onClick={exportChart} disabled={plotData.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export Image
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">X-Axis Parameter</label>
            <Select value={xParameter} onValueChange={setXParameter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                {availableParameters.map((param) => (
                  <SelectItem key={param} value={param}>
                    {parameterLabels[param] || param}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Y-Axis Parameter</label>
            <Select value={yParameter} onValueChange={setYParameter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                {availableParameters.map((param) => (
                  <SelectItem key={param} value={param}>
                    {parameterLabels[param] || param}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Color By Parameter</label>
            <Select value={colorParameter} onValueChange={setColorParameter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Color Coding</SelectItem>
                {availableParameters.map((param) => (
                  <SelectItem key={param} value={param}>
                    {parameterLabels[param] || param}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset to default parameters
                setXParameter("depth")
                setYParameter("rop")
                setColorParameter("none")
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        <div className="border rounded-md h-[calc(100vh-350px)]">
          {plotData.length > 0 ? (
            <Scatter ref={chartRef} data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data available for plotting
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          {plotData.length > 0 && <span>Showing {plotData.length} data points</span>}
        </div>
      </CardContent>
    </Card>
  )
}
