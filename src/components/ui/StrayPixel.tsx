"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { music } from "@/lib/audio/engine";
import { surprise } from "@/content/copy";

/**
 * The one pixel that never made it into the flower. After the bloom it
 * blinks in a corner of later chapters — tapping it early just teases.
 */
export default function StrayPixel({ className = "", light = false }: { className?: string; light?: boolean }) {
  const escaped = useStore((s) => s.heartPhase === "bloomed");
  const found = useStore((s) => s.strayFound);
  const [tease, setTease] = useState(false);
  if (!escaped || found) return null;
  return (
    <button
      type="button"
      aria-label={surprise.pixelAria}
      onClick={() => {
        setTease(true);
        music.sfx("chime");
        setTimeout(() => setTease(false), 2600);
      }}
      className={`absolute z-20 grid h-10 w-10 place-items-center ${className}`}
    >
      <span className="block h-[7px] w-[7px] bg-hot" style={{ animation: "blink-pixel 3.4s steps(1) infinite" }} />
      <span
        className={`pointer-events-none absolute top-full mt-1 whitespace-nowrap font-hand text-lg transition-all duration-500 ${
          light ? "text-berry" : "text-blush"
        } ${tease ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}
      >
        {surprise.early}
      </span>
    </button>
  );
}
