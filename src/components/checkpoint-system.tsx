"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, RotateCcw, Save } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CheckpointSystemProps {
  simulationEngine: any
  isRunning: boolean
  onLoadCheckpoint: (checkpointId: string) => void
}

interface Checkpoint {
  id: string
  name: string
  timestamp: string
  depth: number
  automatic: boolean
}

export default function CheckpointSystem({ simulationEngine, isRunning, onLoadCheckpoint }: CheckpointSystemProps) {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null)

  // Load checkpoints from simulation engine
  useEffect(() => {
    if (!simulationEngine) return

    try {
      const savedCheckpoints = simulationEngine.getCheckpoints()
      if (savedCheckpoints && savedCheckpoints.length > 0) {
        setCheckpoints(savedCheckpoints)

        // Find last auto save
        const lastAuto = savedCheckpoints.find((cp: Checkpoint) => cp.automatic)
        if (lastAuto) {
          setLastAutoSave(lastAuto.id)
        }
      }
    } catch (error) {
      console.error("Error loading checkpoints:", error)
    }
  }, [simulationEngine])

  // Create manual checkpoint
  const createCheckpoint = () => {
    if (!simulationEngine || !isRunning) return

    try {
      const newCheckpoint = simulationEngine.createCheckpoint(false)
      if (newCheckpoint) {
        setCheckpoints((prev) => [...prev, newCheckpoint])
      }
    } catch (error) {
      console.error("Error creating checkpoint:", error)
    }
  }

  // Load checkpoint
  const loadCheckpoint = (checkpointId: string) => {
    if (!simulationEngine) return

    try {
      onLoadCheckpoint(checkpointId)
    } catch (error) {
      console.error("Error loading checkpoint:", error)
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch (e) {
      return timestamp
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Bookmark className="mr-2 h-4 w-4" />
            <span>Checkpoint System</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-full" onClick={createCheckpoint} disabled={!isRunning}>
              <Save className="h-4 w-4 mr-1" />
              Save Checkpoint
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={checkpoints.length === 0}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Load
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Available Checkpoints</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {checkpoints.length > 0 ? (
                  checkpoints.map((checkpoint) => (
                    <DropdownMenuItem key={checkpoint.id} onClick={() => loadCheckpoint(checkpoint.id)}>
                      <div className="flex flex-col">
                        <span className="font-medium">{checkpoint.name}</span>
                        <span className="text-xs text-slate-500">
                          {formatTimestamp(checkpoint.timestamp)} | Depth: {checkpoint.depth.toFixed(1)}ft
                          {checkpoint.automatic && " (Auto)"}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No checkpoints available</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {lastAutoSave && (
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => loadCheckpoint(lastAutoSave)}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Load Last Safe State
            </Button>
          )}

          <div className="text-xs text-slate-500 mt-1">
            {checkpoints.length > 0 ? (
              <>Last checkpoint: {formatTimestamp(checkpoints[checkpoints.length - 1].timestamp)}</>
            ) : (
              <>No checkpoints saved yet</>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
