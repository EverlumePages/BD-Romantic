"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { world, type FireworkKind } from "@/lib/world";

const KIND: Record<FireworkKind, number> = { burst: 0, heart: 1, flower: 2, glitter: 3, ring: 4 };
const PALETTES: [string, string][] = [
  ["#ff1493", "#ffd1e8"],
  ["#ff8dc7", "#fff9fc"],
  ["#ffc2a8", "#ff2d96"],
  ["#fff0f7", "#ff8dc7"],
  ["#ff2d96", "#ffb3d9"],
];
const PLANE_Z = -3;

const vertex = (slots: number) => /* glsl */ `
  #define SLOTS ${slots}
  #define TAU 6.28318531
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform vec3 uOrigin[SLOTS];
  uniform vec3 uLaunch[SLOTS];
  uniform float uStart[SLOTS];
  uniform float uKind[SLOTS];
  uniform vec3 uColA[SLOTS];
  uniform vec3 uColB[SLOTS];
  attribute float aSlot;
  attribute float aIdx;
  attribute vec4 aRand;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    int i = int(aSlot + 0.5);
    float t = uTime - uStart[i];
    float rise = 0.8;
    float life = 2.8;
    if (t < 0.0 || t > rise + life) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }
    vec3 origin = uOrigin[i];
    vec3 pos;
    float size;
    float alpha;
    vec3 col = mix(uColA[i], uColB[i], aRand.y);
    if (t < rise) {
      // the little spark rising, with a short glittering trail
      float lag = aIdx * 0.35;
      float k = clamp((t - lag * 0.5) / rise, 0.0, 1.0);
      float e = 1.0 - pow(1.0 - k, 2.4);
      pos = mix(uLaunch[i], origin, e);
      pos.x += sin(t * 24.0 + aIdx * 30.0) * 0.015;
      alpha = step(aIdx, 0.14) * (1.0 - aIdx * 6.0) * smoothstep(0.0, 0.08, t);
      size = 2.6;
      col = mix(col, vec3(1.0, 0.9, 0.95), 0.6);
    } else {
      float bt = t - rise;
      float kind = uKind[i];
      float th = aIdx * TAU;
      vec3 dir;
      if (kind < 0.5) {
        dir = normalize(aRand.xzw * 2.0 - 1.0 + 0.0001) * (0.75 + 0.25 * aRand.y);
      } else if (kind < 1.5) {
        float s = sin(th);
        vec2 h = vec2(16.0 * s * s * s, 13.0 * cos(th) - 5.0 * cos(2.0 * th) - 2.0 * cos(3.0 * th) - cos(4.0 * th)) / 16.0;
        dir = vec3(h, (aRand.z - 0.5) * 0.2) * (0.9 + 0.1 * aRand.w);
      } else if (kind < 2.5) {
        float r = 0.4 + 0.6 * abs(cos(2.5 * th));
        dir = vec3(cos(th) * r, sin(th) * r, (aRand.z - 0.5) * 0.2) * (0.86 + 0.14 * aRand.w);
      } else if (kind < 3.5) {
        dir = normalize(aRand.xzw * 2.0 - 1.0 + 0.0001) * (0.25 + 0.75 * aRand.y);
      } else {
        dir = vec3(cos(th), sin(th) * 0.6, sin(th) * 0.35);
      }
      float drag = 1.7;
      float travel = (1.0 - exp(-drag * bt)) / drag;
      pos = origin + dir * uScale * 4.2 * travel;
      pos.y -= 0.22 * bt * bt;
      alpha = 1.0 - smoothstep(life * 0.4, life, bt);
      if (kind > 2.5 && kind < 3.5) alpha *= 0.45 + 0.55 * sin(uTime * 26.0 + aRand.x * 60.0);
      alpha *= smoothstep(0.0, 0.05, bt);
      size = mix(3.6, 1.3, bt / life);
      col = mix(vec3(1.0, 0.95, 0.97), col, smoothstep(0.0, 0.35, bt));
    }
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = size * uPixelRatio * (12.0 / -mv.z) * (0.7 + aRand.w * 0.6);
    vColor = col;
    vAlpha = alpha;
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = pow(a, 1.6);
    gl_FragColor = vec4(vColor * a * vAlpha * 1.6, 1.0);
    #include <colorspace_fragment>
  }
`;

/** A fixed pool of firework slots in a single draw call. */
export default function Fireworks({ slots, particles }: { slots: number; particles: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);
  const next = useRef(0);
  const tmp = useMemo(() => ({ v: new THREE.Vector3(), dir: new THREE.Vector3() }), []);

  const geometry = useMemo(() => {
    const n = slots * particles;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const slot = new Float32Array(n);
    const idx = new Float32Array(n);
    const rand = new Float32Array(n * 4);
    for (let s = 0; s < slots; s++)
      for (let p = 0; p < particles; p++) {
        const k = s * particles + p;
        slot[k] = s;
        idx[k] = p / particles;
        rand.set([Math.random(), Math.random(), Math.random(), Math.random()], k * 4);
      }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSlot", new THREE.BufferAttribute(slot, 1));
    g.setAttribute("aIdx", new THREE.BufferAttribute(idx, 1));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    return g;
  }, [slots, particles]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex(slots),
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uScale: { value: 1 },
          uOrigin: { value: Array.from({ length: slots }, () => new THREE.Vector3()) },
          uLaunch: { value: Array.from({ length: slots }, () => new THREE.Vector3()) },
          uStart: { value: Array.from({ length: slots }, () => -100) },
          uKind: { value: Array.from({ length: slots }, () => 0) },
          uColA: { value: Array.from({ length: slots }, () => new THREE.Color()) },
          uColB: { value: Array.from({ length: slots }, () => new THREE.Color()) },
        },
      }),
    [slots]
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const u = material.uniforms;
    const now = state.clock.elapsedTime;
    u.uTime.value = now;
    u.uPixelRatio.value = viewport.dpr;
    const aspect = size.width / Math.max(1, size.height);
    u.uScale.value = Math.min(1, 0.45 + aspect * 0.45);

    while (world.fireworks.length) {
      const e = world.fireworks.shift()!;
      const s = next.current;
      next.current = (next.current + 1) % slots;
      // project the normalised screen point onto the firework plane
      tmp.v.set(e.x, e.y, 0.5).unproject(camera);
      tmp.dir.copy(tmp.v).sub(camera.position).normalize();
      const dist = (PLANE_Z - camera.position.z) / tmp.dir.z;
      const origin = (u.uOrigin.value as THREE.Vector3[])[s];
      origin.copy(camera.position).addScaledVector(tmp.dir, dist);
      // launch from below the bottom edge of the view
      tmp.v.set(e.x * 0.85, -1.15, 0.5).unproject(camera);
      tmp.dir.copy(tmp.v).sub(camera.position).normalize();
      const d2 = (PLANE_Z - camera.position.z) / tmp.dir.z;
      (u.uLaunch.value as THREE.Vector3[])[s].copy(camera.position).addScaledVector(tmp.dir, d2);
      (u.uStart.value as number[])[s] = now;
      (u.uKind.value as number[])[s] = KIND[e.kind];
      const pal = PALETTES[Math.floor((e.hue ?? Math.random()) * PALETTES.length) % PALETTES.length];
      (u.uColA.value as THREE.Color[])[s].set(pal[0]);
      (u.uColB.value as THREE.Color[])[s].set(pal[1]);
    }
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
