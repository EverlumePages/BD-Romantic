/**
 * Procedural bloom — a layered rose/peony.
 *
 * The same petal surface function exists twice: here (to place the voxel
 * targets on the CPU) and in GLSL (to shape the smooth petals on the GPU),
 * so the pixels land exactly where the real petals unfold.
 * KEEP `petalPoint` IN SYNC WITH `PETAL_GLSL` in heartflower/shaders.ts.
 */

export type PetalLayer = {
  count: number;
  L: number; // length
  W: number; // width
  aOpen: number; // tilt from the flower axis when open (rad)
  aClosed: number;
  curlOpen: number; // tip curl over the petal length (rad)
  curlClosed: number;
  cup: number; // lateral concavity
  r0: number; // base radius
  y: number; // base height
};

export const FLOWER_LAYERS: PetalLayer[] = [
  { count: 4, L: 0.5, W: 0.52, aOpen: 0.34, aClosed: 0.05, curlOpen: 0.4, curlClosed: -0.4, cup: 1.7, r0: 0.02, y: 0.07 },
  { count: 5, L: 0.72, W: 0.68, aOpen: 0.64, aClosed: 0.09, curlOpen: 0.55, curlClosed: -0.32, cup: 1.5, r0: 0.05, y: 0.035 },
  { count: 6, L: 0.92, W: 0.82, aOpen: 0.94, aClosed: 0.13, curlOpen: 0.65, curlClosed: -0.26, cup: 1.25, r0: 0.08, y: 0.0 },
  { count: 7, L: 1.08, W: 0.92, aOpen: 1.2, aClosed: 0.17, curlOpen: 0.72, curlClosed: -0.22, cup: 1.0, r0: 0.11, y: -0.035 },
  { count: 8, L: 1.2, W: 0.98, aOpen: 1.4, aClosed: 0.21, curlOpen: 0.78, curlClosed: -0.2, cup: 0.8, r0: 0.14, y: -0.07 },
];

export const FLOWER_TILT = 0.82; // rotation about X so the face looks toward the camera
export const GOLDEN = 2.39996323;

export type PetalInstance = {
  layer: number;
  psi: number;
  rand: number;
} & PetalLayer;

export function petalInstances(): PetalInstance[] {
  const out: PetalInstance[] = [];
  FLOWER_LAYERS.forEach((layer, k) => {
    const offset = k * GOLDEN;
    for (let i = 0; i < layer.count; i++) {
      const rand = fract(Math.sin((k * 17 + i) * 91.7) * 43758.5453);
      out.push({ ...layer, layer: k, psi: offset + (i / layer.count) * Math.PI * 2 + (rand - 0.5) * 0.18, rand });
    }
  });
  return out;
}

function fract(x: number) {
  return x - Math.floor(x);
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** petal half-width profile (0..1): narrow base, rounded tip */
export function petalWidth(v: number) {
  return v < 0.55 ? Math.pow(Math.max(v, 0) / 0.55, 0.65) : Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.55) / 0.45, 2)));
}

/** Petal surface point in the (untilted) flower frame — axis = +Y. */
export function petalPoint(p: PetalInstance, u: number, v: number, bloom: number): [number, number, number] {
  const a0 = mix(p.aClosed, p.aOpen, bloom);
  const curl = mix(p.curlClosed, p.curlOpen, bloom);
  const sc = mix(0.35, 1.0, bloom);
  const L = p.L * sc;
  const W = p.W * mix(0.55, 1.0, bloom);
  const half = 0.5 * W * petalWidth(v);
  const s = (u * 2 - 1) * half;
  const l = v * L;
  const k = curl / Math.max(L, 0.001);
  let cy: number, cz: number;
  if (Math.abs(k) < 1e-4) {
    cy = l * Math.cos(a0);
    cz = l * Math.sin(a0);
  } else {
    cy = (Math.sin(a0 + k * l) - Math.sin(a0)) / k;
    cz = (Math.cos(a0) - Math.cos(a0 + k * l)) / k;
  }
  const a = a0 + k * l;
  const cupOff = (p.cup * s * s) / Math.max(W, 0.05);
  const px = s;
  const py = cy + Math.sin(a) * cupOff;
  const pz = cz - Math.cos(a) * cupOff;
  // petal frame → flower frame (rotate around the axis by psi)
  const cs = Math.cos(p.psi), sn = Math.sin(p.psi);
  const r = pz + p.r0;
  const x = -sn * px + cs * r;
  const z = cs * px + sn * r;
  const y = py + p.y;
  return [x, y, z];
}

/** Apply the display tilt (rotation about X). */
export function tilt([x, y, z]: [number, number, number], t = FLOWER_TILT): [number, number, number] {
  const c = Math.cos(t), s = Math.sin(t);
  return [x, y * c - z * s, y * s + z * c];
}

export type FlowerTargets = {
  positions: Float32Array;
  /** petal layer 0..4, -1 for the centre, -2 for the stray pixel */
  layer: Float32Array;
};

/** Distribute `count` voxel targets over the open flower. */
export function flowerTargets(count: number, strayIndex: number, scale = 1, seed = 7): FlowerTargets {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const petals = petalInstances();
  const weights = petals.map((p) => p.L * p.W);
  const total = weights.reduce((a, b) => a + b, 0);
  const positions = new Float32Array(count * 3);
  const layer = new Float32Array(count);
  const centreCount = Math.round(count * 0.06);

  // order: centre first, then petals — then shuffle assignment so the
  // crumble order (by heart index) doesn't correlate with petal layers
  const slots: { p: [number, number, number]; layer: number }[] = [];
  for (let i = 0; i < centreCount; i++) {
    const r = Math.sqrt(rnd()) * 0.16;
    const th = rnd() * Math.PI * 2;
    const h = 0.04 + rnd() * 0.12 * (1 - r / 0.18);
    slots.push({ p: [Math.cos(th) * r, h, Math.sin(th) * r], layer: -1 });
  }
  const petalCount = count - centreCount;
  for (let i = 0; i < petalCount; i++) {
    // pick a petal by area
    let pick = rnd() * total;
    let idx = 0;
    while (idx < petals.length - 1 && pick > weights[idx]) {
      pick -= weights[idx];
      idx++;
    }
    const p = petals[idx];
    let u: number, v: number;
    const outline = rnd() < 0.34;
    if (outline) {
      // trace the petal edge so the voxel flower reads clearly
      v = 0.08 + rnd() * 0.92;
      u = rnd() < 0.5 ? 0.03 : 0.97;
      if (v > 0.9) u = 0.15 + rnd() * 0.7;
    } else {
      // rejection-sample by width so density is even
      do {
        v = rnd();
        u = rnd();
      } while (rnd() > petalWidth(v));
    }
    slots.push({ p: petalPoint(p, u, v, 1), layer: p.layer });
  }
  // Fisher–Yates
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  for (let i = 0; i < count; i++) {
    const slot = slots[i];
    const t = tilt(slot.p);
    positions[i * 3] = t[0] * scale;
    positions[i * 3 + 1] = t[1] * scale;
    positions[i * 3 + 2] = t[2] * scale;
    layer[i] = slot.layer;
  }
  // the stray pixel wanders off toward the top-right instead
  positions[strayIndex * 3] = 4.2 * scale;
  positions[strayIndex * 3 + 1] = 2.6 * scale;
  positions[strayIndex * 3 + 2] = 1.2 * scale;
  layer[strayIndex] = -2;
  return { positions, layer };
}
