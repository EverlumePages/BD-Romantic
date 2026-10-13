"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { music } from "@/lib/audio/engine";
import { useMediaQuery } from "@/lib/hooks";
import { littleThings as copy } from "@/content/copy";
import StrayPixel from "../ui/StrayPixel";

// eight points on the classic heart curve, in order around the outline
const TS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75].map((k) => k * Math.PI);
function heartPoint(t: number) {
  const s = Math.sin(t);
  const x = 16 * s * s * s;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  const r = (v: number) => Math.round(v * 10000) / 10000;
  return { x: r((x + 16) / 32), y: r(1 - (y + 17) / 29.6) };
}

function Sparkle({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="starGlow">
          <stop offset="0" stopColor="#fff9fc" />
          <stop offset="0.4" stopColor="#ff8dc7" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff1493" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r={open ? 19 : 14} fill="url(#starGlow)" opacity={open ? 0.9 : 0.6} style={{ transition: "all .8s" }} />
      <g
        style={{
          transformOrigin: "20px 20px",
          transform: open ? "scale(0) rotate(90deg)" : "scale(1) rotate(0deg)",
          transition: "transform .7s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <path d="M20 6 C21 16 24 19 34 20 C24 21 21 24 20 34 C19 24 16 21 6 20 C16 19 19 16 20 6Z" fill="#fff0f7" />
      </g>
      <g
        style={{
          transformOrigin: "20px 20px",
          transform: open ? "scale(1) rotate(0deg)" : "scale(0) rotate(-120deg)",
          transition: "transform .9s cubic-bezier(.22,1,.36,1) .1s",
        }}
      >
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="20" cy="12" rx="5" ry="8" transform={`rotate(${r} 20 20)`} fill="#ff2d96" />
        ))}
        <circle cx="20" cy="20" r="4.5" fill="#fff0f7" />
      </g>
    </svg>
  );
}

/**
 * Chapter 4 — a sky full of little things. Eight stars sit on a heart
 * that isn't visible yet; each one opens a small note, and every opened
 * pair draws a line until the constellation is complete.
 */
export default function Ch4LittleThings() {
  const root = useRef<HTMLElement>(null);
  const [opened, setOpened] = useState<boolean[]>(() => copy.notes.map(() => false));
  const [current, setCurrent] = useState<number | null>(null);
  const complete = opened.every(Boolean);
  const count = opened.filter(Boolean).length;
  const portrait = useMediaQuery("(max-aspect-ratio: 4/5)");
  const announce = useStore((s) => s.announce);

  const points = useMemo(() => TS.map(heartPoint), []);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = boxRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const poly = points.map((p) => `${(p.x * size.w).toFixed(1)},${(p.y * size.h).toFixed(1)}`).join(" ");
  const perimeter = points.reduce((a, p, i) => {
    const q = points[(i + 1) % points.length];
    return a + Math.hypot((q.x - p.x) * size.w, (q.y - p.y) * size.h);
  }, 0);

  useGSAP(
    () => {
      gsap.fromTo(
        ".lt-reveal",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: { trigger: root.current, start: "top 65%" },
        }
      );
      gsap.fromTo(
        ".lt-star",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          stagger: { each: 0.09, from: "random" },
          duration: 1,
          ease: "back.out(2.5)",
          scrollTrigger: { trigger: root.current, start: "top 55%" },
        }
      );
    },
    { scope: root }
  );

  // when every star is open, the heart lights up and a shooting star leaves
  useGSAP(
    () => {
      if (!complete) return;
      const tl = gsap.timeline({ delay: 0.5 });
      tl.to(".lt-outline", { opacity: 1, duration: 1.2 });
      tl.fromTo(".lt-shimmer", { strokeDashoffset: perimeter }, { strokeDashoffset: -perimeter, duration: 2.6, ease: "power1.inOut" }, "<");
      tl.fromTo(".lt-shoot", { x: "-20vw", y: "-10vh", opacity: 0 }, { x: "120vw", y: "30vh", opacity: 1, duration: 1.6, ease: "power2.in" }, "-=0.6");
      tl.to(".lt-shoot", { opacity: 0, duration: 0.3 }, ">-0.3");
    },
    { scope: root, dependencies: [complete, perimeter], revertOnUpdate: true }
  );

  const open = (i: number) => {
    setCurrent(i);
    if (!opened[i]) {
      music.sfx(count === copy.notes.length - 1 ? "bloom" : "chime");
      setOpened((o) => o.map((v, k) => (k === i ? true : v)));
    }
    announce(copy.notes[i]);
  };

  // stage box keeps the heart proportions on every screen
  const box = portrait ? "w-[84vw] h-[min(52svh,104vw)]" : "w-[min(64vw,700px)] h-[min(56svh,520px)]";

  return (
    <section ref={root} id="little-things" data-chapter={3} className="section flex flex-col items-center justify-center py-[10svh]" aria-label="Little things">
      <div className="lt-reveal mb-2 text-center opacity-0">
        <p className="eyebrow text-blush/60">{copy.eyebrow}</p>
        <h2 className="mt-3 font-serif text-[clamp(2rem,6vw,3.6rem)] font-light italic text-pale glow-text-soft">{copy.title}</h2>
        <p className="mt-2 font-hand text-xl text-candy">
          {complete ? "♡" : count === 0 ? copy.hint : copy.counter(count, copy.notes.length)}
        </p>
      </div>

      <div ref={boxRef} className={`relative mt-4 ${box}`}>
        {/* constellation lines — drawn in real pixels so dashes stay exact */}
        <svg viewBox={`0 0 ${size.w || 1} ${size.h || 1}`} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {size.w > 0 &&
            points.map((p, i) => {
              const q = points[(i + 1) % points.length];
              const on = opened[i] && opened[(i + 1) % points.length];
              const x1 = p.x * size.w, y1 = p.y * size.h, x2 = q.x * size.w, y2 = q.y * size.h;
              const len = Math.hypot(x2 - x1, y2 - y1);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ff8dc7"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeDasharray={len}
                  strokeDashoffset={on ? 0 : len}
                  opacity={on ? 1 : 0}
                  style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.65,0,.35,1), opacity .3s", filter: "drop-shadow(0 0 3px #ff1493)" }}
                />
              );
            })}
          {size.w > 0 && (
            <>
              <polygon className="lt-outline" points={poly} fill="rgba(255,20,147,0.08)" stroke="none" opacity="0" />
              <polygon
                className="lt-shimmer"
                points={poly}
                fill="none"
                stroke="#fff0f7"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray={`${perimeter * 0.12} ${perimeter * 0.88}`}
                strokeDashoffset={perimeter}
                opacity={complete ? 1 : 0}
                style={{ filter: "drop-shadow(0 0 4px #ff8dc7)" }}
              />
            </>
          )}
        </svg>

        {/* stars */}
        {points.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => open(i)}
            aria-label={`Little thing ${i + 1}${opened[i] ? " (opened)" : ""}`}
            aria-pressed={current === i}
            className="lt-star absolute grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center opacity-0"
            style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          >
            <span
              className="block h-11 w-11"
              style={{ animation: opened[i] ? "none" : `twinkle ${2.4 + (i % 3) * 0.7}s ease-in-out ${i * 0.3}s infinite` }}
            >
              <Sparkle open={opened[i]} />
            </span>
          </button>
        ))}

        {/* the note, inside the heart */}
        <div className="pointer-events-none absolute left-1/2 top-[44%] w-[min(64%,380px)] -translate-x-1/2 -translate-y-1/2 text-center">
          <AnimatePresence mode="wait">
            {current !== null ? (
              <motion.p
                key={current}
                initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-[clamp(1.05rem,3.6vw,1.6rem)] italic leading-snug text-pale glow-text-soft"
              >
                {copy.notes[current]}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 1.2 }}
            className="mt-6 px-6 text-center"
          >
            <p className="font-serif text-[clamp(1.3rem,4vw,2rem)] italic text-pale">{copy.complete[0]}</p>
            <p className="mt-1 font-hand text-[clamp(1.4rem,4.4vw,2rem)] text-candy">{copy.complete[1]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* shooting star */}
      <span
        aria-hidden
        className="lt-shoot pointer-events-none absolute left-0 top-[18%] h-[2px] w-40 opacity-0"
        style={{ background: "linear-gradient(90deg, transparent, #ffd1e8, #fff)", boxShadow: "0 0 12px #ff8dc7", transform: "rotate(14deg)" }}
      />
      <StrayPixel className="bottom-[8%] right-[6%]" />
    </section>
  );
}
