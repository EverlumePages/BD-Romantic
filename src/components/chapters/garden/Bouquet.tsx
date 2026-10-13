"use client";

import { useId } from "react";
import type { FlowerKind } from "@/content/copy";
import { FlowerHead } from "./Flower";

export const SLOTS = [
  { x: 0, y: -74, s: 0.92 },
  { x: -44, y: -60, s: 0.82 },
  { x: 44, y: -60, s: 0.82 },
  { x: -80, y: -30, s: 0.72 },
  { x: 80, y: -30, s: 0.72 },
  { x: -24, y: -112, s: 0.76 },
  { x: 24, y: -112, s: 0.76 },
];

/** A hand-tied bouquet in a paper wrap. Heads fill the slots in order. */
export function BouquetArt({ kinds, tied, className }: { kinds: FlowerKind[]; tied: boolean; className?: string }) {
  const id = useId().replace(/[:«»]/g, "");
  return (
    <svg viewBox="-130 -165 260 300" className={className} aria-hidden>
      <defs>
        <linearGradient id={`wrap${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7fb" />
          <stop offset="0.6" stopColor="#ffd1e8" />
          <stop offset="1" stopColor="#ffb3d9" />
        </linearGradient>
        <linearGradient id={`wrapIn${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc2df" />
          <stop offset="1" stopColor="#ff8dc7" />
        </linearGradient>
      </defs>
      {/* back of the wrap */}
      <path d="M-96 -40 L96 -40 L26 120 L-26 120 Z" fill={`url(#wrapIn${id})`} opacity="0.85" />
      {/* stems */}
      {kinds.map((_, k) => {
        const s = SLOTS[k];
        return <path key={`s${k}`} d={`M${s.x} ${s.y + 20} Q${s.x * 0.4} 40 0 118`} stroke="#4f7d61" strokeWidth="3" fill="none" />;
      })}
      {/* slot anchors (used to aim flying flowers) */}
      {SLOTS.map((s, k) => (
        <circle key={`a${k}`} data-slot={k} cx={s.x} cy={s.y} r={41 * s.s} fill="none" />
      ))}
      {/* heads */}
      {kinds.map((kind, k) => {
        const s = SLOTS[k];
        return (
          <g key={`h${k}`} transform={`translate(${s.x} ${s.y}) scale(${s.s * 0.92})`}>
            <FlowerHead kind={kind} />
          </g>
        );
      })}
      {/* front of the wrap */}
      <path d="M-104 -10 C-60 6 60 6 104 -10 L30 122 C10 128 -10 128 -30 122 Z" fill={`url(#wrap${id})`} />
      <path d="M-104 -10 C-60 6 60 6 104 -10" stroke="#ff8dc7" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M-60 -2 L-12 118" stroke="#ffb3d9" strokeWidth="1" opacity="0.6" />
      <path d="M58 -2 L14 118" stroke="#ffb3d9" strokeWidth="1" opacity="0.6" />
      {/* ribbon */}
      <g opacity={tied ? 1 : 0} style={{ transition: "opacity .4s" }}>
        <path
          d="M-30 62 C-60 40 -66 78 -34 74 C-14 72 -4 66 0 66 C4 66 14 72 34 74 C66 78 60 40 30 62 C16 70 6 66 0 66 M0 66 C-8 86 -22 102 -34 112 M0 66 C8 86 22 102 34 112"
          fill="none"
          stroke="#ff1493"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={tied ? 0 : 1}
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(.65,0,.35,1)" }}
        />
        <circle cx="0" cy="66" r="6" fill="#ff1493" />
      </g>
    </svg>
  );
}
