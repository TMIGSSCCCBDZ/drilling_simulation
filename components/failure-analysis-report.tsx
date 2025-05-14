"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart4, ChevronLeft, Clock, FileText, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface FailureAnalysisReportProps {
  details: any
  onBack: () => void
  onRestart: () => void
}

export default function FailureAnalysisReport({ details, onBack, onRestart }: FailureAnalysisReportProps) {
  const [activeTab, setActiveTab] = useState("timeline")

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch (e) {
      return "Unknown time"
    }
  }

  // Extract timeline data from action log
  const getTimelineData = () => {
    if (!details.actionLog) return []

    return details.actionLog.map((action: any) => ({
      ...action,
      formattedTime: formatTime(action.time),
    }))
  }

  // Extract parameter data for charts
  const getParameterData = () => {
    if (!details.actionLog) return []

    return details.actionLog.map((action: any) => ({
      time: formatTime(action.time),
      ...action.parameters,
    }))
  }

  const timelineData = getTimelineData()
  const parameterData = getParameterData()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 overflow-y-auto py-8">
      <Card className="w-full max-w-5xl mx-4 shadow-lg animate-in fade-in duration-300">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-slate-700 mr-2" />
              <div>
                <CardTitle className="text-xl">Failure Analysis Report</CardTitle>
                <CardDescription>
                  Detailed analysis of the {details.time ? formatTime(details.time) : "recent"} incident
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b p-0">
              <TabsTrigger
                value="timeline"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none py-3 px-4"
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger
                value="warnings"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none py-3 px-4"
              >
                Missed Warnings
              </TabsTrigger>
              <TabsTrigger
                value="parameters"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none py-3 px-4"
              >
                Parameter Analysis
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:shadow-none py-3 px-4"
              >
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Event Timeline
              </h3>

              <div className="space-y-4">
                {timelineData.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

                    {timelineData.map((event, index) => (
                      <div key={index} className="flex mb-4 relative">
                        <div className="absolute left-4 top-4 -ml-2 h-4 w-4 rounded-full bg-slate-400" />
                        <div className="ml-10 flex-grow">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{event.action}</p>
                              <p className="text-sm text-slate-500">
                                Value: {typeof event.value === "object" ? JSON.stringify(event.value) : event.value}
                              </p>
                            </div>
                            <span className="text-sm text-slate-500">{event.formattedTime}</span>
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            Depth: {event.depth.toFixed(1)} ft | ROP: {event.parameters.rop.toFixed(1)} ft/hr | Mud
                            Weight: {event.parameters.mudWeight.toFixed(1)} ppg
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">No timeline data available</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="warnings" className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Missed Warning Signs
              </h3>

              {details.missedWarnings && details.missedWarnings.length > 0 ? (
                <div className="space-y-4">
                  {details.missedWarnings.map((warning: any, index: number) => (
                    <Card key={index} className="border-yellow-200 bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-yellow-800">{warning.warning}</h4>
                            <p className="text-sm text-yellow-700 mt-1">Detected at: {formatTime(warning.time)}</p>
                            <p className="text-sm text-yellow-700 mt-1">Required action: {warning.requiredAction}</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Time allowed to respond: {warning.timeAllowed}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No missed warnings detected. The failure may have occurred due to other factors.
                </div>
              )}
            </TabsContent>

            <TabsContent value="parameters" className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart4 className="h-5 w-5 mr-2" />
                Parameter Analysis
              </h3>

              <div className="space-y-6">
                <div className="h-64">
                  <p className="font-medium mb-2">Pressure Parameters</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={parameterData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="pumpPressure" name="Pump Pressure" stroke="#8884d8" />
                      <Line type="monotone" dataKey="pitLevel" name="Pit Level" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-64">
                  <p className="font-medium mb-2">Drilling Parameters</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={parameterData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="rop" name="ROP" stroke="#ff7300" />
                      <Line type="monotone" dataKey="mudWeight" name="Mud Weight" stroke="#0088fe" />
                      <Line type="monotone" dataKey="gasLevel" name="Gas Level" stroke="#ff0000" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Critical Parameters at Failure</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Depth</p>
                      <p className="font-medium">{details.depth ? details.depth.toFixed(1) : "N/A"} ft</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Mud Weight</p>
                      <p className="font-medium">
                        {details.parameters?.mudWeight ? details.parameters.mudWeight.toFixed(1) : "N/A"} ppg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Formation Pressure</p>
                      <p className="font-medium">
                        {details.parameters?.formationPressure
                          ? details.parameters.formationPressure.toFixed(1)
                          : "N/A"}{" "}
                        ppg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Gas Level</p>
                      <p className="font-medium">
                        {details.parameters?.gasLevel ? details.parameters.gasLevel.toFixed(1) : "N/A"}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Recommendations & Best Practices
              </h3>

              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">What Went Wrong</h4>
                    <p className="text-slate-700">
                      {details.description || "A critical failure occurred in the drilling operation."}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Consequences</h4>
                    <p className="text-slate-700">
                      {details.consequence || "The drilling operation cannot continue safely."}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Prevention Tips</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {details.preventionTips ? (
                        details.preventionTips.map((tip: string, index: number) => <li key={index}>{tip}</li>)
                      ) : (
                        <>
                          <li>Ensure proper monitoring of all drilling parameters</li>
                          <li>Follow standard operating procedures for well control</li>
                          <li>Maintain adequate training for all personnel</li>
                          <li>Perform regular equipment checks and maintenance</li>
                        </>
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Training Recommendations</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      <li>Review well control procedures and kick detection</li>
                      <li>Practice emergency response scenarios</li>
                      <li>Train on proper parameter monitoring and interpretation</li>
                      <li>Understand formation pressure prediction and management</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Summary
          </Button>
          <Button onClick={onRestart}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Restart Simulation
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
