"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { heartVoxels } from "@/lib/shapes/heart";
import { flowerTargets, petalInstances, FLOWER_TILT } from "@/lib/shapes/flower";
import { world } from "@/lib/world";
import {
  haloFragment,
  haloVertex,
  petalFragment,
  petalVertex,
  voxelFragment,
  voxelVertex,
} from "./shaders";

const C = (hex: string) => new THREE.Color(hex);

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** heartbeat envelope: "lub-dub" */
function beatShape(f: number) {
  const g = (x: number, w: number) => Math.exp(-(x * x) / w);
  return g(f, 0.0032) + g(1 - f, 0.0032) + 0.62 * g(f - 0.24, 0.0042);
}

export default function HeartFlower({ voxels, glowGain = 1 }: { voxels: number; glowGain?: number }) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const sparkleGroup = useRef<THREE.Group>(null);
  const beat = useRef({ phase: 0 });
  const size = useThree((s) => s.size);

  // ——— voxel geometry (heart positions, flower targets, scatter) ———
  const { voxelGeo, cell, count } = useMemo(() => {
    const heart = heartVoxels(voxels);
    const flower = flowerTargets(heart.count, heart.strayIndex, 1.18);
    const rnd = seeded(1313);
    const n = heart.count;
    const scatter = new Float32Array(n * 3);
    const rand = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      const r = 5 + rnd() * 6;
      scatter[i * 3] = Math.sin(ph) * Math.cos(th) * r * 1.3;
      scatter[i * 3 + 1] = Math.cos(ph) * r * 0.75;
      scatter[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r * 0.6 - 2;
      rand[i * 4] = 0.55 * heart.edge[i] + 0.45 * rnd();
      rand[i * 4 + 1] = rnd();
      rand[i * 4 + 2] = rnd();
      rand[i * 4 + 3] = rnd();
    }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.setAttribute("aHeart", new THREE.InstancedBufferAttribute(heart.positions, 3));
    geo.setAttribute("aFlower", new THREE.InstancedBufferAttribute(flower.positions, 3));
    geo.setAttribute("aScatter", new THREE.InstancedBufferAttribute(scatter, 3));
    geo.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 4));
    geo.setAttribute("aLayer", new THREE.InstancedBufferAttribute(flower.layer, 1));
    return { voxelGeo: geo, cell: heart.cell, count: n };
  }, [voxels]);

  // ——— petal geometry ———
  const petalGeo = useMemo(() => {
    const petals = petalInstances();
    const geo = new THREE.PlaneGeometry(1, 1, 10, 18);
    // PlaneGeometry uv: (0,0) bottom-left … (1,1) top-right — v runs base→tip
    const shape = new Float32Array(petals.length * 4);
    const angles = new Float32Array(petals.length * 4);
    const extra = new Float32Array(petals.length * 4);
    const S = 1.18;
    petals.forEach((p, i) => {
      shape.set([p.L * S, p.W * S, p.cup / S, p.r0 * S], i * 4);
      angles.set([p.psi, p.aOpen, p.aClosed, p.curlOpen], i * 4);
      extra.set([p.curlClosed, p.layer, p.y * S, p.rand], i * 4);
    });
    geo.setAttribute("aShape", new THREE.InstancedBufferAttribute(shape, 4));
    geo.setAttribute("aAngles", new THREE.InstancedBufferAttribute(angles, 4));
    geo.setAttribute("aExtra", new THREE.InstancedBufferAttribute(extra, 4));
    return { geo, count: petals.length };
  }, []);

  const voxelMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: voxelVertex,
        fragmentShader: voxelFragment,
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uAssemble: { value: 0 },
          uCharge: { value: 0 },
          uBeat: { value: 0 },
          uProgress: { value: 0 },
          uCell: { value: 0.1 },
          uVisible: { value: 0 },
          uCalm: { value: 0 },
          uGlowGain: { value: glowGain },
          uHot: { value: C("#ff1493") },
          uRose: { value: C("#ff2d96") },
          uCandy: { value: C("#ff8dc7") },
          uPale: { value: C("#ffe4f1") },
          uBerry: { value: C("#b0186a") },
          uGold: { value: C("#ffd2b8") },
        },
      }),
    [glowGain]
  );

  const petalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: petalVertex,
        fragmentShader: petalFragment,
        side: THREE.DoubleSide,
        transparent: true,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uTilt: { value: FLOWER_TILT },
          uVisible: { value: 0 },
          uGlow: { value: 0.1 * glowGain },
          uBerry: { value: C("#8c1456") },
          uHot: { value: C("#ff1493") },
          uCandy: { value: C("#ff8dc7") },
          uPale: { value: C("#fff0f7") },
        },
      }),
    [glowGain]
  );

  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: haloVertex,
        fragmentShader: haloFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: C("#ff2d96") }, uIntensity: { value: 0 }, uTime: { value: 0 } },
      }),
    []
  );

  useEffect(() => {
    voxelMat.uniforms.uCell.value = cell;
  }, [cell, voxelMat]);

  useEffect(
    () => () => {
      voxelGeo.dispose();
      petalGeo.geo.dispose();
      voxelMat.dispose();
      petalMat.dispose();
      haloMat.dispose();
    },
    [voxelGeo, petalGeo, voxelMat, petalMat, haloMat]
  );

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const h = world.heart;
    const visible = h.visible;
    g.visible = visible > 0.004;
    if (!g.visible) return;
    const t = state.clock.elapsedTime;
    const P = h.progress;

    // heartbeat — speeds up as she holds the heart, fades once it blooms
    const bpm = 60 + 85 * h.charge;
    beat.current.phase += Math.min(dt, 0.05) * (bpm / 60);
    const f = beat.current.phase % 1;
    const beatVal = beatShape(f) * (1 - Math.min(1, Math.max(0, (P - 0.04) / 0.12)));

    const vu = voxelMat.uniforms;
    vu.uTime.value = t;
    vu.uAssemble.value = h.assemble;
    vu.uCharge.value = h.charge;
    vu.uBeat.value = beatVal;
    vu.uProgress.value = P;
    vu.uVisible.value = visible;
    vu.uCalm.value = h.calm;

    const pu = petalMat.uniforms;
    pu.uProgress.value = P;
    pu.uTime.value = t;
    pu.uVisible.value = visible;

    // responsive scale: keep the heart comfortably inside narrow screens
    const aspect = size.width / Math.max(1, size.height);
    const fit = Math.min(1, 1.42 * aspect);
    g.scale.setScalar(fit * h.scale);
    g.position.y = 0.12 + h.lift;

    // gentle sway + pointer parallax
    const bloomed = Math.min(1, Math.max(0, (P - 0.6) / 0.3));
    const targetRy = Math.sin(t * 0.35) * (0.28 - 0.18 * bloomed) + world.pointer.x * 0.3;
    const targetRx = -world.pointer.y * 0.18 + bloomed * 0.05;
    g.rotation.y += (targetRy - g.rotation.y) * Math.min(1, dt * 3);
    g.rotation.x += (targetRx - g.rotation.x) * Math.min(1, dt * 3);

    if (halo.current) {
      const hm = haloMat.uniforms;
      hm.uTime.value = t;
      const glow = 0.25 * h.assemble + 0.45 * h.charge + 0.3 * beatVal * h.assemble + 0.55 * Math.sin(Math.min(1, P) * Math.PI) + 0.4 * bloomed;
      hm.uIntensity.value = glow * visible * 0.6;
      halo.current.scale.setScalar(5.5 + bloomed * 1.5 + beatVal * 0.3);
      halo.current.lookAt(state.camera.position);
    }
    if (sparkleGroup.current) {
      sparkleGroup.current.visible = bloomed > 0.05;
      sparkleGroup.current.scale.setScalar(0.6 + bloomed * 0.4);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={halo} position={[0, 0, -1.2]} material={haloMat} renderOrder={-1}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <instancedMesh args={[petalGeo.geo, petalMat, petalGeo.count]} frustumCulled={false} renderOrder={1} />
      <instancedMesh args={[voxelGeo, voxelMat, count]} frustumCulled={false} renderOrder={2} />
      <group ref={sparkleGroup} visible={false}>
        <Sparkles count={48} scale={[4.5, 3.5, 3]} size={4} speed={0.35} opacity={0.9} color="#ffd1e8" noise={0.6} />
      </group>
    </group>
  );
}
