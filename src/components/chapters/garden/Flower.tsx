"use client";

import { forwardRef, useId } from "react";
import type { FlowerKind } from "@/content/copy";

type Palette = { a: string; b: string; c: string; center: string };

export const FLOWER_PALETTE: Record<FlowerKind, Palette> = {
  rose: { a: "#9c0f4d", b: "#ff1493", c: "#ff8dc7", center: "#7a0c3c" },
  peony: { a: "#ff6fb6", b: "#ffb3d9", c: "#fff0f7", center: "#ffd1e8" },
  tulip: { a: "#d1126d", b: "#ff2d96", c: "#ffb3d9", center: "#ff2d96" },
  cosmos: { a: "#ff2d96", b: "#ff6fb6", c: "#ffc2df", center: "#ffcf8a" },
  sakura: { a: "#ff9cc9", b: "#ffd1e8", c: "#fff7fb", center: "#ff4fa7" },
  ranunculus: { a: "#c2185b", b: "#ff4fa7", c: "#ffd1e8", center: "#8c1456" },
  lily: { a: "#ff8dc7", b: "#ffe1ef", c: "#fffafd", center: "#ff1493" },
};

export const FLOWER_NAMES: Record<FlowerKind, string> = {
  rose: "pink rose",
  peony: "peony",
  tulip: "tulip",
  cosmos: "cosmos",
  sakura: "sakura",
  ranunculus: "ranunculus",
  lily: "lily",
};

/** a petal pointing up from its base at (0,0) */
const r2 = (v: number) => Math.round(v * 100) / 100;

function petalPath(L: number, W: number, tip: "round" | "notch" | "point" = "round") {
  if (tip === "notch")
    return `M0 0 C${-W} ${-L * 0.3} ${-W * 0.95} ${-L * 0.85} ${-W * 0.3} ${-L} L0 ${-L * 0.9} L${W * 0.3} ${-L} C${W * 0.95} ${-L * 0.85} ${W} ${-L * 0.3} 0 0Z`;
  if (tip === "point") return `M0 0 C${-W} ${-L * 0.35} ${-W * 0.5} ${-L * 0.8} 0 ${-L} C${W * 0.5} ${-L * 0.8} ${W} ${-L * 0.35} 0 0Z`;
  return `M0 0 C${-W} ${-L * 0.25} ${-W * 0.95} ${-L * 0.88} 0 ${-L} C${W * 0.95} ${-L * 0.88} ${W} ${-L * 0.25} 0 0Z`;
}

type Ring = { n: number; L: number; W: number; offset: number; fill: string; tip?: "round" | "notch" | "point"; r0?: number };

function rings(kind: FlowerKind, ids: { g1: string; g2: string; g3: string }): Ring[] {
  const f1 = `url(#${ids.g1})`, f2 = `url(#${ids.g2})`, f3 = `url(#${ids.g3})`;
  switch (kind) {
    case "rose":
      return [
        { n: 5, L: 36, W: 22, offset: 0, fill: f1 },
        { n: 5, L: 28, W: 18, offset: 36, fill: f2 },
        { n: 4, L: 19, W: 13, offset: 18, fill: f3 },
      ];
    case "peony":
      return [
        { n: 9, L: 38, W: 17, offset: 0, fill: f1 },
        { n: 8, L: 30, W: 16, offset: 22, fill: f2 },
        { n: 7, L: 21, W: 13, offset: 10, fill: f3 },
        { n: 5, L: 12, W: 9, offset: 40, fill: f3 },
      ];
    case "cosmos":
      return [{ n: 8, L: 40, W: 14, offset: 0, fill: f1, tip: "notch", r0: 4 }];
    case "sakura":
      return [{ n: 5, L: 35, W: 20, offset: 0, fill: f1, tip: "notch", r0: 2 }];
    case "ranunculus":
      return [
        { n: 10, L: 32, W: 13, offset: 0, fill: f1 },
        { n: 9, L: 25, W: 12, offset: 18, fill: f2 },
        { n: 8, L: 18, W: 10, offset: 8, fill: f2 },
        { n: 6, L: 11, W: 8, offset: 30, fill: f3 },
      ];
    case "lily":
      return [
        { n: 3, L: 44, W: 13, offset: 0, fill: f1, tip: "point" },
        { n: 3, L: 40, W: 12, offset: 60, fill: f2, tip: "point" },
      ];
    case "tulip":
      return [];
  }
}

/**
 * A flower head drawn around (0,0), radius ≈ 45. Every petal carries the
 * `petal` class so a bloom can be animated with a stagger.
 */
export const FlowerHead = forwardRef<SVGGElement, { kind: FlowerKind }>(function FlowerHead({ kind }, ref) {
  const raw = useId().replace(/[:«»]/g, "");
  const ids = { g1: `f1${raw}`, g2: `f2${raw}`, g3: `f3${raw}`, glow: `fg${raw}` };
  const p = FLOWER_PALETTE[kind];

  return (
    <g ref={ref}>
      <defs>
        <radialGradient id={ids.g1} cx="0.5" cy="1" r="1" fx="0.5" fy="1">
          <stop offset="0" stopColor={p.a} />
          <stop offset="0.55" stopColor={p.b} />
          <stop offset="1" stopColor={p.c} />
        </radialGradient>
        <radialGradient id={ids.g2} cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor={p.a} />
          <stop offset="0.7" stopColor={p.b} />
          <stop offset="1" stopColor={p.c} />
        </radialGradient>
        <radialGradient id={ids.g3} cx="0.5" cy="1" r="1">
          <stop offset="0" stopColor={p.center} />
          <stop offset="1" stopColor={p.a} />
        </radialGradient>
        <radialGradient id={ids.glow}>
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor={p.b} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="52" fill={`url(#${ids.glow})`} className="flower-glow" opacity="0.5" />

      {kind === "tulip" ? (
        <g>
          <g transform="translate(0 22)">
            <g transform="rotate(-20)">
              <path className="petal" d={petalPath(46, 20)} fill={`url(#${ids.g2})`} />
            </g>
            <g transform="rotate(20)">
              <path className="petal" d={petalPath(46, 20)} fill={`url(#${ids.g2})`} />
            </g>
            <path className="petal" d={petalPath(50, 22)} fill={`url(#${ids.g1})`} />
            <path className="petal" d="M-8 -6 C-6 -24 6 -24 8 -6" fill="none" stroke={p.c} strokeOpacity="0.6" strokeWidth="1.5" />
          </g>
        </g>
      ) : (
        rings(kind, ids).map((ring, ri) => (
          <g key={ri}>
            {Array.from({ length: ring.n }).map((_, i) => (
              <g key={i} transform={`rotate(${ring.offset + (i * 360) / ring.n}) translate(0 ${-(ring.r0 ?? 0)})`}>
                <path className="petal" d={petalPath(ring.L, ring.W, ring.tip)} fill={ring.fill} stroke={p.a} strokeOpacity="0.18" strokeWidth="0.8" />
                {kind === "lily" && <path d={`M0 -4 L0 ${-ring.L * 0.8}`} stroke={p.center} strokeOpacity="0.5" strokeWidth="1.4" className="petal" />}
              </g>
            ))}
          </g>
        ))
      )}

      {/* centres */}
      {kind === "rose" && (
        <path className="petal" d="M0 0 C6 -2 7 6 1 8 C-7 10 -10 0 -5 -6 C1 -12 12 -8 12 2" fill="none" stroke={p.center} strokeWidth="2.6" strokeLinecap="round" />
      )}
      {kind === "cosmos" && (
        <g className="petal">
          <circle r="9" fill={p.center} />
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={i} cx={r2(Math.cos(i * 0.63) * 5.5)} cy={r2(Math.sin(i * 0.63) * 5.5)} r="1.3" fill="#e8955a" />
          ))}
        </g>
      )}
      {(kind === "sakura" || kind === "lily") && (
        <g className="petal">
          {Array.from({ length: kind === "lily" ? 6 : 9 }).map((_, i, arr) => {
            const a = (i / arr.length) * Math.PI * 2;
            const r = kind === "lily" ? 20 : 12;
            return (
              <g key={i}>
                <line x1="0" y1="0" x2={r2(Math.cos(a) * r)} y2={r2(Math.sin(a) * r)} stroke={p.center} strokeWidth="1" />
                <circle cx={r2(Math.cos(a) * r)} cy={r2(Math.sin(a) * r)} r="1.8" fill={kind === "lily" ? "#c2185b" : "#ffcf8a"} />
              </g>
            );
          })}
          <circle r="3.5" fill={p.center} />
        </g>
      )}
      {kind === "peony" && <circle className="petal" r="5" fill="#ffcf8a" opacity="0.8" />}
    </g>
  );
});

/** A closed bud, shown before the flower blooms. */
export function Bud({ kind }: { kind: FlowerKind }) {
  const p = FLOWER_PALETTE[kind];
  return (
    <g className="bud">
      <path d="M0 18 C-16 6 -12 -18 0 -26 C12 -18 16 6 0 18Z" fill={p.b} />
      <path d="M0 18 C-8 6 -6 -14 0 -22 C2 -10 3 4 0 18Z" fill={p.a} opacity="0.55" />
      <path d="M0 22 C-12 18 -16 8 -14 0 C-8 8 -4 12 0 14 C4 12 8 8 14 0 C16 8 12 18 0 22Z" fill="#5f9474" />
    </g>
  );
}
