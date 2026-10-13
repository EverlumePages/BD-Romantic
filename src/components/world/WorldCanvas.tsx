"use client";

import { Component, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { useStore, type Tier } from "@/lib/store";
import { tierConfig } from "@/lib/quality";
import { world } from "@/lib/world";
import Backdrop from "./Backdrop";
import AmbientField from "./AmbientField";
import PetalField from "./PetalField";
import Fireworks from "./Fireworks";
import CameraRig from "./CameraRig";
import HeartFlower from "./heartflower/HeartFlower";

function FirstFrame() {
  const frames = useRef(0);
  const setWorldReady = useStore((s) => s.setWorldReady);
  useFrame(() => {
    frames.current++;
    if (frames.current === 3) setWorldReady(true);
  });
  return null;
}

function Glow() {
  const ref = useRef<BloomEffect>(null);
  useFrame(() => {
    // bloom would wash out the daylight chapters, so it follows the light
    if (ref.current) ref.current.intensity = 0.75 * (1 - world.lightness * 0.85);
  });
  return (
    <EffectComposer multisampling={0}>
      <Bloom ref={ref} mipmapBlur luminanceThreshold={0.72} luminanceSmoothing={0.2} intensity={0.75} radius={0.7} />
    </EffectComposer>
  );
}

const DOWNGRADE: Record<Tier, Tier> = { high: "medium", medium: "low", low: "low", none: "none" };

function Scene({ tier }: { tier: Exclude<Tier, "none"> }) {
  const cfg = tierConfig[tier];
  const setTier = useStore((s) => s.setTier);
  const declines = useRef(0);
  return (
    <>
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          declines.current++;
          if (declines.current >= 2 && tier !== "low") setTier(DOWNGRADE[tier]);
        }}
      />
      <FirstFrame />
      <CameraRig />
      <Backdrop />
      <AmbientField count={cfg.dust} />
      <PetalField count={cfg.petals} />
      <HeartFlower voxels={cfg.voxels} glowGain={cfg.bloom ? 1 : 0.85} />
      <Fireworks slots={cfg.fireworkSlots} particles={cfg.fireworkParticles} />
      {cfg.bloom && <Glow />}
    </>
  );
}

class WorldBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** The single, fixed WebGL canvas that sits behind every chapter. */
export default function WorldCanvas() {
  const tier = useStore((s) => s.tier) as Exclude<Tier, "none">;
  const setTier = useStore((s) => s.setTier);
  const [maxDpr] = useState(() => Math.min(tierConfig[tier].dpr, typeof window !== "undefined" ? window.devicePixelRatio : 1));
  const cfg = tierConfig[tier];

  return (
    <div className="world-canvas pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh w-full" aria-hidden>
      <WorldBoundary onError={() => setTier("none")}>
        <Canvas
          flat
          dpr={[1, Math.min(maxDpr, cfg.dpr)]}
          camera={{ position: [0, 0, 11], fov: 38, near: 0.1, far: 80 }}
          gl={{ antialias: tier !== "low", alpha: false, powerPreference: "high-performance", stencil: false }}
          events={undefined}
          onCreated={({ gl }) => {
            gl.setClearColor("#12040e");
            gl.domElement.addEventListener(
              "webglcontextlost",
              (e) => {
                e.preventDefault();
                setTier("none");
              },
              { once: true }
            );
          }}
        >
          <Scene tier={tier} />
        </Canvas>
      </WorldBoundary>
    </div>
  );
}
