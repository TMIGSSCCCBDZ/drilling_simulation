/**
 * Formation Model for Drilling Simulation
 *
 * This class represents the subsurface formation model with layers,
 * pressure gradients, and lithology properties.
 */
export class FormationModel {
  private layers: any[] = []

  constructor() {
    // Initialize with default layers
    this.initializeDefaultLayers()
  }

  /**
   * Initialize default formation layers
   */
  private initializeDefaultLayers(): void {
    this.layers = [
      {
        name: "Topsoil",
        depth: 0,
        thickness: 500,
        porePressure: 8.5,
        fracturePressure: 12.0,
        permeability: 0.01,
        lithology: "sand",
      },
      {
        name: "Shale",
        depth: 500,
        thickness: 1000,
        porePressure: 9.2,
        fracturePressure: 14.5,
        permeability: 0.001,
        lithology: "shale",
      },
      {
        name: "Reservoir",
        depth: 1500,
        thickness: 800,
        porePressure: 11.0,
        fracturePressure: 15.0,
        permeability: 0.5,
        lithology: "sandstone",
      },
      {
        name: "Overpressured Zone",
        depth: 2300,
        thickness: 500,
        porePressure: 14.0,
        fracturePressure: 16.5,
        permeability: 0.05,
        lithology: "limestone",
      },
    ]
  }

  /**
   * Get all formation layers
   */
  public getLayers(): any[] {
    return [...this.layers]
  }

  /**
   * Add a new formation layer
   */
  public addLayer(layer: any): void {
    this.layers.push(layer)
    // Sort layers by depth
    this.layers.sort((a, b) => a.depth - b.depth)
  }

  /**
   * Update an existing formation layer
   */
  public updateLayer(updatedLayer: any): void {
    const index = this.layers.findIndex((layer) => layer.name === updatedLayer.name)
    if (index !== -1) {
      this.layers[index] = { ...updatedLayer }
      // Sort layers by depth
      this.layers.sort((a, b) => a.depth - b.depth)
    }
  }

  /**
   * Remove a formation layer
   */
  public removeLayer(layerName: string): void {
    this.layers = this.layers.filter((layer) => layer.name !== layerName)
  }

  /**
   * Get formation properties at a specific depth
   */
  public getPropertiesAtDepth(depth: number): any {
    // Find the layer that contains this depth
    const layer = this.getLayerAtDepth(depth)

    if (!layer) {
      // Return default properties if no layer found
      return {
        porePressure: 9.0,
        fracturePressure: 14.0,
        permeability: 0.1,
        lithology: "sandstone",
      }
    }

    // Calculate pressure gradient based on depth within layer
    const depthInLayer = depth - layer.depth
    const depthFactor = depthInLayer / layer.thickness

    // Adjust properties based on depth within layer
    const porePressureGradient = 0.1 // psi/ft increase
    const fracturePressureGradient = 0.15 // psi/ft increase

    return {
      porePressure: layer.porePressure + depthFactor * porePressureGradient,
      fracturePressure: layer.fracturePressure + depthFactor * fracturePressureGradient,
      permeability: layer.permeability,
      lithology: layer.lithology,
    }
  }

  /**
   * Get the layer at a specific depth
   */
  public getLayerAtDepth(depth: number): any {
    for (let i = 0; i < this.layers.length; i++) {
      const layerTop = this.layers[i].depth
      const layerBottom = layerTop + this.layers[i].thickness

      if (depth >= layerTop && depth < layerBottom) {
        return this.layers[i]
      }
    }

    // If depth is beyond all layers, return the deepest layer
    if (this.layers.length > 0 && depth >= this.layers[this.layers.length - 1].depth) {
      return this.layers[this.layers.length - 1]
    }

    return null
  }

  /**
   * Get the layer index at a specific depth
   */
  public getLayerIndexAtDepth(depth: number): number {
    for (let i = 0; i < this.layers.length; i++) {
      const layerTop = this.layers[i].depth
      const layerBottom = layerTop + this.layers[i].thickness

      if (depth >= layerTop && depth < layerBottom) {
        return i + 1
      }
    }

    // If depth is beyond all layers, return the deepest layer index
    if (this.layers.length > 0 && depth >= this.layers[this.layers.length - 1].depth) {
      return this.layers.length
    }

    return 1
  }

  /**
   * Get recommended drilling parameters for a specific lithology
   */
  public getRecommendedParameters(lithology: string): any {
    switch (lithology.toLowerCase()) {
      case "sand":
        return {
          minROP: 50,
          maxROP: 100,
          recommendedMudWeight: 9.0,
          recommendedRPM: 80,
          description: "Unconsolidated sand formation. Use moderate ROP to prevent collapse.",
        }
      case "sandstone":
        return {
          minROP: 40,
          maxROP: 80,
          recommendedMudWeight: 9.5,
          recommendedRPM: 70,
          description: "Consolidated sandstone. Moderate drilling parameters recommended.",
        }
      case "shale":
        return {
          minROP: 30,
          maxROP: 60,
          recommendedMudWeight: 10.0,
          recommendedRPM: 60,
          description: "Shale formation. Drill slowly to prevent swelling and instability.",
        }
      case "limestone":
        return {
          minROP: 25,
          maxROP: 50,
          recommendedMudWeight: 10.5,
          recommendedRPM: 50,
          description: "Hard limestone formation. Use lower ROP to prevent bit damage.",
        }
      case "dolomite":
        return {
          minROP: 20,
          maxROP: 40,
          recommendedMudWeight: 11.0,
          recommendedRPM: 45,
          description: "Very hard dolomite. Drill slowly with higher mud weight.",
        }
      default:
        return {
          minROP: 30,
          maxROP: 70,
          recommendedMudWeight: 10.0,
          recommendedRPM: 60,
          description: "Unknown formation. Use moderate drilling parameters.",
        }
    }
  }

  /**
   * Get current formation recommendations at a specific depth
   */
  public getRecommendationsAtDepth(depth: number): any {
    const layer = this.getLayerAtDepth(depth)
    if (!layer) {
      return this.getRecommendedParameters("unknown")
    }

    return this.getRecommendedParameters(layer.lithology)
  }
}
