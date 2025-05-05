"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play, RefreshCw, Download } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import html2canvas from 'html2canvas';

// --- Types ---
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

// --- Component ---
export function AnimationStage({ analysis, svgLayers, svgContent }: AnimationStageProps) {
  const [animationCode, setAnimationCode] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false) // Tracks if the *last run* animation is playing
  const [isAnimeJsLoaded, setIsAnimeJsLoaded] = useState(false)
  const [editedAnalysis, setEditedAnalysis] = useState<SvgAnalysis>({ ...analysis })
  const [isExporting, setIsExporting] = useState(false); // New state for export status
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
      window.logoAnimation = undefined // Clear any previous animation instances
    }
    script.onerror = () => {
      console.error("Failed to load anime.js")
      toast({ title: "Error", description: "Failed to load anime.js library", variant: "destructive" })
    }
    document.body.appendChild(script)

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[src*="anime.min.js"]')
      // Optional: Consider if removing the script is desired on unmount
      // if (existingScript) {
      //   document.body.removeChild(existingScript);
      //   setIsAnimeJsLoaded(false);
      // }
    }
  }, [toast])

  // Reset SVG DOM
  const resetSvg = useCallback(() => {
    if (previewRef.current && svgContent) {
      // Pause and clear any existing animation instance
      if (window.logoAnimation && typeof window.logoAnimation.pause === 'function') {
        window.logoAnimation.pause();
      }
      window.logoAnimation = undefined;

      // Reset the innerHTML with the base SVG content
      previewRef.current.innerHTML = svgContent;
      setIsPlaying(false); // Reset playing state
      console.log("SVG reset.");

      // Immediate check (might show 0 before repaint)
      const immediateCheck = previewRef.current.querySelectorAll("svg *[id]");
      console.log(`Immediate check after innerHTML reset: ${immediateCheck.length} elements with IDs found.`);

      // Check after a render frame to allow DOM update
      requestAnimationFrame(() => {
        if (previewRef.current) {
            const postFrameCheck = previewRef.current.querySelectorAll("svg *[id]");
            console.log(`requestAnimationFrame check after reset: ${postFrameCheck.length} SVG elements with IDs found.`);
        }
      });

    } else {
      console.warn("Preview ref is null or svgContent is empty, cannot reset SVG", { hasPreviewRef: !!previewRef.current, hasSvgContent: !!svgContent });
    }
  }, [svgContent]); // Dependency is correct

  // Execute animation code
  const executeAnimationCode = useCallback(
    (code: string) => {
      console.log("Executing animation code...");
      setError(null);

      if (!code?.trim()) {
          toast({ title: "No Code", description: "Animation code is empty.", variant: "warning" });
          return;
      }
      if (!window.anime) {
          toast({ title: "Error", description: "anime.js is not loaded.", variant: "destructive" });
          setError("anime.js not loaded");
          return;
      }
      if (!previewRef.current) {
          toast({ title: "Error", description: "Preview area not available.", variant: "destructive" });
          setError("Preview DOM element not found");
          return;
      }

      resetSvg(); // Reset SVG before executing new code

      // Delay execution slightly to ensure DOM is ready after resetSvg
      requestAnimationFrame(() => {
         setTimeout(() => { // Additional small delay can sometimes help complex SVGs render
            if (!previewRef.current) return; // Re-check ref

            const elementsCheck = previewRef.current.querySelectorAll("svg *[id]");
            console.log(`Verifying elements before execution: ${elementsCheck.length} with IDs found.`);
            if (elementsCheck.length === 0 && svgContent.includes("id=")) {
                // Warn if SVG seems to have IDs but none are found in DOM yet
                console.warn("Potential timing issue: SVG has IDs but none found in DOM before execution attempt.");
                setError("SVG elements might not be ready. Try again.");
                toast({ title: "Warning", description: "SVG elements not found immediately. If animation fails, try again.", variant: "warning" });
                // Optionally, could add a retry mechanism here
            }

            const animeInstance = window.anime;
            const origTimeline = animeInstance.timeline;
            let timelineCreated = false;
            let capturedTimeline: any = null; // Backup capture via override

            // Override timeline (as a backup)
            animeInstance.timeline = ((opts: any) => {
              console.log("anime.timeline() override triggered.");
              const tl = origTimeline.call(animeInstance, opts);
              capturedTimeline = tl;
              timelineCreated = true;
              return tl;
            }) as any;

            try {
              let runCode = code;
              // Strip common wrappers (DOMContentLoaded)
              const domContentMatch = runCode.match(/document\.addEventListener\(['"]DOMContentLoaded['"],\s*function\s*\(\)\s*{([\s\S]*)}\);?/i);
              if (domContentMatch && domContentMatch[1]) {
                console.log("Stripped DOMContentLoaded wrapper.");
                runCode = domContentMatch[1].trim();
              }
              // Strip IIFE (Immediately Invoked Function Expression)
              const iifeMatch = runCode.match(/^\s*\(\s*function\s*\(\s*\)\s*{([\s\S]*)}\s*\)\s*\(\s*\)\s*;?\s*$/)
              if (iifeMatch && iifeMatch[1]) {
                console.log("Stripped IIFE wrapper.");
                runCode = iifeMatch[1].trim();
              }

              // --- Modify code to DEFINE and CALL function, returning the timeline ---
              let finalCodeToRun = runCode;
              // Regex to find "function functionName(" or "const functionName = () => {" or "let functionName = function()" etc.
              const functionDefinitionMatch = runCode.match(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z0-9_$]+)\s*(?:=\s*function)?\s*\(/);

              if (functionDefinitionMatch && functionDefinitionMatch[1]) {
                  const functionNameToCall = functionDefinitionMatch[1];
                  console.log(`Detected function definition: ${functionNameToCall}`);
                  // Check if the code already calls the function
                  const callRegex = new RegExp(`\\b${functionNameToCall}\\s*\\(`, 'g');
                  if (!callRegex.test(runCode)) {
                      // Construct code that defines the function, calls it, and returns the result
                      finalCodeToRun = `${runCode}\n\n// Attempt to call and return timeline\ntry { return ${functionNameToCall}(); } catch(e) { console.error('Error calling detected function:', e); return null; }`;
                      console.log(`Modified code to call ${functionNameToCall} and return its result.`);
                  } else {
                      console.log(`Function ${functionNameToCall} seems to be called already. Running as is, relying on return or override.`);
                      // Maybe it returns the timeline? Or maybe it assigns it globally? We rely on the backup capture.
                      // To ensure we get the return value if it exists *and* is called:
                       finalCodeToRun = `${runCode}\n\n// Ensure return if function is called and returns timeline\ntry { if(typeof ${functionNameToCall} === 'function') { const result = ${functionNameToCall}(); if (result && typeof result.play === 'function') return result; } } catch(e) {} return null;`;
                  }
              } else {
                  console.warn("Could not detect standard function definition. Executing original code and relying on timeline override.");
                  // Wrap the code in a function to capture potential return value if it's just expression(s)
                  finalCodeToRun = `try { ${runCode}; return null; /* Or rely on override */ } catch(e) { console.error('Error in raw code execution:', e); throw e; }`;
              }
              // --- End modification ---

              console.log("Running animation code:\n---\n", finalCodeToRun, "\n---");
              const container = previewRef.current; // Pass container if needed by the script

              // Use Function constructor to execute in a controlled scope
              const runner = new Function("anime", "container", finalCodeToRun);
              const resultFromRunner = runner(animeInstance, container); // Execute

              console.log("Code execution finished.");
              console.log("Timeline captured via override:", capturedTimeline);
              console.log("Was anime.timeline override triggered?", timelineCreated);
              console.log("Result returned directly from runner:", resultFromRunner);

              // --- Check results and play ---
              // Prioritize the timeline returned directly by the executed function
              const finalTimeline = resultFromRunner || capturedTimeline;
              window.logoAnimation = finalTimeline; // Store globally

              if (window.logoAnimation && typeof window.logoAnimation.play === 'function' && typeof window.logoAnimation.restart === 'function') {
                 console.log("Successfully obtained timeline. Restarting and playing.");
                 window.logoAnimation.restart(); // Start from beginning
                 window.logoAnimation.play();
                 setIsPlaying(true);
                 setError(null);
                 toast({ title: "Success", description: "Animation executed.", variant: "default" })
              } else {
                 console.warn("Execution completed, but no valid anime.js timeline was returned or captured.", { resultFromRunner, capturedTimeline });
                 setError("Generated code ran but didn't produce a playable animation timeline.");
                 toast({ title: "Execution Warning", description: "Code ran, but no valid animation timeline was found.", variant: "warning" });
                 window.logoAnimation = undefined;
                 setIsPlaying(false);
              }

            } catch (err: any) {
              console.error("Error executing animation code:", err);
              setError(`Animation Execution Error: ${err.message || "Unknown error"}`);
              toast({ title: "Execution Error", description: `Failed to run animation code: ${err.message}`, variant: "destructive" })
              setIsPlaying(false);
              window.logoAnimation = undefined;
            } finally {
              // Restore original timeline function regardless of success/error
              if (animeInstance) {
                 animeInstance.timeline = origTimeline;
                 console.log("Restored original anime.timeline function.");
              }
            }
         }, 50); // Small delay after rAF
      });
    },
    [toast, resetSvg, svgContent] // Added svgContent dependency for the check inside
  );

  // Generate code
  const generateAnimationCode = async () => {
    setIsGenerating(true);
    setError(null);
    setIsPlaying(false); // Stop visual indication of playing
    // Stop any existing animation before generating a new one
    if (window.logoAnimation && typeof window.logoAnimation.pause === 'function') {
        window.logoAnimation.pause();
    }
     window.logoAnimation = undefined; // Clear ref to old animation

    try {
      console.log("Sending request to generate animation with analysis:", editedAnalysis);

      const res = await fetch("/api/generate-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: editedAnalysis, // Use edited analysis
          svgLayers // Pass layers if your API needs them
        }),
      });

      if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch (e) {
            errorData = { error: `Server responded with status ${res.status}: ${res.statusText}` };
        }
        throw new Error(errorData?.error || `Generation request failed (${res.status})`);
      }

      const data = await res.json();
      console.log("Received response:", data);

      if (!data.animationCode) {
        throw new Error("API response did not include animation code.");
      }

      setAnimationCode(data.animationCode);
      toast({ title: "Generated", description: "Animation code received.", variant: "default" });

      // Execute the *newly generated* code
      // Use a timeout to allow React state update and DOM reset to potentially complete
      setTimeout(() => {
        executeAnimationCode(data.animationCode);
      }, 100); // Delay allows state/DOM updates

    } catch (err: any) {
      console.error("Generation or initial execution error:", err);
      setError(err.message || "Failed to generate or execute animation code");
      toast({ title: "Error", description: err.message || "An unknown error occurred", variant: "destructive" });
      setAnimationCode(""); // Clear code on generation error
    } finally {
      setIsGenerating(false);
    }
  };

  // Replay the last successfully executed animation
  const replayAnimation = () => {
      if (!isAnimeJsLoaded) {
           toast({ title: "Error", description: "anime.js not loaded.", variant: "destructive" })
           return;
      }
      if (window.logoAnimation && typeof window.logoAnimation.restart === 'function') {
          console.log("Replaying last animation.");
          window.logoAnimation.restart();
          window.logoAnimation.play(); // Ensure it plays
          setIsPlaying(true); // Update state
          setError(null); // Clear previous errors
          toast({ title: "Replaying", description: "Animation restarted.", variant: "default" });
      } else {
          console.warn("No valid animation found to replay.");
          toast({ title: "No Animation", description: "No animation has been successfully run yet or it was invalid.", variant: "warning" });
          setIsPlaying(false); // Ensure state is false
      }
  }

  // Apply manual code edits
  const applyCodeChanges = () => {
    if (!animationCode?.trim()) {
      toast({ title: "No Code", description: "There's no code in the editor to apply.", variant: "warning" });
      return;
    }
     console.log("Applying manually edited code...");
     setIsPlaying(false); // Reset playing state before trying new code
    executeAnimationCode(animationCode); // Execute the code currently in the textarea
  };

  // Video Export Function
  const handleExportVideo = async () => {
    if (!isAnimeJsLoaded) {
       toast({ title: "Export Error", description: "anime.js not loaded.", variant: "destructive" });
       return;
    }
    if (!window.logoAnimation || typeof window.logoAnimation.seek !== 'function' || typeof window.logoAnimation.duration !== 'number') {
      toast({ title: "Export Error", description: "A valid animation must be run first.", variant: "destructive" });
      return;
    }
    if (!previewRef.current) {
      toast({ title: "Export Error", description: "Preview area not found.", variant: "destructive" });
      return;
    }
    if (!window.MediaRecorder) {
       toast({ title: "Export Error", description: "Video recording (MediaRecorder API) is not supported in this browser.", variant: "destructive" });
       return;
    }

    setIsExporting(true);
    setIsPlaying(false); // Stop any live playback indication
    toast({ title: "Exporting Video", description: "Starting video capture... Please wait.", variant: "info" });

    const originalAnimation = window.logoAnimation;
    const duration = originalAnimation.duration; // Duration in ms
    const fps = 30; // Target Frames per second
    const frameDelay = 1000 / fps;
    const totalFrames = Math.ceil((duration * fps) / 1000);
    const previewElement = previewRef.current;

    // Get dimensions accurately
    let width = previewElement.offsetWidth;
    let height = previewElement.offsetHeight;
     // Ensure dimensions are not zero
     if (width === 0 || height === 0) {
        const bounds = previewElement.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
    }
    width = Math.round(width);
    height = Math.round(height);

    if (width === 0 || height === 0) {
         toast({ title: "Export Error", description: "Could not determine preview area dimensions.", variant: "destructive" });
         setIsExporting(false);
         return;
    }


    // Create a canvas for capturing frames
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        toast({ title: "Export Error", description: "Failed to get canvas context for recording.", variant: "destructive" });
        setIsExporting(false);
        return;
    }

    // MediaRecorder Setup
    const chunks: Blob[] = [];
    let videoStream: MediaStream | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let requestedMimeType = 'video/mp4;codecs=avc1'; // Try MP4 first
    let actualMimeType = requestedMimeType;
    let fileExtension = 'mp4';

    try {
       // Pause the source animation and go to start
       originalAnimation.pause();
       originalAnimation.seek(0);

       // Wait a moment for the seek(0) to visually apply before starting capture
       await new Promise(resolve => setTimeout(resolve, 50));


       videoStream = canvas.captureStream(fps); // Capture stream from canvas

       if (!MediaRecorder.isTypeSupported(requestedMimeType)) {
            console.warn(`MIME type ${requestedMimeType} not supported. Falling back to webm.`);
            toast({ title: "Format Note", description: "MP4 export not directly supported by browser, exporting as WebM.", variant: "info" });
            requestedMimeType = 'video/webm;codecs=vp9'; // Try specific webm codec
             if (!MediaRecorder.isTypeSupported(requestedMimeType)) {
                 requestedMimeType = 'video/webm'; // Generic webm fallback
             }
            fileExtension = 'webm';
            if (!MediaRecorder.isTypeSupported(requestedMimeType)) {
                 console.error(`Fallback MIME type ${requestedMimeType} also not supported.`);
                 throw new Error("No supported video format found (tried MP4 and WebM).");
            }
       }
       actualMimeType = requestedMimeType; // Store the type that will actually be used
       console.log(`Using MIME type: ${actualMimeType}`);

       mediaRecorder = new MediaRecorder(videoStream, {
            mimeType: actualMimeType,
            // videoBitsPerSecond: 2500000 // Optional: Adjust bitrate
        });

       mediaRecorder.ondataavailable = (e) => {
         if (e.data.size > 0) {
           chunks.push(e.data);
           console.log(`Chunk received: ${e.data.size} bytes`);
         }
       };

       mediaRecorder.onstop = () => {
         console.log("MediaRecorder stopped. Processing blob.");
         if (chunks.length === 0) {
             console.error("Recording stopped, but no data chunks were received.");
             toast({ title: "Export Error", description: "Recording finished with no video data. Try again.", variant: "destructive"});
             setIsExporting(false);
             // Reset animation state
             originalAnimation.seek(0);
             originalAnimation.pause();
             return;
         }
         const blob = new Blob(chunks, { type: actualMimeType });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.style.display = 'none';
         a.href = url;
         a.download = `logo-animation.${fileExtension}`; // Use correct extension
         document.body.appendChild(a);
         a.click();
         // Wait a moment before removing the link and revoking the URL
         setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              console.log("Download link clicked and resources released.");
         }, 100);

         toast({ title: "Export Complete", description: `Video saved as logo-animation.${fileExtension}`, variant: "success" });
         setIsExporting(false);
         // Reset animation visually after export
         originalAnimation.seek(0);
         originalAnimation.pause();
       };

       mediaRecorder.onerror = (e) => {
         console.error("MediaRecorder error:", e);
         // Attempt to provide more specific error info if available
         let errorMessage = "MediaRecorder error occurred.";
         if (e instanceof Event && 'error' in e && e.error instanceof DOMException) {
             errorMessage = `MediaRecorder error: ${e.error.name} - ${e.error.message}`;
         }
         throw new Error(errorMessage);
       }

       // --- Frame Capture Loop ---
       mediaRecorder.start();
       console.log(`Starting recording (${actualMimeType}), Duration: ${duration}ms, Target Frames: ${totalFrames}, Frame Delay: ${frameDelay.toFixed(2)}ms`);

       let frameCount = 0;
       const captureFrame = async () => {
         // Check if recorder is still running and we haven't exceeded frames
         if (!mediaRecorder || mediaRecorder.state !== 'recording' || frameCount > totalFrames) {
             if (mediaRecorder && mediaRecorder.state === 'recording') {
                console.log(`Stopping recorder. Frame count: ${frameCount}, Total frames target: ${totalFrames}`);
                mediaRecorder.stop();
             } else {
                console.log("Recording loop finished or recorder already stopped.");
                if(mediaRecorder?.state === 'inactive' && chunks.length === 0) {
                     // If stopped early and no chunks, likely an error occurred before data event
                     toast({ title: "Export Warning", description: "Recording stopped prematurely with no data.", variant: "warning"});
                     setIsExporting(false);
                     originalAnimation.seek(0);
                     originalAnimation.pause();
                 }
             }
             return; // End the loop
         }

         const currentTime = Math.min(frameCount * frameDelay, duration);
         originalAnimation.seek(currentTime);

         // Allow anime.js to update the DOM/styles based on seek
         // requestAnimationFrame might be slightly better for visual updates before capture
         await new Promise(resolve => requestAnimationFrame(resolve));
         // await new Promise(resolve => setTimeout(resolve, 1)); // Alternative small delay

         // Use html2canvas to draw the current state onto our capture canvas
         try {
            // Ensure the preview element is visible and has dimensions
             if (previewElement.offsetWidth === 0 || previewElement.offsetHeight === 0) {
                 console.warn(`Preview element has zero dimensions at frame ${frameCount}. Skipping frame.`);
                 frameCount++;
                 setTimeout(captureFrame, 0); // Schedule next frame attempt
                 return;
             }

            const sourceCanvas = await html2canvas(previewElement, {
                useCORS: true,
                logging: false,
                width: canvas.width,
                height: canvas.height,
                scale: 1,
                backgroundColor: window.getComputedStyle(previewElement).backgroundColor || '#ffffff', // Use preview bg or white
                 x: 0, // Try explicitly setting capture origin
                 y: 0,
                 scrollX: -window.scrollX, // Account for page scroll
                 scrollY: -window.scrollY,
                 windowWidth: document.documentElement.offsetWidth, // Provide window dimensions
                 windowHeight: document.documentElement.offsetHeight
            });

            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous frame
            ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);

            // Trigger stream update (important!)
            // Accessing the track forces an update in some browsers
             const track = videoStream?.getVideoTracks()[0];
            if(track && 'requestFrame' in track) {
                (track as any).requestFrame(); // Non-standard, but can help in Chromium
            } else {
                 // Fallback: redraw slightly offset? Sometimes helps trigger change detection.
                 // ctx.drawImage(sourceCanvas, 0, 1, canvas.width, canvas.height-1);
                 // ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
            }


            // Optional: Log progress
            if (frameCount % fps === 0) { // Log every second
                console.log(`Captured frame ${frameCount}/${totalFrames} at time ${currentTime.toFixed(0)}ms`);
            }

         } catch (captureError: any) {
            console.error(`Error capturing frame ${frameCount} at time ${currentTime}:`, captureError);
            toast({ title: "Frame Capture Error", description: `Failed on frame ${frameCount}. Export may be incomplete. ${captureError.message}`, variant: "destructive" });
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                 mediaRecorder.stop(); // Stop recording on error
            }
            setIsExporting(false); // Set exporting to false on error
            originalAnimation.seek(0); // Reset animation state
            originalAnimation.pause();
            return; // Stop the loop
         }


         frameCount++;
         // Schedule the next frame immediately after the current one is processed
         setTimeout(captureFrame, 0); // Use 0ms delay for tight loop

       };

       captureFrame(); // Start the capture loop

    } catch (error: any) {
        console.error("Video export setup or loop failed:", error);
        toast({ title: "Export Failed", description: error.message || "An unknown error occurred during export setup.", variant: "destructive" });
        setIsExporting(false);
        // Ensure recorder is stopped if it exists and was recording
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            try {
                mediaRecorder.stop();
            } catch (stopError) {
                console.error("Error stopping media recorder during cleanup:", stopError);
            }
        }
         // Reset animation state
         originalAnimation.seek(0);
         originalAnimation.pause();
    }
  };

  // Initial setup: Reset SVG when component mounts or svgContent changes
  useEffect(() => {
    if (previewRef.current && svgContent) {
       console.log("Initial SVG setup or svgContent changed, resetting.");
      resetSvg();
    }
    // Cleanup animation instance on unmount
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
    // Optionally clear generation error when user edits analysis
    // if (error && error.startsWith("Failed to generate")) setError(null);
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* --- Generation Card --- */}
      <Card>
        <CardHeader>
          <CardTitle>Animation Generator</CardTitle>
        </CardHeader>
        <CardContent>
           {/* Analysis Editor */}
           <div className="mb-4 bg-gray-100 p-4 rounded-md border border-gray-200">
              <h3 className="font-medium mb-2 text-gray-800">1. Edit Analysis (Optional)</h3>
              <p className="text-sm text-gray-600 mb-2">
                Modify the description to guide the AI's animation style. Clearer descriptions yield better results.
              </p>
              <Textarea
                value={editedAnalysis?.conceptDescription || ""}
                onChange={handleConceptDescriptionChange}
                className="h-[100px] bg-white mb-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                placeholder="Describe the logo and the desired animation (e.g., 'Shapes fade in sequentially, then the text slides up.')"
                disabled={isGenerating || isExporting}
              />
            </div>

          {/* Generate Button */}
          <div className="flex flex-wrap gap-2">
             <h3 className="font-medium mb-2 text-gray-800 w-full">2. Generate or Modify</h3>
            <Button
              onClick={generateAnimationCode}
              disabled={isGenerating || !isAnimeJsLoaded || !editedAnalysis?.conceptDescription || isExporting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title={!isAnimeJsLoaded ? "Waiting for animation library..." : !editedAnalysis?.conceptDescription ? "Please provide an analysis description above" : isGenerating ? "Generation in progress..." : isExporting ? "Export in progress..." : "Generate animation based on the analysis"}
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
          {error && <p className="mt-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">Error: {error}</p>}
        </CardContent>
      </Card>

      {/* --- Preview & Export Section --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2 flex-wrap">
          <CardTitle className="mb-2 sm:mb-0">3. Preview & Export</CardTitle>
          <div className="flex items-center space-x-2 flex-wrap"> {/* Group buttons */}
            <Button
              onClick={replayAnimation}
              disabled={!isAnimeJsLoaded || isGenerating || isExporting || !window.logoAnimation}
              variant="outline"
              size="sm"
              className="border-purple-600 text-purple-600 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!isAnimeJsLoaded ? "Waiting for animation library..." : !window.logoAnimation ? "Run an animation first" : isGenerating ? "Generation in progress..." : isExporting ? "Export in progress..." : "Replay the last animation"}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Replay
            </Button>
            {/* Export Button */}
            <Button
                onClick={handleExportVideo}
                disabled={!isAnimeJsLoaded || isGenerating || isExporting || !window.logoAnimation}
                variant="outline"
                size="sm"
                className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!isAnimeJsLoaded ? "Waiting for animation library..." : !window.logoAnimation ? "Run an animation first" : isGenerating ? "Generation in progress..." : isExporting ? "Export in progress..." : "Export animation as video (MP4 attempt, likely WebM)"}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" /> Export Video
                  </>
                )}
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Preview Area */}
          <div
            ref={previewRef}
            className="border border-gray-300 rounded p-4 bg-gray-50 min-h-[250px] flex items-center justify-center overflow-hidden"
            style={{ position: 'relative' }} // Needed for reliable html2canvas bounds
          >
            {/* SVG content is injected here by resetSvg */}
             {!svgContent && <p className="text-gray-500">SVG Preview Area</p>}
          </div>
           {/* Status Indicators */}
           {/* {isPlaying && !isExporting && <p className="mt-2 text-xs text-green-600">Animation playing...</p>} */}
           {isExporting && <p className="mt-2 text-xs text-blue-600">Exporting video, please wait... This may take time and consume resources.</p>}

        </CardContent>
      </Card>

       {/* --- Code Editor Section (Conditional) --- */}
       {animationCode && (
        <Card>
          <CardHeader>
            <CardTitle>4. Edit Code Directly (Advanced)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="bg-gray-100 p-4 rounded-md border border-gray-200 space-y-3">
                <p className="text-sm text-gray-600">
                    You can modify the generated Javascript (using anime.js) below and run it. Ensure the code defines and potentially returns an `anime.timeline()` object.
                </p>
              <Textarea
                value={animationCode}
                onChange={(e) => {
                    setAnimationCode(e.target.value)
                    // Clear execution error when user edits code
                    if (error && error.startsWith("Animation Execution Error")) setError(null);
                }}
                className="font-mono text-sm h-[250px] whitespace-pre-wrap bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                spellCheck="false"
                disabled={isGenerating || isExporting}
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={applyCodeChanges}
                disabled={!isAnimeJsLoaded || isGenerating || isExporting || !animationCode.trim()}
                title={!isAnimeJsLoaded ? "Waiting for animation library..." : !animationCode.trim() ? "Code editor is empty" : isGenerating ? "Generation in progress..." : isExporting ? "Export in progress..." : "Run the modified code in the editor"}
              >
                <Play className="mr-2 h-4 w-4" /> Run Modified Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}