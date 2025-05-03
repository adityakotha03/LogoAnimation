"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { StepNavigation, type Step } from "@/components/step-navigation"
import { UploadStage } from "@/components/analyzer/upload-stage"
import { CaptionsStage } from "@/components/analyzer/captions-stage"
import { AnimationStage } from "@/components/analyzer/animation-stage"
import { useToast } from "@/hooks/use-toast"

type Layer = {
  id: string
  name: string
  svgContent: string
}

type ElementAnalysis = {
  id: string
  type: "primary" | "secondary" | "text" | "background"
  description: string
  animationSuggestion: string
}

type Grouping = {
  name: string
  elementIds: string[]
  reason: string
}

type SvgAnalysis = {
  elements: ElementAnalysis[]
  groupings: Grouping[]
  conceptDescription: string
}

export default function AnalyzerPage() {
  const [steps, setSteps] = useState<Step[]>([
    { id: "upload", label: "Upload", isCompleted: false, isActive: true, isEnabled: true },
    { id: "captions", label: "Generate Captions", isCompleted: false, isActive: false, isEnabled: false },
    { id: "animate", label: "Animate", isCompleted: false, isActive: false, isEnabled: false },
  ])

  const [activeStepId, setActiveStepId] = useState("upload")
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [svgContent, setSvgContent] = useState<string>("")
  const [layers, setLayers] = useState<Layer[]>([])
  const [analysis, setAnalysis] = useState<SvgAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  // Update step status
  const updateStepStatus = (stepId: string, updates: Partial<Step>) => {
    setSteps(steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)))
  }

  // Activate a specific step
  const activateStep = (stepId: string) => {
    setSteps(
      steps.map((step) => ({
        ...step,
        isActive: step.id === stepId,
      })),
    )
    setActiveStepId(stepId)
  }

  // Handle step click (only for backward navigation)
  const handleStepClick = (stepId: string) => {
    // Find the current step index
    const currentStepIndex = steps.findIndex((s) => s.isActive)
    // Find the clicked step index
    const clickedStepIndex = steps.findIndex((s) => s.id === stepId)

    // Only allow navigation to previous steps or the current step
    if (clickedStepIndex <= currentStepIndex) {
      activateStep(stepId)
    }
  }

  // Handle SVG upload
  const handleSvgUploaded = (content: string, file: File, extractedLayers: Layer[]) => {
    setSvgContent(content)
    setSvgFile(file)
    setLayers(extractedLayers)

    // Mark upload step as completed and enable captions step
    updateStepStatus("upload", { isCompleted: true })
    updateStepStatus("captions", { isEnabled: true })
  }

  // Handle next from upload
  const handleNextFromUpload = () => {
    if (!svgContent || layers.length === 0) {
      toast({
        title: "No SVG uploaded",
        description: "Please upload an SVG file first",
        variant: "destructive",
      })
      return
    }

    // Activate captions step
    activateStep("captions")

    // Automatically start analysis
    analyzeSvg()
  }

  // Analyze SVG with Claude
  const analyzeSvg = async () => {
    if (layers.length === 0) return

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/analyze-svg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ svgLayers: layers }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze SVG")
      }

      const data = await response.json()
      setAnalysis(data.analysis)

      // Mark captions step as completed and enable animate step
      updateStepStatus("captions", { isCompleted: true })
      updateStepStatus("animate", { isEnabled: true })

      toast({
        title: "Analysis complete",
        description: "SVG layers have been analyzed successfully",
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze SVG"
      toast({
        title: "Analysis error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle next from captions
  const handleNextFromCaptions = () => {
    if (!analysis) {
      toast({
        title: "No analysis available",
        description: "Please wait for the analysis to complete",
        variant: "destructive",
      })
      return
    }

    // Activate animate step
    activateStep("animate")
  }

  // Auto-start analysis when entering captions tab
  useEffect(() => {
    if (activeStepId === "captions" && !isAnalyzing && !analysis && layers.length > 0) {
      analyzeSvg()
    }
  }, [activeStepId, isAnalyzing, analysis, layers])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b bg-purple-600 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-bold">Back to Animify</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">SVG Animation Creator</h1>

        <StepNavigation steps={steps} onStepClick={handleStepClick} />

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {activeStepId === "upload" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Upload Your SVG</h2>
              <p className="text-gray-600 mb-6">
                Start by uploading your layered SVG file. We'll analyze its structure and suggest animations.
              </p>

              <UploadStage onSvgUploaded={handleSvgUploaded} svgContent={svgContent} layers={layers} />

              {svgContent && layers.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNextFromUpload} className="bg-purple-600 hover:bg-purple-700">
                    Next: Generate Captions <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeStepId === "captions" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Generate Captions</h2>
              <p className="text-gray-600 mb-6">
                We're analyzing your SVG to understand its components and suggest meaningful animations.
              </p>

              <CaptionsStage svgContent={svgContent} layers={layers} isAnalyzing={isAnalyzing} analysis={analysis} />

              {analysis && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNextFromCaptions} className="bg-purple-600 hover:bg-purple-700">
                    Next: Animate <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeStepId === "animate" && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Generate Animation</h2>
              <p className="text-gray-600 mb-6">
                Now we'll generate a beautiful animation based on the analysis of your SVG.
              </p>

              <AnimationStage analysis={analysis!} svgLayers={layers} svgContent={svgContent} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
