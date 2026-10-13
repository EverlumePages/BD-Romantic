"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MOODS } from "@/lib/moods";
import { world } from "@/lib/world";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uBot;
  uniform vec3 uGlow;
  uniform float uGlowY;
  uniform float uGlowR;
  uniform float uGlowI;
  uniform float uStars;
  uniform float uVignette;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 q = vec2(uv.x * uAspect, uv.y);
    float n = fbm(q * 1.4 + vec2(uTime * 0.018, -uTime * 0.012));
    float y = uv.y + (n - 0.5) * 0.2;
    vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.55, y));
    col = mix(col, uTop, smoothstep(0.5, 1.02, y));

    // soft light source
    vec2 gp = vec2(0.5 + uPointer.x * 0.025, uGlowY + uPointer.y * 0.02);
    vec2 d = (uv - gp) * vec2(uAspect, 1.0);
    float g = exp(-dot(d, d) / max(uGlowR * uGlowR, 0.0001));
    col += uGlow * g * uGlowI;

    // aurora silk
    float w = fbm(vec2(q.x * 0.8 + uTime * 0.01, uv.y * 2.6 - uTime * 0.025));
    col += uGlow * smoothstep(0.55, 0.92, w) * 0.07 * uGlowI;

    // pin-prick stars
    vec2 cellUv = q * 90.0;
    vec2 cell = floor(cellUv);
    float h = hash(cell);
    float star = step(0.986, h);
    vec2 sp = fract(cellUv) - 0.5 - (vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5) * 0.6;
    float tw = 0.55 + 0.45 * sin(uTime * (1.0 + h * 3.0) + h * 40.0);
    col += vec3(1.0, 0.86, 0.94) * star * smoothstep(0.12, 0.0, length(sp)) * tw * uStars * smoothstep(0.15, 0.6, uv.y + 0.2);

    // vignette
    float v = smoothstep(1.25, 0.25, length((uv - 0.5) * vec2(uAspect * 0.75, 1.0)));
    col *= mix(1.0, v, uVignette);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
    // dither against banding
    gl_FragColor.rgb += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 200.0;
  }
`;

const keys = ["top", "mid", "bot", "glow"] as const;

export default function Backdrop() {
  const size = useThree((s) => s.size);
  const shown = useRef(0);
  const palettes = useMemo(
    () =>
      MOODS.map((m) => ({
        top: new THREE.Color(m.top),
        mid: new THREE.Color(m.mid),
        bot: new THREE.Color(m.bot),
        glow: new THREE.Color(m.glow),
        m,
      })),
    []
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        depthWrite: false,
        depthTest: false,
        uniforms: {
          uTop: { value: new THREE.Color() },
          uMid: { value: new THREE.Color() },
          uBot: { value: new THREE.Color() },
          uGlow: { value: new THREE.Color() },
          uGlowY: { value: 0.5 },
          uGlowR: { value: 0.3 },
          uGlowI: { value: 0.3 },
          uStars: { value: 0 },
          uVignette: { value: 0.5 },
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uPointer: { value: new THREE.Vector2() },
        },
      }),
    []
  );

  useFrame((state, dt) => {
    const target = world.gate * world.scrollMood;
    shown.current += (target - shown.current) * Math.min(1, dt * 2.6);
    world.mood = shown.current;
    const m = Math.max(0, Math.min(palettes.length - 1, shown.current));
    const i = Math.floor(m);
    const j = Math.min(palettes.length - 1, i + 1);
    const t = m - i;
    const a = palettes[i], b = palettes[j];
    const u = material.uniforms;
    for (const k of keys) {
      const key = ("u" + k[0].toUpperCase() + k.slice(1)) as "uTop" | "uMid" | "uBot" | "uGlow";
      (u[key].value as THREE.Color).copy(a[k]).lerp(b[k], t);
    }
    u.uGlowY.value = a.m.glowY + (b.m.glowY - a.m.glowY) * t;
    u.uGlowR.value = a.m.glowR + (b.m.glowR - a.m.glowR) * t;
    u.uGlowI.value = (a.m.glowI + (b.m.glowI - a.m.glowI) * t) * (1 + world.heart.charge * 0.6 * world.heart.visible);
    u.uStars.value = a.m.stars + (b.m.stars - a.m.stars) * t;
    u.uVignette.value = a.m.vignette + (b.m.vignette - a.m.vignette) * t;
    u.uTime.value = state.clock.elapsedTime;
    u.uAspect.value = size.width / Math.max(1, size.height);
    (u.uPointer.value as THREE.Vector2).set(world.pointer.x, world.pointer.y);
    world.lightness = a.m.light + (b.m.light - a.m.light) * t;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1000} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
