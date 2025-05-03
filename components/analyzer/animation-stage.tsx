"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type Layer = { id: string; name: string; svgContent: string }
type SvgAnalysis = { elements: any[]; groupings: any[]; conceptDescription: string }

interface AnimationStageProps {
  analysis: SvgAnalysis
  svgLayers: Layer[]
  svgContent: string
}

declare global {
  interface Window {
    anime: any
    logoAnimation: any
  }
}

export function AnimationStage({ analysis, svgLayers, svgContent }: AnimationStageProps) {
  const [animationCode, setAnimationCode] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnimeJsLoaded, setIsAnimeJsLoaded] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load anime.js
  useEffect(() => {
    if ((window as any).anime) {
      setIsAnimeJsLoaded(true)
      return
    }
    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"
    script.async = true
    script.onload = () => {
      setIsAnimeJsLoaded(true)
      console.log("anime.js loaded successfully")
    }
    script.onerror = () => {
      console.error("Failed to load anime.js")
      toast({ title: "Error", description: "Failed to load anime.js library", variant: "destructive" })
    }
    document.body.appendChild(script)
  }, [toast])

  // Reset SVG DOM
  const resetSvg = useCallback(() => {
    if (previewRef.current) {
      previewRef.current.innerHTML = svgContent
      console.log("SVG reset complete", previewRef.current)
    } else {
      console.warn("Preview ref is null, cannot reset SVG")
    }
  }, [svgContent])

  // Execute animation code
  const executeAnimationCode = useCallback(
    (code: string) => {
      if (!code.trim()) {
        console.warn("No animation code to execute.")
        return
      }
      if (!window.anime) {
        console.error("anime.js not loaded yet")
        toast({
          title: "Animation Error",
          description: "anime.js not loaded. Please try again.",
          variant: "destructive",
        })
        return
      }
      if (!previewRef.current) {
        console.error("Preview ref is null")
        toast({ title: "Animation Error", description: "Preview container not found.", variant: "destructive" })
        return
      }

      resetSvg()

      // Pause any existing animation
      if (window.logoAnimation) {
        try {
          window.logoAnimation.pause()
        } catch (err) {
          console.warn("Error pausing previous animation:", err)
        }
      }

      const animeInstance = window.anime
      const origTimeline = animeInstance.timeline

      // Override timeline to capture
      animeInstance.timeline = ((opts: any) => {
        const tl = origTimeline.call(animeInstance, opts)
        window.logoAnimation = tl
        return tl
      }) as any

      try {
        // Strip DOMContentLoaded wrapper if present
        let runCode = code
        const match = runCode.match(/document\.addEventListener$$'DOMContentLoaded',\s*function$$$$\s*{([\s\S]*)}$$;?/)
        if (match && match[1]) {
          runCode = match[1]
        }

        // Debug log
        console.log("Running animation code:\n", runCode)

        // Test if elements exist before animation
        const testElements = previewRef.current.querySelectorAll("svg *[id]")
        console.log(
          `Found ${testElements.length} SVG elements with IDs:`,
          Array.from(testElements).map((el) => el.id),
        )

        // Execute the code
        const runner = new Function("anime", runCode)
        runner(animeInstance)

        if (window.logoAnimation) {
          window.logoAnimation.restart()
          window.logoAnimation.play()
          setIsPlaying(true)
          console.log("Animation started successfully")
        } else {
          console.warn("No logoAnimation created, falling back to default")
          // Fallback: simple fade-in animation
          const tl = animeInstance.timeline({ autoplay: true })
          const elems = previewRef.current.querySelectorAll(
            "svg path, svg circle, svg rect, svg ellipse, svg polygon, svg polyline, svg line, svg text",
          )
          console.log(`Fallback animation: found ${elems.length} SVG elements`)

          if (elems.length) {
            tl.add({
              targets: elems,
              opacity: [0, 1],
              translateY: [10, 0],
              duration: 500,
              delay: animeInstance.stagger(100),
              easing: "easeOutQuad",
            })
            window.logoAnimation = tl
            setIsPlaying(true)
          } else {
            toast({ title: "Warning", description: "No SVG elements found to animate", variant: "warning" })
          }
        }
        setError(null)
      } catch (err: any) {
        console.error("Animation execution error:", err)
        setError(err.message || "Animation execution error")
        toast({ title: "Execution Error", description: err.message || "", variant: "destructive" })
      } finally {
        // Restore original timeline function
        animeInstance.timeline = origTimeline
      }
    },
    [toast, svgContent, resetSvg],
  )

  // Generate code
  const generateAnimationCode = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      console.log("Sending request to generate animation...")
      const res = await fetch("/api/generate-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, svgLayers }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Generation failed")
      }

      const data = await res.json()
      console.log("Received response:", data)

      // Check if we got animation code
      if (!data.animationCode) {
        throw new Error("No animation code received from API")
      }

      setAnimationCode(data.animationCode)

      toast({ title: "Generated", description: "Animation code ready.", variant: "default" })

      // Execute after a short delay to ensure DOM is ready
      setTimeout(() => {
        executeAnimationCode(data.animationCode)
      }, 500)
    } catch (err: any) {
      console.error("Generation error:", err)
      setError(err.message || "Failed to generate animation code")
      toast({ title: "Generation Error", description: err.message || "", variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  // Test simple animation function
  const testAnimation = () => {
    if (!window.anime || !previewRef.current) {
      toast({ title: "Error", description: "anime.js not loaded or preview missing", variant: "destructive" })
      return
    }

    resetSvg()

    console.log("Running test animation")
    const tl = window.anime.timeline()
    const elems = previewRef.current.querySelectorAll("svg *")
    console.log(`Found ${elems.length} elements for test animation`)

    tl.add({
      targets: elems,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 2000,
      easing: "easeInOutQuad",
      delay: window.anime.stagger(100),
    })

    window.logoAnimation = tl
    setIsPlaying(true)
  }

  // Apply manual code edits
  const applyCodeChanges = () => {
    if (!animationCode.trim()) {
      toast({ title: "No Code", description: "There's no code to apply.", variant: "destructive" })
      return
    }
    executeAnimationCode(animationCode)
    toast({ title: "Applied", description: "Code changes applied.", variant: "default" })
  }

  // Initial setup
  useEffect(() => {
    if (svgContent && previewRef.current) {
      resetSvg()
    }
  }, [svgContent, resetSvg])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Animation Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={generateAnimationCode}
              disabled={isGenerating || !isAnimeJsLoaded}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Animation"
              )}
            </Button>
          </div>

          {!isAnimeJsLoaded && <p className="mt-2 text-sm">Loading anime.js library...</p>}
          {error && <p className="mt-2 text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={previewRef}
            className="border rounded p-4 bg-gray-50 min-h-32 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
          <div className="mt-4 flex space-x-2">
            <Button
              onClick={testAnimation}
              disabled={!isAnimeJsLoaded}
              className="bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg"
            >
              <Play className="mr-2 h-4 w-4" /> Run Animation
            </Button>
          </div>
        </CardContent>
      </Card>

      {animationCode && (
        <Card>
          <CardHeader>
            <CardTitle>Animation Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="code">
              <TabsList className="mb-4">
                <TabsTrigger value="code">Edit Code Directly</TabsTrigger>
                <TabsTrigger value="analysis">Edit Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Code Editor</h3>
                  <Textarea
                    value={animationCode}
                    onChange={(e) => setAnimationCode(e.target.value)}
                    className="font-mono text-sm h-[200px] whitespace-pre bg-white"
                  />
                  <Button
                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white transition-all"
                    onClick={applyCodeChanges}
                  >
                    <Play className="mr-2 h-4 w-4" /> Run Modified Code
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <div className="bg-gray-100 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Analysis Editor</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Modify the analysis description to generate a new animation with different characteristics
                  </p>
                  <Textarea
                    value={analysis?.conceptDescription || ""}
                    onChange={(e) => {
                      if (analysis) {
                        analysis.conceptDescription = e.target.value
                      }
                    }}
                    className="h-[200px] bg-white"
                  />
                  <Button
                    className="mt-2 bg-purple-600 hover:bg-purple-700 text-white transition-all"
                    onClick={generateAnimationCode}
                  >
                    <Loader2 className="mr-2 h-4 w-4" /> Regenerate Animation
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
