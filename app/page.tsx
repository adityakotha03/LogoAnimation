import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Layers, Play, Wand2 } from "lucide-react"
import Image from "next/image"
import { AnimatedDemo } from "@/components/animated-demo"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Play className="h-6 w-6 text-purple-200" />
            <span className="font-bold text-xl">Animify</span>
          </div>
          <nav>
            <Link href="/analyzer">
              <Button variant="outline" className="text-white border-white hover:bg-white/10 hover:text-white">
                <span className="text-purple-700">Get Started</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Transform Static SVGs into{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                  Dynamic Animations
                </span>
              </h1>
              <p className="text-xl text-gray-600">
                Easily create professional animations from layered SVG files using AI—no coding or animation skills
                required.
              </p>
              <div className="pt-4">
                <Link href="/analyzer">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-6 py-3 h-auto shadow-lg transition-all hover:shadow-xl"
                  >
                    Start Animating <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <AnimatedDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered tool analyzes your layered SVG files and generates beautiful animations in just a few
              clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-8 rounded-xl shadow-lg transition-transform hover:scale-105">
              <div className="h-14 w-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-6 shadow-md">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Upload Layered SVG</h3>
              <p className="text-gray-600">
                Export your design as an SVG with layers from Figma, Illustrator, or any design tool.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-8 rounded-xl shadow-lg transition-transform hover:scale-105">
              <div className="h-14 w-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-6 shadow-md">
                <Wand2 className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">AI Analysis</h3>
              <p className="text-gray-600">
                Our AI analyzes your SVG layers and suggests meaningful animations based on the content.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-8 rounded-xl shadow-lg transition-transform hover:scale-105">
              <div className="h-14 w-14 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center mb-6 shadow-md">
                <Play className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Generate Animation</h3>
              <p className="text-gray-600">
                With one click, generate professional animations that bring your static designs to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Export Instructions */}
      <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 w-full">
          <div className="relative w-full aspect-[2928/1841] rounded-xl overflow-hidden shadow-xl">
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
              <h2 className="text-3xl md:text-5xl font-bold">Exporting from Figma</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm">1</span>
                  </div>
                  <p className="ml-4 text-gray-600 text-lg">Select the layers you want to animate in Figma</p>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm">2</span>
                  </div>
                  <p className="ml-4 text-gray-600 text-lg">Right-click and select "Export..."</p>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm">3</span>
                  </div>
                  <p className="ml-4 text-gray-600 text-lg">
                    Choose SVG format and ensure "Include 'id' attribute" is checked
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <span className="text-sm">4</span>
                  </div>
                  <p className="ml-4 text-gray-600 text-lg">
                    Upload the exported SVG to our tool and let the magic happen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Got questions? We've got answers.</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2">What file formats are supported?</h3>
              <p className="text-gray-600">
                Currently, we support SVG files with properly structured layers. These can be exported from design tools
                like Figma, Adobe Illustrator, or Sketch.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2">Do I need coding skills to use this tool?</h3>
              <p className="text-gray-600">
                Not at all! Our tool is designed for designers and non-technical users. The AI handles all the complex
                animation code for you.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2">How do I export my animation?</h3>
              <p className="text-gray-600">
                After generating your animation, you can download it as Mp4 file.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold mb-2">Can I customize the generated animations?</h3>
              <p className="text-gray-600">
                Yes! While our AI creates a great starting point, you can edit the animation parameters, timing, and
                effects to fine-tune the result.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Ready to Bring Your SVGs to Life?</h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto">
            Start creating beautiful animations from your layered SVG files in minutes, powered by Claude AI.
          </p>
          <Link href="/analyzer">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-6 py-3 h-auto shadow-lg transition-all hover:shadow-xl"
            >
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-gray-400 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Play className="h-5 w-5 text-purple-400" />
              <span className="font-bold text-white">Animify</span>
            </div>
            <div className="text-sm">© {new Date().getFullYear()} Animify. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
