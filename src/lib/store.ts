import { create } from "zustand"

interface ControlState {
  bopOpen: boolean
  targetDepth: number
  currentScenario: string
  scenarioActive: boolean
  setBopOpen: (open: boolean) => void
  setTargetDepth: (depth: number) => void
  setCurrentScenario: (scenario: string) => void
  setScenarioActive: (active: boolean) => void
}

export const useControlStore = create<ControlState>((set) => ({
  bopOpen: true, // Initial state is open
  targetDepth: 5000, // Default target depth
  currentScenario: "normal",
  scenarioActive: false,
  setBopOpen: (open) => set({ bopOpen: open }),
  setTargetDepth: (depth) => set({ targetDepth: depth }),
  setCurrentScenario: (scenario) => set({ currentScenario: scenario }),
  setScenarioActive: (active) => set({ scenarioActive: active }),
}))

interface ScenarioState {
  scenarios: Record<string, ScenarioConfig>
  completedScenarios: string[]
  addCompletedScenario: (scenarioId: string) => void
  resetCompletedScenarios: () => void
}

export interface ScenarioConfig {
  id: string
  name: string
  description: string
  difficulty: "easy" | "medium" | "hard"
  defaultTargetDepth: number
  minTargetDepth: number
  maxTargetDepth: number
  objectives: string[]
  nextScenario?: string
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: {
    normal: {
      id: "normal",
      name: "Normal Drilling",
      description: "Standard drilling operation with no complications",
      difficulty: "easy",
      defaultTargetDepth: 5000,
      minTargetDepth: 1000,
      maxTargetDepth: 10000,
      objectives: [
        "Maintain ROP between 50-100 ft/hr",
        "Keep pump pressure below 3000 psi",
        "Reach target depth of 5000 ft",
      ],
    },
    kick: {
      id: "kick",
      name: "Gas Kick",
      description: "Drilling into an overpressured zone causing a gas kick",
      difficulty: "medium",
      defaultTargetDepth: 3000,
      minTargetDepth: 1500,
      maxTargetDepth: 5000,
      objectives: [
        "Detect the kick early",
        "Properly shut in the well",
        "Circulate out the kick safely",
        "Adjust mud weight appropriately",
      ],
      nextScenario: "lost-circulation",
    },
    "lost-circulation": {
      id: "lost-circulation",
      name: "Lost Circulation",
      description: "Drilling through a fractured zone causing lost circulation",
      difficulty: "medium",
      defaultTargetDepth: 2500,
      minTargetDepth: 1000,
      maxTargetDepth: 4000,
      objectives: [
        "Identify lost circulation",
        "Reduce pump rate and pressure",
        "Add lost circulation material to mud",
        "Stabilize wellbore",
      ],
      nextScenario: "stuck-pipe",
    },
    "stuck-pipe": {
      id: "stuck-pipe",
      name: "Stuck Pipe",
      description: "Drill string becomes stuck due to differential sticking",
      difficulty: "hard",
      defaultTargetDepth: 3500,
      minTargetDepth: 1500,
      maxTargetDepth: 5000,
      objectives: [
        "Recognize signs of stuck pipe",
        "Apply appropriate freeing techniques",
        "Adjust drilling parameters to prevent recurrence",
      ],
      nextScenario: "blowout",
    },
    blowout: {
      id: "blowout",
      name: "Blowout Prevention",
      description: "High-pressure formation with risk of blowout",
      difficulty: "hard",
      defaultTargetDepth: 4000,
      minTargetDepth: 2000,
      maxTargetDepth: 6000,
      objectives: [
        "Monitor pressure indicators closely",
        "Respond quickly to kick indicators",
        "Properly activate BOP system",
        "Implement well control procedures",
      ],
    },
  },
  completedScenarios: [],
  addCompletedScenario: (scenarioId) =>
    set((state) => ({
      completedScenarios: state.completedScenarios.includes(scenarioId)
        ? state.completedScenarios
        : [...state.completedScenarios, scenarioId],
    })),
  resetCompletedScenarios: () => set({ completedScenarios: [] }),
}))
