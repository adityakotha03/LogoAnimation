import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the logo analysis and SVG data from the request
    const { analysis, svgLayers } = await request.json();

    if (!analysis || !svgLayers) {
      return NextResponse.json(
        { error: "Missing analysis or SVG data" },
        { status: 400 },
      );
    }

    // Check if Claude API key is available
    if (!process.env.CLAUDE_API_KEY) {
      console.error("Missing CLAUDE_API_KEY environment variable");
      return NextResponse.json(
        {
          error:
            "Claude API key not configured. Please add CLAUDE_API_KEY to your environment variables.",
        },
        { status: 500 },
      );
    }

    // --- Prompt Modification Start ---

    // Prepare the prompt for animation code generation using anime.js
    const promptText = `
Based on the analysis of this logo:
${JSON.stringify(analysis, null, 2)}

And the SVG structure with layer IDs:
${JSON.stringify(svgLayers, null, 2)}

Generate JavaScript animation code that **MUST use the anime.js library** to create a semantically meaningful animation for this logo.

**Instructions:**

1.  **Use anime.js ONLY.** Do not use CSS animations (like Animate.css) or vanilla JS timeouts for sequencing.
2.  **Create a main timeline:** Use \`const timeline = anime.timeline({ /* options */ });\` as the core structure.
3.  **Add animations to the timeline:** Use \`timeline.add({ targets: '#layer-ID', /* animation properties */ }, '+=offset');\` to sequence animations. Target elements specifically by their IDs (e.g., '#layer-1', '#layer-2').
4.  **Animate based on semantics:** Design the animation sequence and effects based on the provided analysis (primary/secondary elements, groupings, concept description). Make primary elements stand out, support them with secondary elements, and time text appropriately.
5.  **Include comments:** Add descriptive comments explaining the animation choices for different parts.
6.  **Assume Environment:** Assume anime.js is already loaded (\`window.anime\` is available) and the SVG elements with the specified IDs exist in the DOM when the code runs.
7.  **Output Format:** Provide ONLY the JavaScript code necessary to define and potentially initiate the animation using an anime.js timeline. The code should be executable in a browser environment where 'anime' is globally available. Do not wrap it in \`document.addEventListener('DOMContentLoaded', ...)\` unless absolutely necessary for the animation logic itself (usually not needed with anime.js timelines).

**Example anime.js Pattern:**

\`\`\`javascript
/**
 * Conceptual description of the animation approach goes here.
 * (e.g., Explaining how the elements will animate and interact based on the analysis)
 */
function animateLogo() {
  // Optional: Reset initial states if needed (e.g., set opacity to 0)
  anime.set(['#layer-1', '#layer-2' /* ...all layers */], { opacity: 0, /* other initial states */ });

  // Create the main timeline
  const timeline = anime.timeline({
    easing: 'easeOutExpo', // Example default easing
    duration: 750       // Example default duration
  });

  // Add animations sequentially
  timeline.add({
    targets: '#layer-1', // Target the first element
    opacity: [0, 1],
    translateX: [-20, 0], // Example animation
    // duration, easing can be specified here to override defaults
  })
  .add({
    targets: '#layer-2', // Target the second element
    opacity: [0, 1],
    scale: [0.5, 1],
    // Use relative offset for timing based on the previous animation's end
  }, '-=300') // Example offset - starts 300ms before the previous one ends
  // ... add more animation steps for other layers ...
  .add({
    targets: '#layer-text', // Example text layer
    opacity: [0, 1],
  }, '+=500'); // Example offset - starts 500ms after the previous one ends

  // IMPORTANT: Ensure the function returns the timeline or makes it accessible
  // so the calling environment can potentially control it (e.g., replay).
  // Returning it is often cleaner:
  return timeline;
}

// Optional: If the function needs to be called immediately after definition
// const logoAnimationTimeline = animateLogo();
// Or the calling code might handle execution. Returning the timeline is preferred.
\`\`\`

Now, generate the specific anime.js code for the provided logo analysis and structure. Start with the conceptual description comment block, followed by the JavaScript code.
`;

    // --- Prompt Modification End ---


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
      const errorData = await response.json();
      console.error("Claude API error:", response.status, errorData);
      return NextResponse.json(
        { error: "Failed to call Claude API", details: errorData },
        { status: response.status }, // Return Claude's status code
      );
    }

    // Process the response
    const data = await response.json();
    let animationCode = "";
    let conceptDescription = ""; // Initialize conceptDescription

    if (!data.content || !Array.isArray(data.content) || data.content.length === 0 || !data.content[0].text) {
         console.error("Invalid response structure from Claude:", data);
         return NextResponse.json({ error: "Invalid response structure from Claude API" }, { status: 500 });
    }

    try {
      // Extract the text content from Claude's response
      const textContent = data.content[0].text;

      // Attempt to find the JavaScript code block first
      const codeMatch =
        textContent.match(/```javascript\n([\s\S]*?)\n```/) ||
        textContent.match(/```js\n([\s\S]*?)\n```/) ||
        textContent.match(/```\n([\s\S]*?)\n```/); // Allow generic block

      if (codeMatch && codeMatch[1]) {
         animationCode = codeMatch[1].trim();
         // Try to extract the description preceding the code block
         const descriptionMatch = textContent.substring(0, codeMatch.index).trim();
         // Look for common patterns like /** ... */ or // comments
         const commentDescMatch = descriptionMatch.match(/^\/\*\*([\s\S]*?)\*\//) || descriptionMatch.match(/^(?:\/\/.*\n?)+/);
         conceptDescription = commentDescMatch ? commentDescMatch[0].trim() : descriptionMatch;
      } else {
        // If no code block found, assume the whole response might be code,
        // but this is less reliable. Check if it looks like code.
        if (textContent.includes('anime.timeline') || textContent.includes('anime.set') || textContent.includes('timeline.add')) {
            animationCode = textContent.trim();
            conceptDescription = "Conceptual description could not be separated from code.";
            console.warn("Could not find clear code block markers (```), treating response as code.");
        } else {
            // Assume it's mostly description if it doesn't look like code
            conceptDescription = textContent.trim();
            animationCode = "// Failed to extract executable code from the response.";
            console.warn("Response did not contain expected code patterns or markers.");
        }
      }

      // Basic validation: Does the extracted code look like it contains anime.js calls?
       if (!animationCode.includes('anime.timeline') && !animationCode.includes('anime(')) {
          console.warn(`Generated code might not be using anime.js as requested: ${animationCode.substring(0, 100)}...`);
          // Decide if you want to return an error here or proceed cautiously
          // return NextResponse.json({ error: "Generated code does not seem to use anime.js" }, { status: 500 });
       }


    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      // Attempt to return raw response text if parsing fails
      const rawText = data.content[0]?.text || "No text content found";
      return NextResponse.json(
        {
          error: "Failed to parse Claude response",
          rawResponseText: rawText, // Send raw text for debugging
        },
        { status: 500 },
      );
    }

    // Return the generated animation code and description to the client
    return NextResponse.json({ animationCode, conceptDescription });
  } catch (error: any) {
    console.error("Error in /api/generate-animation:", error);
    return NextResponse.json(
      { error: "Failed to generate animation code", details: error.message || "Unknown server error" },
      { status: 500 },
    );
  }
}