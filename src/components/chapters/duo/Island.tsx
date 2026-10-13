"use client";

/** A floating island, softly glowing with flowers. Centre ≈ (500, 770). */
export function Island() {
  const flowers = [
    [352, 762, 0.8], [384, 750, 1], [418, 744, 0.7], [600, 742, 0.85], [632, 750, 1.1], [662, 760, 0.75],
    [500, 738, 0.6], [520, 742, 0.55], [436, 758, 0.6], [566, 756, 0.65], [372, 772, 0.5], [646, 772, 0.5],
  ];
  return (
    <g>
      <defs>
        <linearGradient id="islandRock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c2407e" />
          <stop offset="0.5" stopColor="#8c1456" />
          <stop offset="1" stopColor="#3a0f2c" />
        </linearGradient>
        <linearGradient id="islandTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc2df" />
          <stop offset="1" stopColor="#ff8dc7" />
        </linearGradient>
        <radialGradient id="islandGlow">
          <stop offset="0" stopColor="#fff0f7" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff8dc7" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="flowerGlow">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ff2d96" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="500" cy="770" rx="300" ry="120" fill="url(#islandGlow)" opacity="0.55" />
      {/* rocky underside */}
      <path
        d="M312 770 C320 800 352 812 372 836 C392 860 404 900 440 914 C470 926 482 960 500 968 C520 960 534 924 566 912 C600 900 612 860 632 838 C652 816 682 800 690 770 Z"
        fill="url(#islandRock)"
      />
      <path d="M420 860 C440 880 452 900 470 905" stroke="#ff8dc7" strokeOpacity="0.25" strokeWidth="3" fill="none" />
      <path d="M560 870 C575 885 590 890 598 878" stroke="#ff8dc7" strokeOpacity="0.2" strokeWidth="3" fill="none" />
      {/* hanging crystals */}
      <path d="M470 925 L478 950 L486 925 Z" fill="#ffd1e8" opacity="0.8" />
      <path d="M530 918 L536 938 L542 918 Z" fill="#ffd1e8" opacity="0.6" />
      {/* grassy top */}
      <ellipse cx="500" cy="770" rx="192" ry="34" fill="url(#islandTop)" />
      <ellipse cx="500" cy="764" rx="176" ry="24" fill="#ffd9ea" opacity="0.65" />
      {/* glowing flowers */}
      {flowers.map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <circle r="16" fill="url(#flowerGlow)" opacity="0.55" />
          <line x1="0" y1="0" x2="0" y2="14" stroke="#c2407e" strokeWidth="2" />
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-5" rx="3.6" ry="5.6" transform={`rotate(${r})`} fill={i % 3 === 0 ? "#ff1493" : i % 3 === 1 ? "#ff8dc7" : "#fff0f7"} />
          ))}
          <circle r="2.6" fill="#fff9fc" />
        </g>
      ))}
    </g>
  );
}

/** An original little toy plane (not based on any game asset). */
export function Plane() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="72" ry="17" fill="#8c1456" />
      <ellipse cx="-4" cy="-4" rx="62" ry="8" fill="#b02a6e" opacity="0.6" />
      <rect x="-60" y="-3" width="118" height="5" rx="2.5" fill="#ff8dc7" />
      <path d="M-20 -4 L-6 -46 L14 -46 L8 -4 Z" fill="#c2407e" />
      <path d="M-20 4 L-6 40 L12 40 L8 4 Z" fill="#6d1044" />
      <path d="M-70 -2 L-92 -30 L-78 -30 L-58 -6 Z" fill="#c2407e" />
      <ellipse cx="40" cy="-6" rx="14" ry="6" fill="#ffe4f1" opacity="0.9" />
      <circle cx="74" cy="0" r="5" fill="#3a0f2c" />
      <ellipse className="prop" cx="77" cy="0" rx="3" ry="20" fill="#fff0f7" opacity="0.55" />
      <path d="M4 -1 C0 -6 -8 -5 -8 0 C-8 4 -2 6 4 10 C10 6 16 4 16 0 C16 -5 8 -6 4 -1 Z" fill="#ff1493" transform="translate(-30 -1) scale(0.7)" />
    </g>
  );
}

/** A pink gift box with a ribbon and a bow. Origin at the bottom centre. */
export function Crate({ open }: { open: boolean }) {
  return (
    <g>
      <ellipse cx="0" cy="2" rx="34" ry="6" fill="#8c1456" opacity="0.3" />
      <rect x="-30" y="-44" width="60" height="44" rx="3" fill="#ff2d96" />
      {/* ribbon */}
      <rect x="-5" y="-44" width="10" height="44" fill="#fff0f7" />
      <rect x="-30" y="-26" width="60" height="9" fill="#fff0f7" />
      <path d="M0 -24 C-1.6 -26.5 -5.5 -26 -5.5 -23 C-5.5 -20.5 -2.5 -19 0 -16.5 C2.5 -19 5.5 -20.5 5.5 -23 C5.5 -26 1.6 -26.5 0 -24 Z" fill="#ff1493" />
      <g
        className="crate-lid"
        style={{
          transformOrigin: "0% 100%",
          transformBox: "fill-box",
          transform: open ? "rotate(-58deg)" : "rotate(0deg)",
          transition: "transform .8s cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <rect x="-33" y="-52" width="66" height="11" rx="3" fill="#ff1493" />
        <rect x="-5" y="-52" width="10" height="11" fill="#fff0f7" />
        {/* bow */}
        <path d="M0 -52 C-6 -64 -20 -66 -18 -58 C-17 -53 -8 -52 0 -52 Z" fill="#fff0f7" stroke="#ffd1e8" strokeWidth="1.5" />
        <path d="M0 -52 C6 -64 20 -66 18 -58 C17 -53 8 -52 0 -52 Z" fill="#fff0f7" stroke="#ffd1e8" strokeWidth="1.5" />
        <path d="M-2 -52 L-8 -44 M2 -52 L8 -44" stroke="#fff0f7" strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="-53" r="3.5" fill="#ffd1e8" />
      </g>
    </g>
  );
}

export function MiniChute() {
  return (
    <g>
      <line x1="-22" y1="-74" x2="-6" y2="-50" stroke="#8c1456" strokeWidth="1" opacity="0.6" />
      <line x1="22" y1="-74" x2="6" y2="-50" stroke="#8c1456" strokeWidth="1" opacity="0.6" />
      <path d="M-26 -72 C-24 -98 24 -98 26 -72 Q13 -78 0 -72 Q-13 -78 -26 -72 Z" fill="#fff0f7" stroke="#ff2d96" strokeWidth="1.5" />
    </g>
  );
}
