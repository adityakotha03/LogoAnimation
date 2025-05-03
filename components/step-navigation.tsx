"use client"

import { ChevronRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

export type Step = {
  id: string
  label: string
  isCompleted: boolean
  isActive: boolean
  isEnabled: boolean
}

interface StepNavigationProps {
  steps: Step[]
  onStepClick: (stepId: string) => void
}

export function StepNavigation({ steps, onStepClick }: StepNavigationProps) {
  return (
    <div className="bg-gray-100 rounded-md overflow-hidden shadow-sm mb-6">
      <div className="flex items-center">
        {steps.map((step, index) => {
          // A step is clickable if:
          // 1. It's a previous step (backward navigation)
          // 2. It's the current active step
          const currentStepIndex = steps.findIndex((s) => s.isActive)
          const isClickable = index <= currentStepIndex

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable}
                className={cn(
                  "px-4 py-3 flex items-center transition-colors",
                  step.isActive
                    ? "bg-purple-600 text-white font-medium"
                    : step.isCompleted
                      ? "hover:bg-gray-200 text-gray-800"
                      : "text-gray-400",
                  !isClickable && "cursor-not-allowed opacity-60",
                )}
              >
                <span>{step.label}</span>
                {!isClickable && index > currentStepIndex && <Lock className="ml-2 h-3 w-3 text-gray-400" />}
              </button>

              {index < steps.length - 1 && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4",
                    step.isActive || steps[index + 1].isActive ? "text-purple-600" : "text-gray-400",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
