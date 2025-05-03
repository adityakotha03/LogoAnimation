"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"

export function AnimatedDemo() {
  const svgRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const animationRef = useRef<any>(null)

  useEffect(() => {
    // Load anime.js
    if ((window as any).anime) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"
    script.async = true
    script.onload = () => {
      setIsLoaded(true)
    }
    document.body.appendChild(script)

    return () => {
      if (animationRef.current) {
        animationRef.current.pause()
      }
    }
  }, [])

  useEffect(() => {
    if (isLoaded && svgRef.current) {
      resetAnimation()
      // Auto-play the animation after a short delay
      const timer = setTimeout(() => {
        playAnimation()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  const playAnimation = () => {
    if (!isLoaded || !svgRef.current || !window.anime) return

    if (animationRef.current) {
      animationRef.current.play()
      setIsPlaying(true)
      return
    }

    const timeline = window.anime.timeline({
      easing: "easeOutExpo",
      duration: 750,
      autoplay: true,
    })

    // Background
    timeline.add({
      targets: "#demo-background",
      opacity: [0, 1],
      duration: 800,
    })

    // Mountain
    timeline.add(
      {
        targets: "#demo-mountain",
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 1000,
      },
      "-=400",
    )

    // Sun
    timeline.add(
      {
        targets: "#demo-sun",
        scale: [0, 1],
        opacity: [0, 1],
        duration: 1200,
        easing: "easeOutElastic(1, .5)",
      },
      "-=800",
    )

    // Trees
    timeline.add(
      {
        targets: "#demo-trees path",
        translateY: [20, 0],
        opacity: [0, 1],
        delay: window.anime.stagger(100),
        duration: 800,
      },
      "-=1000",
    )

    // Birds
    timeline.add(
      {
        targets: "#demo-birds path",
        translateX: [-20, 0],
        opacity: [0, 1],
        delay: window.anime.stagger(150),
        duration: 1000,
      },
      "-=600",
    )

    // Text
    timeline.add(
      {
        targets: "#demo-text",
        translateY: [10, 0],
        opacity: [0, 1],
        duration: 800,
      },
      "-=400",
    )

    animationRef.current = timeline
    setIsPlaying(true)
  }

  const pauseAnimation = () => {
    if (animationRef.current) {
      animationRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resetAnimation = () => {
    if (!isLoaded || !svgRef.current) return

    if (animationRef.current) {
      animationRef.current.pause()
    }

    // Reset all elements to their initial state
    if (window.anime) {
      window.anime.set("#demo-background", { opacity: 0 })
      window.anime.set("#demo-mountain", { translateY: 50, opacity: 0 })
      window.anime.set("#demo-sun", { scale: 0, opacity: 0 })
      window.anime.set("#demo-trees path", { translateY: 20, opacity: 0 })
      window.anime.set("#demo-birds path", { translateX: -20, opacity: 0 })
      window.anime.set("#demo-text", { translateY: 10, opacity: 0 })
    }

    animationRef.current = null
    setIsPlaying(false)
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-xl bg-white">
      <div className="relative bg-gradient-to-b from-sky-100 to-white p-4 h-[300px] md:h-[400px]">
        <div ref={svgRef} className="w-full h-full">
          <svg viewBox="0 0 800 500" className="w-full h-full">
            {/* Background */}
            <rect id="demo-background" x="0" y="0" width="800" height="500" fill="#f0f9ff" opacity="0" />

            {/* Sun */}
            <circle id="demo-sun" cx="650" cy="120" r="60" fill="#fbbf24" opacity="0" />

            {/* Mountain */}
            <path id="demo-mountain" d="M0,500 L300,200 L500,350 L800,180 L800,500 Z" fill="#6366f1" opacity="0" />

            {/* Trees */}
            <g id="demo-trees">
              <path d="M150,380 L170,380 L160,320 Z" fill="#15803d" opacity="0" />
              <path d="M190,400 L220,400 L205,320 Z" fill="#16a34a" opacity="0" />
              <path d="M250,390 L280,390 L265,330 Z" fill="#15803d" opacity="0" />
              <path d="M100,410 L130,410 L115,350 Z" fill="#16a34a" opacity="0" />
            </g>

            {/* Birds */}
            <g id="demo-birds">
              <path d="M600,150 C610,140 620,150 630,140 C620,150 630,160 620,160 Z" fill="#1e293b" opacity="0" />
              <path d="M650,180 C660,170 670,180 680,170 C670,180 680,190 670,190 Z" fill="#1e293b" opacity="0" />
              <path d="M550,130 C560,120 570,130 580,120 C570,130 580,140 570,140 Z" fill="#1e293b" opacity="0" />
            </g>

            {/* Text */}
            <text
              id="demo-text"
              x="400"
              y="450"
              textAnchor="middle"
              fontFamily="Arial"
              fontSize="24"
              fontWeight="bold"
              fill="#1e293b"
              opacity="0"
            >
              Bring Your SVGs to Life
            </text>
          </svg>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t flex justify-center space-x-4">
        {isPlaying ? (
          <Button onClick={pauseAnimation} variant="outline" className="flex items-center">
            <Pause className="mr-2 h-4 w-4" /> Pause
          </Button>
        ) : (
          <Button onClick={playAnimation} className="bg-purple-600 hover:bg-purple-700 flex items-center">
            <Play className="mr-2 h-4 w-4" /> Play Animation
          </Button>
        )}
        <Button onClick={resetAnimation} variant="outline" className="flex items-center">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      </div>
    </div>
  )
}
