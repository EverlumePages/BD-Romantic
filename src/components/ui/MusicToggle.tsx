"use client";

import { useStore } from "@/lib/store";
import { music } from "@/lib/audio/engine";
import { ui } from "@/content/copy";

/** A little flower that spins its petals while the music plays. */
export default function MusicToggle() {
  const musicOn = useStore((s) => s.musicOn);
  const setMusic = useStore((s) => s.setMusic);
  const started = useStore((s) => s.started);
  const hidden = useStore((s) => s.uiHidden);

  const toggle = () => {
    const next = !musicOn;
    music.setEnabled(next);
    setMusic(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={musicOn}
      aria-label={musicOn ? ui.musicOn : ui.musicOff}
      className={`fixed z-40 grid h-11 w-11 place-items-center rounded-full transition-all duration-700 glass
        right-[calc(14px+var(--safe-right))] top-[calc(14px+var(--safe-top))]
        md:left-[calc(22px+var(--safe-left))] md:right-auto md:top-auto md:bottom-[calc(22px+var(--safe-bottom))]
        ${started && !hidden ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
        <g
          style={{
            transformOrigin: "20px 20px",
            animation: musicOn ? "spin-slow 9s linear infinite" : "none",
          }}
        >
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse
              key={r}
              cx="20"
              cy="11.5"
              rx="5"
              ry="8"
              transform={`rotate(${r} 20 20)`}
              fill={musicOn ? "#ff2d96" : "rgba(255,209,232,0.35)"}
              style={{ transition: "fill .6s" }}
            />
          ))}
        </g>
        <circle cx="20" cy="20" r="4.2" fill={musicOn ? "#fff0f7" : "rgba(255,240,247,0.5)"} />
        {!musicOn && <line x1="9" y1="31" x2="31" y2="9" stroke="#ffd1e8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />}
      </svg>
      <style>{`@keyframes spin-slow{to{transform:rotate(360deg)}}`}</style>
    </button>
  );
}
