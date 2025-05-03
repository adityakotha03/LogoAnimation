// Collection of Animate.css animation names by category
export const animateCssAnimations = {
    attention_seekers: ["bounce", "flash", "pulse", "rubberBand", "shake", "swing", "tada", "wobble"],
    bouncing_entrances: ["bounceIn", "bounceInDown", "bounceInLeft", "bounceInRight", "bounceInUp"],
    bouncing_exits: ["bounceOut", "bounceOutDown", "bounceOutLeft", "bounceOutRight", "bounceOutUp"],
    fading_entrances: [
      "fadeIn",
      "fadeInDown",
      "fadeInDownBig",
      "fadeInLeft",
      "fadeInLeftBig",
      "fadeInRight",
      "fadeInRightBig",
      "fadeInUp",
      "fadeInUpBig",
    ],
    fading_exits: [
      "fadeOut",
      "fadeOutDown",
      "fadeOutDownBig",
      "fadeOutLeft",
      "fadeOutLeftBig",
      "fadeOutRight",
      "fadeOutRightBig",
      "fadeOutUp",
      "fadeOutUpBig",
    ],
    flippers: ["flip", "flipInX", "flipInY", "flipOutX", "flipOutY"],
    lightspeed: ["lightSpeedIn", "lightSpeedOut"],
    rotating: ["rotate", "rotateDownLeft", "rotateDownRight", "rotateUpLeft", "rotateUpRight"],
    rotating_entrances: ["rotateIn", "rotateInDownLeft", "rotateInDownRight", "rotateInUpLeft", "rotateInUpRight"],
    rotating_exits: ["rotateOut", "rotateOutDownLeft", "rotateOutDownRight", "rotateOutUpLeft", "rotateOutUpRight"],
    specials: ["hinge", "rollIn", "rollOut"],
    zooming_entrances: ["zoomIn", "zoomInDown", "zoomInLeft", "zoomInRight", "zoomInUp"],
    zooming_exits: ["zoomOut", "zoomOutDown", "zoomOutLeft", "zoomOutRight", "zoomOutUp"],
    sliding_entrances: ["slideInDown", "slideInLeft", "slideInRight", "slideInUp"],
    sliding_exits: ["slideOutDown", "slideOutLeft", "slideOutRight", "slideOutUp"],
  }
  
  // Function to apply Animate.css animations to elements
  export function applyAnimateCss(element: Element, animationName: string, duration = 1, delay = 0, infinite = false) {
    // Add the base animated class
    element.classList.add("animated")
  
    // Add the specific animation class
    element.classList.add(animationName)
  
    // Set duration if different from default
    if (duration !== 1) {
      element.style.animationDuration = `${duration}s`
    }
  
    // Set delay if specified
    if (delay > 0) {
      element.style.animationDelay = `${delay}s`
    }
  
    // Set infinite if specified
    if (infinite) {
      element.classList.add("infinite")
    }
  
    // Return a function to remove the animation
    return () => {
      element.classList.remove("animated")
      element.classList.remove(animationName)
      if (infinite) {
        element.classList.remove("infinite")
      }
      element.style.animationDuration = ""
      element.style.animationDelay = ""
    }
  }
  
  // Function to create a sequence of animations
  export function createAnimationSequence(elements: Element[], animations: string[], options = {}) {
    const sequence: any[] = []
  
    elements.forEach((element, index) => {
      const animation = animations[index % animations.length]
      const delay = index * 0.2 // Stagger delay
  
      sequence.push({
        element,
        animation,
        delay,
        cleanup: () => {},
      })
    })
  
    return {
      play: () => {
        sequence.forEach((item) => {
          item.cleanup = applyAnimateCss(item.element, item.animation, 1, item.delay)
        })
      },
      stop: () => {
        sequence.forEach((item) => item.cleanup())
      },
    }
  }
  