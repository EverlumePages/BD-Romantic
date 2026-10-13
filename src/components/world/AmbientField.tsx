"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { world } from "@/lib/world";

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uAspect;
  uniform vec3 uPointer; // xy ndc, z active
  uniform float uSpeed;
  attribute vec4 aRand;
  varying float vAlpha;
  varying float vHue;

  void main() {
    vec3 p = position;
    float speed = (0.06 + aRand.x * 0.16) * uSpeed;
    p.y = mod(p.y + uTime * speed + 8.0, 16.0) - 8.0;
    p.x += sin(uTime * 0.18 + aRand.y * 6.2831) * 0.5;
    p.z += cos(uTime * 0.14 + aRand.z * 6.2831) * 0.35;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;
    vec2 dd = (ndc - uPointer.xy) * vec2(uAspect, 1.0);
    float dist = length(dd);
    float push = smoothstep(0.38, 0.0, dist) * uPointer.z;
    mv.xy += normalize(dd + 0.0001) * push * (-mv.z) * 0.07;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + aRand.w * 5.5) * uPixelRatio * (9.0 / -mv.z);
    float tw = 0.5 + 0.5 * sin(uTime * (0.6 + aRand.x * 2.2) + aRand.y * 30.0);
    vAlpha = (0.25 + 0.75 * tw) * (0.6 + push * 1.5);
    vHue = aRand.z;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uC;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vHue;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a = a * a;
    vec3 col = vHue < 0.5 ? mix(uA, uB, vHue * 2.0) : mix(uB, uC, (vHue - 0.5) * 2.0);
    gl_FragColor = vec4(col * a * vAlpha * uOpacity, 1.0);
    #include <colorspace_fragment>
  }
`;

/** GPU stardust drifting through every chapter, shy of the pointer. */
export default function AmbientField({ count }: { count: number }) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const rand = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 13;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * 8;
      pos[i * 3 + 2] = -12 + Math.random() * 15;
      rand.set([Math.random(), Math.random(), Math.random(), Math.random() ** 2], i * 4);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uAspect: { value: 1 },
          uPointer: { value: new THREE.Vector3() },
          uSpeed: { value: 1 },
          uOpacity: { value: 1 },
          uA: { value: new THREE.Color("#ff1493") },
          uB: { value: new THREE.Color("#ff8dc7") },
          uC: { value: new THREE.Color("#fff0f7") },
        },
      }),
    []
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = viewport.dpr;
    u.uAspect.value = size.width / Math.max(1, size.height);
    (u.uPointer.value as THREE.Vector3).set(world.pointer.x, world.pointer.y, world.pointer.active);
    // calmer in the confession, livelier in the finale, faint in daylight
    const m = world.mood;
    const quiet = Math.max(0, 1 - Math.abs(m - 6) * 1.5);
    u.uSpeed.value = 1 - quiet * 0.7;
    u.uOpacity.value = (1 - world.lightness * 0.75) * (0.35 + 0.65 * world.gate) * (1 - quiet * 0.55);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
