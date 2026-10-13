/**
 * One palette per chapter. The backdrop shader (and the 2D fallback)
 * blends between neighbours as she scrolls, so the whole world slowly
 * changes its light: dark invitation → dusk → focus → night → pink dawn →
 * blush daylight → near-dark confession → firework night → rose dawn.
 */
export type Mood = {
  top: string;
  mid: string;
  bot: string;
  glow: string;
  glowY: number;
  glowR: number;
  glowI: number;
  stars: number;
  vignette: number;
  /** 0 = dark scene, 1 = light scene (switches particle blending) */
  light: number;
};

export const MOODS: Mood[] = [
  // 0 invitation
  { top: "#0a0208", mid: "#12040e", bot: "#1b0615", glow: "#ff1493", glowY: 0.6, glowR: 0.2, glowI: 0.3, stars: 0.25, vignette: 0.9, light: 0 },
  // 1 october 13 — dusk
  { top: "#0d020a", mid: "#24071c", bot: "#560d3a", glow: "#ff2d96", glowY: 0.04, glowR: 0.55, glowI: 0.34, stars: 0.7, vignette: 0.5, light: 0 },
  // 2 the little spark — dark focus
  { top: "#080106", mid: "#12040e", bot: "#1d0617", glow: "#ff1493", glowY: 0.5, glowR: 0.34, glowI: 0.3, stars: 0.3, vignette: 0.85, light: 0 },
  // 3 little things — night sky
  { top: "#06020b", mid: "#13061c", bot: "#2a0b2b", glow: "#c03a8f", glowY: 0.9, glowR: 0.55, glowI: 0.28, stars: 1, vignette: 0.45, light: 0 },
  // 4 duo — pink dawn
  { top: "#ff86c2", mid: "#ffbddb", bot: "#ffeef6", glow: "#fff9fc", glowY: 0.72, glowR: 0.42, glowI: 0.5, stars: 0, vignette: 0.05, light: 1 },
  // 5 garden — blush daylight
  { top: "#ffc9e3", mid: "#ffeef6", bot: "#ffdcec", glow: "#ffffff", glowY: 0.86, glowR: 0.5, glowI: 0.45, stars: 0, vignette: 0.06, light: 1 },
  // 6 confession — near dark, one soft light
  { top: "#060105", mid: "#0d030a", bot: "#16050f", glow: "#ff5aa8", glowY: 0.5, glowR: 0.26, glowI: 0.22, stars: 0.12, vignette: 0.95, light: 0 },
  // 7 finale — firework night
  { top: "#07020d", mid: "#130512", bot: "#2c0a22", glow: "#ff1493", glowY: 0.04, glowR: 0.5, glowI: 0.3, stars: 0.85, vignette: 0.5, light: 0 },
  // 8 one more thing — rose dawn
  { top: "#1a0517", mid: "#701346", bot: "#e8679f", glow: "#ff5aa8", glowY: 0.12, glowR: 0.5, glowI: 0.26, stars: 0.5, vignette: 0.35, light: 0.2 },
];

export function moodAt(index: number) {
  return MOODS[Math.max(0, Math.min(MOODS.length - 1, index))];
}
