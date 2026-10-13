"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { world } from "@/lib/world";

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; star: boolean; hue: number };

/** A delicate trail of light that follows the pointer or a finger. */
export default function CursorTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useStore((s) => s.reducedMotion);

  useEffect(() => {
    if (reduced) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const parts: P[] = [];
    let raf = 0;
    let running = false;
    let last = { x: -1, y: -1 };

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();

    const drawStar = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2.2);
      ctx.quadraticCurveTo(x, y, x + r * 2.2, y);
      ctx.quadraticCurveTo(x, y, x, y + r * 2.2);
      ctx.quadraticCurveTo(x, y, x - r * 2.2, y);
      ctx.quadraticCurveTo(x, y, x, y - r * 2.2);
      ctx.fill();
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const light = world.lightness > 0.5;
      ctx.globalCompositeOperation = light ? "source-over" : "lighter";
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        if (p.life > p.max) {
          parts.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy = p.vy * 0.97 + 0.015;
        const t = 1 - p.life / p.max;
        const r = p.size * dpr * (0.4 + t * 0.6);
        ctx.fillStyle = light
          ? p.hue < 0.5
            ? `rgba(194,24,91,${t * 0.8})`
            : `rgba(255,45,150,${t * 0.7})`
          : p.hue < 0.4
            ? `rgba(255,20,147,${t})`
            : p.hue < 0.8
              ? `rgba(255,141,199,${t})`
              : `rgba(255,240,247,${t})`;
        if (p.star) drawStar(p.x * dpr, p.y * dpr, r * 0.6);
        else {
          ctx.beginPath();
          ctx.arc(p.x * dpr, p.y * dpr, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (parts.length) raf = requestAnimationFrame(tick);
      else {
        running = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const spawn = (x: number, y: number, n: number, burst = false) => {
      for (let i = 0; i < n; i++) {
        if (parts.length > 140) parts.shift();
        const a = Math.random() * Math.PI * 2;
        const sp = burst ? 0.6 + Math.random() * 2.2 : Math.random() * 0.5;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - (burst ? 0.4 : 0.15),
          life: 0,
          max: 40 + Math.random() * 40,
          size: (burst ? 1.6 : 1) * (1 + Math.random() * 2.2),
          star: Math.random() < 0.35,
          hue: Math.random(),
        });
      }
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const move = (e: PointerEvent) => {
      const x = e.clientX, y = e.clientY;
      const d = Math.hypot(x - last.x, y - last.y);
      if (last.x >= 0 && d > 4) spawn(x, y, Math.min(3, Math.ceil(d / 14)));
      last = { x, y };
    };
    const down = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
      spawn(e.clientX, e.clientY, 10, true);
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[45] h-full w-full" />;
}
