let idCounter = 0

type Layer = {
  id: string
  name: string
  svgContent: string
}

/**
 * Extracts individual layers from an SVG string
 */
export function extractSvgLayers(svgString: string): Layer[] {
  try {
    // Create a DOM parser
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml")

    // Check for parsing errors
    const parserError = svgDoc.querySelector("parsererror")
    if (parserError) {
      throw new Error("SVG parsing error: " + parserError.textContent)
    }

    // Get the root SVG element
    const svgElement = svgDoc.querySelector("svg")
    if (!svgElement) {
      throw new Error("No SVG element found")
    }

    // Get SVG attributes for creating new SVGs
    const svgAttributes: Record<string, string> = {}
    Array.from(svgElement.attributes).forEach((attr) => {
      svgAttributes[attr.name] = attr.value
    })

    // Find potential layers (direct children of the SVG that are visual elements)
    const layers: Layer[] = []
    const layerElements = Array.from(svgElement.children).filter((el) => {
      const tagName = el.tagName.toLowerCase()
      // Skip non-visual elements
      return !["defs", "metadata", "title", "desc"].includes(tagName)
    })

    // If no direct children found or only one child, treat the whole SVG as a single layer
    if (layerElements.length <= 1) {
      return [
        {
          id: "layer-whole",
          name: "Complete SVG",
          svgContent: svgString,
        },
      ]
    }

    // Process each layer
    layerElements.forEach((element, index) => {
      const layerId = element.id || `layer-${++idCounter}`
      const layerName = getElementName(element, index)

      // Create a new SVG document for this layer
      const layerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

      // Copy attributes from original SVG
      Object.entries(svgAttributes).forEach(([name, value]) => {
        layerSvg.setAttribute(name, value)
      })

      // Clone the element and add to the new SVG
      const clonedElement = element.cloneNode(true)
      layerSvg.appendChild(clonedElement)

      layers.push({
        id: layerId,
        name: layerName,
        svgContent: layerSvg.outerHTML,
      })
    })

    return layers
  } catch (error) {
    console.error("Error extracting SVG layers:", error)
    return []
  }
}

/**
 * Get a descriptive name for an element
 */
function getElementName(element: Element, index: number): string {
  // Try to get a meaningful name
  if (element.id) {
    return element.id
  }

  if (element.classList.length > 0) {
    return Array.from(element.classList).join(" ")
  }

  // If it's a group with a single child that has an ID, use that
  if (element.tagName.toLowerCase() === "g" && element.children.length === 1 && element.children[0].id) {
    return element.children[0].id
  }

  // Otherwise use the element type
  return element.tagName.toLowerCase()
}

/**
 * For backward compatibility - keep this function but make it return an empty array
 */
export function parseSvgElements(svgString: string): any[] {
  console.warn("parseSvgElements is deprecated, use extractSvgLayers instead")
  return []
}
