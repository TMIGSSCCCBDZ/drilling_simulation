"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BarChart4, Download, FileText, Layers, List, RefreshCw } from "lucide-react"
import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"

interface LogsViewerProps {
  simulationEngine: any
  isRunning: boolean
}

export default function LogsViewer({ simulationEngine, isRunning }: LogsViewerProps) {
  const [logData, setLogData] = useState<any[]>([])
  const [eventLog, setEventLog] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("depth-logs")

  // Update log data from simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    // Initial data load
    try {
      // Get log data
      const logs = simulationEngine.getLogData()
      if (logs && logs.length > 0) {
        setLogData(logs)
      }

      // Get event log
      const events = simulationEngine.getEventLog()
      if (events && events.length > 0) {
        setEventLog(events)
      }
    } catch (error) {
      console.error("Error loading initial log data:", error)
    }

    // Set up regular updates
    const updateInterval = setInterval(() => {
      try {
        // Get log data
        const logs = simulationEngine.getLogData()
        if (logs && logs.length > 0) {
          setLogData(logs)
        }

        // Get event log
        const events = simulationEngine.getEventLog()
        if (events && events.length > 0) {
          setEventLog(events)
        }
      } catch (error) {
        console.error("Error updating log data:", error)
      }
    }, 1000) // Update more frequently

    return () => clearInterval(updateInterval)
  }, [simulationEngine])

  // Add a useEffect to handle isRunning changes
  useEffect(() => {
    if (isRunning && simulationEngine) {
      // Force an immediate update when simulation starts/stops
      try {
        const logs = simulationEngine.getLogData()
        if (logs && logs.length > 0) {
          setLogData(logs)
        }

        const events = simulationEngine.getEventLog()
        if (events && events.length > 0) {
          setEventLog(events)
        }
      } catch (error) {
        console.error("Error updating log data on simulation state change:", error)
      }
    }
  }, [isRunning, simulationEngine])

  // Export logs as CSV
  const exportLogs = () => {
    if (logData.length === 0) return

    try {
      // Convert log data to CSV
      const headers = Object.keys(logData[0]).join(",")
      const rows = logData.map((row) => Object.values(row).join(",")).join("\n")
      const csv = `${headers}\n${rows}`

      // Create download link
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `drilling_logs_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting logs:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Logs & Data Analysis
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (simulationEngine) {
                simulationEngine.refreshLogs()
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportLogs} disabled={logData.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="depth-logs">Depth Logs</TabsTrigger>
          <TabsTrigger value="time-logs">Time Logs</TabsTrigger>
          <TabsTrigger value="crossplots">Crossplots</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        <TabsContent value="depth-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layers className="mr-2 h-5 w-5" />
                Depth-Based Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ChartContainer>
                  <Chart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={logData
                          .filter((d) => d.depth !== undefined && d.depth > 0)
                          .sort((a, b) => a.depth - b.depth)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="depth" label={{ value: "Depth (ft)", position: "insideBottom", offset: -5 }} />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          label={{ value: "ROP (ft/hr)", angle: -90, position: "insideLeft" }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          label={{ value: "Pressure (psi)", angle: 90, position: "insideRight" }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="rop"
                          name="ROP"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="formationPressure"
                          name="Formation Pressure"
                          stroke="#82ca9d"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="mudWeight"
                          name="Mud Weight (ppg)"
                          stroke="#ff7300"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Chart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart4 className="mr-2 h-5 w-5" />
                Time-Based Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ChartContainer>
                  <Chart>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={logData.filter((d) => d.time !== undefined && new Date(d.time).getTime() > 0)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="time"
                          tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                          label={{ value: "Time", position: "insideBottom", offset: -5 }}
                        />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Line type="monotone" dataKey="standpipePressure" name="Standpipe Pressure" stroke="#8884d8" />
                        <Line type="monotone" dataKey="pitLevel" name="Pit Level" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="gasLevel" name="Gas Level" stroke="#ff7300" />
                        <Line type="monotone" dataKey="hookload" name="Hookload" stroke="#ff0000" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Chart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crossplots" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart4 className="mr-2 h-5 w-5" />
                Parameter Crossplots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ChartContainer>
                  <Chart>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis
                          type="number"
                          dataKey="mudWeight"
                          name="Mud Weight"
                          unit="ppg"
                          label={{ value: "Mud Weight (ppg)", position: "insideBottom", offset: -5 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="standpipePressure"
                          name="Standpipe Pressure"
                          unit="psi"
                          label={{ value: "Standpipe Pressure (psi)", angle: -90, position: "insideLeft" }}
                        />
                        <ZAxis type="number" dataKey="depth" range={[20, 200]} name="Depth" unit="ft" />
                        <ChartTooltip content={<ChartTooltipContent />} cursor={{ strokeDasharray: "3 3" }} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Scatter
                          name="Drilling Parameters"
                          data={logData.filter((d) => d.mudWeight && d.standpipePressure && d.depth)}
                          fill="#8884d8"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Chart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <List className="mr-2 h-5 w-5" />
                Event Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Event Type</th>
                      <th className="p-2 text-left">Depth (ft)</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-left">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventLog.length > 0 ? (
                      eventLog.map((event, index) => (
                        <tr
                          key={index}
                          className={
                            event.severity === "critical"
                              ? "bg-red-50"
                              : event.severity === "warning"
                                ? "bg-yellow-50"
                                : "bg-white"
                          }
                        >
                          <td className="p-2 border-t border-slate-200">{new Date(event.time).toLocaleString()}</td>
                          <td className="p-2 border-t border-slate-200 font-medium">{event.type}</td>
                          <td className="p-2 border-t border-slate-200">{event.depth}</td>
                          <td className="p-2 border-t border-slate-200">{event.description}</td>
                          <td className="p-2 border-t border-slate-200">
                            <span
                              className={
                                event.severity === "critical"
                                  ? "text-red-500 font-bold"
                                  : event.severity === "warning"
                                    ? "text-yellow-600 font-medium"
                                    : "text-green-600"
                              }
                            >
                              {event.severity}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          No events recorded yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
