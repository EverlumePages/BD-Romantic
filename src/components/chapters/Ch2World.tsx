"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { requestPetalBurst } from "@/lib/world";
import { music } from "@/lib/audio/engine";
import { octoberGrid, BIRTH_DAY } from "@/lib/birthday";
import { splitChars, splitWords, revealWords, inkIn } from "@/lib/text";
import { world as copy, ui } from "@/content/copy";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * Chapter 2 — a world just for her. A tiny October calendar lights up day
 * by day until the 13th, the other days fall away like petals, and the 13
 * grows into the hero of the page.
 */
export default function Ch2World() {
  const root = useRef<HTMLElement>(null);
  const started = useStore((s) => s.started);
  const reduced = useStore((s) => s.reducedMotion);
  // chapters only mount on the client (after device detection), so this is hydration-safe
  const grid = useMemo(() => octoberGrid(new Date().getFullYear()), []);

  // entrance once the invitation opens
  useGSAP(
    () => {
      if (!started) return;
      const tl = gsap.timeline({ delay: reduced ? 0.3 : 1.6 });
      tl.fromTo(".w-eyebrow", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2 });
      tl.fromTo(
        ".cal-num",
        { opacity: 0, y: 14, scale: 0.6 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "back.out(2)", stagger: { each: 0.018, from: "center" } },
        "-=0.8"
      );
      tl.fromTo(".cal-head", { opacity: 0 }, { opacity: 1, duration: 0.8 }, "-=0.6");
      tl.fromTo(".w-cue", { opacity: 0 }, { opacity: 1, duration: 1 }, "-=0.2");
    },
    { scope: root, dependencies: [started] }
  );

  // the scroll-driven date reveal
  useGSAP(
    () => {
      const stage = root.current!.querySelector<HTMLElement>(".w-stage")!;
      const cells = gsap.utils.toArray<HTMLElement>(".cal-day");
      const upTo13 = cells.filter((c) => Number(c.dataset.day) <= BIRTH_DAY);
      const others = cells.filter((c) => Number(c.dataset.day) !== BIRTH_DAY);
      const cell13 = root.current!.querySelector<HTMLElement>(".cal-13")!;
      const cal = root.current!.querySelector<HTMLElement>(".cal")!;
      const monthChars = splitChars(root.current!.querySelector(".w-month")!);
      const lineWords = splitWords(root.current!.querySelector(".w-line")!);
      let burstDone = false;

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "+=240%",
          pin: true,
          scrub: reduced ? true : 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(".w-cue", { opacity: 0, duration: 0.4 }, 0);
      // 1 → 13, one day at a time
      tl.to(upTo13, { backgroundColor: "rgba(255,20,147,0.32)", color: "#fff9fc", stagger: 0.17, duration: 0.3 }, 0.1);
      tl.to(cell13, { scale: 1.3, backgroundColor: "#ff1493", boxShadow: "0 0 26px rgba(255,20,147,0.9)", duration: 0.4 }, ">-0.1");
      // the rest fall away like petals
      tl.to(
        others,
        {
          y: () => gsap.utils.random(140, 320),
          x: () => gsap.utils.random(-60, 60),
          rotation: () => gsap.utils.random(-120, 120),
          opacity: 0,
          duration: 1.1,
          ease: "power2.in",
          stagger: { each: 0.02, from: "random" },
        },
        ">"
      );
      tl.to(".cal-head", { opacity: 0, y: -10, duration: 0.5 }, "<");
      tl.to(".w-eyebrow", { opacity: 0, duration: 0.5 }, "<");
      // bring the 13 to the centre and let it become enormous
      tl.to(
        cal,
        {
          x: () => {
            const c = cell13.getBoundingClientRect();
            const r = cal.getBoundingClientRect();
            const centerInCal = c.left + c.width / 2 - (r.left + r.width / 2);
            return -centerInCal;
          },
          y: () => {
            const c = cell13.getBoundingClientRect();
            const r = cal.getBoundingClientRect();
            return -(c.top + c.height / 2 - (r.top + r.height / 2));
          },
          duration: 0.9,
        },
        "-=0.6"
      );
      tl.to(cell13, { scale: 5, opacity: 0, duration: 0.8, ease: "power2.in" }, ">-0.2");
      tl.fromTo(".big13", { scale: 0.35, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "power3.out" }, "<0.35");
      tl.fromTo(".big13-stroke", { strokeDashoffset: 1600 }, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, "<");
      tl.fromTo(".big13-fill", { opacity: 0 }, { opacity: 1, duration: 0.8 }, ">-0.4");
      tl.fromTo(
        monthChars,
        { opacity: 0, yPercent: 80, filter: "blur(8px)" },
        { opacity: 1, yPercent: 0, filter: "blur(0px)", stagger: 0.06, duration: 0.7, ease: "power3.out" },
        "<-0.2"
      );
      // a hand-drawn circle — someone marked the date
      tl.fromTo(".w-circle", { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1, ease: "power1.inOut" }, ">");
      inkIn(tl, ".w-note", "<0.5", 0.9);
      // the line
      tl.set(".w-line", { opacity: 1 }, ">");
      revealWords(tl, lineWords, ">", { stagger: 0.09, duration: 0.6 });
      tl.to({}, { duration: 0.4 });
      // make room for the greeting
      tl.to(".w-hero", { yPercent: -16, scale: 0.84, duration: 1 }, ">");
      tl.to(".w-line", { opacity: 0.0, y: -10, duration: 0.6 }, "<");
      tl.call(() => {
        if (burstDone) return;
        burstDone = true;
        requestPetalBurst();
        music.sfx("sparkle");
      }, undefined, "<0.4");
      inkIn(tl, gsap.utils.toArray(".w-greet"), "<", 1.2);
      tl.fromTo(".w-heart", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(3)" }, ">-0.2");
      tl.to({}, { duration: 0.8 });
    },
    { scope: root, dependencies: [grid.blanks, reduced], revertOnUpdate: true }
  );

  return (
    <section ref={root} id="world" data-chapter={1} className="section" aria-label="October 13">
      <div className="w-stage pin-stage">
        <p className="w-eyebrow eyebrow absolute left-0 right-0 top-[15%] text-center text-blush/70 opacity-0">{copy.eyebrow}</p>

        <div className="w-hero absolute inset-0 flex items-center justify-center">
          {/* calendar */}
          <div className="cal relative -mt-[6svh] w-[min(86vw,340px)]" aria-hidden>
            <div className="cal-head mb-3 grid grid-cols-7 text-center font-sans text-[0.62rem] tracking-[0.3em] text-blush/50 opacity-0">
              {WEEK.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1.5">
              {Array.from({ length: grid.blanks }).map((_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: grid.days }).map((_, i) => {
                const day = i + 1;
                const is13 = day === BIRTH_DAY;
                return (
                  <span
                    key={day}
                    data-day={day}
                    className={`cal-day ${is13 ? "cal-13 z-10 border border-candy/60 text-pale" : "text-blush/60"} mx-auto grid aspect-square w-[min(10vw,38px)] place-items-center rounded-full font-serif text-[0.95rem]`}
                  >
                    <span className="cal-num opacity-0">{day}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* the giant 13 */}
          <div className="big13 pointer-events-none absolute left-1/2 top-1/2 w-[min(84vw,560px)] -translate-x-1/2 -translate-y-[58%] opacity-0">
            <p className="w-month mb-[-4%] text-center font-serif text-[clamp(1.2rem,4.8vw,2.2rem)] font-light uppercase tracking-[0.55em] text-blush">
              {copy.month}
            </p>
            <svg viewBox="0 0 520 300" className="w-full overflow-visible" role="img" aria-label="13">
              <defs>
                <linearGradient id="g13" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffd1e8" />
                  <stop offset="0.45" stopColor="#ff2d96" />
                  <stop offset="1" stopColor="#ff1493" />
                </linearGradient>
                <radialGradient id="g13glow" cx="0.5" cy="0.55" r="0.5">
                  <stop offset="0" stopColor="#ff1493" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#ff1493" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx="260" cy="170" rx="250" ry="140" fill="url(#g13glow)" className="big13-fill" />
              <text
                className="big13-fill"
                x="260"
                y="255"
                textAnchor="middle"
                fontSize="300"
                fill="url(#g13)"
                style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontVariantNumeric: "lining-nums" }}
              >
                {copy.day}
              </text>
              <text
                className="big13-stroke"
                x="260"
                y="255"
                textAnchor="middle"
                fontSize="300"
                fill="none"
                stroke="#ffd1e8"
                strokeWidth="1.6"
                style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500, fontVariantNumeric: "lining-nums", strokeDasharray: 1600, strokeDashoffset: 1600 }}
              >
                {copy.day}
              </text>
              <path
                className="w-circle"
                d="M150 70 C 250 18, 430 40, 440 150 C 450 262, 140 290, 92 182 C 64 118, 140 70, 232 58"
                fill="none"
                stroke="#ff8dc7"
                strokeWidth="3.2"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="1"
              />
            </svg>
            <p className="w-note ink absolute -right-1 -top-3 rotate-[-8deg] font-hand text-[clamp(1.5rem,5.5vw,2.3rem)] text-candy sm:-right-6">
              {copy.note}
            </p>
          </div>
        </div>

        <p className="w-line pointer-events-none absolute inset-x-6 top-[72%] mx-auto max-w-xl text-center font-serif text-[clamp(1.35rem,4.6vw,2.2rem)] italic text-pale opacity-0">
          {copy.line}
        </p>

        <h2 className="pointer-events-none absolute inset-x-4 top-[62%] text-center">
          <span className="w-greet ink block font-serif text-[clamp(2.2rem,8vw,4.6rem)] font-light italic leading-tight text-pale glow-text-soft">
            {copy.greeting.split(",")[0]},
          </span>
          <span className="w-greet ink mt-1 inline-block font-hand text-[clamp(3rem,12vw,6.2rem)] leading-none text-hot glow-text">
            {copy.greeting.split(",")[1]?.trim()}
            <span className="w-heart ml-3 inline-block opacity-0">♡</span>
          </span>
        </h2>

        <div className="w-cue pointer-events-none absolute bottom-[calc(28px+var(--safe-bottom))] left-0 right-0 flex flex-col items-center gap-1 opacity-0" aria-hidden>
          <span className="eyebrow text-blush/60">{ui.scroll}</span>
          <svg viewBox="0 0 20 24" className="h-5 w-4" style={{ animation: "hint-fall 2.2s ease-in-out infinite" }}>
            <path d="M10 2 C15 7 15 15 10 22 C5 15 5 7 10 2Z" fill="#ff2d96" />
          </svg>
        </div>
      </div>
    </section>
  );
}
