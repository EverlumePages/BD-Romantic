"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { isScrollLocked } from "@/lib/scroll";
import { ui } from "@/content/copy";

/** Appears only when she has been still for a while, so it never nags. */
export default function ScrollHint() {
  const started = useStore((s) => s.started);
  const hidden = useStore((s) => s.uiHidden);
  const chapter = useStore((s) => s.chapter);
  const heartPhase = useStore((s) => s.heartPhase);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!started) return;
    let timer: ReturnType<typeof setTimeout>;
    const arm = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => {
        const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40;
        if (!atEnd && !isScrollLocked() && window.scrollY > window.innerHeight * 0.5) setIdle(true);
      }, 4200);
    };
    const onLock = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail) {
        clearTimeout(timer);
        setIdle(false);
      } else arm();
    };
    arm();
    window.addEventListener("scroll-lock", onLock);
    window.addEventListener("scroll", arm, { passive: true });
    window.addEventListener("pointerdown", arm, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll-lock", onLock);
      window.removeEventListener("scroll", arm);
      window.removeEventListener("pointerdown", arm);
    };
  }, [started]);

  const light = chapter === 4 || chapter === 5;
  const waitingForHeart = chapter === 2 && heartPhase !== "bloomed";
  const show = started && idle && !hidden && !waitingForHeart;
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed bottom-[calc(18px+var(--safe-bottom))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1 transition-all duration-1000 ${
        show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
    >
      <span className={`eyebrow ${light ? "text-berry/70" : "text-blush/70"}`}>{ui.scroll}</span>
      <svg viewBox="0 0 20 24" className="h-5 w-4" style={{ animation: "hint-fall 2.2s ease-in-out infinite" }}>
        <path d="M10 2 C15 7 15 15 10 22 C5 15 5 7 10 2Z" fill={light ? "#c2185b" : "#ff2d96"} />
      </svg>
    </div>
  );
}
