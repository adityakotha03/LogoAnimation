import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get SVG layers from request body
    const { svgLayers } = await request.json()

    if (!svgLayers || !Array.isArray(svgLayers) || svgLayers.length === 0) {
      return NextResponse.json({ error: "Invalid or missing svgLayers in request body" }, { status: 400 })
    }

    // Prepare the prompt for Claude
    const promptText = `
      Analyze this SVG logo that has been split into layers. Each layer represents a distinct visual element in the logo.
      
      Here are the SVG layers:
      ${JSON.stringify(svgLayers, null, 2)}
      
      For each layer element:
      1. Describe what it visually represents (e.g., "mountain", "bird", "company name")
      2. Classify it as one of: primary element (focal point), secondary element, text, or background
      3. Suggest how this element could be meaningfully animated based on what it represents
      
      Return your analysis as JSON in this format:
      {
        "elements": [
          {
            "id": "layer-id-from-svg",
            "type": "primary|secondary|text|background",
            "description": "what this element depicts",
            "animationSuggestion": "how this specific element could be animated"
          }
        ],
        "groupings": [
          {
            "name": "descriptive-group-name",
            "elementIds": ["layer-id-1", "layer-id-2"],
            "reason": "why these elements should be animated together"
          }
        ],
        "conceptDescription": "overall animation concept that would be semantically meaningful for this logo"
      }
      
      Focus on creating animations that reflect the real-world behavior or meaning of each element. For example, if an element represents a bird, suggest it could fly in; if it's a wave, suggest it could undulate.
      Only output valid JSON—no markdown fences, no extra text.
    `

    // Check if Claude API key is available
    if (!process.env.CLAUDE_API_KEY) {
      console.error("Missing CLAUDE_API_KEY environment variable")
      return NextResponse.json(
        { error: "Claude API key not configured. Please add CLAUDE_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    // Call Claude API for SVG analysis
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 2500,
        messages: [
          {
            role: "user",
            content: promptText,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Claude API error:", errorData)
      return NextResponse.json({ error: "Failed to call Claude API", details: errorData }, { status: 500 })
    }

    // Process the response
    const data = await response.json()
    let analysis

    try {
      // Extract the JSON from Claude's response
      const textContent = data.content[0].text
      // Find JSON content (it might be wrapped in markdown code blocks)
      const jsonMatch =
        textContent.match(/```json\n([\s\S]*?)\n```/) ||
        textContent.match(/```\n([\s\S]*?)\n```/) ||
        textContent.match(/{[\s\S]*}/)

      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : textContent
      analysis = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError)
      return NextResponse.json({ error: "Failed to parse Claude response", rawResponse: data }, { status: 500 })
    }

    // Return the analysis to the client
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("Error analyzing SVG with Claude:", error)
    return NextResponse.json({ error: "Failed to analyze SVG" }, { status: 500 })
  }
}
