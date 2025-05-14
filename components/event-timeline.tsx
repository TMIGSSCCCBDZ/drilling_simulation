"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, AlertTriangle, CheckCircle2, AlertCircle, Info } from "lucide-react"

interface EventTimelineProps {
  simulationEngine: any
  isRunning: boolean
}

interface TimelineEvent {
  id: string
  type: string
  time: string
  description: string
  severity: "info" | "warning" | "critical" | "success"
  parameters?: Record<string, any>
}

export default function EventTimeline({ simulationEngine, isRunning }: EventTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [expanded, setExpanded] = useState(false)

  // Update events from simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    const updateInterval = setInterval(() => {
      try {
        const timelineEvents = simulationEngine.getTimelineEvents()
        if (timelineEvents && timelineEvents.length > 0) {
          setEvents(timelineEvents)
        }
      } catch (error) {
        console.error("Error updating timeline events:", error)
      }
    }, 1000)

    return () => clearInterval(updateInterval)
  }, [simulationEngine])

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch (e) {
      return timestamp
    }
  }

  // Get icon based on severity
  const getEventIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // Get color based on severity
  const getEventColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "success":
        return "border-green-200 bg-green-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  // Display only the last 5 events unless expanded
  const displayEvents = expanded ? events : events.slice(-5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <span>Event Timeline</span>
          </div>
          <button className="text-xs text-blue-500 hover:underline" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show Less" : "Show All"}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {displayEvents.length > 0 ? (
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />

              {displayEvents.map((event, index) => (
                <div
                  key={event.id || index}
                  className={`ml-6 p-2 mb-2 rounded-md border ${getEventColor(event.severity)}`}
                >
                  <div className="absolute left-0 mt-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center border border-slate-200">
                    {getEventIcon(event.severity)}
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="font-medium text-sm">{event.description}</div>
                    <div className="text-xs text-slate-500">{formatTimestamp(event.time)}</div>
                  </div>

                  {event.parameters && (
                    <div className="mt-1 text-xs text-slate-600">
                      {Object.entries(event.parameters).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {typeof value === "number" ? value.toFixed(1) : value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">No events recorded yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
