"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, Layers, Plus, Save, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FormationEditorProps {
  formationModel: any
  simulationEngine: any
}

export default function FormationEditor({ formationModel, simulationEngine }: FormationEditorProps) {
  const [layers, setLayers] = useState<any[]>([])
  const [editingLayer, setEditingLayer] = useState<any>(null)
  const [showAlert, setShowAlert] = useState(false)

  // Load formation layers
  useEffect(() => {
    if (!formationModel) return

    try {
      const formationLayers = formationModel.getLayers()
      if (formationLayers && formationLayers.length > 0) {
        setLayers(formationLayers)
      }
    } catch (error) {
      console.error("Error loading formation layers:", error)
    }
  }, [formationModel])

  // Handle layer selection for editing
  const selectLayer = (layer: any) => {
    setEditingLayer({ ...layer })
  }

  // Handle layer property changes
  const handleLayerChange = (property: string, value: any) => {
    setEditingLayer((prev) => ({ ...prev, [property]: value }))
  }

  // Save edited layer
  const saveLayer = () => {
    if (!editingLayer || !formationModel) return

    try {
      // Update layer in formation model
      formationModel.updateLayer(editingLayer)

      // Update local state
      setLayers((prev) => prev.map((layer) => (layer.name === editingLayer.name ? editingLayer : layer)))

      // Update simulation engine
      if (simulationEngine) {
        simulationEngine.setFormation(formationModel)
      }

      // Show success alert
      setShowAlert(true)
      setTimeout(() => setShowAlert(false), 3000)

      // Clear editing layer
      setEditingLayer(null)
    } catch (error) {
      console.error("Error saving layer:", error)
    }
  }

  // Add new layer
  const addLayer = () => {
    const newLayer = {
      name: `Layer ${layers.length + 1}`,
      depth: layers.length > 0 ? layers[layers.length - 1].depth + layers[layers.length - 1].thickness : 0,
      thickness: 500,
      porePressure: 9.0,
      fracturePressure: 14.0,
      permeability: 0.1,
      lithology: "sandstone",
    }

    setEditingLayer(newLayer)
  }

  // Delete layer
  const deleteLayer = (layerName: string) => {
    if (!formationModel) return

    try {
      // Remove layer from formation model
      formationModel.removeLayer(layerName)

      // Update local state
      setLayers((prev) => prev.filter((layer) => layer.name !== layerName))

      // Update simulation engine
      if (simulationEngine) {
        simulationEngine.setFormation(formationModel)
      }

      // Clear editing layer if it's the one being deleted
      if (editingLayer && editingLayer.name === layerName) {
        setEditingLayer(null)
      }
    } catch (error) {
      console.error("Error deleting layer:", error)
    }
  }

  // Get lithology color
  const getLithologyColor = (lithology: string) => {
    switch (lithology.toLowerCase()) {
      case "sand":
        return "bg-yellow-200"
      case "sandstone":
        return "bg-yellow-300"
      case "shale":
        return "bg-gray-400"
      case "limestone":
        return "bg-blue-200"
      case "dolomite":
        return "bg-blue-300"
      case "coal":
        return "bg-black"
      case "salt":
        return "bg-white border"
      default:
        return "bg-gray-300"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center">
          <Layers className="mr-2 h-5 w-5" />
          Formation Model Editor
        </h2>
        <Button onClick={addLayer}>
          <Plus className="h-4 w-4 mr-1" />
          Add Layer
        </Button>
      </div>

      {showAlert && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Formation model updated successfully</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Formation Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {layers.map((layer, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${
                    editingLayer && editingLayer.name === layer.name
                      ? "bg-blue-100 border border-blue-300"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                  onClick={() => selectLayer(layer)}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-sm mr-2 ${getLithologyColor(layer.lithology)}`} />
                    <div>
                      <div className="font-medium">{layer.name}</div>
                      <div className="text-xs text-slate-500">
                        Depth: {layer.depth}ft, Thickness: {layer.thickness}ft
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteLayer(layer.name)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}

              {layers.length === 0 && <div className="p-4 text-center text-slate-500">No formation layers defined</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{editingLayer ? `Edit Layer: ${editingLayer.name}` : "Layer Properties"}</CardTitle>
          </CardHeader>
          <CardContent>
            {editingLayer ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Layer Name</Label>
                    <Input
                      id="name"
                      value={editingLayer.name}
                      onChange={(e) => handleLayerChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lithology">Lithology</Label>
                    <select
                      id="lithology"
                      className="w-full p-2 border rounded-md"
                      value={editingLayer.lithology}
                      onChange={(e) => handleLayerChange("lithology", e.target.value)}
                    >
                      <option value="sand">Sand</option>
                      <option value="sandstone">Sandstone</option>
                      <option value="shale">Shale</option>
                      <option value="limestone">Limestone</option>
                      <option value="dolomite">Dolomite</option>
                      <option value="coal">Coal</option>
                      <option value="salt">Salt</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depth">Depth (ft)</Label>
                    <Input
                      id="depth"
                      type="number"
                      value={editingLayer.depth}
                      onChange={(e) => handleLayerChange("depth", Number.parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thickness">Thickness (ft)</Label>
                    <Input
                      id="thickness"
                      type="number"
                      value={editingLayer.thickness}
                      onChange={(e) => handleLayerChange("thickness", Number.parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="porePressure">Pore Pressure (ppg)</Label>
                    <span>{editingLayer.porePressure.toFixed(1)} ppg</span>
                  </div>
                  <Slider
                    id="porePressure"
                    value={[editingLayer.porePressure]}
                    min={8.0}
                    max={18.0}
                    step={0.1}
                    onValueChange={(value) => handleLayerChange("porePressure", value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fracturePressure">Fracture Pressure (ppg)</Label>
                    <span>{editingLayer.fracturePressure.toFixed(1)} ppg</span>
                  </div>
                  <Slider
                    id="fracturePressure"
                    value={[editingLayer.fracturePressure]}
                    min={10.0}
                    max={20.0}
                    step={0.1}
                    onValueChange={(value) => handleLayerChange("fracturePressure", value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="permeability">Permeability (mD)</Label>
                    <span>{editingLayer.permeability.toFixed(3)} mD</span>
                  </div>
                  <Slider
                    id="permeability"
                    value={[editingLayer.permeability]}
                    min={0.001}
                    max={1.0}
                    step={0.001}
                    onValueChange={(value) => handleLayerChange("permeability", value[0])}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button variant="outline" className="mr-2" onClick={() => setEditingLayer(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveLayer}>
                    <Save className="h-4 w-4 mr-1" />
                    Save Layer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">Select a layer to edit or create a new one</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
