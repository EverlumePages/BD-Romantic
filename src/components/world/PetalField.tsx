"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { world } from "@/lib/world";
import { COMMON_GLSL } from "./heartflower/shaders";

/** petal density per chapter mood */
const DENSITY = [0.0, 0.6, 0.18, 0.3, 0.7, 0.85, 0.05, 0.5, 0.85];

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uGust;
  uniform float uFall;
  uniform float uOpacity;
  attribute vec4 aOffset; // xyz base, w scale
  attribute vec4 aRand;
  varying vec2 vUv;
  varying float vFacing;
  varying float vRand;

  ${COMMON_GLSL}

  void main() {
    vec3 pp = position;
    float v = uv.y;
    float w = pow(max(sin(PI * pow(v, 0.7)), 0.0), 0.9);
    pp.x *= w * 0.8;
    pp.z += -pp.x * pp.x * 1.4 + sin(v * PI) * 0.1;
    // fade by count: each petal has its own threshold, so density changes cleanly
    float show = smoothstep(aRand.x - 0.04, aRand.x + 0.04, uOpacity);
    pp *= aOffset.w * show;

    float spin = uTime * (0.25 + aRand.x * 0.55) + aRand.x * 20.0 + uGust * 3.0 * aRand.y;
    vec3 axis = normalize(aRand.yzw - 0.5 + 0.001);
    mat3 R = rotAxis(axis, spin);
    pp = R * pp;

    vec3 base = aOffset.xyz;
    base.y = mod(base.y - uFall * (0.6 + aRand.y * 0.8) + 9.0, 18.0) - 9.0;
    base.x += sin(uTime * 0.35 + aRand.z * TAU) * 0.9 + uGust * (aRand.w - 0.3) * 2.4;
    base.z += cos(uTime * 0.3 + aRand.y * TAU) * 0.5;

    vec4 mv = modelViewMatrix * vec4(base + pp, 1.0);
    vec3 n = normalize(normalMatrix * (R * vec3(0.0, 0.0, 1.0)));
    vFacing = abs(n.z);
    vUv = uv;
    vRand = aRand.x;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uHot;
  uniform vec3 uPale;
  uniform float uLight;
  varying vec2 vUv;
  varying float vFacing;
  varying float vRand;

  void main() {
    vec3 col = mix(uDeep, uHot, smoothstep(0.0, 0.5, vUv.y));
    col = mix(col, uPale, smoothstep(0.45, 1.0, vUv.y) * (0.4 + vRand * 0.5));
    float light = 0.55 + 0.45 * vFacing;
    vec3 c = col * light;
    // a little self-glow at night
    c += col * 0.25 * (1.0 - uLight);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

/** Drifting petals — instanced, all motion on the GPU. */
export default function PetalField({ count }: { count: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.28, 0.36, 4, 6);
    const offset = new Float32Array(count * 4);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      offset.set(
        [(Math.random() * 2 - 1) * 11, (Math.random() * 2 - 1) * 9, -10 + Math.random() * 9.5, 0.5 + Math.random() * 0.7],
        i * 4
      );
      rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offset, 4));
    g.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 4));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uGust: { value: 0 },
          uFall: { value: 0 },
          uOpacity: { value: 0 },
          uLight: { value: 0 },
          uDeep: { value: new THREE.Color("#c2185b") },
          uHot: { value: new THREE.Color("#ff4fa7") },
          uPale: { value: new THREE.Color("#ffe1ef") },
        },
      }),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, dt) => {
    const u = material.uniforms;
    const t = state.clock.elapsedTime;
    const since = performance.now() / 1000 - world.petalBurstAt;
    const gust = since >= 0 ? Math.exp(-since * 0.9) * Math.min(1, since * 6) : 0;
    u.uTime.value = t;
    u.uGust.value = gust;
    u.uFall.value += Math.min(dt, 0.05) * (0.35 + gust * 2.5);
    const m = Math.max(0, Math.min(DENSITY.length - 1, world.mood));
    const i = Math.floor(m);
    const d = DENSITY[i] + (DENSITY[Math.min(DENSITY.length - 1, i + 1)] - DENSITY[i]) * (m - i);
    u.uOpacity.value = Math.min(1, (d + gust * 0.6) * world.petals) * world.gate;
    u.uLight.value = world.lightness;
  });

  return <instancedMesh args={[geometry, material, count]} frustumCulled={false} />;
}
