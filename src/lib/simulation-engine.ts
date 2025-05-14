/**
 * Simulation Engine for Drilling Operations
 *
 * This class handles the physics and logic of the drilling simulation,
 * including formation interactions, fluid dynamics, and event generation.
 */
export class SimulationEngine {
  private running = false
  private paused = false
  private speed = 1
  private trainingMode = true
  private wellType = "vertical"
  private formation: any = null
  private simulationInterval: any = null
  private simulationTime = 0
  private elapsedTime = 0

  // Current simulation data
  private currentData: any = {
    rop: 0,
    pumpPressure: 0,
    pitLevel: 50,
    standpipePressure: 0,
    gasLevel: 0,
    bitDepth: 0,
    hookload: 250,
    mudWeight: 10.0,
    mudTemperature: 120,
    formationPressure: 0,
    annularPressure: 0,
    torque: 0,
    rpm: 0,
    chokePosition: 0,
    bopStatus: "closed",
    events: [],
  }

  // Control settings
  private controls: any = {
    rop: 50,
    pumpRate: 50,
    rotarySpeed: 60,
    mudWeight: 10,
    chokePosition: 0,
    bopStatus: "closed",
    hookPosition: 0,
    drawworks: "locked",
  }

  // Historical data for logs
  private logData: any[] = []
  private eventLog: any[] = []

  // Current scenario
  private scenario = "normal"
  private gameOver = false
  private gameOverReason = ""
  private gameOverDetails: any = {}
  private warningTimers: Record<string, number> = {}
  private warningTimestamps: Record<string, number> = {}
  private missedWarnings: any[] = []
  private actionLog: any[] = []
  private equipmentStatus: Record<string, any> = {
    pumps: { health: 100, overuseDuration: 0 },
    drillString: { health: 100, vibration: 0, torque: 0 },
    bop: { health: 100, lastClosed: 0 },
  }
  private casingDepth = 0
  private lastCasingRun = 0
  private trippingStatus = {
    isTripping: false,
    direction: "none", // "in" or "out"
    speed: 0,
    lastDepth: 0,
    lastTime: 0,
  }

  private checkpoints: any[]
  private timelineEvents: any[]
  private riskDecayRate = 0.5 // Risk decay rate per second
  private lastRiskLevel = 0
  private riskDecaying = false
  private formationTransitions: any[] = []
  private lastFormationDepth = 0
  private currentFormation: any = null
  private formationData: any[] = [
    {
      name: "Surface Formation",
      depth: 0,
      thickness: 500,
      lithology: "sand",
      porePressure: 8.5,
      fracturePressure: 12.0,
      permeability: 0.01,
      kickRisk: 0.05,
      description: "Unconsolidated surface formation with low pressure.",
    },
    {
      name: "Upper Shale",
      depth: 500,
      thickness: 1000,
      lithology: "shale",
      porePressure: 9.2,
      fracturePressure: 14.5,
      permeability: 0.001,
      kickRisk: 0.1,
      description: "Stable shale formation with moderate pressure.",
    },
    {
      name: "Sandstone Reservoir",
      depth: 1500,
      thickness: 800,
      lithology: "sandstone",
      porePressure: 11.0,
      fracturePressure: 15.0,
      permeability: 0.5,
      kickRisk: 0.25,
      description: "Permeable sandstone with potential for fluid influx.",
    },
    {
      name: "Pressured Zone",
      depth: 2300,
      thickness: 500,
      lithology: "limestone",
      porePressure: 14.0,
      fracturePressure: 16.5,
      permeability: 0.05,
      kickRisk: 0.4,
      description: "High-pressure limestone formation requiring careful drilling.",
    },
    {
      name: "Salt Dome",
      depth: 2800,
      thickness: 400,
      lithology: "salt",
      porePressure: 10.0,
      fracturePressure: 13.0,
      permeability: 0.001,
      kickRisk: 0.15,
      description: "Salt formation with risk of washouts and closure.",
    },
    {
      name: "Deep Reservoir",
      depth: 3200,
      thickness: 600,
      lithology: "sandstone",
      porePressure: 15.5,
      fracturePressure: 17.0,
      permeability: 0.3,
      kickRisk: 0.45,
      description: "Deep high-pressure reservoir with significant kick potential.",
    },
  ]

  /**
   * Set target depth for scenario completion
   */
  public setTargetDepth(depth: number): void {
    this.targetDepth = depth
  }

  /**
   * Get current target depth
   */
  public getTargetDepth(): number {
    return this.targetDepth || 0
  }

  /**
   * Check if target depth has been reached
   */
  public isTargetDepthReached(): boolean {
    return this.targetDepth > 0 && this.currentData.bitDepth >= this.targetDepth
  }

  /**
   * Track BOP activations
   */
  private bopActivations = 0

  /**
   * Get number of BOP activations
   */
  public getBopActivations(): number {
    return this.bopActivations
  }

  /**
   * Track kicks handled
   */
  private kicksHandled = 0

  /**
   * Get number of kicks handled
   */
  public getKicksHandled(): number {
    return this.kicksHandled
  }

  private targetDepth = 0
  private previousGasLevel = 0

  constructor() {
    // Initialize with default values
    this.reset()
    this.checkpoints = []
    this.timelineEvents = []
    this.formationTransitions = []
  }

  /**
   * Start the simulation
   */
  public start(): void {
    if (this.running) return

    this.running = true
    this.paused = false

    // Start simulation loop
    this.simulationInterval = setInterval(() => {
      if (!this.paused) {
        this.updateSimulation()
      }
    }, 1000 / this.speed)
  }

  /**
   * Pause the simulation
   */
  public pause(): void {
    this.paused = true
  }

  /**
   * Resume the simulation
   */
  public resume(): void {
    this.paused = false
  }

  /**
   * Stop the simulation
   */
  public stop(): void {
    this.running = false
    this.paused = false

    if (this.simulationInterval) {
      clearInterval(this.simulationInterval)
      this.simulationInterval = null
    }
  }

  /**
   * Check if game is over
   */
  public isGameOver(): boolean {
    return this.gameOver
  }

  /**
   * Get game over reason
   */
  public getGameOverReason(): string {
    return this.gameOverReason
  }

  /**
   * Get game over details
   */
  public getGameOverDetails(): any {
    return this.gameOverDetails
  }

  /**
   * Get action log
   */
  public getActionLog(): any[] {
    return [...this.actionLog]
  }

  /**
   * Get missed warnings
   */
  public getMissedWarnings(): any[] {
    return [...this.missedWarnings]
  }

  /**
   * Log user action
   */
  private logAction(action: string, value: any, timestamp: number = Date.now()): void {
    this.actionLog.push({
      action,
      value,
      time: new Date(timestamp).toISOString(),
      depth: this.currentData.bitDepth,
      parameters: {
        rop: this.currentData.rop,
        pumpPressure: this.currentData.pumpPressure,
        pitLevel: this.currentData.pitLevel,
        gasLevel: this.currentData.gasLevel,
        mudWeight: this.currentData.mudWeight,
      },
    })
  }

  /**
   * Set controls with action logging
   * Modified to track BOP activations
   */
  public setControls(controls: any): void {
    // Track BOP activations
    if (this.controls.bopStatus === "open" && controls.bopStatus === "closed") {
      this.bopActivations++

      // Log BOP activation
      this.addTimelineEvent({
        type: "bopActivation",
        time: new Date().toISOString(),
        description: "BOP activated",
        severity: "info",
        parameters: {
          depth: this.currentData.bitDepth,
          gasLevel: this.currentData.gasLevel,
        },
      })
    }

    // Log changes
    Object.keys(controls).forEach((key) => {
      if (this.controls[key] !== controls[key]) {
        this.logAction(`Changed ${key}`, controls[key])
      }
    })

    // Update controls
    this.controls = { ...this.controls, ...controls }
  }

  /**
   * Run casing to current depth
   */
  public runCasing(): void {
    this.casingDepth = this.currentData.bitDepth
    this.lastCasingRun = this.simulationTime
    this.logAction("Run Casing", this.casingDepth)
  }

  /**
   * Start tripping operation
   */
  public startTripping(direction: "in" | "out", speed: number): void {
    this.trippingStatus.isTripping = true
    this.trippingStatus.direction = direction
    this.trippingStatus.speed = speed
    this.trippingStatus.lastDepth = this.currentData.bitDepth
    this.trippingStatus.lastTime = this.simulationTime
    this.logAction("Start Tripping", { direction, speed })
  }

  /**
   * Stop tripping operation
   */
  public stopTripping(): void {
    this.trippingStatus.isTripping = false
    this.trippingStatus.direction = "none"
    this.logAction("Stop Tripping", null)
  }

  /**
   * Trigger game over
   */
  private triggerGameOver(reason: string, details: any = {}): void {
    if (this.gameOver) return // Already in game over state

    this.gameOver = true
    this.gameOverReason = reason
    this.gameOverDetails = {
      ...details,
      time: new Date().toISOString(),
      depth: this.currentData.bitDepth,
      elapsedTime: this.elapsedTime,
      parameters: {
        rop: this.currentData.rop,
        pumpPressure: this.currentData.pumpPressure,
        pitLevel: this.currentData.pitLevel,
        gasLevel: this.currentData.gasLevel,
        mudWeight: this.currentData.mudWeight,
        standpipePressure: this.currentData.standpipePressure,
        annularPressure: this.currentData.annularPressure,
        formationPressure: this.currentData.formationPressure,
      },
      missedWarnings: this.missedWarnings,
      actionLog: this.actionLog.slice(-20), // Last 20 actions
    }

    // Add to event log
    const gameOverEvent = {
      type: "gameOver",
      time: new Date().toISOString(),
      depth: this.currentData.bitDepth,
      layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
      severity: "critical",
      description: `GAME OVER: ${reason}`,
    }

    this.eventLog.push(gameOverEvent)
    this.currentData.events.push(gameOverEvent)

    // Pause the simulation
    this.pause()
  }

  /**
   * Reset game over state
   */
  public resetGameOver(): void {
    this.gameOver = false
    this.gameOverReason = ""
    this.gameOverDetails = {}
    this.missedWarnings = []
    this.actionLog = []
    this.warningTimers = {}
    this.warningTimestamps = {}
    this.equipmentStatus = {
      pumps: { health: 100, overuseDuration: 0 },
      drillString: { health: 100, vibration: 0, torque: 0 },
      bop: { health: 100, lastClosed: 0 },
    }
    this.casingDepth = 0
    this.lastCasingRun = 0
    this.trippingStatus = {
      isTripping: false,
      direction: "none",
      speed: 0,
      lastDepth: 0,
      lastTime: 0,
    }
  }

  /**
   * Reset the simulation to initial state
   */
  public reset(): void {
    this.stop()
    this.resetGameOver()

    this.simulationTime = 0
    this.elapsedTime = 0

    // Reset current data
    this.currentData = {
      rop: 0,
      pumpPressure: 0,
      pitLevel: 50,
      standpipePressure: 0,
      gasLevel: 0,
      bitDepth: 0,
      hookload: 250,
      mudWeight: 10.0,
      mudTemperature: 120,
      formationPressure: 0,
      annularPressure: 0,
      torque: 0,
      rpm: 0,
      chokePosition: 0,
      bopStatus: "closed",
      events: [],
    }

    // Reset controls
    this.controls = {
      rop: 50,
      pumpRate: 50,
      rotarySpeed: 60,
      mudWeight: 10,
      chokePosition: 0,
      bopStatus: "closed",
      hookPosition: 0,
      drawworks: "locked",
    }

    // Clear logs
    this.logData = []
    this.eventLog = []
    this.timelineEvents = []
    this.formationTransitions = []
    this.lastFormationDepth = 0
    this.currentFormation = null
    this.lastRiskLevel = 0
    this.riskDecaying = false
  }

  /**
   * Set simulation speed
   */
  public setSpeed(speed: number): void {
    this.speed = speed

    // Restart interval with new speed if running
    if (this.running && !this.paused) {
      this.stop()
      this.start()
    }
  }

  /**
   * Set training mode
   */
  public setTrainingMode(mode: boolean): void {
    this.trainingMode = mode
  }

  /**
   * Set well type
   */
  public setWellType(type: string): void {
    this.wellType = type
  }

  /**
   * Set formation model
   */
  public setFormation(formation: any): void {
    this.formation = formation

    // Initialize formation data with kickRisk if not already present
    if (this.formation) {
      const layers = this.formation.getLayers()
      if (layers && layers.length > 0) {
        layers.forEach((layer: any) => {
          if (layer.kickRisk === undefined) {
            // Calculate kick risk based on pore pressure and permeability
            const basePressure = 9.0 // baseline pressure
            const pressureFactor = Math.max(0, (layer.porePressure - basePressure) / 5)
            const permeabilityFactor = Math.min(1, layer.permeability * 2)
            layer.kickRisk = Math.min(0.8, pressureFactor * 0.7 + permeabilityFactor * 0.3)
          }
        })
      }
    }
  }

  /**
   * Get current simulation data
   */
  public getCurrentData(): any {
    return { ...this.currentData }
  }

  /**
   * Get log data
   */
  public getLogData(): any[] {
    return [...this.logData]
  }

  /**
   * Get event log
   */
  public getEventLog(): any[] {
    return [...this.eventLog]
  }

  /**
   * Refresh logs
   */
  public refreshLogs(): void {
    // Add current data to logs
    this.addToLogs()
  }

  /**
   * Refresh simulation data without resetting the simulation
   * Used when switching between tabs to ensure data consistency
   */
  public refreshData(): void {
    // Refresh logs
    this.refreshLogs()

    // Ensure current data is up to date
    // This helps maintain state consistency across tab switches
    if (this.running && !this.paused) {
      this.updateSimulation()
    }
  }

  /**
   * Load a predefined scenario
   */
  public loadScenario(scenario: string): void {
    this.scenario = scenario
    this.reset()

    // Configure simulation based on scenario
    switch (scenario) {
      case "kick":
        // Set up formation with overpressured zone
        if (this.formation) {
          const layers = this.formation.getLayers()
          if (layers && layers.length > 0) {
            // Find a deep layer to make overpressured
            const deepLayer = layers.find((l: any) => l.depth > 1500)
            if (deepLayer) {
              deepLayer.porePressure = 14.0 // Increase pore pressure
              deepLayer.kickRisk = 0.6 // High kick risk
              this.formation.updateLayer(deepLayer)
            }
          }
        }
        break

      case "lost-circulation":
        // Set up formation with fractured zone
        if (this.formation) {
          const layers = this.formation.getLayers()
          if (layers && layers.length > 0) {
            // Find a middle layer to make fractured
            const midLayer = layers.find((l: any) => l.depth > 800 && l.depth < 1500)
            if (midLayer) {
              midLayer.fracturePressure = 11.0 // Lower fracture pressure
              this.formation.updateLayer(midLayer)
            }
          }
        }
        break

      case "stuck-pipe":
        // Set up formation with high differential pressure zone
        if (this.formation) {
          const layers = this.formation.getLayers()
          if (layers && layers.length > 0) {
            // Find a layer to create differential sticking
            const targetLayer = layers.find((l: any) => l.depth > 1000)
            if (targetLayer) {
              targetLayer.permeability = 0.001 // Low permeability
              targetLayer.porePressure = 8.0 // Low pore pressure
              this.formation.updateLayer(targetLayer)
            }
          }
        }
        break

      case "blowout":
        // Set up formation with very high pressure zone
        if (this.formation) {
          const layers = this.formation.getLayers()
          if (layers && layers.length > 0) {
            // Find the deepest layer
            const deepestLayer = layers.reduce((prev: any, current: any) =>
              prev.depth > current.depth ? prev : current,
            )
            if (deepestLayer) {
              deepestLayer.porePressure = 16.0 // Very high pore pressure
              deepestLayer.permeability = 0.5 // High permeability
              deepestLayer.kickRisk = 0.8 // Very high kick risk
              this.formation.updateLayer(deepestLayer)
            }
          }
        }
        break

      case "normal":
      default:
        // Normal drilling conditions
        break
    }
  }

  /**
   * Update simulation state
   * This is the main physics and logic engine
   */
  private updateSimulation(): void {
    // Skip updates if game is over
    if (this.gameOver) return

    this.simulationTime += 1
    this.elapsedTime += 1 / this.speed

    // Get current formation properties at bit depth
    const formationProps = this.getFormationPropertiesAtDepth(this.currentData.bitDepth)

    // Check for formation transitions
    this.checkFormationTransition(this.currentData.bitDepth)

    // Update bit depth based on ROP
    let depthIncrement = 0
    if (this.controls.drawworks === "unlocked") {
      // Manual control of hook position
      const depthChange = (this.controls.hookPosition - this.currentData.bitDepth / 100) * 10
      this.currentData.bitDepth = Math.max(0, this.currentData.bitDepth + depthChange)
    } else {
      // Automatic drilling based on ROP
      depthIncrement = this.controls.rop / (3600 / this.speed)
      this.currentData.bitDepth += depthIncrement
    }

    // Update drilling parameters
    this.currentData.rop = this.controls.rop
    this.currentData.rpm = this.controls.rotarySpeed
    this.currentData.torque = this.calculateTorque(this.controls.rotarySpeed, formationProps)
    this.currentData.hookload = this.calculateHookload(this.currentData.bitDepth, this.wellType)

    // Update fluid parameters
    this.currentData.mudWeight = this.controls.mudWeight
    this.currentData.pumpPressure = this.calculatePumpPressure(this.controls.pumpRate, this.currentData.bitDepth)
    this.currentData.standpipePressure = this.calculateStandpipePressure(
      this.currentData.pumpPressure,
      this.controls.chokePosition,
    )
    this.currentData.annularPressure = this.calculateAnnularPressure(
      this.currentData.standpipePressure,
      this.currentData.bitDepth,
    )

    // Ensure pit level never goes below 0
    this.currentData.pitLevel = Math.max(0, this.currentData.pitLevel)

    // Update formation interaction
    this.currentData.formationPressure = formationProps.porePressure

    // Update BOP status
    this.currentData.bopStatus = this.controls.bopStatus
    this.currentData.chokePosition = this.controls.chokePosition

    // Check for events
    this.checkForEvents(formationProps)

    // Check for game over conditions
    this.checkGameOverConditions(formationProps)

    // Update equipment status
    this.updateEquipmentStatus()

    // Check tripping operations
    this.checkTrippingOperations()

    // Create automatic checkpoint every 500ft
    if (Math.floor(this.currentData.bitDepth / 500) > Math.floor((this.currentData.bitDepth - depthIncrement) / 500)) {
      this.createCheckpoint(true)
    }

    // Add data to logs periodically
    if (this.simulationTime % 5 === 0) {
      this.addToLogs()
    }

    this.checkKickHandling()
  }

  /**
   * Check for kick handling
   * Called during updateSimulation to track when kicks are successfully handled
   */
  private checkKickHandling(): void {
    // A kick is considered handled if gas level was above threshold and is now decreasing
    if (
      this.previousGasLevel > 3 &&
      this.currentData.gasLevel < this.previousGasLevel &&
      this.controls.bopStatus === "closed"
    ) {
      this.kicksHandled++

      // Log kick handling
      this.addTimelineEvent({
        type: "kickHandled",
        time: new Date().toISOString(),
        description: "Kick successfully controlled",
        severity: "success",
        parameters: {
          depth: this.currentData.bitDepth,
          gasLevel: this.currentData.gasLevel,
          mudWeight: this.currentData.mudWeight,
        },
      })
    }

    // Update previous gas level for next check
    this.previousGasLevel = this.currentData.gasLevel
  }

  /**
   * Check for formation transition
   */
  private checkFormationTransition(depth: number): void {
    // Skip if no formation model
    if (!this.formation) return

    try {
      // Get current formation layer
      const currentLayer = this.formation.getLayerAtDepth(depth)

      // Check if we've entered a new formation
      if (currentLayer && (!this.currentFormation || this.currentFormation.name !== currentLayer.name)) {
        // Record formation transition
        const transition = {
          time: new Date().toISOString(),
          depth: depth,
          fromFormation: this.currentFormation ? this.currentFormation.name : "Surface",
          toFormation: currentLayer.name,
          properties: {
            lithology: currentLayer.lithology,
            porePressure: currentLayer.porePressure,
            fracturePressure: currentLayer.fracturePressure,
            permeability: currentLayer.permeability,
            kickRisk: currentLayer.kickRisk || 0.1,
          },
        }

        this.formationTransitions.push(transition)
        this.currentFormation = currentLayer

        // Add to timeline
        this.addTimelineEvent({
          type: "formationTransition",
          time: new Date().toISOString(),
          description: `Entered ${currentLayer.name} formation at ${depth.toFixed(0)}ft`,
          severity: "info",
          parameters: {
            depth: depth,
            lithology: currentLayer.lithology,
            porePressure: currentLayer.porePressure,
            fracturePressure: currentLayer.fracturePressure,
          },
        })
      }

      this.lastFormationDepth = depth
    } catch (error) {
      console.error("Error checking formation transition:", error)
    }
  }

  /**
   * Get formation at specific depth
   */
  public getFormationAtDepth(depth: number): any {
    if (!this.formation) {
      // Use predefined formation data if no formation model
      for (let i = this.formationData.length - 1; i >= 0; i--) {
        if (depth >= this.formationData[i].depth) {
          return this.formationData[i]
        }
      }
      return this.formationData[0]
    }

    try {
      return this.formation.getLayerAtDepth(depth)
    } catch (error) {
      console.error("Error getting formation at depth:", error)
      return null
    }
  }

  /**
   * Get current risk level
   */
  public getRiskLevel(): {
    level: number
    type: string | null
    decaying: boolean
  } {
    // Default values
    let riskLevel = 0
    let riskType: string | null = null
    let decaying = false

    // Calculate risk level based on various factors

    // Check for kick risk
    const hydrostaticPressure = this.currentData.mudWeight * 0.052 * this.currentData.bitDepth
    const formationProps = this.getFormationPropertiesAtDepth(this.currentData.bitDepth)

    // Only consider kick risk if we're past the minimum depth threshold (500ft)
    if (this.currentData.bitDepth > 500 && formationProps.porePressure > hydrostaticPressure * 0.95) {
      // Approaching underbalanced condition
      const kickRisk = Math.min(
        100,
        ((formationProps.porePressure - hydrostaticPressure * 0.95) / (hydrostaticPressure * 0.05)) * 100,
      )

      // Factor in formation kick risk
      const formationKickFactor = formationProps.kickRisk || 0.2
      const adjustedKickRisk = kickRisk * (0.7 + formationKickFactor * 0.3)

      if (adjustedKickRisk > riskLevel) {
        riskLevel = adjustedKickRisk
        riskType = "kick"
      }
    }

    // Check for lost circulation risk
    if (
      this.currentData.mudWeight > formationProps.fracturePressure * 0.9 ||
      this.currentData.standpipePressure > formationProps.fracturePressure * 130
    ) {
      // Approaching fracture pressure
      const lossRisk = Math.min(
        100,
        Math.max(
          ((this.currentData.mudWeight - formationProps.fracturePressure * 0.9) /
            (formationProps.fracturePressure * 0.1)) *
            100,
          ((this.currentData.standpipePressure - formationProps.fracturePressure * 130) /
            (formationProps.fracturePressure * 20)) *
            100,
        ),
      )

      if (lossRisk > riskLevel) {
        riskLevel = lossRisk
        riskType = "lostCirculation"
      }
    }

    // Check for pit depletion risk
    if (this.currentData.pitLevel < 30) {
      const pitRisk = Math.min(100, ((30 - this.currentData.pitLevel) / 30) * 100)

      if (pitRisk > riskLevel) {
        riskLevel = pitRisk
        riskType = "pitDepletion"
      }
    }

    // Check for equipment failure risk
    const equipmentRisk = Math.min(
      100,
      Math.max(
        (100 - this.equipmentStatus.pumps.health) * 1.2,
        (100 - this.equipmentStatus.drillString.health) * 1.2,
        (100 - this.equipmentStatus.bop.health) * 1.2,
      ),
    )

    if (equipmentRisk > riskLevel) {
      riskLevel = equipmentRisk
      riskType = "equipmentFailure"
    }

    // Check for wellbore instability risk
    const depthWithoutCasing = this.currentData.bitDepth - this.casingDepth
    const timeSinceLastCasing = this.simulationTime - this.lastCasingRun

    if (depthWithoutCasing > 1000 && (formationProps.lithology === "shale" || formationProps.permeability < 0.01)) {
      const instabilityRisk = Math.min(100, (depthWithoutCasing - 1000) / 10)

      if (instabilityRisk > riskLevel) {
        riskLevel = instabilityRisk
        riskType = "wellboreInstability"
      }
    }

    // Check if risk is decreasing
    if (riskLevel < this.lastRiskLevel) {
      decaying = true

      // Add to timeline if risk decreased significantly
      if (this.lastRiskLevel - riskLevel > 20) {
        this.addTimelineEvent({
          type: "riskDecreased",
          time: new Date().toISOString(),
          description: `Risk level decreased from ${Math.round(this.lastRiskLevel)}% to ${Math.round(riskLevel)}%`,
          severity: "success",
          parameters: {
            previousRisk: Math.round(this.lastRiskLevel),
            currentRisk: Math.round(riskLevel),
            riskType: riskType,
          },
        })
      }
    } else if (riskLevel > this.lastRiskLevel + 10) {
      // Add to timeline if risk increased significantly
      this.addTimelineEvent({
        type: "riskIncreased",
        time: new Date().toISOString(),
        description: `Risk level increased to ${Math.round(riskLevel)}% - ${riskType || "multiple issues"}`,
        severity: riskLevel > 70 ? "critical" : "warning",
        parameters: {
          previousRisk: Math.round(this.lastRiskLevel),
          currentRisk: Math.round(riskLevel),
          riskType: riskType,
        },
      })
    }

    // Update last risk level
    this.lastRiskLevel = riskLevel
    this.riskDecaying = decaying

    // If risk level is at maximum, trigger game over
    if (riskLevel >= 100 && !this.gameOver) {
      let gameOverReason = "Critical System Failure"
      const details = {
        description: "Multiple critical failures led to an unrecoverable situation.",
        consequence: "The operation has failed due to unmanaged risks.",
        preventionTips: [
          "Monitor warning signs closely",
          "Take immediate action when risks are detected",
          "Follow proper procedures for well control",
          "Maintain equipment within operational parameters",
        ],
      }

      // Set specific reason based on risk type
      if (riskType === "kick") {
        gameOverReason = "Uncontrolled Kick"
        details.description = "Formation fluids entered the wellbore and were not properly controlled."
      } else if (riskType === "lostCirculation") {
        gameOverReason = "Catastrophic Lost Circulation"
        details.description = "Complete loss of drilling fluid to the formation."
      } else if (riskType === "pitDepletion") {
        gameOverReason = "Mud System Failure"
        details.description = "Critical depletion of drilling fluid reserves."
      } else if (riskType === "equipmentFailure") {
        gameOverReason = "Critical Equipment Failure"
        details.description = "Key drilling equipment has failed beyond operational limits."
      } else if (riskType === "wellboreInstability") {
        gameOverReason = "Wellbore Collapse"
        details.description = "The wellbore has collapsed due to instability and lack of support."
      }

      this.triggerGameOver(gameOverReason, details)
    }

    return { level: riskLevel, type: riskType, decaying }
  }

  /**
   * Create a checkpoint
   */
  public createCheckpoint(automatic = false): any {
    const checkpointId = `cp_${Date.now()}`
    const timestamp = new Date().toISOString()
    const depth = this.currentData.bitDepth

    // Create checkpoint data
    const checkpoint = {
      id: checkpointId,
      name: automatic ? `Auto-save at ${depth.toFixed(0)}ft` : `Checkpoint at ${depth.toFixed(0)}ft`,
      timestamp,
      depth,
      automatic,
      state: {
        currentData: { ...this.currentData },
        controls: { ...this.controls },
        equipmentStatus: JSON.parse(JSON.stringify(this.equipmentStatus)),
        casingDepth: this.casingDepth,
        simulationTime: this.simulationTime,
      },
    }

    // Store checkpoint
    if (!this.checkpoints) this.checkpoints = []
    this.checkpoints.push(checkpoint)

    // Keep only the last 10 checkpoints
    if (this.checkpoints.length > 10) {
      this.checkpoints = this.checkpoints.slice(-10)
    }

    // Add to timeline if manual
    if (!automatic) {
      this.addTimelineEvent({
        type: "checkpoint",
        time: timestamp,
        description: `Checkpoint created at ${depth.toFixed(0)}ft`,
        severity: "info",
        parameters: {
          depth,
          id: checkpointId,
        },
      })
    }

    return checkpoint
  }

  /**
   * Get all checkpoints
   */
  public getCheckpoints(): any[] {
    return this.checkpoints || []
  }

  /**
   * Load checkpoint
   */
  public loadCheckpoint(checkpointId: string): boolean {
    if (!this.checkpoints) return false

    const checkpoint = this.checkpoints.find((cp) => cp.id === checkpointId)
    if (!checkpoint || !checkpoint.state) return false

    // Restore state
    this.currentData = { ...checkpoint.state.currentData }
    this.controls = { ...checkpoint.state.controls }
    this.equipmentStatus = JSON.parse(JSON.stringify(checkpoint.state.equipmentStatus))
    this.casingDepth = checkpoint.state.casingDepth
    this.simulationTime = checkpoint.state.simulationTime

    // Reset game over state
    this.gameOver = false
    this.gameOverReason = ""
    this.gameOverDetails = {}

    // Add to timeline
    this.addTimelineEvent({
      type: "checkpointLoaded",
      time: new Date().toISOString(),
      description: `Checkpoint loaded: ${checkpoint.name}`,
      severity: "info",
      parameters: {
        depth: checkpoint.depth,
        id: checkpointId,
      },
    })

    return true
  }

  /**
   * Add event to timeline
   */
  private addTimelineEvent(event: any): void {
    if (!this.timelineEvents) this.timelineEvents = []

    // Add unique ID if not provided
    if (!event.id) {
      event.id = `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    }

    this.timelineEvents.push(event)

    // Keep timeline manageable
    if (this.timelineEvents.length > 100) {
      this.timelineEvents = this.timelineEvents.slice(-100)
    }
  }

  /**
   * Get timeline events
   */
  public getTimelineEvents(): any[] {
    return this.timelineEvents || []
  }

  /**
   * Check for game over conditions
   */
  private checkGameOverConditions(formationProps: any): void {
    // 1. Mud Pit Depletion
    if (this.currentData.pitLevel === 0) {
      this.triggerGameOver("Mud Pit Depletion", {
        description: "Mud depleted – circulation impossible – formation fluids uncontrolled.",
        consequence:
          "Without drilling fluid, the wellbore cannot maintain hydrostatic pressure, leading to an uncontrolled influx of formation fluids and potential blowout.",
        preventionTips: [
          "Monitor pit levels continuously",
          "Reduce pump rate when pit levels are low",
          "Add lost circulation material when losses are detected",
          "Maintain adequate reserve pit volume at all times",
        ],
      })
      return
    }

    // 2. Blowout Event - only if we're past minimum depth threshold (500ft)
    if (this.currentData.bitDepth > 500 && this.currentData.gasLevel > 20 && this.controls.bopStatus === "open") {
      this.triggerGameOver("Blowout Event", {
        description: "Uncontrolled kick has escalated to a blowout.",
        consequence:
          "Formation fluids have reached the surface in an uncontrolled manner, creating a dangerous situation with risk of fire, environmental damage, and personnel injury.",
        preventionTips: [
          "Monitor for kick indicators (pit gain, flow rate changes)",
          "Close BOP immediately when kick is detected",
          "Properly weight up mud to control formation pressure",
          "Maintain proper choke control during well control operations",
        ],
      })
      return
    }

    // 3. Formation Breakdown
    if (
      this.currentData.standpipePressure > formationProps.fracturePressure * 200 ||
      this.currentData.mudWeight > formationProps.fracturePressure * 1.2
    ) {
      // Check if this is followed by a kick (gas level increasing)
      if (this.currentData.gasLevel > 5 && this.currentData.pitLevel < 30) {
        this.triggerGameOver("Formation Breakdown with Kick", {
          description: "Excessive pressure fractured the formation, causing severe losses followed by an influx.",
          consequence:
            "The combination of lost circulation and kick is one of the most dangerous scenarios in drilling, as the well can no longer be controlled with conventional methods.",
          preventionTips: [
            "Maintain mud weight below fracture gradient",
            "Control pump pressure and avoid pressure spikes",
            "Perform leak-off tests to determine safe operating pressures",
            "Reduce ECD (Equivalent Circulating Density) when approaching weak zones",
          ],
        })
        return
      }
    }

    // 4. Gas Influx Ignored - only if we're past minimum depth threshold (500ft)
    if (this.currentData.bitDepth > 500 && this.currentData.gasLevel > 5) {
      // Start timer if not already started
      if (!this.warningTimers["gasInflux"]) {
        this.warningTimers["gasInflux"] = this.simulationTime
        this.warningTimestamps["gasInflux"] = Date.now()
      }

      // Check if 60 seconds have passed without action
      const timeElapsed = this.simulationTime - this.warningTimers["gasInflux"]
      if (timeElapsed > 60 * this.speed) {
        // Check if any mitigating action was taken
        const actionsAfterWarning = this.actionLog.filter(
          (action) =>
            new Date(action.time).getTime() > this.warningTimestamps["gasInflux"] &&
            (action.action.includes("BOP") ||
              action.action.includes("mudWeight") ||
              action.action.includes("chokePosition")),
        )

        if (actionsAfterWarning.length === 0) {
          // No action taken within time limit
          this.missedWarnings.push({
            warning: "Gas Influx Detected",
            time: new Date(this.warningTimestamps["gasInflux"]).toISOString(),
            requiredAction: "Close BOP and adjust mud weight",
            timeAllowed: "60 seconds",
          })

          // Check if H2S is present in formation
          const h2sPresent = formationProps.lithology === "shale" || this.scenario === "blowout"
          if (h2sPresent) {
            this.triggerGameOver("H2S Exposure", {
              description: "Gas influx containing H2S reached dangerous levels without mitigation.",
              consequence:
                "H2S is extremely toxic and can cause rapid unconsciousness and death at high concentrations. The entire rig is now in a life-threatening situation.",
              preventionTips: [
                "Monitor for H2S continuously in high-risk formations",
                "Respond immediately to gas influx indicators",
                "Ensure all personnel are trained in H2S safety procedures",
                "Maintain proper BOP and well control equipment",
              ],
            })
          } else {
            this.triggerGameOver("Uncontrolled Gas Influx", {
              description: "Gas influx was ignored and has escalated to an uncontrollable situation.",
              consequence:
                "The increasing gas volume has displaced drilling fluid, reducing hydrostatic pressure and allowing more formation fluids to enter the wellbore in a dangerous cycle.",
              preventionTips: [
                "Monitor for kick indicators continuously",
                "Take immediate action when gas is detected",
                "Properly train personnel in well control procedures",
                "Maintain adequate mud weight for formation pressure",
              ],
            })
          }
          return
        }

        // Reset timer if action was taken
        this.warningTimers["gasInflux"] = 0
      }
    } else {
      // Reset gas influx timer if gas level is normal
      this.warningTimers["gasInflux"] = 0
    }

    // 5. Equipment Failure due to Misuse
    // Check pump overuse
    if (this.equipmentStatus.pumps.health <= 0) {
      this.triggerGameOver("Pump Failure", {
        description: "Pumps failed due to extended operation beyond rated capacity.",
        consequence:
          "Without functional mud pumps, circulation is impossible, leading to inability to control wellbore pressure and remove cuttings.",
        preventionTips: [
          "Monitor pump pressure and maintain within specifications",
          "Perform regular maintenance checks",
          "Reduce pump rate when high pressures are observed",
          "Use multiple pumps to distribute load when high rates are needed",
        ],
      })
      return
    }

    // Check drill string failure
    if (this.equipmentStatus.drillString.health <= 0) {
      this.triggerGameOver("Drill String Failure", {
        description: "Drill string failed due to excessive torque and vibration.",
        consequence:
          "A drill string failure can result in dropped pipe, fishing operations, or in severe cases, loss of well control if it occurs during a critical operation.",
        preventionTips: [
          "Monitor torque and vibration continuously",
          "Adjust drilling parameters (WOB, RPM) to minimize vibration",
          "Perform regular inspections of drill pipe",
          "Use shock subs and other vibration dampening tools",
        ],
      })
      return
    }

    // Check BOP failure
    if (this.equipmentStatus.bop.health <= 0) {
      this.triggerGameOver("BOP Failure", {
        description: "BOP failed due to improper operation.",
        consequence:
          "A non-functional BOP means the last line of defense against a blowout is compromised, creating an extremely dangerous situation.",
        preventionTips: [
          "Never close annular preventer while pipe is rotating",
          "Perform regular BOP tests and maintenance",
          "Ensure proper training for BOP operation",
          "Follow manufacturer's guidelines for BOP operation",
        ],
      })
      return
    }

    // 6. Well Collapse (No Casing Run + Instability)
    const depthWithoutCasing = this.currentData.bitDepth - this.casingDepth
    const timeSinceLastCasing = this.simulationTime - this.lastCasingRun

    // Check if drilling deep without casing in unstable formation
    if (
      depthWithoutCasing > 1500 &&
      timeSinceLastCasing > 1000 &&
      (formationProps.lithology === "shale" || formationProps.permeability < 0.01)
    ) {
      this.triggerGameOver("Wellbore Collapse", {
        description: "Wellbore collapsed due to drilling too deep without casing in unstable formation.",
        consequence:
          "Wellbore collapse has trapped the drill string, making it impossible to circulate or trip out. The well must now be abandoned or sidetracked at significant cost.",
        preventionTips: [
          "Run casing at appropriate intervals based on formation stability",
          "Monitor for signs of wellbore instability (tight hole, high torque)",
          "Use appropriate mud properties to stabilize the wellbore",
          "Perform caliper logs to assess wellbore condition before running casing",
        ],
      })
      return
    }
  }

  /**
   * Update equipment status based on operating conditions
   */
  private updateEquipmentStatus(): void {
    // Update pump health
    if (this.controls.pumpRate > 800) {
      this.equipmentStatus.pumps.overuseDuration += 1
      // Damage increases with higher pump rates
      const damageRate = (this.controls.pumpRate - 800) / 200
      this.equipmentStatus.pumps.health -= damageRate * 0.1
    } else if (this.equipmentStatus.pumps.overuseDuration > 0) {
      // Recover slowly when not overused
      this.equipmentStatus.pumps.overuseDuration = Math.max(0, this.equipmentStatus.pumps.overuseDuration - 0.5)
    }

    // Update drill string health
    this.equipmentStatus.drillString.vibration = this.calculateVibration()
    this.equipmentStatus.drillString.torque = this.currentData.torque

    if (this.equipmentStatus.drillString.vibration > 80 || this.equipmentStatus.drillString.torque > 90) {
      // Damage based on vibration and torque
      const vibrationDamage = Math.max(0, (this.equipmentStatus.drillString.vibration - 80) * 0.05)
      const torqueDamage = Math.max(0, (this.equipmentStatus.drillString.torque - 90) * 0.1)
      this.equipmentStatus.drillString.health -= vibrationDamage + torqueDamage

      // Add warning if not already warned
      if (!this.warningTimers["highVibration"] && this.equipmentStatus.drillString.vibration > 80) {
        this.warningTimers["highVibration"] = this.simulationTime
        this.warningTimestamps["highVibration"] = Date.now()

        const vibrationWarning = {
          type: "highVibration",
          time: new Date().toISOString(),
          depth: this.currentData.bitDepth,
          layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
          severity: "warning",
          description: "High vibration detected - risk of drill string damage",
        }
        this.eventLog.push(vibrationWarning)
        this.currentData.events.push(vibrationWarning)
      }

      if (!this.warningTimers["highTorque"] && this.equipmentStatus.drillString.torque > 90) {
        this.warningTimers["highTorque"] = this.simulationTime
        this.warningTimestamps["highTorque"] = Date.now()

        const torqueWarning = {
          type: "highTorque",
          time: new Date().toISOString(),
          depth: this.currentData.bitDepth,
          layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
          severity: "warning",
          description: "High torque detected - risk of drill string damage or twist-off",
        }
        this.eventLog.push(torqueWarning)
        this.currentData.events.push(torqueWarning)
      }
    } else {
      // Reset warnings
      this.warningTimers["highVibration"] = 0
      this.warningTimers["highTorque"] = 0
    }

    // Update BOP health
    if (this.controls.bopStatus === "closed" && this.controls.rotarySpeed > 30) {
      // Damage BOP if closing while pipe is rotating
      this.equipmentStatus.bop.health -= this.controls.rotarySpeed * 0.1

      // Add warning if not already warned
      if (!this.warningTimers["bopWithRotation"]) {
        this.warningTimers["bopWithRotation"] = this.simulationTime
        this.warningTimestamps["bopWithRotation"] = Date.now()

        const bopWarning = {
          type: "bopWithRotation",
          time: new Date().toISOString(),
          depth: this.currentData.bitDepth,
          layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
          severity: "warning",
          description: "BOP closed while pipe is rotating - risk of equipment damage",
        }
        this.eventLog.push(bopWarning)
        this.currentData.events.push(bopWarning)
      }
    } else {
      // Reset warning
      this.warningTimers["bopWithRotation"] = 0
    }
  }

  /**
   * Calculate vibration based on drilling parameters and formation
   */
  private calculateVibration(): number {
    const baseVibration = this.controls.rotarySpeed * 0.5
    const ropFactor = this.controls.rop / 50
    const formationProps = this.getFormationPropertiesAtDepth(this.currentData.bitDepth)

    let formationFactor = 1.0
    if (formationProps.lithology === "limestone" || formationProps.lithology === "dolomite") {
      formationFactor = 1.5 // Hard formations increase vibration
    }

    // Depth also affects vibration (deeper = more vibration)
    const depthFactor = 1 + (this.currentData.bitDepth / 10000) * 0.5

    return Math.min(100, baseVibration * ropFactor * formationFactor * depthFactor)
  }

  /**
   * Check tripping operations for swab/surge effects
   */
  private checkTrippingOperations(): void {
    if (!this.trippingStatus.isTripping) return

    const currentTime = this.simulationTime
    const timeDelta = currentTime - this.trippingStatus.lastTime

    if (timeDelta <= 0) return

    const currentDepth = this.currentData.bitDepth
    const depthDelta = currentDepth - this.trippingStatus.lastDepth

    // Calculate tripping speed in ft/min
    const actualSpeed = Math.abs(depthDelta) / (timeDelta / 60)

    // Update tripping status
    this.trippingStatus.lastDepth = currentDepth
    this.trippingStatus.lastTime = currentTime

    // Check for swab effect (tripping out too fast)
    if (this.trippingStatus.direction === "out" && actualSpeed > 100) {
      // Swab effect can induce kick
      const swabPressureReduction = (actualSpeed - 100) * 0.05
      this.currentData.formationPressure += swabPressureReduction

      // Increase gas level if swab pressure reduces hydrostatic below formation pressure
      if (this.currentData.mudWeight * 0.052 * this.currentData.bitDepth < this.currentData.formationPressure) {
        this.currentData.gasLevel += swabPressureReduction * 0.5
        this.currentData.pitLevel += swabPressureReduction * 0.2

        // Add warning if not already warned
        if (!this.warningTimers["swabKick"]) {
          this.warningTimers["swabKick"] = this.simulationTime
          this.warningTimestamps["swabKick"] = Date.now()

          const swabWarning = {
            type: "swabKick",
            time: new Date().toISOString(),
            depth: this.currentData.bitDepth,
            layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
            severity: "warning",
            description: "Swab-induced kick detected - tripping out too fast",
          }
          this.eventLog.push(swabWarning)
          this.currentData.events.push(swabWarning)
        }
      }
    }

    // Check for surge effect (tripping in too fast)
    if (this.trippingStatus.direction === "in" && actualSpeed > 100) {
      // Surge effect can fracture formation
      const surgePressureIncrease = (actualSpeed - 100) * 0.1
      this.currentData.annularPressure += surgePressureIncrease

      // Get formation properties
      const formationProps = this.getFormationPropertiesAtDepth(this.currentData.bitDepth)

      // Check if surge pressure exceeds fracture pressure
      if (this.currentData.annularPressure > formationProps.fracturePressure * 100) {
        // Induce losses
        this.currentData.pitLevel -= surgePressureIncrease * 0.5

        // Add warning if not already warned
        if (!this.warningTimers["surgeLoss"]) {
          this.warningTimers["surgeLoss"] = this.simulationTime
          this.warningTimestamps["surgeLoss"] = Date.now()

          const surgeWarning = {
            type: "surgeLoss",
            time: new Date().toISOString(),
            depth: this.currentData.bitDepth,
            layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
            severity: "warning",
            description: "Surge-induced losses detected - tripping in too fast",
          }
          this.eventLog.push(surgeWarning)
          this.currentData.events.push(surgeWarning)
        }
      }
    }
  }

  /**
   * Get layer index at a specific depth
   */
  private getLayerIndexAtDepth(depth: number): number {
    if (!this.formation) return 1

    try {
      return this.formation.getLayerIndexAtDepth(depth)
    } catch (error) {
      return 1
    }
  }

  /**
   * Get formation properties at a specific depth
   */
  private getFormationPropertiesAtDepth(depth: number): any {
    if (!this.formation) {
      // Return default properties if no formation model is available
      return {
        porePressure: 9.0,
        fracturePressure: 14.0,
        permeability: 0.1,
        lithology: "sandstone",
      }
    }

    try {
      return this.formation.getPropertiesAtDepth(depth)
    } catch (error) {
      console.error("Error getting formation properties:", error)
      // Return default properties if there's an error
      return {
        porePressure: 9.0,
        fracturePressure: 14.0,
        permeability: 0.1,
        lithology: "sandstone",
      }
    }
  }

  /**
   * Calculate torque based on rotary speed and formation properties
   */
  private calculateTorque(rotarySpeed: number, formationProps: any): number {
    const baseTorque = rotarySpeed * 0.5

    // Adjust torque based on formation lithology
    let formationFactor = 1.0
    if (formationProps.lithology === "limestone" || formationProps.lithology === "dolomite") {
      formationFactor = 1.5 // Hard formations increase torque
    }

    return baseTorque * formationFactor
  }

  /**
   * Calculate hookload based on depth and well type
   */
  private calculateHookload(depth: number, wellType: string): number {
    // Base hookload increases with depth
    const baseHookload = 100 + depth * 0.05

    // Adjust for well type
    let wellTypeFactor = 1.0
    if (wellType === "deviated") {
      wellTypeFactor = 1.2 // Deviated wells have higher friction
    } else if (wellType === "horizontal") {
      wellTypeFactor = 1.5 // Horizontal wells have even higher friction
    }

    return baseHookload * wellTypeFactor
  }

  /**
   * Calculate pump pressure based on pump rate and depth
   */
  private calculatePumpPressure(pumpRate: number, depth: number): number {
    // Base pressure increases with pump rate
    const basePressure = pumpRate * 3

    // Adjust for depth (deeper = more pressure)
    const depthFactor = 1 + (depth / 10000) * 0.5

    return basePressure * depthFactor
  }

  /**
   * Calculate standpipe pressure based on pump pressure and choke position
   */
  private calculateStandpipePressure(pumpPressure: number, chokePosition: number): number {
    // Choke increases backpressure
    const chokeFactor = 1 + (chokePosition / 100) * 0.5

    return pumpPressure * chokeFactor
  }

  /**
   * Calculate annular pressure based on standpipe pressure and depth
   */
  private calculateAnnularPressure(standpipePressure: number, depth: number): number {
    // Pressure decreases as it travels up the annulus
    const depthFactor = Math.max(0.5, 1 - depth / 20000)

    return standpipePressure * depthFactor
  }

  /**
   * Check for drilling events based on current conditions
   */
  private checkForEvents(formationProps: any): void {
    // Check for kick (formation pressure > hydrostatic pressure)
    const hydrostaticPressure = this.currentData.mudWeight * 0.052 * this.currentData.bitDepth

    // Only consider kicks if we're past the minimum depth threshold (500ft)
    if (
      this.currentData.bitDepth > 500 &&
      formationProps.porePressure > hydrostaticPressure &&
      this.currentData.pitLevel < 100
    ) {
      // Calculate kick probability based on formation properties and drilling parameters
      const pressureDifferential = formationProps.porePressure - hydrostaticPressure
      const formationKickRisk = formationProps.kickRisk || 0.2
      const kickProbability = Math.min(1, pressureDifferential * 0.1 * formationKickRisk)

      // Only trigger kick if probability threshold is met
      if (Math.random() < kickProbability) {
        // Increase gas level and pit level to simulate kick
        this.currentData.gasLevel += pressureDifferential * 0.1
        this.currentData.pitLevel += pressureDifferential * 0.05

        // Add kick event if not already warned
        if (!this.warningTimers["kick"]) {
          this.warningTimers["kick"] = this.simulationTime
          this.warningTimestamps["kick"] = Date.now()

          const kickEvent = {
            type: "kick",
            time: new Date().toISOString(),
            depth: this.currentData.bitDepth,
            layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
            severity: "warning",
            description: "Potential kick detected - formation pressure exceeds hydrostatic pressure",
          }

          this.eventLog.push(kickEvent)
          this.currentData.events.push(kickEvent)

          // Add to timeline
          this.addTimelineEvent({
            type: "kickDetected",
            time: new Date().toISOString(),
            description: `Kick detected at ${this.currentData.bitDepth.toFixed(0)}ft - formation pressure: ${formationProps.porePressure.toFixed(1)} ppg`,
            severity: "critical",
            parameters: {
              depth: this.currentData.bitDepth,
              formationPressure: formationProps.porePressure,
              hydrostaticPressure: hydrostaticPressure,
              mudWeight: this.currentData.mudWeight,
            },
          })
        }
      }
    } else {
      // Reset kick warning timer if conditions are normal
      this.warningTimers["kick"] = 0
    }

    // Check for lost circulation (mud weight > fracture pressure)
    if (
      this.currentData.mudWeight > formationProps.fracturePressure ||
      this.currentData.standpipePressure > formationProps.fracturePressure * 150
    ) {
      // Decrease pit level to simulate lost circulation
      const lossRate = Math.max(
        (this.currentData.mudWeight - formationProps.fracturePressure) * 2,
        (this.currentData.standpipePressure - formationProps.fracturePressure * 150) * 0.01,
      )

      this.currentData.pitLevel -= lossRate * 0.1

      // Add lost circulation event if not already warned
      if (!this.warningTimers["lostCirculation"]) {
        this.warningTimers["lostCirculation"] = this.simulationTime
        this.warningTimestamps["lostCirculation"] = Date.now()

        const lostCircEvent = {
          type: "lostCirculation",
          time: new Date().toISOString(),
          depth: this.currentData.bitDepth,
          layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
          severity: "warning",
          description: "Lost circulation detected - formation fracture pressure exceeded",
        }

        this.eventLog.push(lostCircEvent)
        this.currentData.events.push(lostCircEvent)

        // Add to timeline
        this.addTimelineEvent({
          type: "lostCirculation",
          time: new Date().toISOString(),
          description: `Lost circulation at ${this.currentData.bitDepth.toFixed(0)}ft - fracture pressure: ${formationProps.fracturePressure.toFixed(1)} ppg`,
          severity: "warning",
          parameters: {
            depth: this.currentData.bitDepth,
            fracturePressure: formationProps.fracturePressure,
            mudWeight: this.currentData.mudWeight,
            standpipePressure: this.currentData.standpipePressure,
          },
        })
      }

      // If losses are severe, add a more critical event
      if (lossRate > 5 && !this.warningTimers["severeLostCirculation"]) {
        this.warningTimers["severeLostCirculation"] = this.simulationTime
        this.warningTimestamps["severeLostCirculation"] = Date.now()

        const severeLostCircEvent = {
          type: "severeLostCirculation",
          time: new Date().toISOString(),
          depth: this.currentData.bitDepth,
          layer: this.getLayerIndexAtDepth(this.currentData.bitDepth),
          severity: "critical",
          description: "Severe lost circulation - significant fluid loss to formation",
        }

        this.eventLog.push(severeLostCircEvent)
        this.currentData.events.push(severeLostCircEvent)
      }
    } else {
      // Reset lost circulation warning timers if conditions are normal
      this.warningTimers["lostCirculation"] = 0
      this.warningTimers["severeLostCirculation"] = 0
    }
  }

  /**
   * Add current data to logs
   */
  private addToLogs(): void {
    const logEntry = {
      time: new Date().toISOString(),
      depth: this.currentData.bitDepth,
      rop: this.currentData.rop,
      pumpPressure: this.currentData.pumpPressure,
      standpipePressure: this.currentData.standpipePressure,
      pitLevel: this.currentData.pitLevel,
      gasLevel: this.currentData.gasLevel,
      mudWeight: this.currentData.mudWeight,
      formationPressure: this.currentData.formationPressure,
      annularPressure: this.currentData.annularPressure,
      torque: this.currentData.torque,
      rpm: this.currentData.rpm,
      hookload: this.currentData.hookload,
    }

    this.logData.push(logEntry)

    // Keep log size manageable
    if (this.logData.length > 1000) {
      this.logData = this.logData.slice(-1000)
    }
  }

  /**
   * Get depth-based logs
   */
  public getDepthLogs(): any[] {
    // Combine event log and timeline events
    const allEvents = [
      ...this.eventLog.map((event) => ({
        depth: event.depth || 0,
        timestamp: event.time,
        eventType: event.type,
        parameters: {
          layer: event.layer,
          severity: event.severity,
          ...event.parameters,
        },
      })),
      ...this.timelineEvents.map((event) => ({
        depth: event.parameters?.depth || 0,
        timestamp: event.time,
        eventType: event.type,
        parameters: event.parameters || {},
      })),
      ...this.formationTransitions.map((transition) => ({
        depth: transition.depth,
        timestamp: transition.time,
        eventType: "formationTransition",
        parameters: {
          fromFormation: transition.fromFormation,
          toFormation: transition.toFormation,
          ...transition.properties,
        },
      })),
      ...this.actionLog.map((action) => ({
        depth: action.depth,
        timestamp: action.time,
        eventType: `action_${action.action}`,
        parameters: {
          value: action.value,
          ...action.parameters,
        },
      })),
    ]

    // Sort by depth
    return allEvents.sort((a, b) => a.depth - b.depth)
  }

  /**
   * Get time-based logs
   */
  public getTimeLogs(): any[] {
    // Use the same data as depth logs but sort by time
    const logs = this.getDepthLogs()
    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }
}
