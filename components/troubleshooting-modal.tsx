"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

interface TroubleshootingModalProps {
  isOpen: boolean
  onClose: () => void
  simulationEngine: any
  riskType: string | null
}

interface ActionOption {
  id: string
  label: string
  isCorrect: boolean
  explanation: string
}

export default function TroubleshootingModal({
  isOpen,
  onClose,
  simulationEngine,
  riskType,
}: TroubleshootingModalProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<"correct" | "incorrect" | null>(null)
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([])
  const [explanation, setExplanation] = useState("")

  // Set action options based on risk type
  useEffect(() => {
    if (!riskType) return

    let options: ActionOption[] = []

    switch (riskType) {
      case "kick":
        options = [
          {
            id: "closeBOP",
            label: "Close BOP and shut in well",
            isCorrect: true,
            explanation:
              "Correct! Closing the BOP prevents further influx and allows you to regain control of the well.",
          },
          {
            id: "increasePumpRate",
            label: "Increase pump rate to circulate out the kick",
            isCorrect: false,
            explanation:
              "Incorrect. Increasing pump rate without shutting in the well can worsen the kick by allowing more formation fluid to enter.",
          },
          {
            id: "pullOutOfHole",
            label: "Pull out of hole to check the drill string",
            isCorrect: false,
            explanation:
              "Incorrect. Pulling out during a kick can cause a swabbing effect, worsening the influx and potentially leading to a blowout.",
          },
          {
            id: "increaseMudWeight",
            label: "Immediately increase mud weight",
            isCorrect: false,
            explanation:
              "Partially correct, but you should first shut in the well before adjusting mud weight to kill the kick.",
          },
        ]
        break

      case "lostCirculation":
        options = [
          {
            id: "reducePumpRate",
            label: "Reduce pump rate and ECD",
            isCorrect: true,
            explanation:
              "Correct! Reducing pump rate lowers the equivalent circulating density and pressure on the formation, helping to stop losses.",
          },
          {
            id: "increaseMudWeight",
            label: "Increase mud weight",
            isCorrect: false,
            explanation:
              "Incorrect. Increasing mud weight will increase hydrostatic pressure, potentially worsening the losses.",
          },
          {
            id: "continueDrilling",
            label: "Continue drilling ahead",
            isCorrect: false,
            explanation:
              "Incorrect. Continuing to drill with active losses can lead to wellbore instability and potential stuck pipe.",
          },
          {
            id: "addLCM",
            label: "Add lost circulation material to mud",
            isCorrect: true,
            explanation: "Correct! Adding LCM can help seal fractures in the formation and reduce or stop losses.",
          },
        ]
        break

      case "pitDepletion":
        options = [
          {
            id: "stopPumps",
            label: "Stop pumps immediately",
            isCorrect: true,
            explanation: "Correct! Stopping pumps prevents further loss of mud and allows you to assess the situation.",
          },
          {
            id: "increasePumpRate",
            label: "Increase pump rate to maintain circulation",
            isCorrect: false,
            explanation:
              "Incorrect. Increasing pump rate with depleted pits will quickly exhaust remaining mud and potentially damage pumps.",
          },
          {
            id: "addWaterToPits",
            label: "Add water to pits to maintain volume",
            isCorrect: false,
            explanation:
              "Incorrect. Diluting mud with water changes its properties and reduces its ability to control formation pressure.",
          },
          {
            id: "pullOutOfHole",
            label: "Pull out of hole",
            isCorrect: false,
            explanation:
              "Incorrect. Pulling out without addressing the mud loss can lead to wellbore instability and potential well control issues.",
          },
        ]
        break

      case "highPressure":
        options = [
          {
            id: "reduceROP",
            label: "Reduce ROP and circulate bottoms up",
            isCorrect: true,
            explanation:
              "Correct! Reducing ROP allows better hole cleaning and pressure management while circulating helps assess the situation.",
          },
          {
            id: "increaseMudWeight",
            label: "Increase mud weight immediately",
            isCorrect: true,
            explanation:
              "Correct! Increasing mud weight helps control the high pressure zone, but should be done carefully to avoid fracturing formation.",
          },
          {
            id: "continueDrilling",
            label: "Continue drilling at current parameters",
            isCorrect: false,
            explanation:
              "Incorrect. Continuing to drill into a high-pressure zone without adjusting parameters can lead to a kick or blowout.",
          },
          {
            id: "reduceMudWeight",
            label: "Reduce mud weight to decrease ECD",
            isCorrect: false,
            explanation:
              "Incorrect. Reducing mud weight when encountering high pressure will reduce your primary barrier against formation fluids.",
          },
        ]
        break

      case "equipmentFailure":
        options = [
          {
            id: "stopOperations",
            label: "Stop operations and inspect equipment",
            isCorrect: true,
            explanation:
              "Correct! Stopping operations allows you to assess and address equipment issues before they lead to failure.",
          },
          {
            id: "reduceParameters",
            label: "Reduce operating parameters (RPM, WOB, flow rate)",
            isCorrect: true,
            explanation:
              "Correct! Reducing operating parameters can alleviate stress on equipment and prevent catastrophic failure.",
          },
          {
            id: "increaseParameters",
            label: "Increase parameters to work through the issue",
            isCorrect: false,
            explanation:
              "Incorrect. Increasing parameters when equipment is showing signs of failure will likely accelerate the failure.",
          },
          {
            id: "ignoreFeedback",
            label: "Continue normal operations - sensors may be faulty",
            isCorrect: false,
            explanation:
              "Incorrect. Ignoring warning signs of equipment failure can lead to catastrophic failure, NPT, and safety incidents.",
          },
        ]
        break

      case "wellboreInstability":
        options = [
          {
            id: "adjustMudProperties",
            label: "Adjust mud properties (weight, viscosity)",
            isCorrect: true,
            explanation:
              "Correct! Proper mud properties help stabilize the wellbore and prevent further deterioration.",
          },
          {
            id: "reduceROP",
            label: "Reduce ROP and improve hole cleaning",
            isCorrect: true,
            explanation: "Correct! Slower drilling with better hole cleaning helps maintain wellbore stability.",
          },
          {
            id: "continueDrilling",
            label: "Continue drilling to get through unstable zone",
            isCorrect: false,
            explanation:
              "Incorrect. Continuing to drill through an unstable zone without addressing the issue can lead to stuck pipe or collapse.",
          },
          {
            id: "runCasing",
            label: "Run casing to isolate the unstable zone",
            isCorrect: true,
            explanation:
              "Correct! Running casing is often the best solution to isolate unstable zones and prevent further deterioration.",
          },
        ]
        break

      default:
        options = [
          {
            id: "stopOperations",
            label: "Stop operations and assess the situation",
            isCorrect: true,
            explanation: "Stopping operations is generally the safest approach when facing an unknown issue.",
          },
          {
            id: "continueCautiously",
            label: "Continue operations with caution",
            isCorrect: false,
            explanation: "Continuing operations without understanding the issue can lead to worsening conditions.",
          },
          {
            id: "adjustParameters",
            label: "Adjust drilling parameters",
            isCorrect: false,
            explanation: "Adjusting parameters without understanding the root cause may not address the issue.",
          },
          {
            id: "consultExpert",
            label: "Consult with drilling engineer/supervisor",
            isCorrect: true,
            explanation: "Consulting with experts is always a good approach when facing unusual situations.",
          },
        ]
    }

    setActionOptions(options)
  }, [riskType])

  // Handle action selection
  const handleActionSelect = (actionId: string) => {
    setSelectedAction(actionId)

    // Find if action is correct
    const selectedOption = actionOptions.find((option) => option.id === actionId)

    if (selectedOption) {
      setActionResult(selectedOption.isCorrect ? "correct" : "incorrect")
      setExplanation(selectedOption.explanation)

      // Apply action in simulation engine if available
      if (simulationEngine) {
        simulationEngine.applyTroubleshootingAction(actionId, selectedOption.isCorrect)
      }
    }
  }

  // Handle close and reset
  const handleClose = () => {
    setSelectedAction(null)
    setActionResult(null)
    setExplanation("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Critical Situation - Take Action Now
          </DialogTitle>
          <DialogDescription>
            {riskType === "kick" && "Formation fluid is entering the wellbore. Select your response:"}
            {riskType === "lostCirculation" && "Drilling fluid is being lost to the formation. Select your response:"}
            {riskType === "pitDepletion" && "Mud pit levels are critically low. Select your response:"}
            {riskType === "highPressure" && "Approaching a high-pressure zone. Select your response:"}
            {riskType === "equipmentFailure" && "Equipment showing signs of imminent failure. Select your response:"}
            {riskType === "wellboreInstability" && "Wellbore showing signs of instability. Select your response:"}
            {!riskType && "A critical situation requires your immediate response. Select your action:"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {actionOptions.map((option) => (
            <Button
              key={option.id}
              variant={
                selectedAction === option.id ? (actionResult === "correct" ? "success" : "destructive") : "outline"
              }
              className={`justify-start text-left ${
                selectedAction && selectedAction !== option.id ? "opacity-50" : ""
              }`}
              onClick={() => handleActionSelect(option.id)}
              disabled={selectedAction !== null}
            >
              {selectedAction === option.id && actionResult === "correct" && (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              )}
              {selectedAction === option.id && actionResult === "incorrect" && (
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
              )}
              {option.label}
            </Button>
          ))}
        </div>

        {explanation && (
          <div
            className={`p-3 rounded-md text-sm ${
              actionResult === "correct" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            {explanation}
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          {actionResult && (
            <Button variant={actionResult === "correct" ? "default" : "secondary"} onClick={handleClose}>
              {actionResult === "correct" ? "Continue Operations" : "Try Different Approach"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
