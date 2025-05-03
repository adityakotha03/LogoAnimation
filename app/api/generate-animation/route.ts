import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get the logo analysis and SVG data from the request
    const { analysis, svgLayers } = await request.json()

    if (!analysis || !svgLayers) {
      return NextResponse.json({ error: "Missing analysis or SVG data" }, { status: 400 })
    }

    // Check if Claude API key is available
    if (!process.env.CLAUDE_API_KEY) {
      console.error("Missing CLAUDE_API_KEY environment variable")
      return NextResponse.json(
        { error: "Claude API key not configured. Please add CLAUDE_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    // Prepare the prompt for animation code generation
    const promptText = `
      Based on the analysis of this logo:
      ${JSON.stringify(analysis, null, 2)}
      
      Generate anime.js animation code that creates a semantically meaningful animation for this logo.
      
      The SVG structure is:
      ${JSON.stringify(svgLayers, null, 2)}
      
      Please create animation code that:
      
      1. Animates the primary element in a way that reflects what it represents (e.g., if it's a bird, make it fly in; if it's a wave, make it undulate)
      
      2. Properly sequences the animation of secondary elements to support the primary element
      
      3. Times the text elements to appear at an appropriate moment
      
      4. Uses appropriate easing functions for smooth, professional animations
      
      5. Includes descriptive comments for each animation block to explain what's happening
      
      Your code should use anime.js syntax and target elements by their IDs. Format your response as valid JavaScript that creates a timeline using anime.js.
      
      Include a conceptual description at the top explaining the overall animation approach, followed by the complete, working code.
      
      The HTML has already loaded the anime.js library and contains all the SVG elements with their IDs as specified in the analysis.
      
      Return just the JavaScript code to execute the animation.
    `

    // Call Claude API for animation code generation
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 2000,
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
    let animationCode
    let conceptDescription = ""

    try {
      // Extract the code from Claude's response
      const textContent = data.content[0].text
      
      // Split response into description and code parts
      const parts = textContent.split("```")
      
      // First part is the conceptual description
      if (parts.length > 0) {
        conceptDescription = parts[0].trim()
      }
      
      // Find code content (it might be wrapped in markdown code blocks)
      const codeMatch =
        textContent.match(/```javascript\n([\s\S]*?)\n```/) ||
        textContent.match(/```js\n([\s\S]*?)\n```/) ||
        textContent.match(/```\n([\s\S]*?)\n```/)

      animationCode = codeMatch ? codeMatch[1] : textContent
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError)
      return NextResponse.json({ error: "Failed to parse Claude response", rawResponse: data }, { status: 500 })
    }

    // Return the generated animation code and description to the client
    return NextResponse.json({ animationCode, conceptDescription })
  } catch (error) {
    console.error("Error generating animation code with Claude:", error)
    return NextResponse.json({ error: "Failed to generate animation code" }, { status: 500 })
  }
}