import type { Tier } from "./store";

export type Environment = { tier: Tier; reducedMotion: boolean; coarse: boolean };

function param(name: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Decide how much visual richness this device can comfortably afford. */
export function detectEnvironment(): Environment {
  const reducedMotion =
    param("motion") === "reduced" ||
    (param("motion") !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const forced = param("tier") as Tier | null;
  if (param("webgl") === "0") return { tier: "none", reducedMotion, coarse };
  if (forced && ["high", "medium", "low", "none"].includes(forced)) return { tier: forced, reducedMotion, coarse };
  if (!hasWebGL()) return { tier: "none", reducedMotion, coarse };

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory ?? 4;
  const cores = nav.hardwareConcurrency ?? 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;

  // iOS Safari hides deviceMemory and often reports few cores, yet recent iPhones are fast
  const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let tier: Tier;
  if (coarse || small) {
    if (nav.deviceMemory !== undefined && nav.deviceMemory <= 3) tier = "low";
    else if (iOS || cores >= 6) tier = "medium";
    else tier = cores <= 4 ? "low" : "medium";
  } else {
    tier = cores >= 6 && memory >= 4 ? "high" : "medium";
  }
  return { tier, reducedMotion, coarse };
}

export const tierConfig = {
  high: { voxels: 2600, dust: 2200, petals: 110, dpr: 1.75, bloom: true, fireworkSlots: 10, fireworkParticles: 360 },
  medium: { voxels: 1500, dust: 1200, petals: 70, dpr: 1.5, bloom: false, fireworkSlots: 8, fireworkParticles: 260 },
  low: { voxels: 800, dust: 600, petals: 40, dpr: 1.25, bloom: false, fireworkSlots: 6, fireworkParticles: 180 },
  none: { voxels: 0, dust: 0, petals: 0, dpr: 1, bloom: false, fireworkSlots: 0, fireworkParticles: 0 },
} as const;
