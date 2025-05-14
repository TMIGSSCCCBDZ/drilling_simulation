"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DepthLogsPanel from "./depth-logs-panel"
import TimeLogsPanel from "./time-logs-panel"
import CrossPlotsModule from "./cross-plots-module"
import TrendGraphs from "./trend-graphs"
import ParametersDashboard from "./parameters-dashboard"

interface LoggingAnalyticsProps {
  simulationEngine: any
  isRunning: boolean
}

export default function LoggingAnalytics({ simulationEngine, isRunning }: LoggingAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="space-y-4">
      <ParametersDashboard simulationEngine={simulationEngine} isRunning={isRunning} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="trends">Trend Graphs</TabsTrigger>
          <TabsTrigger value="crossplots">Cross-Plots</TabsTrigger>
          <TabsTrigger value="depth-logs">Depth Logs</TabsTrigger>
          <TabsTrigger value="time-logs">Time Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <TrendGraphs simulationEngine={simulationEngine} isRunning={isRunning} />
        </TabsContent>

        <TabsContent value="crossplots" className="space-y-4">
          <CrossPlotsModule simulationEngine={simulationEngine} isRunning={isRunning} />
        </TabsContent>

        <TabsContent value="depth-logs" className="space-y-4">
          <DepthLogsPanel simulationEngine={simulationEngine} isRunning={isRunning} />
        </TabsContent>

        <TabsContent value="time-logs" className="space-y-4">
          <TimeLogsPanel simulationEngine={simulationEngine} isRunning={isRunning} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
