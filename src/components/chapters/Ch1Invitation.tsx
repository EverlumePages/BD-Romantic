"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { lockScroll, scrollToY } from "@/lib/scroll";
import { world, requestPetalBurst } from "@/lib/world";
import { music } from "@/lib/audio/engine";
import { splitWords, revealWords, dissolveWords } from "@/lib/text";
import { invitation } from "@/content/copy";
import Magnetic from "../ui/Magnetic";

/**
 * Chapter 1 — the invitation. A single breathing spark in the dark, three
 * soft lines, and a question. Saying yes blooms the spark open into the world.
 */
export default function Ch1Invitation() {
  const root = useRef<HTMLDivElement>(null);
  const intro = useRef<gsap.core.Timeline | null>(null);
  const [phase, setPhase] = useState<"intro" | "ask" | "leaving" | "gone">("intro");
  const [noStep, setNoStep] = useState(0);
  const [withMusic, setWithMusic] = useState(false);
  const start = useStore((s) => s.start);
  const reduced = useStore((s) => s.reducedMotion);
  const ready = useStore((s) => s.ready);

  // make sure we're at the top and the world is dark while the gate is up
  useEffect(() => {
    lockScroll(true);
    scrollToY(0, { immediate: true });
    world.gate = 0;
    world.heart.visible = 0;
  }, []);

  useGSAP(
    () => {
      if (!ready) return;
      const lines = gsap.utils.toArray<HTMLElement>(".gate-line");
      const tl = gsap.timeline({ delay: 0.6, onComplete: () => setPhase((p) => (p === "intro" ? "ask" : p)) });
      intro.current = tl;
      gsap.set(".gate-lines", { autoAlpha: 1 });
      tl.fromTo(".gate-spark", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.8, ease: "expo.out" });
      lines.forEach((line, i) => {
        const words = splitWords(line);
        gsap.set(line, { autoAlpha: 1 });
        revealWords(tl, words, i === 0 ? "-=0.6" : ">-0.1", { stagger: 0.09, duration: 1.1 });
        tl.to({}, { duration: reduced ? 0.6 : i === 1 ? 1.3 : 1.1 });
        dissolveWords(tl, words, ">", { stagger: 0.025, duration: 0.7 });
      });
    },
    { scope: root, dependencies: [ready] }
  );

  // the question + buttons
  useGSAP(
    () => {
      if (phase !== "ask") return;
      const words = splitWords(root.current!.querySelector(".gate-ready")!);
      const tl = gsap.timeline();
      gsap.set(".gate-ask", { autoAlpha: 1 });
      revealWords(tl, words, 0, { stagger: 0.1, duration: 1.2 });
      tl.fromTo(".gate-btn-wrap", { opacity: 0, y: 18 }, { opacity: 1, y: 0, stagger: 0.12, duration: 1, ease: "power3.out" }, "-=0.6");
      tl.fromTo(".gate-extra", { opacity: 0 }, { opacity: 1, duration: 1.2 }, "-=0.5");
    },
    { scope: root, dependencies: [phase] }
  );

  // debug / replay shortcut: ?start=1 skips straight past the invitation
  useEffect(() => {
    if (!ready) return;
    if (new URLSearchParams(window.location.search).get("start") === "1") {
      const t = setTimeout(() => begin(), 300);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const skipIntro = () => {
    if (phase === "intro" && intro.current) intro.current.progress(1);
  };

  const begin = () => {
    if (phase === "leaving" || phase === "gone") return;
    intro.current?.kill();
    if (withMusic) {
      music.setEnabled(true);
      useStore.getState().setMusic(true);
    }
    music.sfx("bloom");
    setPhase("leaving");
    start();
    requestPetalBurst();
    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("gone");
        lockScroll(false);
        ScrollTrigger.refresh();
      },
    });
    tl.to(".gate-ui", { opacity: 0, y: -12, duration: 0.6, ease: "power2.in" });
    tl.to(".gate-spark", { scale: reduced ? 3 : 46, duration: reduced ? 0.8 : 1.6, ease: "expo.in" }, 0.1);
    tl.to(".gate-flash", { opacity: 1, duration: 0.5, ease: "power2.in" }, reduced ? 0.4 : 1.15);
    tl.set(".gate-spark", { opacity: 0 });
    tl.to(world, { gate: 1, duration: 2.6, ease: "power2.inOut" }, reduced ? 0.6 : 1.3);
    tl.to(root.current, { backgroundColor: "rgba(18,4,14,0)", duration: 0.01 }, reduced ? 0.6 : 1.4);
    tl.to(".gate-flash", { opacity: 0, duration: 1.6, ease: "power2.out" }, reduced ? 0.8 : 1.65);
  };

  const noLabel = invitation.noSteps[Math.min(noStep, invitation.noSteps.length - 1)];
  const noIsYes = noStep >= invitation.noSteps.length - 1;
  const onNo = () => {
    if (noIsYes) return begin();
    music.sfx("chime");
    setNoStep((s) => s + 1);
  };

  if (phase === "gone") return null;

  return (
    <div
      ref={root}
      onPointerDown={skipIntro}
      className="fixed inset-0 z-50 overflow-hidden bg-night/40"
      role="dialog"
      aria-modal="true"
      aria-label="A little invitation"
    >
      {/* the spark */}
      <div className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
        <div className="gate-spark relative h-5 w-5 opacity-0">
          <span
            className="absolute inset-[-34px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,45,150,0.55), rgba(255,20,147,0.12) 45%, transparent 70%)", animation: "breathe 3.2s ease-in-out infinite" }}
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, #fff9fc 0%, #ffd1e8 35%, #ff1493 70%, transparent 72%)", boxShadow: "0 0 24px 6px rgba(255,20,147,0.8)" }}
          />
        </div>
      </div>

      <div className="gate-ui absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {/* the three lines, one after another */}
        <div className="gate-lines invisible absolute inset-x-0 top-[49%] mx-auto h-32 w-full max-w-xl px-6">
          <p className="gate-line invisible absolute inset-x-6 top-0 font-hand text-5xl text-candy glow-text sm:text-6xl">{invitation.lines[0]}</p>
          <p className="gate-line invisible absolute inset-x-6 top-1 font-serif text-3xl italic text-pale sm:text-4xl">{invitation.lines[1]}</p>
          <p className="gate-line invisible absolute inset-x-6 top-1 font-serif text-3xl italic text-blush sm:text-4xl">{invitation.lines[2]}</p>
        </div>

        {/* the question */}
        <div className={`gate-ask invisible absolute inset-x-0 top-[49%] flex flex-col items-center gap-7 px-6 ${phase === "intro" ? "pointer-events-none" : ""}`}>
          <h1 className="gate-ready font-serif text-5xl font-light italic text-pale glow-text-soft sm:text-6xl">{invitation.ready}</h1>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Magnetic className="gate-btn-wrap opacity-0">
              <button
                type="button"
                onClick={begin}
                className="btn-glow px-9 py-4 font-sans text-sm font-semibold uppercase tracking-[0.2em] transition-transform duration-500"
                style={{ transform: `scale(${1 + noStep * 0.07})` }}
              >
                {invitation.yes} <span aria-hidden>♡</span>
              </button>
            </Magnetic>
            <span className="gate-btn-wrap inline-block opacity-0">
            <button
              type="button"
              onClick={onNo}
              className="btn-ghost px-5 py-3 font-hand text-xl transition-transform duration-500"
              style={{ transform: noIsYes ? "scale(1)" : `scale(${Math.max(0.62, 1 - noStep * 0.1)})` }}
            >
              {noLabel}
            </button>
            </span>
          </div>
          <label className="gate-extra flex cursor-pointer items-center gap-3 font-hand text-xl text-blush/80 opacity-0">
            <span className="relative inline-flex h-6 w-11 items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={withMusic}
                onChange={(e) => setWithMusic(e.target.checked)}
              />
              <span className="absolute inset-0 rounded-full border border-blush/30 bg-pale/5 transition-colors peer-checked:bg-hot/70 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-candy" />
              <span className="absolute left-1 h-4 w-4 rounded-full bg-blush shadow transition-transform duration-300 peer-checked:translate-x-5" />
            </span>
            {invitation.musicLabel}
          </label>
        </div>
      </div>

      <div className="gate-flash pointer-events-none absolute inset-0 opacity-0" style={{ background: "radial-gradient(circle at 50% 40%, #fff0f7, #ff8dc7 35%, #ff1493 70%, #8c1456)" }} />
      {!ready && <p className="absolute bottom-10 left-0 right-0 text-center font-hand text-lg text-blush/40">{invitation.loading}</p>}
    </div>
  );
}
