"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { music } from "@/lib/audio/engine";
import { splitWords } from "@/lib/text";
import { confession } from "@/content/copy";
import Letter, { PixelHeartMark } from "./letter/Letter";
import StrayPixel from "../ui/StrayPixel";

/**
 * Chapter 7 — something honest. Almost nothing on screen: one soft light
 * and a few sentences that arrive slowly, one at a time. Then a letter.
 */
export default function Ch7Confession() {
  const root = useRef<HTMLElement>(null);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const reduced = useStore((s) => s.reducedMotion);

  useGSAP(
    () => {
      const el = root.current!;
      const lines = gsap.utils.toArray<HTMLElement>(".c-line", el);
      const words = lines.map((l) => splitWords(l));
      gsap.set(lines, { autoAlpha: 1 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el.querySelector(".c-stage"),
          start: "top top",
          end: "+=520%",
          pin: true,
          scrub: reduced ? true : 1.2,
        },
      });
      tl.fromTo(".c-orb", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, 0);
      words.forEach((w, i) => {
        const last = i === words.length - 1;
        tl.fromTo(
          w,
          { opacity: 0, y: 18, filter: "blur(12px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.12, duration: 0.9, ease: "power2.out" },
          i === 0 ? 0.4 : ">"
        );
        tl.to({}, { duration: last ? 1.4 : 0.9 });
        if (!last) tl.to(w, { opacity: 0, y: -14, filter: "blur(10px)", stagger: 0.03, duration: 0.7, ease: "power1.in" }, ">");
      });
      tl.to(".c-orb", { scale: 1.25, duration: 1.5 }, "<");

      gsap.fromTo(
        ".c-env-wrap",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ".c-env-wrap", start: "top 75%" } }
      );
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true }
  );

  const openEnvelope = () => {
    if (envelopeOpen) {
      setLetterOpen(true);
      return;
    }
    setEnvelopeOpen(true);
    music.sfx("chime");
    setTimeout(() => setLetterOpen(true), reduced ? 200 : 1300);
  };

  return (
    <section ref={root} id="confession" data-chapter={6} className="section" aria-label="Something honest">
      <div className="c-stage pin-stage">
        <div
          className="c-orb pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          style={{ background: "radial-gradient(circle, rgba(255,90,168,0.16), rgba(255,20,147,0.05) 45%, transparent 70%)", animation: "breathe 7s ease-in-out infinite" }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center px-7">
          <div className="relative w-full max-w-3xl">
            {confession.lines.map((l, i) => (
              <p
                key={i}
                className={`c-line invisible absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-serif font-light italic leading-snug ${
                  i === confession.lines.length - 1 ? "text-candy glow-text" : "text-pale"
                } ${l.length > 70 ? "text-[clamp(1.35rem,4.2vw,2.3rem)]" : "text-[clamp(1.7rem,5.6vw,3.2rem)]"}`}
              >
                {l}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* the envelope */}
      <div className="c-env-wrap relative flex min-h-[100svh] flex-col items-center justify-center gap-8 px-6 opacity-0">
        <p className="font-serif text-[clamp(1.6rem,5vw,2.6rem)] italic text-pale">{confession.letterPrompt}</p>
        <button
          type="button"
          onClick={openEnvelope}
          aria-label={confession.letterAria}
          className="group relative h-[min(46vw,210px)] w-[min(70vw,320px)] transition-transform duration-700 hover:-translate-y-1"
          style={{ perspective: "900px", animation: envelopeOpen || reduced ? "none" : "floaty 4s ease-in-out infinite" }}
        >
          {/* letter peeking out */}
          <span
            className="absolute inset-x-[8%] top-[6%] h-[80%] rounded-sm transition-transform duration-1000"
            style={{ background: "linear-gradient(#fffafd, #ffe4f1)", transform: envelopeOpen ? "translateY(-46%)" : "translateY(0)", transitionDelay: envelopeOpen ? "0.45s" : "0s" }}
            aria-hidden
          />
          {/* body */}
          <span className="absolute inset-0 rounded-md shadow-[0_24px_60px_-18px_rgba(255,20,147,0.6)]" style={{ background: "linear-gradient(160deg, #ffd1e8, #ff8dc7)" }} aria-hidden />
          <span
            className="absolute inset-0 rounded-md"
            style={{ background: "linear-gradient(to top right, #ffb3d9 50%, transparent 50%) left / 50% 100% no-repeat, linear-gradient(to top left, #ffb3d9 50%, transparent 50%) right / 50% 100% no-repeat" }}
            aria-hidden
          />
          {/* flap */}
          <span
            className="absolute inset-x-0 top-0 h-[58%] origin-top transition-transform duration-700"
            style={{
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: "linear-gradient(180deg, #ff9cc9, #ff6fb6)",
              transform: envelopeOpen ? "rotateX(180deg)" : "rotateX(0deg)",
              zIndex: envelopeOpen ? 0 : 2,
            }}
            aria-hidden
          />
          {/* wax seal */}
          <span
            className="absolute left-1/2 top-[52%] z-[3] grid h-14 w-14 place-items-center rounded-full transition-all duration-500"
            style={{
              background: "radial-gradient(circle at 35% 30%, #ff4fa7, #c2185b 70%)",
              boxShadow: "0 3px 10px rgba(140,20,86,0.5), inset 0 -3px 6px rgba(0,0,0,0.2)",
              opacity: envelopeOpen ? 0 : 1,
              transform: `translate(-50%, -50%) scale(${envelopeOpen ? 1.6 : 1})`,
            }}
            aria-hidden
          >
            <PixelHeartMark size={24} color="#ffe4f1" />
          </span>
        </button>
        <p className="font-hand text-xl text-blush/60">{envelopeOpen ? "♡" : "tap to open"}</p>
        <StrayPixel className="bottom-[10%] right-[8%]" />
      </div>

      <AnimatePresence>{letterOpen && <Letter onClose={() => setLetterOpen(false)} reduced={reduced} />}</AnimatePresence>
    </section>
  );
}
