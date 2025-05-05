import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Layers, Play, Wand2 } from "lucide-react"
import Image from "next/image"
import { AnimatedDemo } from "@/components/animated-demo"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-gray-200">
      {/* Navigation */}
      <header className="border-b border-purple-900/50 bg-black/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Play className="h-6 w-6 text-purple-500" />
            <span className="font-bold text-xl text-white">Animify</span>
          </div>
          <nav>
            <Link href="/analyzer">
              <Button variant="outline" className="text-purple-400 border-purple-500 hover:bg-purple-500/10 hover:text-purple-300 transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-indigo-700/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Transform Static SVGs into{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600 relative">
                  Dynamic Animations
                  <span className="absolute inset-0 bg-purple-500/20 blur-xl -z-10"></span>
                </span>
              </h1>
              <p className="text-xl text-gray-400">
                Easily create professional animations from layered SVG files using AI—no coding or animation skills
                required.
              </p>
              <div className="pt-4">
                <Link href="/analyzer">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-lg px-6 py-3 h-auto shadow-purple-900/50 shadow-lg transition-all hover:shadow-xl hover:shadow-purple-700/50"
                  >
                    Start Animating <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative bg-black/50 p-4 rounded-xl border border-purple-900/30 shadow-2xl shadow-purple-900/20">
              <div className="absolute inset-0 bg-purple-900/10 rounded-xl blur-sm"></div>
              <AnimatedDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-black/90 relative">
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 bg-purple-800/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our AI-powered tool analyzes your layered SVG files and generates beautiful animations in just a few
              clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900/80 border border-purple-900/30 p-8 rounded-xl shadow-lg transition-transform hover:scale-105 backdrop-blur-sm hover:shadow-purple-700/20 hover:shadow-lg">
              <div className="h-14 w-14 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mb-6 shadow-md shadow-purple-700/30">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Upload Layered SVG</h3>
              <p className="text-gray-400">
                Export your design as an SVG with layers from Figma, Illustrator, or any design tool.
              </p>
            </div>

            <div className="bg-gray-900/80 border border-purple-900/30 p-8 rounded-xl shadow-lg transition-transform hover:scale-105 backdrop-blur-sm hover:shadow-purple-700/20 hover:shadow-lg">
              <div className="h-14 w-14 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mb-6 shadow-md shadow-purple-700/30">
                <Wand2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">AI Analysis</h3>
              <p className="text-gray-400">
                Our AI analyzes your SVG layers and suggests meaningful animations based on the content.
              </p>
            </div>

            <div className="bg-gray-900/80 border border-purple-900/30 p-8 rounded-xl shadow-lg transition-transform hover:scale-105 backdrop-blur-sm hover:shadow-purple-700/20 hover:shadow-lg">
              <div className="h-14 w-14 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex items-center justify-center mb-6 shadow-md shadow-purple-700/30">
                <Play className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Generate Animation</h3>
              <p className="text-gray-400">
                With one click, generate professional animations that bring your static designs to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Export Instructions */}
      <section className="py-24 px-4 bg-black/95 relative">
        {/* Glow Effect */}
        <div className="absolute -bottom-40 left-1/4 w-96 h-96 bg-purple-800/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 w-full">
              <div className="relative w-full aspect-[2928/1841] rounded-xl overflow-hidden shadow-xl border border-purple-900/30 shadow-purple-900/20">
                <Image 
                  src="/svg_figma.jpg"
                  alt="Exporting from Figma"
                  fill
                  className="object-contain" 
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <h2 className="text-3xl md:text-5xl font-bold text-white">Exporting from Figma</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-purple-700/30">
                    <span className="text-sm">1</span>
                  </div>
                  <p className="ml-4 text-gray-400 text-lg">Select the layers you want to animate in Figma</p>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-purple-700/30">
                    <span className="text-sm">2</span>
                  </div>
                  <p className="ml-4 text-gray-400 text-lg">Right-click and select "Export..."</p>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-purple-700/30">
                    <span className="text-sm">3</span>
                  </div>
                  <p className="ml-4 text-gray-400 text-lg">
                    Choose SVG format and ensure "Include 'id' attribute" is checked
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-purple-700/30">
                    <span className="text-sm">4</span>
                  </div>
                  <p className="ml-4 text-gray-400 text-lg">
                    Upload the exported SVG to our tool and let the magic happen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-black/80 relative">
        {/* Glow Effect */}
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-800/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">Got questions? We've got answers.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-900/80 border border-purple-900/30 p-6 rounded-xl shadow-lg backdrop-blur-sm transition-all hover:shadow-purple-700/20 hover:border-purple-800/50">
              <h3 className="text-xl font-bold mb-2 text-white">What file formats are supported?</h3>
              <p className="text-gray-400">
                Currently, we support SVG files with properly structured layers. These can be exported from design tools
                like Figma, Adobe Illustrator, or Sketch.
              </p>
            </div>

            <div className="bg-gray-900/80 border border-purple-900/30 p-6 rounded-xl shadow-lg backdrop-blur-sm transition-all hover:shadow-purple-700/20 hover:border-purple-800/50">
              <h3 className="text-xl font-bold mb-2 text-white">Do I need coding skills to use this tool?</h3>
              <p className="text-gray-400">
                Not at all! Our tool is designed for designers and non-technical users. The AI handles all the complex
                animation code for you.
              </p>
            </div>

            <div className="bg-gray-900/80 border border-purple-900/30 p-6 rounded-xl shadow-lg backdrop-blur-sm transition-all hover:shadow-purple-700/20 hover:border-purple-800/50">
              <h3 className="text-xl font-bold mb-2 text-white">How do I export my animation?</h3>
              <p className="text-gray-400">
                After generating your animation, you can download it as Mp4 file.
              </p>
            </div>

            <div className="bg-gray-900/80 border border-purple-900/30 p-6 rounded-xl shadow-lg backdrop-blur-sm transition-all hover:shadow-purple-700/20 hover:border-purple-800/50">
              <h3 className="text-xl font-bold mb-2 text-white">Can I customize the generated animations?</h3>
              <p className="text-gray-400">
                Yes! While our AI creates a great starting point, you can edit the animation parameters, timing, and
                effects to fine-tune the result.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-purple-900 to-black relative">
        {/* Glow Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-purple-800/10 blur-3xl"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to Bring Your SVGs to Life?</h2>
          <p className="text-xl text-purple-200 mb-10 max-w-2xl mx-auto">
            Start creating beautiful animations from your layered SVG files in minutes, powered by Claude AI.
          </p>
          <Link href="/analyzer">
            <Button
              size="lg"
              className="bg-purple-600 text-white hover:bg-purple-500 text-lg px-6 py-3 h-auto shadow-lg shadow-purple-900/50 transition-all hover:shadow-xl hover:shadow-purple-700/50"
            >
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black text-gray-500 px-4 border-t border-purple-900/30">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Play className="h-5 w-5 text-purple-500" />
              <span className="font-bold text-white">Animify</span>
            </div>
            <div className="text-sm">© {new Date().getFullYear()} Animify. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
