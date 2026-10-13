"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { world, requestPetalBurst, queueFirework } from "@/lib/world";
import { replayBloom, stopBloom } from "@/lib/bloom";
import { music } from "@/lib/audio/engine";
import { lockScroll, scrollToY } from "@/lib/scroll";
import { splitWords, revealWords, dissolveWords } from "@/lib/text";
import { surprise as copy } from "@/content/copy";
import { PixelHeartMark } from "./letter/Letter";

/**
 * Chapter 9 — one more thing. The pixel that never made it into the
 * flower has been waiting here. Tap it, and it says the last thing.
 */
export default function Ch9Surprise() {
  const root = useRef<HTMLElement>(null);
  const pixel = useRef<HTMLButtonElement>(null);
  const found = useStore((s) => s.strayFound);
  const uiHidden = useStore((s) => s.uiHidden);
  const reduced = useStore((s) => s.reducedMotion);
  const [final, setFinal] = useState(false);
  const [keepHint, setKeepHint] = useState(false);

  useGSAP(
    () => {
      const el = root.current!;
      ScrollTrigger.create({
        trigger: el,
        start: "top 45%",
        end: "top top",
        onUpdate: (self) => {
          world.heart.visible = self.progress;
          world.heart.lift = 0.85;
          world.heart.scale = 0.7;
        },
        onLeave: () => (world.heart.visible = 1),
        onLeaveBack: () => (world.heart.visible = 0),
        onEnter: () => {
          const s = useStore.getState();
          if (s.heartPhase !== "bloomed") {
            stopBloom();
            world.heart.assemble = 1;
            world.heart.progress = 1;
            s.setHeartPhase("bloomed");
          }
        },
      });
      gsap.fromTo(".x-hint", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2, scrollTrigger: { trigger: el, start: "top 40%" } });
    },
    { scope: root }
  );

  const findPixel = () => {
    if (found) return;
    useStore.getState().findStray();
    music.sfx("chime");
    const el = root.current!;
    const lines = gsap.utils.toArray<HTMLElement>(".x-line", el);
    const words = lines.map((l) => splitWords(l));
    const r = pixel.current!.getBoundingClientRect();
    const host = el.getBoundingClientRect();
    const dx = host.left + host.width / 2 - (r.left + r.width / 2);
    const dy = host.top + host.height * 0.5 - (r.top + r.height / 2);
    const tl = gsap.timeline({ onComplete: () => setFinal(true) });
    tl.to(".x-hint", { opacity: 0, duration: 0.5 }, 0);
    tl.to(pixel.current, {
      motionPath: { path: [{ x: 0, y: 0 }, { x: dx * 0.5, y: dy - 140 }, { x: dx, y: dy }], curviness: 1.2 },
      duration: reduced ? 0.6 : 1.4,
      ease: "power2.inOut",
    }, 0);
    tl.to(".x-pixel-dot", { scale: 0, duration: 0.3 }, ">-0.1");
    tl.fromTo(".x-pixel-heart", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "back.out(2.4)" }, "<");
    tl.call(() => music.sfx("sparkle"));
    gsap.set(lines, { autoAlpha: 1 });
    revealWords(tl, words[0], ">0.2", { stagger: 0.09, duration: 1 });
    tl.to({}, { duration: reduced ? 0.6 : 1.4 });
    dissolveWords(tl, words[0], ">");
    revealWords(tl, words[1], ">", { stagger: 0.07, duration: 1 });
    tl.to({}, { duration: reduced ? 0.8 : 1.8 });
    dissolveWords(tl, words[1], ">");
    revealWords(tl, words[2], ">", { stagger: 0.14, duration: 1.3 });
    tl.call(() => {
      music.sfx("bloom");
      requestPetalBurst();
      queueFirework({ x: 0, y: 0.6, kind: "heart", hue: 0.2 });
      useStore.getState().announce(copy.lines.join(" "));
    }, undefined, "<0.4");
    tl.to(".x-pixel-heart", { y: -14, scale: 0.8, duration: 1 }, "<");
  };

  useGSAP(
    () => {
      if (!final) return;
      gsap.fromTo(".x-final", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.4, stagger: 0.18, ease: "power3.out", delay: 0.4 });
    },
    { scope: root, dependencies: [final] }
  );

  // "keep this moment": hide every control for a clean screenshot
  useEffect(() => {
    if (!uiHidden) return;
    setKeepHint(true);
    const t = setTimeout(() => setKeepHint(false), 2600);
    const back = () => useStore.getState().setUiHidden(false);
    const arm = setTimeout(() => window.addEventListener("pointerdown", back, { once: true }), 300);
    return () => {
      clearTimeout(t);
      clearTimeout(arm);
      window.removeEventListener("pointerdown", back);
    };
  }, [uiHidden]);

  const restart = () => {
    stopBloom();
    Object.assign(world.heart, { assemble: 0, charge: 0, progress: 0, visible: 0, lift: 0, scale: 1, cinematic: 0 });
    // go back to the top first, then rebuild every chapter from scratch
    lockScroll(true);
    scrollToY(0, { immediate: true });
    requestAnimationFrame(() => requestAnimationFrame(() => useStore.getState().restart()));
  };

  return (
    <section ref={root} id="surprise" data-chapter={8} className="section relative h-[100svh] overflow-hidden" aria-label="One more thing">
      {/* the stray pixel */}
      <button
        ref={pixel}
        type="button"
        onClick={findPixel}
        disabled={found}
        aria-label={copy.pixelAria}
        className="absolute right-[18%] top-[30%] z-20 grid h-12 w-12 place-items-center"
      >
        <span className="x-pixel-dot block h-[9px] w-[9px] bg-hot" style={{ animation: "blink-pixel 2.6s steps(1) infinite" }} />
        <span className="x-pixel-heart absolute opacity-0 drop-shadow-[0_0_12px_rgba(255,20,147,0.9)]">
          <PixelHeartMark size={44} color="#ff1493" />
        </span>
      </button>
      <p className="x-hint pointer-events-none absolute inset-x-6 top-[calc(30%+56px)] text-center font-hand text-2xl text-blush/80 opacity-0 sm:inset-x-auto sm:right-[10%] sm:text-right">
        {found ? "" : copy.hint}
      </p>

      {/* the last words */}
      <div className="x-words pointer-events-none absolute inset-x-6 top-[57%] text-center">
        {copy.lines.map((l, i) => (
          <p
            key={i}
            className={`x-line invisible absolute inset-x-0 top-0 font-serif italic leading-snug ${
              i === 2 ? "text-[clamp(1.9rem,6.5vw,3.4rem)] text-pale glow-text" : "text-[clamp(1.4rem,4.6vw,2.4rem)] text-pale glow-text-soft"
            }`}
          >
            {l}
          </p>
        ))}
      </div>

      {/* the final screen */}
      {final && (
        <div className="absolute inset-x-0 bottom-[calc(3%+var(--safe-bottom))] flex flex-col items-center gap-1.5 px-6 text-center">
          <p className="x-final font-serif text-sm tracking-[0.6em] text-pale/90" style={{ fontVariantNumeric: "lining-nums" }}>
            {copy.date}
          </p>
          <p className="x-final font-hand text-[clamp(2.4rem,9vw,4rem)] leading-none text-pale glow-text-soft">
            {copy.final} <span className="text-hot">♡</span>
          </p>
          <div className="x-final">
          <div className={`mt-3 flex flex-wrap items-center justify-center gap-2 transition-opacity md:gap-3 duration-700 ${uiHidden ? "pointer-events-none opacity-0" : ""}`}>
            <button type="button" onClick={() => useStore.getState().setUiHidden(true)} className="btn-glow px-4 py-2 font-hand text-base md:px-5 md:py-2.5 md:text-xl">
              {copy.keep}
            </button>
            <button
              type="button"
              onClick={() => {
                music.sfx("sparkle");
                replayBloom(reduced);
              }}
              className="btn-ghost px-4 py-2 font-hand text-base md:px-5 md:py-2.5 md:text-xl"
            >
              {copy.replay}
            </button>
            <button type="button" onClick={restart} className="btn-ghost px-4 py-2 font-hand text-base md:px-5 md:py-2.5 md:text-xl">
              {copy.restart}
            </button>
          </div>
          </div>
          <div className="x-final">
            <p className={`mt-2 font-sans text-[0.62rem] uppercase tracking-[0.35em] text-pale/60 transition-opacity duration-700 ${uiHidden ? "opacity-0" : ""}`}>{copy.footer}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {keepHint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed left-0 right-0 top-[calc(18px+var(--safe-top))] z-50 text-center font-hand text-lg text-blush/70"
          >
            {copy.keepHint}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
