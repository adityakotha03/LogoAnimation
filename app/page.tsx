import { SvgUploader } from "@/components/svg-uploader"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">SVG Logo Analyzer</h1>
      <p className="text-gray-600 mb-8">
        Upload an SVG logo to analyze its structure and get AI-powered animation suggestions.
      </p>
      <SvgUploader />
    </main>
  )
}
