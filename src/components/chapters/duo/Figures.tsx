"use client";

import { useId } from "react";

/**
 * Original, tiny chibi duo silhouettes — no game assets.
 * Her: a hoodie with little wolf ears and a fluffy tail. Him: a cap.
 * Drawn with the origin at the feet; ~58 units tall.
 */
export function Chibi({ variant, pose = "stand" }: { variant: "her" | "him"; pose?: "stand" | "fall" }) {
  const her = variant === "her";
  const hoodie = her ? "#ff2d96" : "#8c1456";
  const hoodieDark = her ? "#d81b7a" : "#5e0d3a";
  const skin = "#ffd9cf";
  const fall = pose === "fall";
  return (
    <g className="chibi">
      {/* tail */}
      {her && (
        <path
          d="M7 -14 C18 -16 22 -26 17 -33 C24 -24 22 -12 10 -9 Z"
          fill="#ffd1e8"
          stroke="#c2185b"
          strokeWidth="1.2"
          className="tail"
        />
      )}
      {/* legs */}
      <g className="legs">
        <rect x="-7.5" y={fall ? -12 : -13} width="6" height="13" rx="3" fill="#3a0f2c" transform={fall ? "rotate(18 -4.5 -12)" : undefined} />
        <rect x="1.5" y={fall ? -12 : -13} width="6" height="13" rx="3" fill="#3a0f2c" transform={fall ? "rotate(-18 4.5 -12)" : undefined} />
      </g>
      {/* body */}
      <rect x="-11" y="-31" width="22" height="21" rx="9" fill={hoodie} />
      <rect x="-11" y="-17" width="22" height="5" rx="2.5" fill={hoodieDark} opacity="0.5" />
      {/* arms (pivot at shoulders) */}
      <g className="arm-l">
        <rect x="-16" y="-29" width="6" height="15" rx="3" fill={hoodie} transform={fall ? "rotate(60 -13 -28)" : "rotate(12 -13 -28)"} />
      </g>
      <g className="arm-r">
        <rect x="10" y="-29" width="6" height="15" rx="3" fill={hoodie} transform={fall ? "rotate(-60 13 -28)" : "rotate(-12 13 -28)"} />
      </g>
      {/* head */}
      <circle cx="0" cy="-42" r="12.5" fill={skin} />
      {her ? (
        <>
          {/* hood + wolf ears */}
          <path d="M-14 -40 C-15 -56 15 -56 14 -40 C10 -50 -10 -50 -14 -40 Z" fill={hoodie} />
          <path d="M-12 -49 L-13 -62 L-4 -54 Z" fill={hoodie} />
          <path d="M12 -49 L13 -62 L4 -54 Z" fill={hoodie} />
          <path d="M-11 -52 L-11.5 -58.5 L-7 -54.5 Z" fill="#ffd1e8" />
          <path d="M11 -52 L11.5 -58.5 L7 -54.5 Z" fill="#ffd1e8" />
        </>
      ) : (
        <>
          {/* cap */}
          <path d="M-12.5 -44 C-12 -57 12 -57 12.5 -44 Z" fill="#23091d" />
          <rect x="0" y="-46" width="17" height="3.6" rx="1.8" fill="#23091d" />
          <circle cx="0" cy="-55" r="1.6" fill="#ff2d96" />
        </>
      )}
      {/* face */}
      <circle cx="-4.4" cy="-40.5" r="1.5" fill="#23091d" />
      <circle cx="4.4" cy="-40.5" r="1.5" fill="#23091d" />
      <ellipse cx="-7.5" cy="-36.5" rx="2.4" ry="1.4" fill="#ff8dc7" opacity="0.8" />
      <ellipse cx="7.5" cy="-36.5" rx="2.4" ry="1.4" fill="#ff8dc7" opacity="0.8" />
      <path d="M-2 -36 Q0 -34.2 2 -36" stroke="#23091d" strokeWidth="1.1" fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Heart-pattern canopy; origin at the figure's feet. */
export function Canopy({ variant }: { variant: "her" | "him" }) {
  const id = useId().replace(/:/g, "");
  const a = variant === "her" ? "#ff8dc7" : "#ff2d96";
  const b = variant === "her" ? "#fff0f7" : "#ffd1e8";
  return (
    <g className="canopy">
      <defs>
        <linearGradient id={`cg${id}`} x1="0" x2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="0.5" stopColor={b} />
          <stop offset="1" stopColor={a} />
        </linearGradient>
      </defs>
      <g stroke="rgba(140,20,86,0.55)" strokeWidth="0.9">
        <line x1="-36" y1="-104" x2="-10" y2="-30" />
        <line x1="-14" y1="-102" x2="-6" y2="-30" />
        <line x1="14" y1="-102" x2="6" y2="-30" />
        <line x1="36" y1="-104" x2="10" y2="-30" />
      </g>
      <path
        d="M-40 -102 C-38 -142 38 -142 40 -102 Q33 -108 26 -102 Q20 -108 13 -102 Q7 -108 0 -102 Q-7 -108 -13 -102 Q-20 -108 -26 -102 Q-33 -108 -40 -102 Z"
        fill={`url(#cg${id})`}
        stroke="#c2185b"
        strokeWidth="1.2"
      />
      <path d="M0 -112 C-3 -117 -10 -116 -10 -111 C-10 -106 -4 -103 0 -99 C4 -103 10 -106 10 -111 C10 -116 3 -117 0 -112 Z" fill="#ff1493" />
    </g>
  );
}

/** A complete little parachuter for the hidden easter egg. */
export function Parachuter({ variant }: { variant: "her" | "him" }) {
  return (
    <svg viewBox="-50 -150 100 160" className="h-full w-full overflow-visible" aria-hidden>
      <Canopy variant={variant} />
      <Chibi variant={variant} pose="stand" />
    </svg>
  );
}
