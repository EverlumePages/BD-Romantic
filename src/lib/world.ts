/**
 * A mutable, non-reactive bridge between the DOM story (GSAP / ScrollTrigger)
 * and the WebGL world (useFrame). Writing here never causes React renders.
 */

export type FireworkKind = "burst" | "heart" | "flower" | "glitter" | "ring";

export type FireworkEvent = {
  /** normalised device coords, -1..1 */
  x: number;
  y: number;
  kind: FireworkKind;
  hue?: number;
};

export const world = {
  /** 0..1 blend from the dark invitation into the story */
  gate: 0,
  /** smoothed, displayed mood (written by the backdrop) */
  mood: 0,
  /** continuous chapter index, driven by scroll (1 = october 13 … 8 = final) */
  scrollMood: 1,
  /** pointer in normalised coords (-1..1), y up */
  pointer: { x: 0, y: 0, active: 0 },
  /** 0 = dark scene, 1 = light scene (computed by the backdrop) */
  lightness: 0,
  /** scroll velocity, roughly px per frame */
  velocity: 0,
  heart: {
    /** 0..1 — ambient dust gathering into the heart */
    assemble: 0,
    /** 0..1 — how hard she's holding */
    charge: 0,
    /** 0..1 — the full transformation timeline */
    progress: 0,
    /** 0..1 — overall visibility of the heart/flower object */
    visible: 0,
    /** vertical offset in world units (used when the flower floats away) */
    lift: 0,
    /** extra scale multiplier */
    scale: 1,
    /** 0..1 how much the camera is involved (dolly/orbit) */
    cinematic: 0,
    /** 1 = reduced motion: no swirl, just a gentle gather */
    calm: 0,
  },
  /** 0..1 strength of the drifting petal field */
  petals: 0.6,
  /** timestamp (seconds) of the last petal burst request */
  petalBurstAt: -100,
  fireworks: [] as FireworkEvent[],
  /** 0..1 — finale sky darkness + flower presence */
  finale: 0,
};

export function queueFirework(e: FireworkEvent) {
  if (world.fireworks.length > 24) world.fireworks.shift();
  world.fireworks.push(e);
}

export function requestPetalBurst() {
  world.petalBurstAt = performance.now() / 1000;
}
