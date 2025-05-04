"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, FileUp, AlertCircle, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { extractSvgLayers } from "@/lib/svg-parser" // Import the updated function
import { useToast } from "@/hooks/use-toast" // Assuming correct path

type Layer = {
  id: string
  name: string
  svgContent: string
}

interface UploadStageProps {
  // The first argument is now the *modified* SVG content string with IDs
  onSvgUploaded: (modifiedSvgContent: string, file: File, layers: Layer[]) => void
  // These props might be redundant now if parent handles state based on onSvgUploaded
  // but keep them for now if they are used for display within this component
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
    async (file: File | null) => { // Allow null to reset
      if (!file) {
        // Optional: Reset state if file is cleared
        // setSvgFile(null);
        // setError(null);
        // onSvgUploaded("", null, []); // Notify parent of reset? Depends on logic.
        return;
      }

      setIsParsingFile(true)
      setError(null)
      setSvgFile(file); // Set file early for UI feedback

      try {
        if (file.type !== "image/svg+xml") {
          throw new Error("Please upload an SVG file (image/svg+xml)");
        }

        const reader = new FileReader();

        // Read file content
        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (err) => reject(new Error(`Failed to read file: ${err}`));
          reader.readAsText(file);
        });

        if (!content) {
            throw new Error("File content could not be read or is empty.");
        }

        // --- CHANGE HERE ---
        // Extract SVG layers AND get the modified content with IDs
        const { layers: extractedLayers, modifiedContent } = extractSvgLayers(content);
        // --- END CHANGE ---

        // Check if extraction failed (e.g., parsing error inside extractSvgLayers)
        if (!modifiedContent && extractedLayers.length === 0) {
            // Check if default error object was returned
            if (extractSvgLayers(content).layers[0]?.id === 'error-parse') {
                 throw new Error("Failed to parse SVG content. Check console for details.");
            } else {
                 throw new Error("Failed to extract layers from SVG. The file might be invalid or empty.");
            }
        }


         // --- CHANGE HERE ---
        // Call the callback with the MODIFIED content string
        onSvgUploaded(modifiedContent, file, extractedLayers);
        // --- END CHANGE ---

        toast({
          title: "SVG Processed",
          description: `Extracted ${extractedLayers.length} layers. IDs have been assigned/verified.`,
          variant: "default",
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to process SVG file";
        setError(errorMessage);
        setSvgFile(null); // Clear invalid file
        // Notify parent of failure? Might need to adjust onSvgUploaded signature or add onError callback
        // onSvgUploaded("", null, []); // Clear parent state on error
        toast({
          title: "Processing Error",
          description: errorMessage,
          variant: "destructive",
        })
        console.error("SVG Processing Error:", err);
      } finally {
        setIsParsingFile(false);
      }
    },
    [toast, onSvgUploaded], // Dependency injection
  )

  // --- Drag and Drop Handlers (No changes needed here) ---
   const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Check if it's an SVG file before processing
        if (e.dataTransfer.files[0].type === "image/svg+xml") {
           handleFileChange(e.dataTransfer.files[0]);
        } else {
            setError("Please drop an SVG file (image/svg+xml).");
            toast({ title: "Invalid File Type", description: "Only SVG files are accepted.", variant: "warning" });
        }
        e.dataTransfer.clearData();
      }
    },
    [handleFileChange, toast],
  );


  // --- Input Click/Change Handlers (No changes needed here) ---
  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileChange(e.target.files[0]);
         // Reset input value to allow uploading the same file again
         e.target.value = '';
      }
    },
    [handleFileChange],
  );


  // --- JSX Rendering ---
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {/* Dropzone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-purple-500 bg-purple-50"
                : "border-gray-300 hover:border-purple-400" // Slightly change hover
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick} // Allow click anywhere
            aria-label="SVG Upload Dropzone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept="image/svg+xml" // More specific accept attribute
              className="hidden"
              aria-hidden="true"
            />
            {isParsingFile ? (
              <div className="flex flex-col items-center justify-center min-h-[100px]">
                <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
                <p className="mt-3 text-sm text-gray-600">Processing SVG...</p>
              </div>
            ) : (
               <div className="flex flex-col items-center justify-center min-h-[100px]">
                 <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                 <p className="mt-1 text-sm text-gray-600 font-medium">
                   Drag & drop SVG file here
                 </p>
                 <p className="mt-1 text-xs text-gray-500">or</p>
                 <Button variant="outline" className="mt-2 border-purple-600 text-purple-600 hover:bg-purple-50" size="sm">
                   <FileUp className="mr-2 h-4 w-4" />
                   Select File
                 </Button>
               </div>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

           {/* Success Alert - Show based on svgFile state */}
           {svgFile && !error && !isParsingFile && (
            <Alert variant="default" className="mt-4 border-green-300 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">File Ready</AlertTitle>
              <AlertDescription className="text-green-700">
                {svgFile.name} ({Math.round(svgFile.size / 1024)} KB) - Layers extracted. Proceed to next step.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

       {/* Preview Section - Uses svgContent prop passed from parent */}
       {svgContent && !isParsingFile && ( // Use the prop passed from parent for consistency
         <Card>
           <CardContent className="pt-6">
             <h3 className="font-medium mb-4">SVG Preview (Processed)</h3>
             <div className="border rounded-lg p-4 flex items-center justify-center bg-gray-50 min-h-[150px] overflow-auto">
               {/* Ensure container scales */}
               <div
                  className="max-w-full max-h-[400px] [&>svg]:max-w-full [&>svg]:h-auto" // Style svg directly
                  dangerouslySetInnerHTML={{ __html: svgContent }}
               />
             </div>
           </CardContent>
         </Card>
       )}

       {/* Layers Section - Uses layers prop passed from parent */}
       {layers.length > 0 && !isParsingFile && ( // Use the prop passed from parent
         <Card>
           <CardContent className="pt-6">
             <h3 className="font-medium mb-4">Detected Layers ({layers.length})</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"> {/* Adjust grid */}
               {layers.map((layer, index) => (
                 <div key={layer.id} className="border rounded-lg overflow-hidden shadow-sm">
                   <div className="p-3 bg-gray-50 border-b"> {/* Reduced padding */}
                     <h4 className="text-xs font-medium truncate" title={layer.name}> {/* Truncate long names */}
                       {layer.name || `Layer ${index + 1}`} {/* Fallback name */}
                     </h4>
                      {/* <p className="text-xs text-gray-500">{layer.id}</p> Display ID */}
                   </div>
                    <div
                      className="flex items-center justify-center h-[80px] p-2 bg-white" // Reduced height/padding
                      // Use layer's specific content for layer preview
                      dangerouslySetInnerHTML={{ __html: layer.svgContent }}
                    />
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       )}
    </div>
  );
}