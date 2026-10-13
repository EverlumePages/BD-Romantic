"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { gsap } from "@/lib/gsap";
import { music } from "@/lib/audio/engine";
import { duo } from "@/content/copy";
import { Parachuter } from "../chapters/duo/Figures";

/**
 * Hidden: type "lovely" (or triple-tap her little figure in the duo chapter)
 * and two tiny parachuters drift across the whole screen.
 */
export default function DuoEgg() {
  const count = useStore((s) => s.duoEgg);
  const fire = useStore((s) => s.fireDuoEgg);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  // keyboard secret
  useEffect(() => {
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-6);
      if (buffer === "lovely") {
        buffer = "";
        fire();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fire]);

  useEffect(() => {
    if (count > 0) setActive(count);
  }, [count]);

  useEffect(() => {
    if (!active || !root.current) return;
    music.sfx("sparkle");
    const el = root.current;
    const ctx = gsap.context(() => {
      const w = window.innerWidth, h = window.innerHeight;
      gsap.utils.toArray<HTMLElement>(".egg-chute").forEach((c, i) => {
        gsap.fromTo(
          c,
          { x: w * (0.08 + i * 0.12), y: -160 },
          { x: w * (0.55 + i * 0.12), y: h + 40, duration: 8 + i, ease: "none" }
        );
        gsap.to(c, { rotation: i ? -8 : 8, duration: 1.6, yoyo: true, repeat: 6, ease: "sine.inOut" });
      });
      gsap.fromTo(".egg-bubble", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8, delay: 1.2 });
      gsap.to(".egg-bubble", { opacity: 0, duration: 0.8, delay: 5.2 });
    }, el);
    const t = setTimeout(() => setActive(0), 9500);
    return () => {
      clearTimeout(t);
      ctx.revert();
    };
  }, [active]);

  if (!active) return null;
  return (
    <div ref={root} className="pointer-events-none fixed inset-0 z-[46] overflow-hidden" aria-live="polite">
      <div className="egg-chute absolute left-0 top-0 h-28 w-20">
        <Parachuter variant="her" />
      </div>
      <div className="egg-chute absolute left-0 top-0 h-28 w-20">
        <Parachuter variant="him" />
      </div>
      <p className="egg-bubble glass absolute left-1/2 top-[22%] -translate-x-1/2 rounded-full px-5 py-2 font-hand text-2xl text-pale">
        {duo.secret}
      </p>
    </div>
  );
}
