"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Play, RefreshCw, Download, Video, XCircle, Upload, Film, Image, RotateCcw, Move, Expand } from "lucide-react" // Added RotateCcw, Move, Expand icons
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" // Added Label
import { Slider } from "@/components/ui/slider" // Added Slider
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

// Make window properties optional
declare global {
  interface Window {
    anime?: any
    logoAnimation?: any
  }
}

// --- Constants ---
const TARGET_FPS = 30; // Target FPS for export
const FRAME_DELAY = 1000 / TARGET_FPS;
const MAX_OFFSET_PX = 200; // Max pixel offset for positioning sliders
const MIN_SCALE = 0.1;
const MAX_SCALE = 3.0;
const DEFAULT_SCALE = 1.0;

// --- Component ---
export function AnimationStage({ analysis, svgLayers, svgContent }: AnimationStageProps) {
  const [animationCode, setAnimationCode] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnimeJsLoaded, setIsAnimeJsLoaded] = useState(false)
  const [editedAnalysis, setEditedAnalysis] = useState<SvgAnalysis>({ ...analysis })
  const [isExporting, setIsExporting] = useState(false); // Unified exporting state
  const [exportProgress, setExportProgress] = useState<number | null>(null); // For progress feedback
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // NEW State for overlay transform
  const [overlayScale, setOverlayScale] = useState(DEFAULT_SCALE);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });

  const previewRef = useRef<HTMLDivElement>(null)
  const svgOverlayRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast()

  // Update editedAnalysis when original analysis changes
  useEffect(() => {
    setEditedAnalysis({ ...analysis })
  }, [analysis])

  // Load anime.js
  useEffect(() => {
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
      window.logoAnimation = undefined
    }
    script.onerror = () => {
      console.error("Failed to load anime.js")
      toast({ title: "Error", description: "Failed to load anime.js library", variant: "destructive" })
    }
    document.body.appendChild(script)
  }, [toast])

  // Cleanup video object URL
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        console.log("Revoked video object URL:", videoUrl);
      }
    };
  }, [videoUrl]);

  // Reset SVG DOM
  const resetSvg = useCallback(() => {
    if (window.logoAnimation?.pause) window.logoAnimation.pause();
    window.logoAnimation = undefined;
    setIsPlaying(false);

    if (svgOverlayRef.current && svgContent) {
      svgOverlayRef.current.innerHTML = svgContent;
      // Ensure transform style is applied on reset
      svgOverlayRef.current.style.transform = `translate(${overlayPosition.x}px, ${overlayPosition.y}px) scale(${overlayScale})`;
      svgOverlayRef.current.style.transformOrigin = 'center center';
      console.log("SVG overlay reset with current transform.");
    } else if (svgOverlayRef.current) {
       svgOverlayRef.current.innerHTML = "";
       console.log("SVG overlay cleared.");
    }
  }, [svgContent, overlayScale, overlayPosition]); // Add dependencies

  // Execute animation code
  const executeAnimationCode = useCallback(
    (code: string) => {
      console.log("Executing animation code...");
      setError(null);

      if (!code?.trim()) { toast({ title: "No Code", description: "Animation code is empty.", variant: "warning" }); return; }
      if (!window.anime) { toast({ title: "Error", description: "anime.js is not loaded.", variant: "destructive" }); setError("anime.js not loaded"); return; }
      if (!svgOverlayRef.current) { toast({ title: "Error", description: "SVG preview area not available.", variant: "destructive" }); setError("SVG DOM element not found"); return; }

      resetSvg(); // Reset SVG before execution (already includes transform)

      if (videoRef.current) { // Also reset video
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }

      requestAnimationFrame(() => {
         setTimeout(() => { // Ensure DOM is ready
            if (!svgOverlayRef.current) return;

            const animeInstance = window.anime;
            const origTimeline = animeInstance.timeline;
            let capturedTimeline: any = null;
            // Capture timeline instance
            animeInstance.timeline = ((opts: any) => { const tl = origTimeline.call(animeInstance, opts); capturedTimeline = tl; return tl; }) as any;

            try {
              // --- Code Execution Logic (KEEP AS IS) ---
              let runCode = code;
              // Strip common wrappers (DOMContentLoaded, IIFE)
              const domContentMatch = runCode.match(/document\.addEventListener\(['"]DOMContentLoaded['"],\s*function\s*\(\)\s*{([\s\S]*)}\);?/i);
              if (domContentMatch?.[1]) runCode = domContentMatch[1].trim();
              const iifeMatch = runCode.match(/^\s*\(\s*function\s*\(\s*\)\s*{([\s\S]*)}\s*\)\s*\(\s*\)\s*;?\s*$/)
              if (iifeMatch?.[1]) runCode = iifeMatch[1].trim();

              // Prepare code for Function constructor
              let finalCodeToRun = `try { ${runCode}; return null; } catch(e) { console.error('Error in raw code execution:', e); throw e; }`; // Default: run statements

              // Check if it defines a function and try to call it, returning the timeline if possible
              const functionDefinitionMatch = runCode.match(/(?:function\s+|const\s+|let\s+|var\s+)([a-zA-Z0-9_$]+)\s*(?:=\s*function)?\s*\(/);
              if (functionDefinitionMatch?.[1]) {
                  const functionNameToCall = functionDefinitionMatch[1];
                  // Append a call to the likely function, attempting to capture its return value (assuming it's the timeline)
                  finalCodeToRun = `${runCode}\n\ntry { if(typeof ${functionNameToCall} === 'function') { const result = ${functionNameToCall}(); if (result && typeof result.play === 'function') return result; } } catch(e) {} return null;`;
              }
              // --- End Code Execution Logic ---

              console.log("Running animation code...");
              const container = svgOverlayRef.current; // Pass the overlay div, though anime usually targets elements *within* it via selectors
              const runner = new Function("anime", "container", finalCodeToRun);
              const resultFromRunner = runner(animeInstance, container); // Execute the code

              // Determine the final timeline (either returned, captured, or potentially null)
              const finalTimeline = resultFromRunner || capturedTimeline;
              window.logoAnimation = finalTimeline; // Store the timeline globally

              if (window.logoAnimation?.play && window.logoAnimation?.restart) {
                 console.log("Successfully obtained timeline. Playing.");
                 window.logoAnimation.restart(); // Ensure it starts from beginning
                 window.logoAnimation.play();
                 if (videoRef.current && isVideoLoaded) { // Play video simultaneously
                    videoRef.current.currentTime = 0; // Sync video start
                    videoRef.current.play().catch(e => console.warn("Video play failed:", e));
                 }
                 setIsPlaying(true);
                 setError(null);
                 toast({ title: "Success", description: "Animation executed.", variant: "default" })
              } else {
                 console.warn("Execution completed, but no valid anime.js timeline was returned or captured.");
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
              // Restore original anime.timeline method
              if (animeInstance) animeInstance.timeline = origTimeline;
            }
         }, 50); // Short delay for DOM updates
      });
    },
    [toast, resetSvg, svgContent, isVideoLoaded] // resetSvg dependency is important here
  );

  // Generate code
  const generateAnimationCode = async () => {
    setIsGenerating(true);
    setError(null);
    setIsPlaying(false);
    if (window.logoAnimation?.pause) window.logoAnimation.pause();
    window.logoAnimation = undefined;
     if (videoRef.current) videoRef.current.pause();

    try {
      const res = await fetch("/api/generate-animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: editedAnalysis, svgLayers }), // Use editedAnalysis
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `Server responded with status ${res.status}` }));
        throw new Error(errorData?.error || `Generation request failed (${res.status})`);
      }
      const data = await res.json();
      if (!data.animationCode) throw new Error("API response did not include animation code.");

      setAnimationCode(data.animationCode);
      toast({ title: "Generated", description: "Animation code received.", variant: "default" });
      // Execute the newly generated code immediately
      setTimeout(() => executeAnimationCode(data.animationCode), 100);
    } catch (err: any) {
      console.error("Generation or initial execution error:", err);
      setError(err.message || "Failed to generate animation code");
      toast({ title: "Error", description: err.message || "An unknown error occurred", variant: "destructive" });
      setAnimationCode(""); // Clear code on error
    } finally {
      setIsGenerating(false);
    }
  };

  // Replay animation (and video if present)
  const replayAnimation = () => {
      if (!isAnimeJsLoaded) { toast({ title: "Error", description: "anime.js not loaded.", variant: "destructive" }); return; }
      if (window.logoAnimation?.restart) {
          console.log("Replaying last animation.");
          setError(null);
          window.logoAnimation.restart();
          window.logoAnimation.play();
          // Also restart video from beginning if loaded
          if (videoRef.current && isVideoLoaded) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(e => console.warn("Video replay failed:", e));
          }
          setIsPlaying(true);
          toast({ title: "Replaying", description: "Animation restarted.", variant: "default" });
      } else {
          console.warn("No valid animation found to replay.");
          toast({ title: "No Animation", description: "No animation has been successfully run yet.", variant: "warning" });
          setIsPlaying(false); // Ensure playing state is false
      }
  }

  // Apply manual code edits
  const applyCodeChanges = () => {
    if (!animationCode?.trim()) { toast({ title: "No Code", description: "Code editor is empty.", variant: "warning" }); return; }
     console.log("Applying manually edited code...");
     setIsPlaying(false); // Stop current playback visually
     if (videoRef.current) videoRef.current.pause(); // Pause video too
     executeAnimationCode(animationCode); // Execute the code from the textarea
  };

  // --- Video Handling ---
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
      const currentUrl = videoUrl;
      const newUrl = URL.createObjectURL(file);
      setVideoUrl(newUrl);
      setIsVideoLoaded(false); // Reset status until loaded
      setError(null); // Clear previous errors
      toast({ title: "Video Selected", description: file.name });
      // Revoke previous object URL *after* setting the new one
      if (currentUrl) { requestAnimationFrame(() => URL.revokeObjectURL(currentUrl)); }
    } else if (file) {
      toast({ title: "Invalid File", description: "Please select a valid video file.", variant: "destructive" });
      setError("Invalid file type selected.");
    }
     // Clear the input value to allow selecting the same file again
     if (event.target) event.target.value = "";
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoUrl) { URL.revokeObjectURL(videoUrl); }
    setVideoUrl(null);
    setIsVideoLoaded(false);
    if(videoRef.current) {
        videoRef.current.removeAttribute('src');
        videoRef.current.load(); // Attempt to clear buffer
    }
    toast({ title: "Video Removed" });
  };

  // --- Overlay Transform Handlers ---
  const handleScaleChange = (value: number[]) => {
    setOverlayScale(value[0]);
  };

  const handleXChange = (value: number[]) => {
    setOverlayPosition(prev => ({ ...prev, x: value[0] }));
  };

  const handleYChange = (value: number[]) => {
    setOverlayPosition(prev => ({ ...prev, y: value[0] }));
  };

  const resetOverlayTransform = () => {
    setOverlayScale(DEFAULT_SCALE);
    setOverlayPosition({ x: 0, y: 0 });
    toast({ title: "Overlay Transform Reset" });
  };

  // Apply transform style dynamically
  useEffect(() => {
    if (svgOverlayRef.current) {
      svgOverlayRef.current.style.transform = `translate(${overlayPosition.x}px, ${overlayPosition.y}px) scale(${overlayScale})`;
      svgOverlayRef.current.style.transformOrigin = 'center center'; // Scale from center
    }
  }, [overlayScale, overlayPosition]);


  // --- Base Export Logic (Shared by both export functions) ---
  const setupMediaRecorder = (canvas: HTMLCanvasElement, fps: number): { mediaRecorder: MediaRecorder; chunks: Blob[]; actualMimeType: string; fileExtension: string } => {
    const chunks: Blob[] = [];
    let requestedMimeType = 'video/mp4;codecs=avc1'; // Prefer MP4
    let actualMimeType = requestedMimeType;
    let fileExtension = 'mp4';
    let videoStream: MediaStream | null = null;

    try {
        // Try getting stream from canvas
        videoStream = canvas.captureStream(fps);
        if (!videoStream) throw new Error("Failed to capture canvas stream.");

        // Check MP4 support, fallback to WebM
        if (!MediaRecorder.isTypeSupported(requestedMimeType)) {
            console.warn(`MP4 MIME type (${requestedMimeType}) not supported. Falling back to webm.`);
            toast({ title: "Format Note", description: "MP4 export not directly supported, exporting as WebM.", variant: "info" });
            requestedMimeType = 'video/webm;codecs=vp9'; // Prefer VP9 for WebM
            if (!MediaRecorder.isTypeSupported(requestedMimeType)) {
                 console.warn(`WebM/VP9 MIME type (${requestedMimeType}) not supported. Falling back to default webm.`);
                 requestedMimeType = 'video/webm'; // Fallback further if VP9 isn't supported
            }
            fileExtension = 'webm';
            // Final check for any WebM support
            if (!MediaRecorder.isTypeSupported(requestedMimeType)) {
                 console.error("No supported video MIME type found (tried MP4 and WebM).");
                 throw new Error("No supported video format found for recording.");
            }
        }
        actualMimeType = requestedMimeType; // Store the MIME type that will actually be used
        console.log(`Using MIME type: ${actualMimeType} for export.`);

        // Create MediaRecorder
        const recorder = new MediaRecorder(videoStream, { mimeType: actualMimeType });

        // Data handling
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
                // console.log(`Received data chunk: ${e.data.size} bytes`);
            }
        };

        return { mediaRecorder: recorder, chunks, actualMimeType, fileExtension };

    } catch (error: any) {
        console.error("MediaRecorder setup failed:", error);
        // Clean up stream if created
        if (videoStream) videoStream.getTracks().forEach(track => track.stop());
        throw new Error(`MediaRecorder setup failed: ${error.message}`);
    }
  };

  const downloadExportedVideo = (chunks: Blob[], mimeType: string, filename: string) => {
    if (chunks.length === 0) {
        console.error("Recording stopped, but no data chunks received.");
        throw new Error("Recording finished with no video data."); // Throw error to be caught and shown to user
    }
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename; // e.g., "animation-only.mp4" or "composited-animation.webm"
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`Downloaded ${filename} and revoked URL.`);
    }, 100);
  };


  // --- EXPORT: ANIMATION ONLY ---
  const handleExportAnimationOnly = async () => {
     // Check prerequisites
     if (!isAnimeJsLoaded || !window.logoAnimation?.seek || typeof window.logoAnimation.duration !== 'number' || !svgOverlayRef.current) {
        toast({ title: "Export Error", description: "A valid animation must be run first.", variant: "destructive" });
        return;
    }
    if (isExporting) return; // Prevent concurrent exports

    setIsExporting(true);
    setIsPlaying(false);
    setExportProgress(0); // Reset progress
    toast({ title: "Exporting Animation", description: "Starting SVG animation capture... Please wait.", variant: "info" });

    const animation = window.logoAnimation;
    const svgContainer = svgOverlayRef.current; // This div is now transformed
    let mediaRecorder: MediaRecorder | null = null;
    let recorderSetup : { mediaRecorder: MediaRecorder; chunks: Blob[]; actualMimeType: string; fileExtension: string } | null = null;

    // Pause animation, reset to start
    animation.pause();
    animation.seek(0);
    if (videoRef.current) videoRef.current.pause(); // Pause video too if present

    await new Promise(resolve => setTimeout(resolve, 100)); // Short delay for visual reset

    try {
        const durationMs = animation.duration;
        if (durationMs <= 0) throw new Error("Animation has zero duration.");

        // Get dimensions from preview container (fallback if needed)
        let width = previewRef.current?.offsetWidth ?? 640;
        let height = previewRef.current?.offsetHeight ?? 360;
        if (width === 0 || height === 0) { // Try bounds if offsetWidth is zero (e.g., hidden parent)
            const bounds = previewRef.current?.getBoundingClientRect();
            width = bounds?.width ?? 640; height = bounds?.height ?? 360;
        }
        width = Math.round(width); height = Math.round(height);
        if (width === 0 || height === 0) throw new Error("Could not determine preview area dimensions for export.");
        console.log(`Export canvas dimensions (Animation Only): ${width}x${height}`);

        // Create canvas for capturing frames
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = width;
        captureCanvas.height = height;
        const ctx = captureCanvas.getContext('2d');
        if (!ctx) throw new Error("Failed to get 2D canvas context for export.");

        // Setup MediaRecorder using the shared function
        recorderSetup = setupMediaRecorder(captureCanvas, TARGET_FPS);
        mediaRecorder = recorderSetup.mediaRecorder;

        mediaRecorder.onstop = () => {
            console.log("MediaRecorder stopped (Animation Only).");
            try {
                if (!recorderSetup) throw new Error("Recorder setup info lost before stop.");
                // Use the captured chunks and MIME type from the setup result
                downloadExportedVideo(recorderSetup.chunks, recorderSetup.actualMimeType, `animation-only.${recorderSetup.fileExtension}`);
                toast({ title: "Export Complete", description: `Animation saved as animation-only.${recorderSetup.fileExtension}`, variant: "success" });
            } catch (downloadError: any) {
                 toast({ title: "Download Error", description: downloadError.message, variant: "destructive" });
                 console.error("Download failed:", downloadError);
            } finally {
                setIsExporting(false);
                setExportProgress(null);
                animation.seek(0); // Reset animation visually post-export
                recorderSetup = null; // Clear setup info
            }
        };

        mediaRecorder.onerror = (e) => {
             console.error("MediaRecorder error (Animation Only):", e);
             let msg = "Unknown recorder error.";
             // Try to get more specific error details if possible
             if (e instanceof Event && 'error' in e && e.error instanceof DOMException) {
                msg = `${e.error.name}: ${e.error.message}`;
             } else if (e instanceof Error) {
                 msg = e.message;
             }
             // Stop the export process by throwing
             throw new Error(`MediaRecorder error during recording: ${msg}`);
        };

        // --- Frame Capture Loop ---
        mediaRecorder.start();
        const totalFrames = Math.ceil((durationMs * TARGET_FPS) / 1000);
        console.log(`Starting animation-only recording (${recorderSetup.actualMimeType}), Duration: ${durationMs.toFixed(0)}ms, Target Frames: ${totalFrames}`);

        let frameCount = 0;
        const captureFrame = async () => {
            // Stop condition: recorder stopped or frame count exceeds total
            if (!mediaRecorder || mediaRecorder.state !== 'recording' || frameCount > totalFrames) {
                if (mediaRecorder?.state === 'recording') {
                    console.log(`Stopping recording at frame ${frameCount} (state: ${mediaRecorder.state})`);
                    mediaRecorder.stop();
                }
                return; // End loop
            }

            // Calculate current time, ensuring it doesn't exceed duration
            const currentTimeMs = Math.min(frameCount * FRAME_DELAY, durationMs);
            animation.seek(currentTimeMs); // Seek the anime.js animation

            // Allow rendering updates after seek (important!)
            await new Promise(resolve => requestAnimationFrame(resolve));
            // Optional: small delay if rendering seems lagged, but RAF should suffice
            // await new Promise(resolve => setTimeout(resolve, 5));

            try {
                // 1. Clear canvas and set background (e.g., white for animation-only)
                ctx.fillStyle = '#FFFFFF'; // White background
                ctx.fillRect(0, 0, width, height);

                // 2. Capture the *transformed* SVG overlay using html2canvas
                // html2canvas should capture the element as currently rendered with CSS transforms
                const svgCanvas = await html2canvas(svgContainer, {
                    useCORS: true,         // Important if SVG uses external resources (less common for logos)
                    logging: false,        // Reduce console noise
                    width: width,          // Match capture canvas dimensions
                    height: height,
                    scale: 1,              // Use 1:1 scale
                    backgroundColor: null, // Capture with transparency if needed, but we draw on white bg anyway
                    x: 0, y: 0,            // Capture from top-left of the element
                    scrollX: 0, scrollY: 0,// Don't account for scrolling within the element
                });

                // 3. Draw the captured SVG canvas onto the main capture canvas
                ctx.drawImage(svgCanvas, 0, 0, width, height);

                // Update progress (optional: update less frequently for performance)
                // if (frameCount % 5 === 0 || frameCount === totalFrames) {
                    setExportProgress(Math.min(100, Math.round((frameCount / totalFrames) * 100)));
                // }

            } catch (captureError: any) {
                console.error(`Error capturing animation frame ${frameCount} at ${currentTimeMs.toFixed(0)}ms:`, captureError);
                // Stop recording and report error
                if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); // Stop recording on error
                throw new Error(`Frame capture failed on frame ${frameCount}: ${captureError.message}. Export aborted.`);
            }

            frameCount++;
            // Schedule the next frame using setTimeout for more predictable timing across browsers vs RAF loop
            setTimeout(captureFrame, 0); // Process next frame ASAP
        };

        captureFrame(); // Start the loop

    } catch (error: any) {
        console.error("Animation export process failed:", error);
        toast({ title: "Export Failed", description: error.message || "Unknown export error.", variant: "destructive" });
        // Ensure recorder is stopped if it was started and an error occurred before onstop/onerror fired
        if (mediaRecorder?.state === 'recording') {
            try { mediaRecorder.stop(); } catch (stopErr) { console.error("Error stopping recorder after export failure:", stopErr);}
        }
        setIsExporting(false);
        setExportProgress(null);
        animation.seek(0); // Reset animation visually
        recorderSetup = null; // Clear setup info
    }
  };


  // --- EXPORT: COMBINED VIDEO + ANIMATION ---
  const handleExportCombinedVideo = async () => {
    // Check prerequisites
    if (!isAnimeJsLoaded || !window.logoAnimation?.seek || typeof window.logoAnimation.duration !== 'number' || !svgOverlayRef.current || !videoRef.current || !isVideoLoaded) {
        toast({ title: "Export Error", description: "A loaded video and a valid animation are required.", variant: "destructive" });
        return;
    }
    if (isExporting) return; // Prevent concurrent exports

    setIsExporting(true);
    setIsPlaying(false);
    setExportProgress(0); // Reset progress
    toast({ title: "Exporting Combined Video", description: "Starting composite video capture... Please wait.", variant: "info" });

    const animation = window.logoAnimation;
    const videoElement = videoRef.current;
    const svgContainer = svgOverlayRef.current; // The transformed container
    let mediaRecorder: MediaRecorder | null = null;
    let recorderSetup : { mediaRecorder: MediaRecorder; chunks: Blob[]; actualMimeType: string; fileExtension: string } | null = null;

    // Pause animation and video, reset to start
    animation.pause();
    animation.seek(0);
    videoElement.pause();
    videoElement.currentTime = 0;

    // Wait for elements to visually reset
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const animationDurationMs = animation.duration;
        const videoDurationMs = videoElement.duration * 1000; // Convert video duration to ms

        // Basic validation
        if (animationDurationMs <= 0) throw new Error("Animation has zero or negative duration.");
        if (videoDurationMs <= 0 || !isFinite(videoDurationMs)) throw new Error("Video has zero, negative, or invalid duration.");

        // Determine effective duration: Use the MINIMUM of animation and video length
        const effectiveDurationMs = Math.min(animationDurationMs, videoDurationMs);
        console.log(`Effective export duration: ${effectiveDurationMs.toFixed(0)}ms (Animation: ${animationDurationMs.toFixed(0)}ms, Video: ${videoDurationMs.toFixed(0)}ms)`);

        // Inform user if durations differ significantly
        if (Math.abs(animationDurationMs - videoDurationMs) > 100) { // Threshold to avoid spamming for minor diffs
            if (animationDurationMs > videoDurationMs) {
                toast({ title: "Export Note", description: `Animation is longer than the video. Export will be truncated to video length (${(videoDurationMs/1000).toFixed(1)}s).`, variant: "info" });
            } else {
                 toast({ title: "Export Note", description: `Video is longer than the animation. Export will match animation length (${(animationDurationMs/1000).toFixed(1)}s).`, variant: "info" });
            }
        }

        // Calculate total frames based on the *effective* duration
        const totalFrames = Math.ceil((effectiveDurationMs * TARGET_FPS) / 1000);
        if (totalFrames <= 0) throw new Error("Calculated export duration results in zero frames.");

        // Get dimensions (same as animation-only)
        let width = previewRef.current?.offsetWidth ?? 640;
        let height = previewRef.current?.offsetHeight ?? 360;
        if (width === 0 || height === 0) {
            const bounds = previewRef.current?.getBoundingClientRect();
            width = bounds?.width ?? 640; height = bounds?.height ?? 360;
        }
        width = Math.round(width); height = Math.round(height);
        if (width === 0 || height === 0) throw new Error("Could not determine preview area dimensions for export.");
        console.log(`Export canvas dimensions (Combined): ${width}x${height}`);

        // Create canvas for compositing
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = width;
        captureCanvas.height = height;
        // Use alpha: false for potentially better performance when drawing opaque video frame first
        const ctx = captureCanvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error("Failed to get 2D canvas context for combined export.");

        // Setup MediaRecorder
        recorderSetup = setupMediaRecorder(captureCanvas, TARGET_FPS);
        mediaRecorder = recorderSetup.mediaRecorder;

        mediaRecorder.onstop = () => {
            console.log("MediaRecorder stopped (Combined).");
            try {
                if (!recorderSetup) throw new Error("Recorder setup info lost before stop.");
                downloadExportedVideo(recorderSetup.chunks, recorderSetup.actualMimeType, `composited-animation.${recorderSetup.fileExtension}`);
                toast({ title: "Export Complete", description: `Video saved as composited-animation.${recorderSetup.fileExtension}`, variant: "success" });
            } catch (downloadError: any) {
                 toast({ title: "Download Error", description: downloadError.message, variant: "destructive" });
                 console.error("Download failed:", downloadError);
            } finally {
                setIsExporting(false);
                setExportProgress(null);
                // Reset elements visually post-export
                animation.seek(0);
                videoElement.currentTime = 0;
                recorderSetup = null;
            }
        };

        mediaRecorder.onerror = (e) => {
             console.error("MediaRecorder error (Combined):", e);
             let msg = "Unknown recorder error.";
             if (e instanceof Event && 'error' in e && e.error instanceof DOMException) {
                msg = `${e.error.name}: ${e.error.message}`;
             } else if (e instanceof Error) {
                 msg = e.message;
             }
             throw new Error(`MediaRecorder error during recording: ${msg}`);
        };

        // --- Frame Capture Loop ---
        mediaRecorder.start();
        console.log(`Starting composite recording (${recorderSetup.actualMimeType}), Effective Duration: ${effectiveDurationMs.toFixed(0)}ms, Target Frames: ${totalFrames}`);

        let frameCount = 0;
        const captureFrame = async () => {
            // Stop condition
            if (!mediaRecorder || mediaRecorder.state !== 'recording' || frameCount > totalFrames) {
                if (mediaRecorder?.state === 'recording') {
                     console.log(`Stopping recording at frame ${frameCount} (state: ${mediaRecorder.state})`);
                     mediaRecorder.stop();
                }
                return; // End loop
            }

            // Calculate time based on effective duration and frame count
            const currentTimeMs = Math.min(frameCount * FRAME_DELAY, effectiveDurationMs);
            const currentTimeSec = currentTimeMs / 1000;

            // --- Seek animation and video for the current frame ---
            animation.seek(currentTimeMs);

            // Seek video - MUST wait for seek to complete before drawing
            // Ensure we don't try to seek beyond the video's actual duration, even with effectiveDuration logic
            if (currentTimeSec <= videoElement.duration) {
                videoElement.currentTime = currentTimeSec;

                // --- Wait for video 'seeked' event ---
                try {
                    await new Promise<void>((resolve, reject) => {
                        const timeoutDuration = 2000; // 2 seconds timeout for seeking
                        const timeoutId = setTimeout(() => {
                            console.error(`Video seek timed out after ${timeoutDuration}ms for frame ${frameCount} at time ${currentTimeSec.toFixed(3)}s.`);
                            reject(new Error(`Video seek timed out (${timeoutDuration}ms)`));
                        }, timeoutDuration);

                        const onSeeked = () => {
                            clearTimeout(timeoutId); // Clear the timeout
                            videoElement.removeEventListener('seeked', onSeeked); // Clean up listener
                            videoElement.removeEventListener('error', onError);  // Clean up error listener
                            resolve(); // Seek completed successfully
                        };

                        const onError = (ev: Event | string) => {
                            clearTimeout(timeoutId);
                             videoElement.removeEventListener('seeked', onSeeked);
                            videoElement.removeEventListener('error', onError);
                            let errorMsg = "Video element error during seek.";
                            if (typeof ev === 'string') errorMsg = ev;
                            else if (videoElement.error) errorMsg = `Video Error Code: ${videoElement.error.code}, Message: ${videoElement.error.message}`;
                            console.error(`Video error during seek for frame ${frameCount}:`, ev);
                            reject(new Error(errorMsg));
                        };

                        videoElement.addEventListener('seeked', onSeeked, { once: true });
                        videoElement.addEventListener('error', onError, { once: true });
                    });
                } catch (seekError: any) {
                    console.error(`Error waiting for video seek to ${currentTimeSec.toFixed(3)}s for frame ${frameCount}:`, seekError);
                    if (mediaRecorder?.state === 'recording') mediaRecorder.stop(); // Stop recording on critical error
                    throw new Error(`Video seek failed: ${seekError.message}. Export aborted.`); // Propagate error
                }
            } else {
                // This should ideally not happen if effectiveDurationMs is calculated correctly
                console.warn(`Frame ${frameCount}: Calculated time (${currentTimeSec.toFixed(2)}s) exceeds video duration (${videoElement.duration.toFixed(2)}s). Stopping export early.`);
                 if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
                 return; // Stop the loop if time exceeds video length unexpectedly
            }

            // Allow rendering updates after both seeks (especially animation)
            await new Promise(resolve => requestAnimationFrame(resolve));
             // Optional small delay if compositing looks wrong
             // await new Promise(resolve => setTimeout(resolve, 5));

            // --- Draw composited frame ---
            try {
                // 1. Draw the current video frame onto the canvas (clears previous frame implicitly)
                ctx.drawImage(videoElement, 0, 0, width, height);

                // 2. Capture the *transformed* SVG overlay using html2canvas
                // Use same settings as animation-only capture
                const svgCanvas = await html2canvas(svgContainer, {
                    useCORS: true, logging: false, width: width, height: height, scale: 1,
                    backgroundColor: null, // Capture overlay with transparency
                    x: 0, y: 0, scrollX: 0, scrollY: 0,
                });

                // 3. Draw the captured (potentially transparent) SVG canvas on top of the video frame
                ctx.drawImage(svgCanvas, 0, 0, width, height);

                 // Update progress
                 // if (frameCount % 5 === 0 || frameCount === totalFrames) {
                     setExportProgress(Math.min(100, Math.round((frameCount / totalFrames) * 100)));
                 // }
                // if (frameCount % TARGET_FPS === 0) console.log(`Composited frame ${frameCount}/${totalFrames}`);

            } catch (captureError: any) {
                console.error(`Error compositing frame ${frameCount} at ${currentTimeMs.toFixed(0)}ms:`, captureError);
                 if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
                 throw new Error(`Frame compositing failed on frame ${frameCount}: ${captureError.message}. Export aborted.`);
            }

            frameCount++;
            // Schedule the next frame
            setTimeout(captureFrame, 0);
        };

        captureFrame(); // Start the loop

    } catch (error: any) {
        console.error("Combined video export process failed:", error);
        toast({ title: "Export Failed", description: error.message || "Unknown export error.", variant: "destructive" });
        // Ensure recorder is stopped
        if (mediaRecorder?.state === 'recording') {
             try { mediaRecorder.stop(); } catch (stopErr) { console.error("Error stopping recorder after export failure:", stopErr);}
        }
        setIsExporting(false);
        setExportProgress(null);
        // Reset elements visually
        animation.seek(0);
        if (videoElement) videoElement.currentTime = 0;
        recorderSetup = null;
    }
  };


  // Initial setup / Reset SVG on content change
  useEffect(() => {
    if (svgOverlayRef.current && svgContent) {
       console.log("Initial SVG setup or svgContent changed, resetting.");
      resetSvg(); // resetSvg now includes applying the current transform
    }
     return () => { // Cleanup on unmount
         if (window.logoAnimation?.pause) window.logoAnimation.pause();
         window.logoAnimation = undefined;
     }
  }, [svgContent, resetSvg]); // Keep resetSvg in dependency array

  // Handle concept description change
  const handleConceptDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedAnalysis(prev => ({ ...prev, conceptDescription: e.target.value }));
  };

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* --- Generation Card --- */}
      <Card>
        {/* ... (Generation content remains the same) ... */}
         <CardHeader><CardTitle>1. Animation Generator</CardTitle></CardHeader>
        <CardContent>
           <div className="mb-4 bg-slate-50 p-4 rounded-md border border-slate-200">
              <h3 className="font-semibold mb-2 text-slate-800">Edit Analysis (Optional)</h3>
              <Textarea
                value={editedAnalysis?.conceptDescription || ""}
                onChange={handleConceptDescriptionChange}
                className="h-[100px] bg-white mb-2"
                placeholder="Describe the logo and the desired animation..."
                disabled={isGenerating || isExporting}
              />
            </div>
          <div className="flex flex-wrap gap-2">
             <h3 className="font-semibold mb-2 text-slate-800 w-full">Generate or Modify</h3>
            <Button
              onClick={generateAnimationCode}
              disabled={isGenerating || !isAnimeJsLoaded || !editedAnalysis?.conceptDescription || isExporting}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              title={!isAnimeJsLoaded ? "Waiting for animation library..." : !editedAnalysis?.conceptDescription ? "Enter description" : isGenerating ? "Generating..." : isExporting ? "Exporting..." : "Generate animation"}
            >
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isGenerating ? "Generating..." : "Generate New Animation"}
            </Button>
          </div>
          {!isAnimeJsLoaded && <p className="mt-2 text-sm text-yellow-600">Loading animation library...</p>}
          {error && !error.includes("Execution") && !error.includes("Video") && <p className="mt-4 text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">Generation/System Error: {error}</p>}
        </CardContent>
      </Card>

       {/* --- Video Import Card --- */}
       <Card>
         {/* ... (Video Import content remains the same) ... */}
        <CardHeader><CardTitle>2. Import Background Video (Optional)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-1">
                 <label htmlFor="video-upload" className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${(isGenerating || isExporting) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <Upload className="mr-2 h-4 w-4" /> Choose Video File
                 </label>
                <Input ref={fileInputRef} id="video-upload" type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={isGenerating || isExporting}/>
                <p className="text-xs text-gray-500 mt-1">Select a video for combined export.</p>
            </div>
            {videoFile && (
                <div className="flex-shrink-0 flex items-center gap-2 bg-gray-100 p-2 rounded">
                   <Video className="h-5 w-5 text-gray-600 flex-shrink-0"/>
                   <span className="text-sm text-gray-800 truncate max-w-[150px] sm:max-w-[250px]" title={videoFile.name}>{videoFile.name}</span>
                   <Button variant="ghost" size="sm" onClick={removeVideo} disabled={isGenerating || isExporting} className="p-1 h-auto text-red-500 hover:bg-red-100 flex-shrink-0" title="Remove video">
                       <XCircle className="h-4 w-4"/>
                   </Button>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- NEW: Overlay Transform Controls --- */}
      {videoUrl && svgContent && ( // Only show controls if there's a video AND svg content
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>3. Adjust Overlay</CardTitle>
            <Button
              onClick={resetOverlayTransform}
              variant="outline"
              size="sm"
              disabled={isGenerating || isExporting}
              title="Reset scale and position"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
             {/* Scale Slider */}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="scale-slider" className="text-right col-span-1 flex items-center justify-end">
                 <Expand className="mr-1 h-4 w-4 text-gray-600"/> Scale
               </Label>
               <Slider
                 id="scale-slider"
                 value={[overlayScale]}
                 onValueChange={handleScaleChange}
                 min={MIN_SCALE}
                 max={MAX_SCALE}
                 step={0.05}
                 className="col-span-2"
                 disabled={isGenerating || isExporting}
               />
               <span className="text-sm text-gray-600 col-span-1 w-12 text-center">{(overlayScale * 100).toFixed(0)}%</span>
             </div>
             {/* Position Sliders */}
              <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="x-offset-slider" className="text-right col-span-1 flex items-center justify-end">
                 <Move className="mr-1 h-4 w-4 text-gray-600 transform rotate-90"/> X Offset
               </Label>
               <Slider
                 id="x-offset-slider"
                 value={[overlayPosition.x]}
                 onValueChange={handleXChange}
                 min={-MAX_OFFSET_PX}
                 max={MAX_OFFSET_PX}
                 step={1}
                 className="col-span-2"
                 disabled={isGenerating || isExporting}
               />
               <span className="text-sm text-gray-600 col-span-1 w-12 text-center">{overlayPosition.x.toFixed(0)}px</span>
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="y-offset-slider" className="text-right col-span-1 flex items-center justify-end">
                  <Move className="mr-1 h-4 w-4 text-gray-600"/> Y Offset
               </Label>
               <Slider
                 id="y-offset-slider"
                 value={[overlayPosition.y]}
                 onValueChange={handleYChange}
                 min={-MAX_OFFSET_PX}
                 max={MAX_OFFSET_PX}
                 step={1}
                 className="col-span-2"
                 disabled={isGenerating || isExporting}
               />
               <span className="text-sm text-gray-600 col-span-1 w-12 text-center">{overlayPosition.y.toFixed(0)}px</span>
             </div>
          </CardContent>
        </Card>
      )}

      {/* --- Preview & Export Section (Now potentially step 4) --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-x-2 flex-wrap gap-y-2">
          <CardTitle className="whitespace-nowrap">{videoUrl && svgContent ? '4.' : '3.'} Preview & Export</CardTitle>
           {/* ... (Export/Replay Buttons remain the same structure) ... */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
             {/* Replay Button */}
            <Button
              onClick={replayAnimation}
              disabled={!isAnimeJsLoaded || isGenerating || isExporting || !window.logoAnimation}
              variant="outline" size="sm" className="border-blue-600 text-blue-600"
              title={!isAnimeJsLoaded ? "Waiting for library..." : !window.logoAnimation ? "Generate/run animation first" : isGenerating ? "Generating..." : isExporting ? "Exporting..." : `Replay animation${videoUrl ? " and video" : ""}`}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Replay
            </Button>
             {/* Export Animation Only Button */}
             <Button
                onClick={handleExportAnimationOnly}
                disabled={!isAnimeJsLoaded || isGenerating || isExporting || !window.logoAnimation || !svgContent}
                variant="outline" size="sm" className="border-teal-600 text-teal-600"
                title={!isAnimeJsLoaded ? "Waiting for library..." : !svgContent ? "No SVG loaded" : !window.logoAnimation ? "Generate/run animation first" : isGenerating ? "Generating..." : isExporting ? "Exporting..." : "Export animation only (SVG on white background)"}
              >
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Image className="mr-2 h-4 w-4" />}
                {isExporting ? "Exporting..." : "Export Animation"}
              </Button>
            {/* Export Combined Button */}
            <Button
                onClick={handleExportCombinedVideo}
                disabled={!isAnimeJsLoaded || isGenerating || isExporting || !window.logoAnimation || !videoFile || !isVideoLoaded || !svgContent}
                variant="outline" size="sm" className="border-green-600 text-green-600"
                title={!isAnimeJsLoaded ? "Waiting for library..." : !svgContent ? "No SVG loaded" : !window.logoAnimation ? "Generate/run animation first" : !videoFile ? "Import a video first" : !isVideoLoaded ? "Video is loading..." : isGenerating ? "Generating..." : isExporting ? "Exporting..." : "Export animation overlaid on video"}
              >
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                {isExporting ? "Exporting..." : "Export Combined"}
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Execution Error Display */}
           {error && error.includes("Execution") && <p className="mb-3 text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">Animation Execution Error: {error.replace('Animation Execution Error: ', '')}</p>}
           {/* Video Load Error Display */}
           {error && error.includes("Video") && <p className="mb-3 text-sm text-red-600 font-medium bg-red-50 p-2 rounded border border-red-200">Video Error: {error}</p>}

          {/* Preview Area */}
          <div ref={previewRef} className="border border-gray-300 rounded bg-gray-900 min-h-[300px] flex items-center justify-center overflow-hidden relative aspect-video">
            {/* Video Background */}
            <video
                ref={videoRef}
                muted playsInline // Ensure muted and playsInline for autoplay possibilities and mobile
                className={`absolute top-0 left-0 w-full h-full object-contain ${videoUrl ? 'block' : 'hidden'}`} // Use object-contain to see whole video
                src={videoUrl || undefined}
                onLoadedMetadata={() => { console.log("Video metadata loaded. Duration:", videoRef.current?.duration); setError(null); /* Clear video errors on load */ }}
                onCanPlay={() => { console.log("Video can play."); setIsVideoLoaded(true); }}
                onError={(e) => { console.error("Video loading error:", e); toast({ title: "Video Error", description: "Failed to load the video file. Check console.", variant: "destructive" }); setError("Video loading failed."); setIsVideoLoaded(false); }}
            />
            {/* SVG Overlay - Now with dynamic transform style */}
            <div
                ref={svgOverlayRef}
                className="absolute top-0 left-0 w-full h-full z-10 flex items-center justify-center"
                style={{
                    pointerEvents: 'none', // Keep overlay non-interactive
                    transform: `translate(${overlayPosition.x}px, ${overlayPosition.y}px) scale(${overlayScale})`,
                    transformOrigin: 'center center', // Scale from the center
                }}
            >
                {/* SVG content gets injected here by resetSvg/useEffect */}
                {!svgContent && !videoUrl && <p className="text-gray-500 z-20">Preview Area</p>}
            </div>

            {/* Status Indicators within preview */}
             {videoUrl && !isVideoLoaded && !error?.includes("Video") && !isExporting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                    <Loader2 className="h-8 w-8 animate-spin text-white" /> <p className="ml-2 text-white">Loading video...</p>
                </div>
            )}
             {isExporting && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-30 text-white">
                    <Loader2 className="h-10 w-10 animate-spin" />
                    <p className="mt-3 text-lg font-medium">Exporting Video...</p>
                    {exportProgress !== null && <p className="text-sm mt-1">{exportProgress}% complete</p>}
                    <p className="text-xs mt-2 text-gray-300">(This may take a while)</p>
                </div>
             )}
          </div>
           {/* Status outside preview */}
           {isExporting && <p className="mt-2 text-xs text-blue-600">Exporting is resource intensive. Please wait.</p>}
        </CardContent>
      </Card>

       {/* --- Code Editor Section (Now potentially step 5) --- */}
       {animationCode && (
        <Card>
          {/* ... (Code editor content remains the same) ... */}
           <CardHeader><CardTitle>{videoUrl && svgContent ? '5.' : '4.'} Edit Code Directly (Advanced)</CardTitle></CardHeader>
           <CardContent>
             <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
                <p className="text-sm text-gray-600">Modify Javascript (anime.js) below and click "Run" to apply changes to the preview.</p>
              <Textarea
                value={animationCode}
                onChange={(e) => { setAnimationCode(e.target.value); if (error?.includes("Execution")) setError(null); }} // Clear only execution errors on edit
                className="font-mono text-sm h-[250px] whitespace-pre-wrap bg-white"
                spellCheck="false"
                disabled={isGenerating || isExporting}
              />
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={applyCodeChanges}
                disabled={!isAnimeJsLoaded || isGenerating || isExporting || !animationCode.trim()}
                title={!isAnimeJsLoaded ? "Waiting for library..." : !animationCode.trim() ? "Code empty" : isGenerating ? "Generating..." : isExporting ? "Exporting..." : "Run modified code"}
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