"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { world } from "@/lib/world";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Slow cinematic camera: parallax always, choreography during the bloom. */
export default function CameraRig() {
  const look = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const cam = state.camera;
    const h = world.heart;
    const P = h.progress;
    const cin = h.cinematic;
    // pull back and rise while the pixels swirl, then lean in for the bloom
    const back = Math.sin(clamp((P - 0.08) / 0.6) * Math.PI);
    const push = smooth(0.62, 1.0, P);
    const gateDolly = (1 - world.gate) * 2.2;
    target.set(
      world.pointer.x * 0.38,
      world.pointer.y * 0.22 + cin * (back * 0.75 + push * 0.2),
      9 + gateDolly + cin * (back * 1.8 - push * 1.1)
    );
    const k = Math.min(1, dt * 2.2);
    cam.position.lerp(target, k);
    look.set(0, 0.12 + cin * back * 0.35, 0);
    cam.lookAt(look);
  });

  return null;
}
