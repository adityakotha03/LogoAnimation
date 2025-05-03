"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

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

interface CaptionsStageProps {
  svgContent: string
  layers: Layer[]
  isAnalyzing: boolean
  analysis: SvgAnalysis | null
}

export function CaptionsStage({ svgContent, layers, isAnalyzing, analysis }: CaptionsStageProps) {
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

  const getElementAnalysis = (layerId: string) => {
    if (!analysis) return null
    return analysis.elements.find((element) => element.id === layerId)
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-purple-500 mb-4 animate-spin" />
          <h3 className="text-xl font-medium mb-2">Analyzing with Claude AI</h3>
          <p className="text-gray-600 text-center max-w-md">
            Our AI is analyzing your SVG layers and suggesting meaningful animations based on what each element
            represents. This may take a moment...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-purple-500 mb-4 animate-spin" />
          <h3 className="text-xl font-medium mb-2">Starting Analysis</h3>
          <p className="text-gray-600 text-center max-w-md">Preparing to analyze your SVG with Claude AI...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Animation Concept</h3>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-gray-800">{analysis.conceptDescription}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4">Layer Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {layers.map((layer, index) => {
              const elementAnalysis = getElementAnalysis(layer.id)

              return (
                <div key={layer.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 bg-gray-50">
                    <h4 className="text-sm font-medium mb-2">
                      Layer {index + 1}: {layer.name}
                    </h4>
                    <div
                      className="flex items-center justify-center h-[100px]"
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

      {analysis.groupings.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Suggested Groupings</h3>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
