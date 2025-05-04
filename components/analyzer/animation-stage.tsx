"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play, RefreshCw } from "lucide-react" // Added RefreshCw for replay
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast" // Assuming correct path

type Layer = { id: string; name: string; svgContent: string }
type SvgAnalysis = { elements: any[]; groupings: any[]; conceptDescription: string }

interface AnimationStageProps {
  analysis: SvgAnalysis
  svgLayers: Layer[]
  svgContent: string
}

// Make window properties optional to avoid errors if they don't exist initially
declare global {
  interface Window {
    anime?: any
    logoAnimation?: any // Optional, might not exist yet
  }
}

export function AnimationStage({ analysis, svgLayers, svgContent }: AnimationStageProps) {
  const [animationCode, setAnimationCode] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false) // Tracks if the *last run* animation is playing
  const [isAnimeJsLoaded, setIsAnimeJsLoaded] = useState(false)
  const [editedAnalysis, setEditedAnalysis] = useState<SvgAnalysis>({ ...analysis })
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Update editedAnalysis whenever the original analysis changes
  useEffect(() => {
    setEditedAnalysis({ ...analysis })
  }, [analysis])

  // Load anime.js
  useEffect(() => {
    // Check if already loaded or loading
    if (window.anime || document.querySelector('script[src*="anime.min.js"]')) {
      if (window.anime) setIsAnimeJsLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"
    script.async = true
    script.onload = () => {
      setIsAnimeJsLoaded(true)
      console.log("anime.js loaded successfully")
      // Clear any previous animation instances if the page was reloaded or script re-added
      window.logoAnimation = undefined
    }
    script.onerror = () => {
      console.error("Failed to load anime.js")
      toast({ title: "Error", description: "Failed to load anime.js library", variant: "destructive" })
    }
    document.body.appendChild(script)

    // Cleanup function to remove script if component unmounts (optional but good practice)
    return () => {
      const existingScript = document.querySelector('script[src*="anime.min.js"]')
      // Optional: Only remove if you are sure it won't affect other parts of the app
      // if (existingScript) {
      //   document.body.removeChild(existingScript);
      //   setIsAnimeJsLoaded(false); // Reset state if script is removed
      // }
    }
  }, [toast])

  // Reset SVG DOM
  const resetSvg = useCallback(() => {
    if (previewRef.current && svgContent) {
      // ... (pause animation logic) ...
      window.logoAnimation = undefined;
  
      // *** ADD THIS LOG ***
      console.log("--- SVG Content being set in resetSvg ---");
      console.log(svgContent);
      console.log("--- End SVG Content ---");
  
      previewRef.current.innerHTML = svgContent;
      setIsPlaying(false);
      console.log("SVG reset potentially complete (check DOM).");
  
      // Log check *immediately* after setting innerHTML (might still be 0)
      const immediateCheck = previewRef.current.querySelectorAll("svg *[id]");
      console.log(`Immediate check after innerHTML: ${immediateCheck.length} elements with IDs found.`);
  
  
      requestAnimationFrame(() => {
        if (previewRef.current) {
            const testElements = previewRef.current.querySelectorAll("svg *[id]");
            console.log(`requestAnimationFrame check: ${testElements.length} SVG elements with IDs found.`);
        }
      });
  
    } else {
      console.warn("Preview ref is null or svgContent is empty, cannot reset SVG", { hasPreviewRef: !!previewRef.current, hasSvgContent: !!svgContent });
    }
  }, [svgContent]); // Dependency is correct

  // Execute animation code
    // Execute animation code
    const executeAnimationCode = useCallback(
      (code: string) => {
        console.log("Executing animation code...");
        setError(null);
  
        if (!code?.trim()) { /* ... no code check ... */ return; }
        if (!window.anime) { /* ... anime.js check ... */ return; }
        if (!previewRef.current) { /* ... previewRef check ... */ return; }
  
        resetSvg();
  
        requestAnimationFrame(() => {
           setTimeout(() => {
              if (!previewRef.current) return;
  
              const elementsCheck = previewRef.current.querySelectorAll("svg *[id]");
              console.log(`Verifying elements inside timeout: ${elementsCheck.length} with IDs found.`);
              if (elementsCheck.length === 0) {
                  console.warn("Still no SVG elements with IDs found just before execution.");
                  setError("SVG elements not ready for animation.");
                  toast({ title: "Error", description: "SVG elements not found in time.", variant: "destructive" });
                  return;
              }
  
              const animeInstance = window.anime;
              const origTimeline = animeInstance.timeline;
              let timelineCreated = false;
              let capturedTimeline: any = null; // Backup capture via override
  
              // Override timeline (keep as a backup mechanism)
              animeInstance.timeline = ((opts: any) => {
                console.log("anime.timeline() override triggered."); // Log trigger
                const tl = origTimeline.call(animeInstance, opts);
                capturedTimeline = tl;
                timelineCreated = true;
                return tl;
              }) as any;
  
              try {
                let runCode = code;
                // Strip DOMContentLoaded wrapper (less likely needed now)
                const domContentMatch = runCode.match(/document\.addEventListener\(['"]DOMContentLoaded['"],\s*function\s*\(\)\s*{([\s\S]*)}\);?/i);
                 if (domContentMatch && domContentMatch[1]) {
                   console.log("Stripped DOMContentLoaded wrapper.");
                   runCode = domContentMatch[1].trim();
                 }
  
                // --- *** NEW: Modify code to DEFINE and CALL function *** ---
                let finalCodeToRun = runCode;
                const functionDefinitionMatch = runCode.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);
  
                if (functionDefinitionMatch && functionDefinitionMatch[1]) {
                    const functionNameToCall = functionDefinitionMatch[1];
                    console.log(`Detected function definition: ${functionNameToCall}`);
                    // Construct code that defines the function, calls it, and returns the result
                    finalCodeToRun = `${runCode}\nreturn ${functionNameToCall}();`; // Note the "return" here!
                    console.log(`Modified code to call ${functionNameToCall} and return its result.`);
                } else {
                    console.warn("Could not detect standard function definition. Executing original code.");
                    // If no function definition is found, run the original code.
                    // The timeline override (capturedTimeline) is the only way to get the timeline.
                }
                // --- *** END NEW *** ---
  
                console.log("Running animation code:\n---\n", finalCodeToRun, "\n---");
  
                const container = previewRef.current;
  
                // Execute the potentially modified code string
                const runner = new Function("anime", "container", finalCodeToRun);
                const resultFromRunner = runner(animeInstance, container); // This should now contain the returned timeline
  
                console.log("Code execution finished.");
                // Log details *after* execution
                console.log("Timeline captured via override:", capturedTimeline);
                console.log("Was anime.timeline override triggered?", timelineCreated);
                console.log("Result returned directly from runner execution:", resultFromRunner);
  
                // --- Check results and play ---
                // Prioritize the timeline returned by the function call
                const finalTimeline = resultFromRunner || capturedTimeline;
                window.logoAnimation = finalTimeline; // Set the global ref
  
                if (window.logoAnimation) {
                   if (typeof window.logoAnimation.play === 'function' && typeof window.logoAnimation.restart === 'function') {
                      console.log("Successfully obtained timeline. Restarting and playing.");
                      window.logoAnimation.restart();
                      window.logoAnimation.play();
                      setIsPlaying(true);
                      setError(null);
                      toast({ title: "Success", description: "Animation executed.", variant: "default" })
                   } else {
                      console.warn("Obtained object is not a valid anime.js timeline:", window.logoAnimation);
                      setError("Generated code ran but didn't produce a playable timeline.");
                      toast({ title: "Execution Warning", description: "Code ran, but no valid animation timeline was created.", variant: "warning" });
                      window.logoAnimation = undefined;
                   }
                } else {
                   console.warn("Execution completed, but no animation timeline was returned or captured via override.");
                   setError("Generated code ran but did not create/return an animation using anime.timeline().");
                   toast({ title: "Execution Issue", description: "Code executed, but it seems no animation timeline was created or returned.", variant: "warning" })
                   setIsPlaying(false);
                }
  
              } catch (err: any) {
                // ... (catch block) ...
                console.error("Error executing animation code:", err);
                setError(`Animation Execution Error: ${err.message || "Unknown error"}`);
                toast({ title: "Execution Error", description: `Failed to run animation code: ${err.message}`, variant: "destructive" })
                setIsPlaying(false);
                window.logoAnimation = undefined;
              } finally {
                // Restore original timeline function
                if (animeInstance) {
                   animeInstance.timeline = origTimeline;
                   console.log("Restored original anime.timeline function.");
                }
              }
           }, 50);
        });
      },
      [toast, resetSvg]
    );

  // Generate code
  const generateAnimationCode = async () => {
    setIsGenerating(true);
    setError(null);
    // Stop any existing animation before generating a new one
    if (window.logoAnimation && typeof window.logoAnimation.pause === 'function') {
        window.logoAnimation.pause();
        setIsPlaying(false);
    }
     window.logoAnimation = undefined; // Clear ref to old animation


    try {
      console.log("Sending request to generate animation with analysis:", editedAnalysis);

      const res = await fetch("/api/generate-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: editedAnalysis, // Use edited analysis
          svgLayers
        }),
      });

      if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch (e) {
            // Handle cases where the response is not valid JSON
            errorData = { error: `Server responded with status ${res.status}: ${res.statusText}` };
        }
        throw new Error(errorData?.error || "Generation request failed");
      }

      const data = await res.json();
      console.log("Received response:", data);

      if (!data.animationCode) {
        throw new Error("API response did not include animation code.");
      }

      setAnimationCode(data.animationCode);
      toast({ title: "Generated", description: "Animation code received.", variant: "default" });

      // Execute the *newly generated* code after state updates and short delay for DOM readiness
      // Using timeout here to let React render cycle finish after setAnimationCode
      setTimeout(() => {
        executeAnimationCode(data.animationCode);
      }, 100); // Reduced delay, relies more on requestAnimationFrame in execute func

    } catch (err: any) {
      console.error("Generation or execution error:", err);
      setError(err.message || "Failed to generate or execute animation code");
      toast({ title: "Generation Error", description: err.message || "An unknown error occurred", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Replay the last successfully executed animation
  const replayAnimation = () => {
      if (!window.anime) {
           toast({ title: "Error", description: "anime.js not loaded.", variant: "destructive" })
           return;
      }
      if (window.logoAnimation && typeof window.logoAnimation.restart === 'function') {
          console.log("Replaying last animation.");
          window.logoAnimation.restart();
          window.logoAnimation.play(); // Ensure it plays even if paused
          setIsPlaying(true);
          toast({ title: "Replaying", description: "Animation restarted.", variant: "default" });
      } else {
          console.warn("No valid animation found to replay.");
          toast({ title: "No Animation", description: "No animation has been successfully run yet.", variant: "warning" });
      }
  }


  // Apply manual code edits
  const applyCodeChanges = () => {
    if (!animationCode?.trim()) {
      toast({ title: "No Code", description: "There's no code in the editor to apply.", variant: "warning" });
      return;
    }
     console.log("Applying manually edited code...");
    executeAnimationCode(animationCode); // Execute the code currently in the textarea
    // executeAnimationCode already shows success/error toasts
  };

  // Initial setup: Reset SVG when component mounts or svgContent changes
  useEffect(() => {
    if (previewRef.current && svgContent) {
       console.log("Initial SVG setup or svgContent changed, resetting.");
      resetSvg();
    }
    // Clear any potential animation instance from previous renders/unmounts
     return () => {
         if (window.logoAnimation && typeof window.logoAnimation.pause === 'function') {
            window.logoAnimation.pause();
         }
         window.logoAnimation = undefined;
     }
  }, [svgContent, resetSvg]); // resetSvg is stable due to useCallback

  // Handle concept description text change
  const handleConceptDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedAnalysis(prev => ({
      ...prev,
      conceptDescription: e.target.value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Animation Generator</CardTitle>
        </CardHeader>
        <CardContent>
           {/* Analysis Editor - Moved Up for better flow */}
           <div className="mb-4 bg-gray-100 p-4 rounded-md border">
              <h3 className="font-medium mb-2 text-gray-800">1. Edit Analysis (Optional)</h3>
              <p className="text-sm text-gray-600 mb-2">
                Modify the description to influence the generated animation's style or focus.
              </p>
              <Textarea
                value={editedAnalysis?.conceptDescription || ""}
                onChange={handleConceptDescriptionChange}
                className="h-[100px] bg-white mb-2"
                placeholder="Describe the key elements and the desired animation concept (e.g., 'The shapes should assemble from the center outwards smoothly.')"
              />
            </div>

          <div className="flex flex-wrap gap-2">
             <h3 className="font-medium mb-2 text-gray-800 w-full">2. Generate or Modify Code</h3>
            <Button
              onClick={generateAnimationCode}
              disabled={isGenerating || !isAnimeJsLoaded || !editedAnalysis?.conceptDescription}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400"
              title={!editedAnalysis?.conceptDescription ? "Please provide an analysis description" : "Generate animation based on the analysis above"}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate New Animation"
              )}
            </Button>
          </div>

          {!isAnimeJsLoaded && <p className="mt-2 text-sm text-yellow-600">Loading animation library (anime.js)...</p>}
          {error && <p className="mt-4 text-red-600 font-medium">Error: {error}</p>}
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>3. Preview</CardTitle>
          <Button
            onClick={replayAnimation}
            disabled={!isAnimeJsLoaded || isGenerating} // Disable if generating
            variant="outline"
            size="sm"
            className="border-purple-600 text-purple-600 hover:bg-purple-50 hover:text-purple-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Replay Last Animation
          </Button>
        </CardHeader>
        <CardContent>
          <div
            ref={previewRef}
            className="border rounded p-4 bg-gray-50 min-h-[200px] flex items-center justify-center overflow-hidden" // Added min-height and overflow
            // Use dangerouslySetInnerHTML only on initial load / reset
            // Subsequent animations manipulate the existing DOM
          />
           {/* Status indicator can be added here if needed */}
           {/* {isPlaying && <p className="mt-2 text-sm text-green-600">Animation playing...</p>} */}

        </CardContent>
      </Card>

       {/* Code Editor Section (Only show if code exists) */}
       {animationCode && (
        <Card>
          <CardHeader>
            <CardTitle>4. Edit Code Directly (Advanced)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="bg-gray-100 p-4 rounded-md border space-y-4">
              <Textarea
                value={animationCode}
                onChange={(e) => {
                    setAnimationCode(e.target.value)
                    // Optionally clear error when user starts typing
                    // if(error) setError(null);
                }}
                className="font-mono text-sm h-[250px] whitespace-pre-wrap bg-white" // Use pre-wrap
                spellCheck="false"
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all"
                onClick={applyCodeChanges}
                disabled={!isAnimeJsLoaded || isGenerating}
              >
                <Play className="mr-2 h-4 w-4" /> Run Modified Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Removed Tabs - Simplified flow */}
    </div>
  );
}