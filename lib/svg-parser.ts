let idCounter = 0;

type Layer = {
  id: string;
  name: string;
  svgContent: string; // Represents the content for *this layer only* (often wrapped in its own SVG for display)
};

// Define the return type to include the modified full SVG
type ExtractionResult = {
  layers: Layer[];
  modifiedContent: string; // The full SVG string with IDs added
};

/**
 * Extracts individual layers from an SVG string and adds unique IDs.
 * Returns the layers array and the full SVG string with modifications.
 */
export function extractSvgLayers(svgString: string): ExtractionResult {
  // Reset counter for each new SVG processed
  idCounter = 0;
  const defaultResult: ExtractionResult = { layers: [], modifiedContent: svgString };

  try {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");

    const parserError = svgDoc.querySelector("parsererror");
    if (parserError) {
      console.error("SVG parsing error:", parserError.textContent);
      // Return original string on parsing error, maybe add a specific layer indicating error?
      return {
        layers: [{ id: 'error-parse', name: 'Parsing Error', svgContent: `<svg><text fill='red'>Error parsing SVG</text></svg>` }],
        modifiedContent: svgString
      };
    }

    const svgElement = svgDoc.querySelector("svg");
    if (!svgElement) {
      throw new Error("No SVG element found");
    }

    const svgAttributes: Record<string, string> = {};
    Array.from(svgElement.attributes).forEach((attr) => {
      svgAttributes[attr.name] = attr.value;
    });

    const layers: Layer[] = [];
    const layerElements = Array.from(svgElement.children).filter((el) => {
      const tagName = el.tagName.toLowerCase();
       // Skip non-visual elements like defs, metadata, style, etc.
      return !["defs", "metadata", "title", "desc", "style"].includes(tagName);
    });

    // --- Modification Start ---

    // 1. Assign IDs directly to elements in the original svgDoc
    layerElements.forEach((element) => {
      if (!element.id) {
        const generatedId = `layer-${++idCounter}`;
        element.setAttribute("id", generatedId);
      }
      // Handle cases where an element might already have an ID.
      // For this implementation, we'll prioritize existing IDs but ensure the counter is updated
      // if the existing ID follows the pattern, to avoid collisions.
      else {
         const match = element.id.match(/layer-(\d+)/);
         if (match) {
            idCounter = Math.max(idCounter, parseInt(match[1], 10));
         }
         // If it has an ID but not matching the pattern, we leave it as is.
         // Animation code might need to handle selectors for both formats.
      }
    });

    // Handle the case where the whole SVG is treated as one layer
     if (layerElements.length === 0 || layerElements.length === 1) {
        let singleLayerId = 'layer-whole';
        let singleLayerName = "Complete SVG";
        if (layerElements.length === 1) {
           // Ensure the single element has an ID (it should have been assigned above or existed)
           if (!layerElements[0].id) {
              // Assign one if somehow missed (shouldn't happen)
              layerElements[0].setAttribute("id", `layer-${++idCounter}`);
           }
           singleLayerId = layerElements[0].id;
           singleLayerName = getElementName(layerElements[0], 0);
        }
        // Serialize the potentially modified SVG element
        const modifiedFullSvg = new XMLSerializer().serializeToString(svgElement);
        return {
            layers: [{
                id: singleLayerId,
                name: singleLayerName,
                // For single layer view, show the full (modified) svg
                svgContent: modifiedFullSvg,
            }],
            modifiedContent: modifiedFullSvg
        };
     }


    // 2. Process each layer using the now-ID'd elements
    layerElements.forEach((element, index) => {
      // ID should already be set on the element from the loop above
      const layerId = element.id;
      if (!layerId) {
         console.warn("Element missing ID after assignment attempt:", element);
         // Skip this element if it failed to get an ID
         return;
      }
      const layerName = getElementName(element, index);

      // Create the individual layer preview SVG
      const layerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      // Copy essential attributes like viewBox for proper scaling in preview
       if (svgAttributes.viewBox) layerSvg.setAttribute("viewBox", svgAttributes.viewBox);
       if (svgAttributes.width) layerSvg.setAttribute("width", "100%"); // Make preview responsive
       if (svgAttributes.height) layerSvg.setAttribute("height", "100%"); // Make preview responsive
       layerSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");


      // Clone the element *after* the ID has been set on the original
      const clonedElement = element.cloneNode(true) as Element;
      layerSvg.appendChild(clonedElement);

      layers.push({
        id: layerId,
        name: layerName,
        // Use XMLSerializer for potentially better accuracy than outerHTML for SVG fragments
        svgContent: new XMLSerializer().serializeToString(layerSvg),
      });
    });

    // 3. Serialize the entire modified svgElement to get the full content with IDs
    const modifiedContent = new XMLSerializer().serializeToString(svgElement);

    // --- Modification End ---

    return { layers, modifiedContent };

  } catch (error) {
    console.error("Error extracting SVG layers:", error);
    // Return original content in case of error
    return defaultResult;
  }
}

/**
 * Get a descriptive name for an element
 */
function getElementName(element: Element, index: number): string {
  // Try to get a meaningful name
  if (element.id && !element.id.startsWith('layer-')) { // Prefer existing descriptive IDs
    return element.id;
  }

  // Use title or desc if present
  const titleElement = element.querySelector("title");
  if (titleElement?.textContent) return titleElement.textContent;
  const descElement = element.querySelector("desc");
  if (descElement?.textContent) return descElement.textContent;

  if (element.classList.length > 0) {
    return Array.from(element.classList).join(" ");
  }

  // If it's a group with a single child that has an ID, use that
  if (element.tagName.toLowerCase() === "g" && element.children.length === 1 && element.children[0]?.id) {
    return getElementName(element.children[0], 0); // Recursively get child name
  }

   // Fallback to tag name and index or generated ID
   return element.id || `${element.tagName.toLowerCase()}-${index + 1}`;
}

/**
 * For backward compatibility - keep this function but make it return an empty array
 */
export function parseSvgElements(svgString: string): any[] {
  console.warn("parseSvgElements is deprecated, use extractSvgLayers instead");
  return [];
}