"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { music } from "@/lib/audio/engine";
import { splitWords, revealWords } from "@/lib/text";
import { duo } from "@/content/copy";
import { Canopy, Chibi } from "./duo/Figures";
import { Crate, Island, MiniChute, Plane } from "./duo/Island";
import StrayPixel from "../ui/StrayPixel";

const PLANE_Y = 205;

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ""}`}
      style={{
        background:
          "radial-gradient(closest-side at 30% 60%, rgba(255,255,255,0.95), transparent), radial-gradient(closest-side at 55% 40%, rgba(255,249,252,0.95), transparent), radial-gradient(closest-side at 78% 62%, rgba(255,240,247,0.9), transparent), radial-gradient(closest-side at 50% 75%, rgba(255,230,242,0.85), transparent)",
        ...style,
      }}
    />
  );
}

/**
 * Chapter 5 — our little universe. A toy plane crosses a pink dawn,
 * two tiny parachuters drift down to a flower island, and a gift box
 * lands with a message inside.
 */
export default function Ch5Duo() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState("0 100 1000 850");
  const [dropReady, setDropReady] = useState(false);
  const [crateOpen, setCrateOpen] = useState(false);
  const [card, setCard] = useState(false);
  const herTaps = useRef<number[]>([]);
  const reduced = useStore((s) => s.reducedMotion);
  const fireDuoEgg = useStore((s) => s.fireDuoEgg);

  // keep the island, figures and flight path in frame on any aspect ratio
  useEffect(() => {
    const el = stage.current!;
    const update = () => {
      const a = el.clientWidth / Math.max(1, el.clientHeight);
      const W = Math.max(520, 850 * a);
      const H = W / a;
      setViewBox(`${(500 - W / 2).toFixed(1)} ${(560 - H / 2).toFixed(1)} ${W.toFixed(1)} ${H.toFixed(1)}`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const el = root.current!;
      const lines = gsap.utils.toArray<HTMLElement>(".d-line", el);
      const lineWords = lines.map((l) => splitWords(l));
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage.current,
          start: "top top",
          end: "+=270%",
          pin: true,
          scrub: reduced ? true : 1,
          onUpdate: (self) => setDropReady(self.progress > 0.93),
        },
      });
      gsap.set(lines, { autoAlpha: 1 });
      gsap.set(".d-her", { x: 430, y: PLANE_Y + 10, opacity: 0 });
      gsap.set(".d-him", { x: 462, y: PLANE_Y + 10, opacity: 0 });
      gsap.set(".d-canopy", { scale: 0.05, transformOrigin: "50% 100%" });
      gsap.set(".d-crate", { x: 612, y: -120 });

      // clouds drift past at different depths
      tl.fromTo(".d-cloud-far", { yPercent: 10 }, { yPercent: -30, duration: 10 }, 0);
      tl.fromTo(".d-cloud-near", { yPercent: 40 }, { yPercent: -80, duration: 10 }, 0);

      // the flight
      tl.fromTo(".d-plane", { x: -380, y: PLANE_Y }, { x: 1380, y: PLANE_Y - 20, duration: 3.4 }, 0);
      tl.fromTo(".d-path", { opacity: 0.0 }, { opacity: 0.85, duration: 0.5 }, 0);
      tl.to(".d-path", { opacity: 0, duration: 0.8 }, 3);
      tl.to(".d-jump", { opacity: 1, duration: 0.2 }, 1.2);
      tl.to(".d-jump", { opacity: 0, duration: 0.4 }, 1.9);

      // jump!
      tl.to([".d-her", ".d-him"], { opacity: 1, duration: 0.1 }, 1.5);
      tl.to(".d-her", { y: 370, x: 438, duration: 0.6, ease: "power1.in" }, 1.5);
      tl.to(".d-him", { y: 362, x: 470, duration: 0.6, ease: "power1.in" }, 1.6);
      tl.to(".d-canopy", { scale: 1, duration: 0.45, ease: "back.out(2)", stagger: 0.1 }, 2.1);
      // the gentle descent
      tl.to(".d-her", { y: 752, x: 456, duration: 4.8, ease: "sine.inOut" }, 2.2);
      tl.to(".d-him", { y: 752, x: 544, duration: 4.8, ease: "sine.inOut" }, 2.3);
      tl.to(".d-sway-her", { rotation: 7, duration: 1.2, yoyo: true, repeat: 3, ease: "sine.inOut", transformOrigin: "50% 0%" }, 2.4);
      tl.to(".d-sway-him", { rotation: -6, duration: 1.3, yoyo: true, repeat: 3, ease: "sine.inOut", transformOrigin: "50% 0%" }, 2.5);

      // the words
      revealWords(tl, lineWords[0], 2.6, { stagger: 0.12, duration: 0.6 });
      revealWords(tl, lineWords[1], 4.2, { stagger: 0.12, duration: 0.6 });
      revealWords(tl, lineWords[2], 5.8, { stagger: 0.12, duration: 0.6 });

      // landing
      tl.to(".d-canopy", { scaleY: 0, opacity: 0, duration: 0.5, ease: "power2.in" }, 7.1);
      tl.to([".d-her-body", ".d-him-body"], { y: -12, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.out" }, 7.3);

      // the drop
      tl.to(".d-crate", { y: 756, duration: 1.3, ease: "power1.in" }, 7.8);
      tl.to(".d-crate-chute", { scaleY: 0, opacity: 0, duration: 0.3, transformOrigin: "50% 100%" }, 9.05);
      tl.to(".d-crate-body", { scaleY: 0.86, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: "50% 100%" }, 9.1);
      tl.to(".d-smoke", { opacity: 1, duration: 0.4 }, 9.15);
      tl.to({}, { duration: 0.6 });

      // propeller never stops
      gsap.to(".prop", { scaleY: 0.2, duration: 0.06, repeat: -1, yoyo: true, transformOrigin: "50% 50%" });
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true }
  );

  const highFive = () => {
    const now = performance.now();
    herTaps.current = [...herTaps.current.filter((t) => now - t < 900), now];
    if (herTaps.current.length >= 3) {
      herTaps.current = [];
      fireDuoEgg();
    }
    music.sfx("sparkle");
    const tl = gsap.timeline();
    tl.to(".d-her-body .arm-r", { rotation: -150, transformOrigin: "50% 8%", duration: 0.25, ease: "back.out(2)" });
    tl.to(".d-him-body .arm-l", { rotation: 150, transformOrigin: "50% 8%", duration: 0.25, ease: "back.out(2)" }, "<");
    tl.fromTo(".d-five", { scale: 0, opacity: 1, y: 0 }, { scale: 1.4, y: -26, opacity: 0, duration: 1, ease: "power2.out" }, ">-0.05");
    tl.to([".d-her-body .arm-r", ".d-him-body .arm-l"], { rotation: 0, duration: 0.5, ease: "power2.inOut" }, "<0.3");
  };

  const openDrop = () => {
    if (!dropReady) return;
    setCrateOpen(true);
    music.sfx("bloom");
    setTimeout(() => setCard(true), 650);
  };

  return (
    <section ref={root} id="duo" data-chapter={4} className="section" aria-label="Our little universe">
      <div ref={stage} className="pin-stage">
        <Cloud className="d-cloud-far left-[-10%] top-[30%] h-[22%] w-[60%] opacity-70" style={{ animation: "drift-cloud 14s ease-in-out infinite alternate" }} />
        <Cloud className="d-cloud-far right-[-14%] top-[12%] h-[18%] w-[50%] opacity-60" style={{ animation: "drift-cloud 18s ease-in-out infinite alternate-reverse" }} />
        <Cloud className="d-cloud-far left-[20%] top-[55%] h-[16%] w-[45%] opacity-50" />

        <svg viewBox={viewBox} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden={false} role="img" aria-label="Two tiny parachuters drifting down onto a flower island">
          {/* flight path */}
          <line className="d-path" x1="-600" y1={PLANE_Y} x2="1600" y2={PLANE_Y - 20} stroke="#fff9fc" strokeWidth="4" strokeDasharray="2 18" strokeLinecap="round" opacity="0" />
          <text className="d-jump" x="420" y={PLANE_Y - 40} textAnchor="middle" fill="#8c1456" opacity="0" style={{ fontFamily: "var(--font-caveat)", fontSize: 30 }}>
            {duo.jump}
          </text>

          <g className="d-plane">
            <Plane />
          </g>

          <Island />

          {/* the duo */}
          <g
            role="button"
            tabIndex={0}
            aria-label="High five"
            onClick={highFive}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), highFive())}
            style={{ cursor: "pointer", outline: "none" }}
          >
            <g className="d-her">
              <g className="d-sway-her">
                <g className="d-canopy">
                  <Canopy variant="her" />
                </g>
                <g className="d-her-body" transform="scale(1.35)">
                  <Chibi variant="her" />
                </g>
              </g>
            </g>
            <g className="d-him">
              <g className="d-sway-him">
                <g className="d-canopy">
                  <Canopy variant="him" />
                </g>
                <g className="d-him-body" transform="scale(1.35)">
                  <Chibi variant="him" />
                </g>
              </g>
            </g>
            <text className="d-five" x="500" y="680" textAnchor="middle" fill="#ff1493" opacity="0" style={{ fontSize: 34 }}>
              ♡
            </text>
          </g>

          {/* gift box */}
          <g className="d-crate">
            <g className="d-smoke" opacity="0">
              {[0, 1, 2, 3].map((i) => (
                <circle
                  key={i}
                  cx={-20 + i * 9}
                  cy={-50}
                  r={10 + i * 3}
                  fill="#ff8dc7"
                  opacity="0.45"
                  style={{ animation: `smoke-rise ${2.4 + i * 0.5}s ease-out ${i * 0.45}s infinite`, transformBox: "fill-box", transformOrigin: "center" }}
                />
              ))}
            </g>
            <g className="d-crate-chute">
              <MiniChute />
            </g>
            <g
              className="d-crate-body"
              role="button"
              tabIndex={dropReady ? 0 : -1}
              aria-label={duo.dropAria}
              onClick={openDrop}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openDrop())}
              style={{ cursor: dropReady ? "pointer" : "default", outline: "none" }}
            >
              <rect x="-50" y="-80" width="100" height="100" fill="transparent" />
              <Crate open={crateOpen} />
              {crateOpen && (
                <g>
                  <path d="M-26 -50 L-60 -190 L60 -190 L26 -50 Z" fill="url(#beam)" opacity="0.8" />
                  <defs>
                    <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0" stopColor="#fff9fc" stopOpacity="0.9" />
                      <stop offset="1" stopColor="#ff8dc7" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </g>
              )}
            </g>
          </g>
        </svg>

        <Cloud className="d-cloud-near bottom-[-22%] left-[-20%] h-[30%] w-[80%] opacity-80" />
        <Cloud className="d-cloud-near bottom-[-26%] right-[-25%] h-[34%] w-[80%] opacity-80" />

        {/* words */}
        <div className="pointer-events-none absolute inset-x-5 top-[calc(21%+var(--safe-top))] text-center md:left-[6%] md:right-auto md:top-[34%] md:w-[30%] md:text-left">
          <p className="eyebrow mb-3 text-berry/70">{duo.eyebrow}</p>
          {duo.lines.map((l, i) => (
            <p key={i} className="d-line invisible font-serif text-[clamp(1.2rem,4vw,2rem)] italic leading-snug text-ink md:text-[clamp(1.4rem,2.3vw,2.1rem)]">
              {l}
            </p>
          ))}
        </div>

        <AnimatePresence>
          {dropReady && !crateOpen && (
            <motion.button
              type="button"
              onClick={openDrop}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-[calc(7%+var(--safe-bottom))] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 font-hand text-2xl text-berry glass-light"
            >
              {duo.dropHint} ✦
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {card && (
            <motion.div
              className="absolute inset-0 z-20 grid place-items-center bg-plum/25 px-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCard(false)}
            >
              <motion.div
                role="dialog"
                aria-label={duo.card.rarity}
                initial={{ scale: 0.7, rotateX: 40, opacity: 0 }}
                animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 160, damping: 16 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-light relative w-[min(92vw,430px)] overflow-hidden rounded-[28px] px-7 py-8 text-center"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{ background: "conic-gradient(from 0deg at 50% 0%, transparent, rgba(255,20,147,0.18), transparent 30%)", animation: "spin-slow 8s linear infinite" }}
                />
                <p
                  className="eyebrow relative bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(90deg,#ff1493,#ff8dc7,#c2185b,#ff1493)", backgroundSize: "200% 100%", animation: "shine 3s linear infinite" }}
                >
                  ✦ {duo.card.rarity} ✦
                </p>
                <p className="relative mt-5 font-serif text-[1.45rem] italic leading-snug text-ink">{duo.card.line}</p>
                <p className="relative mt-5 font-hand text-[2rem] leading-tight text-hot">{duo.card.name}</p>
                <p className="relative mt-5 font-sans text-[0.7rem] uppercase tracking-[0.3em] text-berry/60">{duo.dropTag} 🍰</p>
                <button type="button" onClick={() => setCard(false)} className="btn-ghost-dark relative mt-6 px-5 py-2 font-hand text-xl">
                  ♡
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <StrayPixel className="left-[5%] top-[38%]" light />
      </div>
      <style>{`
        @keyframes smoke-rise { 0% { transform: translate(0,0) scale(.6); opacity:.55 } 100% { transform: translate(8px,-70px) scale(1.8); opacity:0 } }
        @keyframes shine { to { background-position: -200% 0 } }
        @keyframes spin-slow { to { transform: rotate(360deg) } }
      `}</style>
    </section>
  );
}
