"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { world, requestPetalBurst } from "@/lib/world";
import { playBloom } from "@/lib/bloom";
import { lockScroll, isNavigating, getLenis } from "@/lib/scroll";
import { music } from "@/lib/audio/engine";
import { splitWords, revealWords, dissolveWords } from "@/lib/text";
import { spark } from "@/content/copy";

const RING = 2 * Math.PI * 48;

/**
 * Chapter 3 — the little spark. Dust gathers into a glowing pixel heart.
 * Holding it makes the heartbeat race until it breaks into light and
 * spirals into a flower. (The visuals live in the WebGL world; this is the
 * story, the timing and the interaction.)
 */
export default function Ch3Spark() {
  const root = useRef<HTMLElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const pressing = useRef(false);
  const charge = useRef(0);
  const lastTap = useRef(0);
  const reduced = useStore((s) => s.reducedMotion);
  const phase = useStore((s) => s.heartPhase);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const assembled = useRef(false);

  const bloom = (auto: boolean) => {
    if (phaseRef.current === "blooming" || phaseRef.current === "bloomed") return;
    phaseRef.current = "blooming";
    pressing.current = false;
    useStore.getState().announce("The heart is blooming into a flower.");
    const el = root.current!;
    playBloom({
      reduced,
      cues: (tl, dur) => {
        const w1 = splitWords(el.querySelector(".s-during-1")!);
        const w2 = splitWords(el.querySelector(".s-during-2")!);
        gsap.set([".s-during-1", ".s-during-2"].map((c) => el.querySelector(c)), { autoAlpha: 1 });
        tl.to(el.querySelectorAll(".s-intro, .s-hold"), { autoAlpha: 0, duration: 0.6 }, 0);
        revealWords(tl, w1, `transform+=${dur * 0.08}`, { stagger: 0.1, duration: 1 });
        revealWords(tl, w2, `transform+=${dur * 0.22}`, { stagger: 0.08, duration: 1 });
        dissolveWords(tl, [...w1, ...w2], `transform+=${dur * 0.66}`, { stagger: 0.02 });
        if (auto) tl.call(() => lockScroll(false), undefined, `transform+=${dur * 0.78}`);
      },
      onComplete: () => {
        if (auto) lockScroll(false);
        const words = splitWords(el.querySelector(".s-after")!);
        gsap.set(el.querySelector(".s-after"), { autoAlpha: 1 });
        const tl = gsap.timeline();
        revealWords(tl, words, 0, { stagger: 0.07, duration: 1.1 });
      },
    });
  };

  // hold-to-charge loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let beatAcc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (phaseRef.current === "idle" || phaseRef.current === "charging") {
        const c = charge.current;
        const grace = now - lastTap.current < 700;
        charge.current = pressing.current ? Math.min(1, c + dt / 1.6) : grace ? c : Math.max(0, c - dt / 2.4);
        world.heart.charge = charge.current;
        if (ring.current) ring.current.style.strokeDashoffset = String(RING * (1 - charge.current));
        if (pressing.current) {
          beatAcc += dt * ((60 + 85 * charge.current) / 60);
          if (beatAcc >= 1) {
            beatAcc = 0;
            navigator.vibrate?.(10 + Math.round(30 * charge.current));
          }
        }
        if (charge.current >= 1) bloom(false);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useGSAP(
    () => {
      const el = root.current!;
      const stage = el.querySelector<HTMLElement>(".s-stage")!;
      const introWords = splitWords(el.querySelector(".s-intro")!);
      let exitBurst = false;
      const builtAt = performance.now();

      // pinned scene: dust gathers, the line appears, the heart waits
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "+=210%",
          pin: true,
          scrub: reduced ? true : 0.8,
          onUpdate: (self) => {
            const p = self.progress;
            world.heart.assemble = Math.min(1, p / 0.32);
            const ready = p > 0.3;
            if (ready !== assembled.current) {
              assembled.current = ready;
              el.classList.toggle("heart-ready", ready);
            }
            if (
              p > 0.9 &&
              self.direction > 0 &&
              performance.now() - builtAt > 1500 &&
              useStore.getState().started &&
              !isNavigating() &&
              (phaseRef.current === "idle" || phaseRef.current === "charging")
            ) {
              // she scrolled on without holding — bloom anyway, and wait for it
              lockScroll(true);
              getLenis()?.scrollTo(self.start + (self.end - self.start) * 0.9, { immediate: true, force: true });
              bloom(true);
            }
          },
        },
      });
      gsap.set(el.querySelector(".s-intro"), { autoAlpha: 1 });
      revealWords(tl, introWords, 0.05, { stagger: 0.05, duration: 0.25 });
      tl.fromTo(".s-hold", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.3);
      tl.to({}, { duration: 0.7 });

      // fade the heart in as the chapter arrives…
      ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "top top",
        onUpdate: (self) => {
          world.heart.visible = self.progress;
          world.heart.lift = -0.08;
          world.heart.scale = 0.84;
        },
        onLeave: () => (world.heart.visible = 1),
      });
      // …and let the flower float up and away as it leaves
      ScrollTrigger.create({
        trigger: el,
        start: "bottom bottom",
        end: "bottom top",
        onUpdate: (self) => {
          // float fully out of frame before fading, so the fade never shows as dither
          const p = self.progress;
          world.heart.visible = 1 - Math.min(1, Math.max(0, (p - 0.7) / 0.3));
          world.heart.lift = -0.08 + p * p * 6;
          if (self.progress > 0.3 && !exitBurst && self.direction > 0) {
            exitBurst = true;
            requestPetalBurst();
          }
        },
        onLeaveBack: () => {
          world.heart.visible = 1;
          world.heart.lift = -0.08;
          exitBurst = false;
        },
      });
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true }
  );

  const press = (on: boolean) => {
    if (phaseRef.current === "blooming" || phaseRef.current === "bloomed") return;
    pressing.current = on;
    if (on) {
      useStore.getState().setHeartPhase("charging");
      music.sfx("chime");
    }
  };

  const showHold = phase === "idle" || phase === "charging";

  return (
    <section ref={root} id="spark" data-chapter={2} className="section" aria-label="The little spark">
      <div className="s-stage pin-stage">
        <p className="s-intro invisible absolute inset-x-6 top-[13%] text-center font-serif text-[clamp(1.4rem,4.8vw,2.3rem)] italic text-pale">
          {spark.intro}
        </p>

        {/* the heart itself is drawn in WebGL behind this invisible hit area */}
        {showHold && (
          <div className="s-hold invisible absolute left-1/2 top-[calc(50%-1svh)] -translate-x-1/2 -translate-y-1/2">
            <button
              type="button"
              aria-label={spark.holdAria}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
                press(true);
              }}
              onPointerUp={() => press(false)}
              onPointerCancel={() => press(false)}
              onLostPointerCapture={() => press(false)}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                  e.preventDefault();
                  press(true);
                }
              }}
              onKeyUp={(e) => {
                if (e.key === " " || e.key === "Enter") press(false);
              }}
              onClick={() => {
                // quick taps count too
                if (phaseRef.current === "blooming" || phaseRef.current === "bloomed") return;
                charge.current = Math.min(1, charge.current + 0.22);
                lastTap.current = performance.now();
              }}
              onContextMenu={(e) => e.preventDefault()}
              className="relative block h-[min(58vmin,340px)] w-[min(58vmin,340px)] rounded-full"
              style={{ touchAction: "pan-y", WebkitTouchCallout: "none" }}
            >
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,209,232,0.08)" strokeWidth="0.6" />
                <circle
                  ref={ring}
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="#ff8dc7"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  strokeDasharray={RING}
                  strokeDashoffset={RING}
                  style={{ filter: "drop-shadow(0 0 3px #ff1493)" }}
                />
              </svg>
            </button>
            <div className="pointer-events-none absolute left-1/2 top-full mt-4 w-max -translate-x-1/2 text-center">
              <p className="font-hand text-2xl text-candy glow-text-soft" style={{ animation: "floaty 3s ease-in-out infinite" }}>
                {spark.holdHint}
              </p>
              <p className="mt-1 font-sans text-[0.65rem] tracking-[0.25em] text-blush/40 uppercase">{spark.holdHintKeyboard}</p>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-6 bottom-[14%] text-center">
          <p className="s-during-1 invisible font-serif text-[clamp(1.5rem,5vw,2.6rem)] italic text-pale glow-text-soft">{spark.during[0]}</p>
          <p className="s-during-2 invisible font-serif text-[clamp(1.5rem,5vw,2.6rem)] italic text-candy glow-text">{spark.during[1]}</p>
        </div>
        <p
          className={`s-after absolute inset-x-6 bottom-[16%] text-center font-serif text-[clamp(1.5rem,5vw,2.6rem)] italic text-pale glow-text-soft ${
            phase === "bloomed" ? "" : "invisible"
          }`}
        >
          {spark.after}
        </p>
      </div>
    </section>
  );
}
