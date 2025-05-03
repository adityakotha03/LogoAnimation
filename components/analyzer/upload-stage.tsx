"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, FileUp, AlertCircle, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { extractSvgLayers } from "@/lib/svg-parser"
import { useToast } from "@/hooks/use-toast"

type Layer = {
  id: string
  name: string
  svgContent: string
}

interface UploadStageProps {
  onSvgUploaded: (svgContent: string, file: File, layers: Layer[]) => void
  svgContent: string
  layers: Layer[]
}

export function UploadStage({ onSvgUploaded, svgContent, layers }: UploadStageProps) {
  const [svgFile, setSvgFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isParsingFile, setIsParsingFile] = useState(false)
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

        // Extract SVG layers
        const extractedLayers = extractSvgLayers(content)

        // Call the callback to notify parent component
        onSvgUploaded(content, file, extractedLayers)

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
    [toast, onSvgUploaded],
  )

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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging ? "border-purple-500 bg-purple-50" : "border-gray-300 hover:border-purple-500"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <input type="file" ref={fileInputRef} onChange={handleInputChange} accept=".svg" className="hidden" />
            {isParsingFile ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
                <p className="mt-2 text-sm text-gray-600">Parsing SVG file...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Drag and drop your SVG file here, or click to select</p>
                <Button className="mt-4 bg-purple-600 hover:bg-purple-700" size="sm">
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
      </Card>

      {svgContent && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">SVG Preview</h3>
            <div className="border rounded-lg p-4 flex items-center justify-center bg-gray-50 min-h-[200px]">
              <div className="max-w-full max-h-[300px]" dangerouslySetInnerHTML={{ __html: svgContent }} />
            </div>
          </CardContent>
        </Card>
      )}

      {layers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4">Detected Layers ({layers.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {layers.map((layer, index) => (
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
