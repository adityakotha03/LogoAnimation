"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, FileUp, AlertCircle, Check, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { extractSvgLayers } from "@/lib/svg-parser"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AnimationGenerator } from "@/components/animation-generator"

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

export function SvgUploader() {
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [svgContent, setSvgContent] = useState<string>("")
  const [svgUrl, setSvgUrl] = useState<string>("")
  const [layers, setLayers] = useState<Layer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<SvgAnalysis | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = useCallback(
    async (file: File) => {
      if (!file) return

      setIsParsingFile(true)
      setError(null)

      try {
        if (file.type !== "image/svg+xml") {
          throw new Error("Please upload an SVG file")
        }

        setSvgFile(file)

        const reader = new FileReader()

        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error("Failed to read file"))
          reader.readAsText(file)
        })

        setSvgContent(content)

        // Create object URL for displaying the SVG
        const blob = new Blob([content], { type: "image/svg+xml" })
        const url = URL.createObjectURL(blob)
        setSvgUrl(url)

        // Extract SVG layers
        const extractedLayers = extractSvgLayers(content)
        setLayers(extractedLayers)

        // Reset analysis when a new file is uploaded
        setAnalysis(null)

        toast({
          title: "SVG uploaded successfully",
          description: `Extracted ${extractedLayers.length} layers`,
          variant: "default",
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to parse SVG file"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        console.error(err)
      } finally {
        setIsParsingFile(false)
      }
    },
    [toast],
  )

  const analyzeSvg = async () => {
    if (layers.length === 0) return

    setIsAnalyzing(true)
    setError(null)

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

      toast({
        title: "Analysis complete",
        description: "SVG layers have been analyzed successfully",
        variant: "default",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze SVG"
      setError(errorMessage)
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files[0])
      }
    },
    [handleFileChange],
  )

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileChange(e.target.files[0])
      }
    },
    [handleFileChange],
  )

  const getElementAnalysis = (layerId: string) => {
    if (!analysis) return null
    return analysis.elements.find((element) => element.id === layerId)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "primary":
        return "bg-blue-100 text-blue-800"
      case "secondary":
        return "bg-purple-100 text-purple-800"
      case "text":
        return "bg-green-100 text-green-800"
      case "background":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload SVG Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <input type="file" ref={fileInputRef} onChange={handleInputChange} accept=".svg" className="hidden" />
            {isParsingFile ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
                <p className="mt-2 text-sm text-gray-600">Parsing SVG file...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Drag and drop your SVG file here, or click to select</p>
                <Button className="mt-4" size="sm">
                  <FileUp className="mr-2 h-4 w-4" />
                  Select SVG File
                </Button>
              </>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {svgFile && !error && (
            <Alert className="mt-4">
              <Check className="h-4 w-4" />
              <AlertTitle>File uploaded</AlertTitle>
              <AlertDescription>
                {svgFile.name} ({Math.round(svgFile.size / 1024)} KB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        {layers.length > 0 && (
          <CardFooter>
            <Button onClick={analyzeSvg} disabled={isAnalyzing || layers.length === 0} className="ml-auto">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with Claude...
                </>
              ) : (
                "Analyze SVG with Claude"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {svgUrl && (
        <Card>
          <CardHeader>
            <CardTitle>SVG Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 flex items-center justify-center bg-gray-50 min-h-[200px]">
              <div className="max-w-full max-h-[300px]" dangerouslySetInnerHTML={{ __html: svgContent }} />
            </div>
          </CardContent>
        </Card>
      )}

      {layers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Layers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layers.map((layer, index) => {
                const elementAnalysis = getElementAnalysis(layer.id)

                return (
                  <div key={layer.id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50">
                      <h3 className="text-sm font-medium mb-2">
                        Layer {index + 1}: {layer.name}
                      </h3>
                      <div
                        className="flex items-center justify-center h-[150px]"
                        dangerouslySetInnerHTML={{ __html: layer.svgContent }}
                      />
                    </div>

                    {elementAnalysis && (
                      <div className="p-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(elementAnalysis.type)}>{elementAnalysis.type}</Badge>
                        </div>

                        <Tabs defaultValue="description" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="description">Description</TabsTrigger>
                            <TabsTrigger value="animation">Animation</TabsTrigger>
                          </TabsList>
                          <TabsContent value="description" className="text-sm">
                            {elementAnalysis.description}
                          </TabsContent>
                          <TabsContent value="animation" className="text-sm">
                            {elementAnalysis.animationSuggestion}
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Animation Concept</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Overall Concept</h3>
                  <p>{analysis.conceptDescription}</p>
                </div>

                {analysis.groupings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Suggested Groupings</h3>
                    <div className="space-y-4">
                      {analysis.groupings.map((group, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-1">{group.name}</h4>
                          <p className="text-sm mb-2">{group.reason}</p>
                          <div className="flex flex-wrap gap-2">
                            {group.elementIds.map((id) => {
                              const layer = layers.find((l) => l.id === id)
                              return layer ? (
                                <Badge key={id} variant="outline">
                                  {`${layer.name} (${id})`}
                                </Badge>
                              ) : (
                                <Badge key={id} variant="outline">
                                  {id}
                                </Badge>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <AnimationGenerator analysis={analysis} svgLayers={layers} svgContent={svgContent} />
        </>
      )}
    </div>
  )
}
