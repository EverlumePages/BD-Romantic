"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { requestPetalBurst } from "@/lib/world";
import { music } from "@/lib/audio/engine";
import { garden as copy, type FlowerKind } from "@/content/copy";
import { Plant, type PlantState } from "./garden/Plant";
import { FlowerHead, FLOWER_NAMES } from "./garden/Flower";
import { BouquetArt } from "./garden/Bouquet";
import StrayPixel from "../ui/StrayPixel";

const KINDS: FlowerKind[] = ["rose", "peony", "tulip", "cosmos", "sakura", "ranunculus", "lily"];
const STEMS = [0.95, 0.7, 1.1, 0.8, 1.0, 0.75, 1.15];

type Flight = { kind: FlowerKind; from: DOMRect; to: DOMRect };

function FlyingFlower({ flight, host, onDone }: { flight: Flight; host: HTMLElement; onDone: () => void }) {
  const el = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const h = host.getBoundingClientRect();
    const { from, to } = flight;
    const x0 = from.left - h.left, y0 = from.top - h.top;
    const x1 = to.left - h.left + to.width / 2 - from.width / 2;
    const y1 = to.top - h.top + to.height / 2 - from.height / 2;
    const s = Math.max(0.3, to.width / from.width);
    gsap.set(el.current, { x: x0, y: y0, width: from.width, height: from.height });
    gsap.to(el.current, {
      motionPath: { path: [{ x: x0, y: y0 }, { x: (x0 + x1) / 2, y: Math.min(y0, y1) - 120 }, { x: x1, y: y1 }], curviness: 1.4 },
      scale: s,
      rotation: 360,
      duration: 1.15,
      ease: "power2.inOut",
      onComplete: onDone,
    });
  });
  return (
    <div ref={el} className="pointer-events-none absolute left-0 top-0 z-30" aria-hidden>
      <svg viewBox="-60 -60 120 120" className="h-full w-full overflow-visible">
        <FlowerHead kind={flight.kind} />
      </svg>
    </div>
  );
}

function Butterfly({ reduced }: { reduced: boolean }) {
  const el = useRef<HTMLButtonElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const [talking, setTalking] = useState(false);

  useGSAP(() => {
    if (reduced) return;
    tween.current = gsap.to(el.current, {
      keyframes: [
        { left: "72%", top: "22%" },
        { left: "58%", top: "40%" },
        { left: "30%", top: "28%" },
        { left: "14%", top: "46%" },
        { left: "40%", top: "18%" },
        { left: "84%", top: "34%" },
        { left: "72%", top: "22%" },
      ],
      duration: 30,
      ease: "sine.inOut",
      repeat: -1,
    });
  });

  const tap = () => {
    if (talking) return;
    setTalking(true);
    tween.current?.pause();
    music.sfx("sparkle");
    useStore.getState().announce(copy.butterfly.join(" "));
    setTimeout(() => {
      setTalking(false);
      tween.current?.resume();
    }, 5200);
  };

  return (
    <button
      ref={el}
      type="button"
      onClick={tap}
      aria-label="A little butterfly"
      className="absolute z-20 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center"
      style={{ left: "72%", top: "22%" }}
    >
      <svg viewBox="-30 -24 60 48" className="h-11 w-11 overflow-visible drop-shadow-[0_0_8px_rgba(255,20,147,0.55)]" aria-hidden>
        <g style={{ animation: `flap ${talking ? 1.4 : 0.32}s ease-in-out infinite`, transformOrigin: "0 0", transformBox: "view-box" }}>
          <path d="M0 0 C-8 -22 -30 -24 -26 -6 C-24 4 -10 4 0 0Z" fill="#ff2d96" />
          <path d="M0 0 C-6 10 -22 18 -18 6 C-16 0 -8 0 0 0Z" fill="#ff8dc7" />
        </g>
        <g style={{ animation: `flap-r ${talking ? 1.4 : 0.32}s ease-in-out infinite`, transformOrigin: "0 0", transformBox: "view-box" }}>
          <path d="M0 0 C8 -22 30 -24 26 -6 C24 4 10 4 0 0Z" fill="#ff2d96" />
          <path d="M0 0 C6 10 22 18 18 6 C16 0 8 0 0 0Z" fill="#ff8dc7" />
        </g>
        <rect x="-1.2" y="-9" width="2.4" height="17" rx="1.2" fill="#3a0f2c" />
      </svg>
      <AnimatePresence>
        {talking && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="glass-light pointer-events-none absolute left-1/2 top-full mt-1 w-max max-w-[62vw] -translate-x-1/2 rounded-2xl px-4 py-2 text-center font-hand text-xl leading-tight text-berry"
          >
            {copy.butterfly.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/**
 * Chapter 6 — the secret garden. Buds bloom at a touch, flowers can be
 * picked into a bouquet, and once it's tied it's hers (it comes back in
 * the finale).
 */
export default function Ch6Garden() {
  const root = useRef<HTMLElement>(null);
  const bouquetRef = useRef<HTMLDivElement>(null);
  const plantRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [plants, setPlants] = useState<Record<FlowerKind, PlantState>>(
    () => Object.fromEntries(KINDS.map((k) => [k, "bud"])) as Record<FlowerKind, PlantState>
  );
  const [note, setNote] = useState<FlowerKind | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const bouquet = useStore((s) => s.bouquet);
  const tied = useStore((s) => s.bouquetTied);
  const addFlower = useStore((s) => s.addFlower);
  const tieBouquet = useStore((s) => s.tieBouquet);
  const reduced = useStore((s) => s.reducedMotion);

  useGSAP(
    () => {
      gsap.fromTo(
        ".g-reveal",
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 62%" } }
      );
      gsap.fromTo(
        ".plant",
        { opacity: 0, y: 60, scaleY: 0.4 },
        {
          opacity: 1,
          y: 0,
          scaleY: 1,
          duration: 1.4,
          ease: "elastic.out(1, 0.7)",
          stagger: { each: 0.08, from: "center" },
          transformOrigin: "50% 100%",
          clearProps: "transform",
          scrollTrigger: { trigger: root.current, start: "top 50%" },
        }
      );
    },
    { scope: root }
  );

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 5200);
    return () => clearTimeout(t);
  }, [note]);

  const tap = (kind: FlowerKind) => {
    const state = plants[kind];
    if (state === "bud") {
      setPlants((p) => ({ ...p, [kind]: "bloomed" }));
      setNote(kind);
      music.sfx("chime");
      useStore.getState().announce(`${FLOWER_NAMES[kind]}: ${copy.flowers[kind]}`);
      return;
    }
    if (state === "bloomed" && !flight && !tied) {
      const src = plantRefs.current[kind];
      const slot = bouquetRef.current?.querySelector<SVGElement>(`[data-slot="${bouquet.length}"]`);
      if (!src || !slot) return;
      setPlants((p) => ({ ...p, [kind]: "picked" }));
      setFlight({ kind, from: src.getBoundingClientRect(), to: slot.getBoundingClientRect() });
      music.sfx("sparkle");
    }
  };

  const tie = () => {
    tieBouquet();
    music.sfx("bloom");
    requestPetalBurst();
    useStore.getState().announce(copy.message);
  };

  return (
    <section ref={root} id="garden" data-chapter={5} className="section relative flex flex-col items-center overflow-hidden px-4 pb-[8svh] pt-[14svh]" aria-label="The secret garden">
      {/* sun rays */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[20%] left-1/2 h-[80%] w-[140%] -translate-x-1/2 opacity-60"
        style={{ background: "conic-gradient(from 180deg at 50% 0%, transparent 0deg, rgba(255,255,255,0.55) 8deg, transparent 16deg, transparent 30deg, rgba(255,255,255,0.4) 38deg, transparent 46deg, transparent 320deg, rgba(255,255,255,0.45) 330deg, transparent 340deg)" }}
      />

      <div className="relative z-10 text-center">
        <p className="g-reveal eyebrow text-berry/60 opacity-0">{copy.eyebrow}</p>
        <h2 className="g-reveal mt-3 font-serif text-[clamp(2rem,6vw,3.6rem)] font-light italic text-ink opacity-0">{copy.title}</h2>
        <p className="g-reveal mt-2 font-hand text-xl text-berry/80 opacity-0">{copy.hint}</p>
      </div>

      <div className="relative z-10 mt-4 h-16 w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          {note && (
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.6 }}
              className="font-hand text-[1.6rem] leading-tight text-hot"
            >
              <span className="mr-2 font-sans text-[0.62rem] uppercase tracking-[0.3em] text-berry/60">{FLOWER_NAMES[note]}</span>
              {copy.flowers[note]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* the flower bed */}
      <div className="relative z-10 mt-2 flex w-full max-w-5xl flex-wrap items-end justify-center gap-x-[2vw] gap-y-6 md:flex-nowrap md:justify-between">
        {KINDS.map((k, i) => (
          <Plant
            key={k}
            ref={(el) => {
              plantRefs.current[k] = el;
            }}
            kind={k}
            state={plants[k]}
            onTap={() => tap(k)}
            stem={STEMS[i]}
            sway={(i % 3) * 0.6}
            reduced={reduced}
          />
        ))}
      </div>
      <div aria-hidden className="relative z-0 -mt-3 h-6 w-[min(110%,1100px)] rounded-[50%] bg-gradient-to-b from-[#9dc7ab]/50 to-transparent blur-md" />

      {/* the bouquet */}
      <div className="relative z-10 mt-6 flex flex-col items-center">
        <p className="font-sans text-[0.7rem] uppercase tracking-[0.3em] text-berry/60">{copy.counter(bouquet.length)}</p>
        <div ref={bouquetRef} className={`relative mt-1 transition-transform duration-1000 ${tied ? "-translate-y-2" : ""}`} style={{ animation: tied && !reduced ? "floaty 4s ease-in-out infinite" : "none" }}>
          <BouquetArt kinds={bouquet} tied={tied} className="h-[min(36svh,300px)] w-auto overflow-visible" />
        </div>
        <AnimatePresence mode="wait">
          {!tied && bouquet.length >= 3 && (
            <motion.button
              key="tie"
              type="button"
              onClick={tie}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="btn-glow mt-2 px-7 py-3 font-hand text-2xl"
            >
              {copy.tie}
            </motion.button>
          )}
          {tied && (
            <motion.div key="msg" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1.2 }} className="mt-2 text-center">
              <p className="font-hand text-[clamp(2.2rem,8vw,3.4rem)] leading-tight text-hot">{copy.message}</p>
              <p className="mt-1 font-serif text-lg italic text-berry/70">{copy.later}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Butterfly reduced={reduced} />
      {flight && root.current && (
        <FlyingFlower
          flight={flight}
          host={root.current}
          onDone={() => {
            addFlower(flight.kind);
            setFlight(null);
          }}
        />
      )}
      <StrayPixel className="left-[4%] top-[10%]" light />
      <style>{`
        @keyframes flap { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(0.25) } }
        @keyframes flap-r { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(0.25) } }
      `}</style>
    </section>
  );
}
