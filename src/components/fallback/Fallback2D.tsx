"use client";

import { useEffect, useRef } from "react";
import { MOODS } from "@/lib/moods";
import { world, type FireworkKind } from "@/lib/world";
import { useStore } from "@/lib/store";
import { heartVoxels } from "@/lib/shapes/heart";
import { flowerTargets, petalInstances, petalPoint, tilt } from "@/lib/shapes/flower";

/**
 * Lightweight Canvas2D world for devices without WebGL. It reuses the same
 * shape modules and the same `world` values, so the story, the pixel heart,
 * its bloom and the fireworks all still happen — just flatter and cheaper.
 */

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PAL = MOODS.map((m) => ({ top: hex(m.top), mid: hex(m.mid), bot: hex(m.bot), glow: hex(m.glow), m }));
const mixc = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c: number[], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TAU = Math.PI * 2;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: number[]; rocket?: { tx: number; ty: number } ; kind?: FireworkKind };

export default function Fallback2D() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useStore((s) => s.reducedMotion);
  const setWorldReady = useStore((s) => s.setWorldReady);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0, H = 0;
    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // heart / flower data
    const heart = heartVoxels(420);
    const flower = flowerTargets(heart.count, heart.strayIndex, 1.18);
    const n = heart.count;
    const rnd = Array.from({ length: n }, () => [Math.random(), Math.random(), Math.random()]);
    const delay = Array.from({ length: n }, (_, i) => 0.55 * heart.edge[i] + 0.45 * Math.random());
    const scatter = Array.from({ length: n }, () => {
      const a = Math.random() * TAU, r = 4 + Math.random() * 4;
      return [Math.cos(a) * r * 1.4, Math.sin(a) * r * 0.8];
    });
    const petals = petalInstances();
    const dust = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random(), p: Math.random() * TAU }));
    const sparks: Spark[] = [];
    let mood = 0;
    let beatPhase = 0;
    let last = performance.now();
    let raf = 0;
    setWorldReady(true);

    const launch = (x: number, y: number, kind: FireworkKind) => {
      const tx = (x * 0.5 + 0.5) * W, ty = (1 - (y * 0.5 + 0.5)) * H;
      sparks.push({ x: tx, y: H + 10, vx: 0, vy: 0, life: 0, max: 50, c: [255, 220, 235], rocket: { tx, ty }, kind });
    };
    const burst = (x: number, y: number, kind: FireworkKind) => {
      const count = kind === "glitter" ? 70 : 90;
      const base = [[255, 20, 147], [255, 141, 199], [255, 240, 247], [255, 194, 168]][Math.floor(Math.random() * 4)];
      const R = Math.min(W, H) * 0.0065;
      for (let i = 0; i < count; i++) {
        const th = (i / count) * TAU;
        let dx: number, dy: number;
        if (kind === "heart") {
          const s = Math.sin(th);
          dx = (16 * s * s * s) / 16;
          dy = -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16;
        } else if (kind === "flower") {
          const r = 0.4 + 0.6 * Math.abs(Math.cos(2.5 * th));
          dx = Math.cos(th) * r;
          dy = Math.sin(th) * r;
        } else if (kind === "ring") {
          dx = Math.cos(th);
          dy = Math.sin(th) * 0.6;
        } else {
          const a = Math.random() * TAU, r = Math.sqrt(Math.random());
          dx = Math.cos(a) * r;
          dy = Math.sin(a) * r;
        }
        sparks.push({ x, y, vx: dx * R, vy: dy * R, life: 0, max: 80 + Math.random() * 40, c: Math.random() < 0.3 ? [255, 240, 247] : base });
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;

      // —— mood backdrop (also feeds world.mood / lightness for the DOM)
      const target = world.gate * world.scrollMood;
      mood += (target - mood) * Math.min(1, dt * 2.6);
      world.mood = mood;
      const i0 = Math.floor(clamp(mood, 0, PAL.length - 1));
      const i1 = Math.min(PAL.length - 1, i0 + 1);
      const f = clamp(mood - i0);
      const A = PAL[i0], B = PAL[i1];
      world.lightness = A.m.light + (B.m.light - A.m.light) * f;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgb(mixc(A.top, B.top, f)));
      g.addColorStop(0.5, rgb(mixc(A.mid, B.mid, f)));
      g.addColorStop(1, rgb(mixc(A.bot, B.bot, f)));
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const gy = (1 - (A.m.glowY + (B.m.glowY - A.m.glowY) * f)) * H;
      const gr = (A.m.glowR + (B.m.glowR - A.m.glowR) * f) * H * 1.4;
      const gi = A.m.glowI + (B.m.glowI - A.m.glowI) * f;
      const rg = ctx.createRadialGradient(W / 2, gy, 0, W / 2, gy, gr);
      rg.addColorStop(0, rgb(mixc(A.glow, B.glow, f), gi));
      rg.addColorStop(1, rgb(mixc(A.glow, B.glow, f), 0));
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      // —— dust
      ctx.globalCompositeOperation = world.lightness > 0.5 ? "source-over" : "lighter";
      for (const d of dust) {
        const y = ((d.y - (reduced ? 0 : t * 0.01 * (0.5 + d.s))) % 1 + 1) % 1;
        const a = (0.3 + 0.5 * Math.sin(t * (0.5 + d.s) + d.p) ** 2) * (1 - world.lightness * 0.7);
        ctx.fillStyle = `rgba(255,${141 + Math.round(d.s * 90)},199,${a})`;
        ctx.beginPath();
        ctx.arc(d.x * W, y * H, 0.8 + d.s * 1.8, 0, TAU);
        ctx.fill();
      }

      // —— the heart / flower
      const h = world.heart;
      if (h.visible > 0.01) {
        const unit = H / 2 / 3.1;
        const fit = Math.min(1, 1.42 * (W / H)) * h.scale;
        const cx = W / 2, cy = H / 2 - (0.12 + h.lift) * unit;
        const S = unit * fit;
        const P = h.progress;
        const bpm = 60 + 85 * h.charge;
        beatPhase += dt * (bpm / 60);
        const bf = beatPhase % 1;
        const beat = (Math.exp(-(bf * bf) / 0.0032) + Math.exp(-((1 - bf) ** 2) / 0.0032) + 0.62 * Math.exp(-((bf - 0.24) ** 2) / 0.0042)) * (1 - smooth(0.04, 0.16, P));
        ctx.globalAlpha = h.visible;
        // halo
        const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 2.6);
        halo.addColorStop(0, `rgba(255,45,150,${0.25 + 0.3 * h.charge + 0.2 * beat})`);
        halo.addColorStop(1, "rgba(255,45,150,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = halo;
        ctx.fillRect(cx - S * 3, cy - S * 3, S * 6, S * 6);

        // petals, back to front
        ctx.globalCompositeOperation = "source-over";
        const drawn = petals
          .map((p) => {
            const b = smooth(0.58 + (p.layer / 4) * 0.18, 0.8 + (p.layer / 4) * 0.18, P);
            if (b <= 0.01) return null;
            const pts: [number, number, number][] = [];
            for (let k = 0; k <= 8; k++) pts.push(tilt(petalPoint(p, 0, k / 8, b)));
            for (let k = 0; k <= 4; k++) pts.push(tilt(petalPoint(p, k / 4, 1, b)));
            for (let k = 8; k >= 0; k--) pts.push(tilt(petalPoint(p, 1, k / 8, b)));
            const z = pts.reduce((a, q) => a + q[2], 0) / pts.length;
            return { pts, z, b, p };
          })
          .filter(Boolean)
          .sort((a, b) => a!.z - b!.z);
        for (const d of drawn) {
          const { pts, b, p } = d!;
          ctx.beginPath();
          pts.forEach(([x, y], k) => {
            const sx = cx + x * 1.18 * S, sy = cy - y * 1.18 * S;
            if (k === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          });
          ctx.closePath();
          const tip = tilt(petalPoint(p, 0.5, 1, b));
          const pg = ctx.createLinearGradient(cx, cy, cx + tip[0] * 1.18 * S, cy - tip[1] * 1.18 * S);
          pg.addColorStop(0, "#8c1456");
          pg.addColorStop(0.45, "#ff1493");
          pg.addColorStop(1, p.layer > 2 ? "#ffd1e8" : "#ff8dc7");
          ctx.globalAlpha = h.visible * clamp(b * 3);
          ctx.fillStyle = pg;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,240,247,0.25)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.globalAlpha = h.visible;

        // voxels
        ctx.globalCompositeOperation = "lighter";
        const cell = heart.cell * S * 0.9;
        for (let i = 0; i < n; i++) {
          const hx = heart.positions[i * 3], hy = heart.positions[i * 3 + 1];
          const fl = tilt([flower.positions[i * 3] / 1.18, flower.positions[i * 3 + 1] / 1.18, flower.positions[i * 3 + 2] / 1.18]);
          const fx = fl[0] * 1.18, fy = fl[1] * 1.18;
          const layer = flower.layer[i];
          const layerN = layer === -1 ? -0.12 : Math.max(layer, 0) / 4;
          const d = delay[i];
          const tA = easeOut(clamp((h.assemble - d * 0.45) / 0.55));
          const bs = 1 + beat * (0.05 + 0.07 * h.charge);
          let x = scatter[i][0] + (hx * bs - scatter[i][0]) * tA;
          let y = scatter[i][1] + (hy * bs - scatter[i][1]) * tA;
          const l0 = 0.04 + d * 0.1;
          const tL = easeOut(smooth(l0, l0 + 0.12, P));
          const len = Math.hypot(hx, hy) || 1;
          x += (hx / len) * (0.25 + rnd[i][2] * 0.45) * tL;
          y += ((hy / len) * (0.25 + rnd[i][2] * 0.45) + 0.12 + rnd[i][1] * 0.3) * tL;
          const s0 = l0 + 0.12;
          const g1 = layer === -2 ? 0.95 : 0.62 + layerN * 0.18 + d * 0.04;
          const tau = clamp((P - s0) / (g1 - s0));
          if (tau > 0) {
            const e = easeInOut(tau);
            const a0 = Math.atan2(y, x), r0 = Math.hypot(x, y);
            const aT = Math.atan2(fy, fx), rT = Math.hypot(fx, fy);
            const turns = h.calm ? 0 : TAU * (1 + Math.floor(rnd[i][2] * 1.99));
            const base = a0 + turns;
            const aEnd = base + (((aT - base) % TAU) + TAU) % TAU;
            const arc = Math.sin(tau * Math.PI) * (h.calm ? 0.25 : 1);
            const ang = a0 + (aEnd - a0) * e;
            const r = r0 + (rT - r0) * smooth(0.45, 1, tau) + arc * (0.8 + rnd[i][1] * 1.2);
            x = Math.cos(ang) * r;
            y = Math.sin(ang) * r;
          }
          const tD = smooth(g1, g1 + 0.12, P);
          const keep = layer === -1 ? 0.55 : rnd[i][1] > 0.62 ? 0.3 : 0;
          const size = cell * (0.35 + 0.65 * tA) * (1 - (1 - keep) * tD) * (layer === -2 ? 1 - smooth(0.9, 1, P) : 1);
          if (size <= 0.2) continue;
          const glow = 0.55 + 0.45 * h.charge + 0.3 * Math.sin(tau * Math.PI);
          ctx.fillStyle = tau > 0.5 ? `rgba(255,${180 + Math.round(60 * tD)},${215 + Math.round(30 * tD)},${glow})` : `rgba(255,${20 + Math.round(rnd[i][0] * 60)},${147 + Math.round(rnd[i][0] * 40)},${glow})`;
          ctx.fillRect(cx + x * S - size / 2, cy - y * S - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
      }

      // —— fireworks
      while (world.fireworks.length) {
        const e = world.fireworks.shift()!;
        launch(e.x, e.y, e.kind);
      }
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        if (s.rocket) {
          const k = easeOut(clamp(s.life / s.max));
          s.y = H + 10 + (s.rocket.ty - H - 10) * k;
          s.x = s.rocket.tx;
          ctx.fillStyle = "rgba(255,230,240,0.9)";
          ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3);
          if (s.life >= s.max) {
            burst(s.x, s.y, s.kind ?? "burst");
            sparks.splice(i, 1);
          }
          continue;
        }
        s.vx *= 0.97;
        s.vy = s.vy * 0.97 + 0.03;
        s.x += s.vx;
        s.y += s.vy;
        const a = 1 - s.life / s.max;
        if (a <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = rgb(s.c, a);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.8 * a + 0.6, 0, TAU);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced, setWorldReady]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
