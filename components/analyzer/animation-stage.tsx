"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play, RefreshCw } from "lucide-react" // Added RefreshCw for replay
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast" // Assuming correct path
import { VideoUpload } from "./video-stage"

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
  const [backgroundVideo, setBackgroundVideo] = useState<string | null>(null)
  const [editedAnalysis, setEditedAnalysis] = useState<SvgAnalysis>({ ...analysis })
  const previewRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast()

  // Modified preview container styles
  const previewContainerStyle = {
    position: 'relative' as const,
    width: '100%',
    minHeight: '200px',
    backgroundColor: backgroundVideo ? 'black' : '#121212',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const svgOverlayStyle = {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  };

  const videoStyle = {
    width: '100%',
    height: 'auto',
  };

  // Handle video selection
  const handleVideoSelect = (videoUrl: string | null) => {
    setBackgroundVideo(videoUrl);
  };

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
      window.logoAnimation = undefined;
      
      // Create or get the SVG overlay container
      let overlayContainer = previewRef.current.querySelector('.svg-overlay-container') as HTMLDivElement;
      if (!overlayContainer) {
        overlayContainer = document.createElement('div');
        overlayContainer.className = 'svg-overlay-container';
        Object.assign(overlayContainer.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: '10'
        });
        previewRef.current.appendChild(overlayContainer);
      }
      
      overlayContainer.innerHTML = svgContent;
      overlayRef.current = overlayContainer;
      setIsPlaying(false);
      
      // Scale SVG to fit container while maintaining aspect ratio
      const svg = overlayContainer.querySelector('svg');
      if (svg instanceof SVGElement) {
        Object.assign(svg.style, {
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto'
        });
      }
    }
  }, [svgContent]);

  // Cleanup function for video URLs
  useEffect(() => {
    return () => {
      if (backgroundVideo) {
        URL.revokeObjectURL(backgroundVideo);
      }
    };
  }, [backgroundVideo]);

  // Execute animation code
  const executeAnimationCode = useCallback(
    (code: string) => {
      console.log("Executing animation code...");
      setError(null);

      if (!code?.trim()) return;
      if (!window.anime) return;
      if (!previewRef.current) return;

      resetSvg();

      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!previewRef.current || !overlayRef.current) return;

          const elementsCheck = overlayRef.current.querySelectorAll("svg *[id]");
          console.log(`Verifying elements inside timeout: ${elementsCheck.length} with IDs found.`);
          
          if (elementsCheck.length === 0) {
            console.warn("No SVG elements with IDs found just before execution.");
            setError("SVG elements not ready for animation.");
            toast({ title: "Error", description: "SVG elements not found in time.", variant: "destructive" });
            return;
          }

          const animeInstance = window.anime;
          const origTimeline = animeInstance.timeline;
          let timelineCreated = false;
          let capturedTimeline: any = null;

          animeInstance.timeline = ((opts: any) => {
            console.log("anime.timeline() override triggered.");
            const tl = origTimeline.call(animeInstance, opts);
            capturedTimeline = tl;
            timelineCreated = true;
            return tl;
          }) as any;

          try {
            let runCode = code;
            const domContentMatch = runCode.match(/document\.addEventListener\(['"]DOMContentLoaded['"],\s*function\s*\(\)\s*{([\s\S]*)}\);?/i);
            if (domContentMatch && domContentMatch[1]) {
              console.log("Stripped DOMContentLoaded wrapper.");
              runCode = domContentMatch[1].trim();
            }

            let finalCodeToRun = runCode;
            const functionDefinitionMatch = runCode.match(/function\s+([a-zA-Z0-9_]+)\s*\(/);

            if (functionDefinitionMatch && functionDefinitionMatch[1]) {
              const functionNameToCall = functionDefinitionMatch[1];
              console.log(`Detected function definition: ${functionNameToCall}`);
              finalCodeToRun = `${runCode}\nreturn ${functionNameToCall}();`;
            }

            console.log("Running animation code:\n---\n", finalCodeToRun, "\n---");

            // Use overlayRef.current instead of previewRef.current
            const container = overlayRef.current;
            const runner = new Function("anime", "container", finalCodeToRun);
            const resultFromRunner = runner(animeInstance, container);

            console.log("Code execution finished.");
            console.log("Timeline captured via override:", capturedTimeline);
            console.log("Result returned directly from runner execution:", resultFromRunner);

            const finalTimeline = resultFromRunner || capturedTimeline;
            window.logoAnimation = finalTimeline;

            if (window.logoAnimation) {
              if (typeof window.logoAnimation.play === 'function' && typeof window.logoAnimation.restart === 'function') {
                console.log("Successfully obtained timeline. Restarting and playing.");
                window.logoAnimation.restart();
                window.logoAnimation.play();
                setIsPlaying(true);
                setError(null);
                toast({ title: "Success", description: "Animation executed.", variant: "default" });
              } else {
                console.warn("Obtained object is not a valid anime.js timeline:", window.logoAnimation);
                setError("Generated code ran but didn't produce a playable timeline.");
                toast({ title: "Execution Warning", description: "Code ran, but no valid animation timeline was created.", variant: "warning" });
                window.logoAnimation = undefined;
              }
            } else {
              console.warn("No animation timeline was returned or captured.");
              setError("Generated code ran but did not create/return an animation using anime.timeline().");
              toast({ title: "Execution Issue", description: "Code executed, but no animation timeline was created.", variant: "warning" });
              setIsPlaying(false);
            }
          } catch (err: any) {
            console.error("Error executing animation code:", err);
            setError(`Animation Execution Error: ${err.message || "Unknown error"}`);
            toast({ title: "Execution Error", description: `Failed to run animation code: ${err.message}`, variant: "destructive" });
            setIsPlaying(false);
            window.logoAnimation = undefined;
          } finally {
            if (animeInstance) {
              animeInstance.timeline = origTimeline;
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
      {/* Background Video Card */}
      <Card className="bg-gray-900 border-purple-900/30 shadow-lg shadow-purple-900/10">
        <CardHeader className="border-b border-purple-900/20">
          <CardTitle className="text-white">Background Video</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-gray-900/80">
          <VideoUpload onVideoSelect={setBackgroundVideo} />
        </CardContent>
      </Card>

      {/* Generation Card */}
      <Card className="bg-gray-900 border-purple-900/30 shadow-lg shadow-purple-900/10">
        <CardHeader className="border-b border-purple-900/20">
          <CardTitle className="text-white">Animation Generator</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-gray-900/80">
          {/* Analysis Editor */}
          <div className="mb-4 bg-gray-800 p-4 rounded-md border border-purple-900/30 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-800/10 rounded-full blur-3xl"></div>
            <h3 className="font-medium mb-2 text-white relative z-10">Edit Animation Concept</h3>
            <Textarea
              value={editedAnalysis?.conceptDescription || ""}
              onChange={handleConceptDescriptionChange}
              className="h-[100px] bg-gray-900 border-gray-700 text-gray-300 mb-2 relative z-10"
              placeholder="Describe the animation concept..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={generateAnimationCode}
              disabled={isGenerating || !isAnimeJsLoaded || !editedAnalysis?.conceptDescription}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white shadow-lg shadow-purple-900/30 transition-all hover:shadow-xl hover:shadow-purple-700/40 disabled:from-gray-700 disabled:to-gray-600 disabled:shadow-none"
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
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card className="bg-gray-900 border-purple-900/30 shadow-lg shadow-purple-900/10 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-purple-900/20">
          <CardTitle className="text-white">Preview</CardTitle>
          <Button
            onClick={replayAnimation}
            disabled={!isAnimeJsLoaded || isGenerating}
            variant="outline"
            size="sm"
            className="border-purple-600 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300 transition-all"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Replay Animation
          </Button>
        </CardHeader>
        <CardContent className="pt-6 p-0 relative">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-800/10 rounded-full blur-3xl"></div>
          <div
            ref={previewRef}
            className="relative overflow-hidden min-h-[300px] flex items-center justify-center bg-black"
            style={{ backgroundColor: backgroundVideo ? 'black' : '#121212' }}
          >
            {backgroundVideo && (
              <video
                src={backgroundVideo}
                className="w-full h-auto"
                autoPlay
                loop
                muted
                playsInline
                controls
              />
            )}
            {/* SVG overlay container will be created by resetSvg */}
          </div>
        </CardContent>
      </Card>

      {/* Code Editor Section (Only show if code exists) */}
      {animationCode && (
        <Card className="bg-gray-900 border-purple-900/30 shadow-lg shadow-purple-900/10">
          <CardHeader className="border-b border-purple-900/20">
            <CardTitle className="text-white">Edit Code (Advanced)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-gray-900/80">
            <div className="bg-gray-800/80 p-4 rounded-md border border-purple-900/30 space-y-4 relative overflow-hidden">
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-800/10 rounded-full blur-3xl"></div>
              <Textarea
                value={animationCode}
                onChange={(e) => setAnimationCode(e.target.value)}
                className="font-mono text-sm h-[250px] whitespace-pre-wrap bg-gray-900 border-gray-700 text-gray-300 relative z-10"
                spellCheck="false"
              />
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg shadow-purple-900/30 hover:shadow-xl hover:shadow-purple-700/40 relative z-10"
                onClick={applyCodeChanges}
                disabled={!isAnimeJsLoaded || isGenerating}
              >
                <Play className="mr-2 h-4 w-4" /> Run Modified Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md text-red-300 text-sm">
          <p className="font-medium mb-1">Error:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
