"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Download, Filter, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DepthLogsPanelProps {
  simulationEngine: any
  isRunning: boolean
}

interface LogEntry {
  depth: number
  timestamp: string
  eventType: string
  parameters: Record<string, any>
}

export default function DepthLogsPanel({ simulationEngine, isRunning }: DepthLogsPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string | null>(null)

  // Update logs from simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    const updateInterval = setInterval(() => {
      try {
        const logData = simulationEngine.getDepthLogs()
        if (logData && logData.length > 0) {
          setLogs(logData)
        }
      } catch (error) {
        console.error("Error updating depth logs:", error)
      }
    }, 1000)

    return () => clearInterval(updateInterval)
  }, [simulationEngine])

  // Filter logs based on search term and filter type
  useEffect(() => {
    let filtered = [...logs]

    // Apply event type filter
    if (filterType) {
      filtered = filtered.filter((log) => log.eventType === filterType)
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.eventType.toLowerCase().includes(term) ||
          log.depth.toString().includes(term) ||
          Object.values(log.parameters).some((value) => value.toString().toLowerCase().includes(term)),
      )
    }

    // Sort by depth (ascending)
    filtered.sort((a, b) => a.depth - b.depth)

    setFilteredLogs(filtered)
  }, [logs, searchTerm, filterType])

  // Get unique event types for filtering
  const eventTypes = Array.from(new Set(logs.map((log) => log.eventType)))

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch (e) {
      return timestamp
    }
  }

  // Format parameters as string
  const formatParameters = (parameters: Record<string, any>) => {
    return Object.entries(parameters)
      .map(([key, value]) => {
        // Format numeric values to 2 decimal places
        const formattedValue = typeof value === "number" ? value.toFixed(2) : value
        return `${key}: ${formattedValue}`
      })
      .join(", ")
  }

  // Export logs as CSV
  const exportLogs = () => {
    if (logs.length === 0) return

    try {
      // Create CSV header
      const headers = ["Depth (ft)", "Timestamp", "Event Type", "Parameters"]

      // Create CSV rows
      const rows = logs.map((log) => [
        log.depth.toFixed(2),
        log.timestamp,
        log.eventType,
        formatParameters(log.parameters),
      ])

      // Combine header and rows
      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `drilling_depth_logs_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting logs:", error)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Depth-Based Logs</CardTitle>
          <Button variant="outline" size="sm" onClick={exportLogs} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              value={filterType || ""}
              onChange={(e) => setFilterType(e.target.value || null)}
            >
              <option value="">All Event Types</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="border rounded-md h-[calc(100vh-300px)] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[100px]">Depth (ft)</TableHead>
                <TableHead className="w-[150px]">Timestamp</TableHead>
                <TableHead className="w-[150px]">Event Type</TableHead>
                <TableHead>Parameters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{log.depth.toFixed(2)}</TableCell>
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          log.eventType.includes("critical") || log.eventType.includes("failure")
                            ? "text-red-500 font-medium"
                            : log.eventType.includes("warning")
                              ? "text-yellow-500 font-medium"
                              : log.eventType.includes("info")
                                ? "text-blue-500"
                                : ""
                        }
                      >
                        {log.eventType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{formatParameters(log.parameters)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No logs available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
