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
        return "bg-blue-900/40 text-blue-300 border border-blue-700/50"
      case "secondary":
        return "bg-purple-900/40 text-purple-300 border border-purple-700/50"
      case "text":
        return "bg-green-900/40 text-green-300 border border-green-700/50"
      case "background":
        return "bg-orange-900/40 text-orange-300 border border-orange-700/50"
      default:
        return "bg-gray-800 text-gray-300 border border-gray-700"
    }
  }

  const getElementAnalysis = (layerId: string) => {
    if (!analysis) return null
    return analysis.elements.find((element) => element.id === layerId)
  }

  if (isAnalyzing) {
    return (
      <Card className="bg-gray-900 border-purple-900/30 shadow-purple-900/20 shadow-lg relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-800/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-800/10 rounded-full blur-3xl"></div>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-12 relative z-10">
          <Loader2 className="h-12 w-12 text-purple-500 mb-4 animate-spin" />
          <h3 className="text-xl font-medium mb-2 text-white">Analyzing with Claude AI</h3>
          <p className="text-gray-400 text-center max-w-md">
            Our AI is analyzing your SVG layers and suggesting meaningful animations based on what each element
            represents. This may take a moment...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card className="bg-gray-900 border-purple-900/30 shadow-purple-900/20 shadow-lg relative overflow-hidden">
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-800/10 rounded-full blur-3xl"></div>
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-800/10 rounded-full blur-3xl"></div>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-12 relative z-10">
          <Loader2 className="h-12 w-12 text-purple-500 mb-4 animate-spin" />
          <h3 className="text-xl font-medium mb-2 text-white">Starting Analysis</h3>
          <p className="text-gray-400 text-center max-w-md">Preparing to analyze your SVG with Claude AI...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-purple-900/30 shadow-purple-900/20 shadow-lg relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-800/10 rounded-full blur-3xl"></div>
        <CardContent className="pt-6 relative z-10">
          <h3 className="font-medium mb-4 text-white">Animation Concept</h3>
          <div className="p-4 bg-gray-800/80 rounded-lg border border-purple-700/30 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-700/10 rounded-full blur-3xl"></div>
            <p className="text-gray-300 relative z-10">{analysis.conceptDescription}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-purple-900/30 shadow-purple-900/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-purple-800/10 rounded-full blur-3xl"></div>
        <CardContent className="pt-6 relative z-10">
          <h3 className="font-medium mb-4 text-white">Layer Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {layers.map((layer, index) => {
              const elementAnalysis = getElementAnalysis(layer.id)

              return (
                <div key={layer.id} className="border border-purple-900/30 rounded-lg overflow-hidden bg-gray-800/80 backdrop-blur-sm shadow-lg shadow-purple-900/10 transition-all hover:shadow-purple-700/20 hover:border-purple-800/50">
                  <div className="p-4 bg-gray-900/80">
                    <h4 className="text-sm font-medium mb-2 text-white">
                      Layer {index + 1}: {layer.name}
                    </h4>
                    <div
                      className="flex items-center justify-center h-[100px] bg-black/50 rounded-lg"
                      dangerouslySetInnerHTML={{ __html: layer.svgContent }}
                    />
                  </div>

                  {elementAnalysis && (
                    <div className="p-4 border-t border-purple-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeColor(elementAnalysis.type)}>{elementAnalysis.type}</Badge>
                      </div>

                      <Tabs defaultValue="description" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-900">
                          <TabsTrigger 
                            value="description" 
                            className="data-[state=active]:bg-purple-900/70 data-[state=active]:text-white"
                          >
                            Description
                          </TabsTrigger>
                          <TabsTrigger 
                            value="animation"
                            className="data-[state=active]:bg-purple-900/70 data-[state=active]:text-white"
                          >
                            Animation
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="description" className="text-sm text-gray-300 mt-2">
                          {elementAnalysis.description}
                        </TabsContent>
                        <TabsContent value="animation" className="text-sm text-gray-300 mt-2">
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
        <Card className="bg-gray-900 border-purple-900/30 shadow-purple-900/20 shadow-lg relative overflow-hidden">
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-800/10 rounded-full blur-3xl"></div>
          <CardContent className="pt-6 relative z-10">
            <h3 className="font-medium mb-4 text-white">Suggested Groupings</h3>
            <div className="space-y-4">
              {analysis.groupings.map((group, index) => (
                <div key={index} className="border border-purple-900/30 rounded-lg p-4 bg-gray-800/80 backdrop-blur-sm shadow-lg shadow-purple-900/10 transition-all hover:shadow-purple-700/20 hover:border-purple-800/50 relative overflow-hidden">
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-700/10 rounded-full blur-3xl"></div>
                  <h4 className="font-medium mb-1 text-white relative z-10">{group.name}</h4>
                  <p className="text-sm mb-2 text-gray-300 relative z-10">{group.reason}</p>
                  <div className="flex flex-wrap gap-2 relative z-10">
                    {group.elementIds.map((id) => {
                      const layer = layers.find((l) => l.id === id)
                      return layer ? (
                        <Badge key={id} variant="outline" className="bg-gray-900/60 border-purple-700/30 text-gray-300">
                          {`${layer.name} (${id})`}
                        </Badge>
                      ) : (
                        <Badge key={id} variant="outline" className="bg-gray-900/60 border-purple-700/30 text-gray-300">
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
