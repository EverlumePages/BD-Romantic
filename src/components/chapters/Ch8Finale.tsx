"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import { world, queueFirework, type FireworkKind } from "@/lib/world";
import { stopBloom } from "@/lib/bloom";
import { music } from "@/lib/audio/engine";
import { splitChars, splitWords, revealWords } from "@/lib/text";
import { finale as copy, type FlowerKind } from "@/content/copy";
import { BouquetArt } from "./garden/Bouquet";
import StrayPixel from "../ui/StrayPixel";

const DEFAULT_BOUQUET: FlowerKind[] = ["rose", "peony", "sakura", "tulip", "cosmos"];
const KINDS: FireworkKind[] = ["burst", "flower", "glitter", "heart", "ring"];

function PixelCake() {
  // drawn on a 26×20 pixel grid
  const px: [number, number, number, number, string][] = [];
  const rect = (x: number, y: number, w: number, h: number, c: string) => px.push([x, y, w, h, c]);
  rect(1, 19, 24, 1, "#ffd1e8"); // plate
  rect(2, 13, 22, 6, "#ff8dc7"); // bottom tier
  rect(2, 13, 22, 1, "#fff0f7");
  [3, 6, 9, 13, 17, 21].forEach((x, i) => rect(x, 14, 1, 1 + (i % 2), "#fff0f7"));
  rect(5, 8, 16, 5, "#ff2d96"); // middle tier
  rect(5, 8, 16, 1, "#fff0f7");
  [6, 9, 12, 15, 19].forEach((x, i) => rect(x, 9, 1, 1 + ((i + 1) % 2), "#fff0f7"));
  rect(8, 4, 10, 4, "#ffd1e8"); // top tier
  rect(8, 4, 10, 1, "#fff9fc");
  rect(12, 0, 2, 4, "#fff9fc"); // candle
  rect(12, 1, 2, 1, "#ff1493");
  rect(12, 3, 2, 1, "#ff1493");
  // sprinkles
  [[4, 16, "#fff9fc"], [8, 17, "#ffcf8a"], [12, 15, "#fff9fc"], [16, 17, "#8c1456"], [20, 16, "#ffcf8a"], [7, 11, "#ffcf8a"], [11, 10, "#fff9fc"], [17, 11, "#8c1456"], [10, 6, "#ff2d96"], [15, 6, "#ff1493"]].forEach(
    ([x, y, c]) => rect(x as number, y as number, 1, 1, c as string)
  );
  return (
    <svg viewBox="0 0 26 20" className="h-full w-full" shapeRendering="crispEdges" aria-hidden>
      {px.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
    </svg>
  );
}

/**
 * Chapter 8 — her day. A spark rises and bursts into a heart, the sky fills
 * with pink fireworks, the flower returns with her bouquet, and then one
 * small candle waits for a wish.
 */
export default function Ch8Finale() {
  const root = useRef<HTMLElement>(null);
  const bouquet = useStore((s) => s.bouquet);
  const candleOut = useStore((s) => s.candleOut);
  const reduced = useStore((s) => s.reducedMotion);
  const [smoke, setSmoke] = useState(false);
  const lastTap = useRef(0);
  const kinds = bouquet.length ? bouquet : DEFAULT_BOUQUET;

  useGSAP(
    () => {
      const el = root.current!;
      const stage = el.querySelector<HTMLElement>(".f-stage")!;
      const greetChars = splitChars(el.querySelector(".f-greet")!);
      const ambient: gsap.core.Tween[] = [];
      let played = false;

      const ensureFlower = () => {
        const s = useStore.getState();
        if (s.heartPhase !== "bloomed") {
          stopBloom();
          world.heart.assemble = 1;
          world.heart.charge = 0;
          gsap.to(world.heart, { progress: 1, duration: 0.01 });
          s.setHeartPhase("bloomed");
        }
      };

      const play = () => {
        if (played) return;
        played = true;
        ensureFlower();
        const tl = gsap.timeline();
        tl.call(() => queueFirework({ x: 0, y: 0.5, kind: "heart", hue: 0 }), undefined, 0.2);
        tl.call(() => music.sfx("pop"), undefined, 1.0);
        gsap.set(".f-greet", { autoAlpha: 1 });
        tl.fromTo(
          greetChars,
          {
            opacity: 0,
            x: () => gsap.utils.random(-160, 160),
            y: () => gsap.utils.random(-120, 120),
            rotation: () => gsap.utils.random(-90, 90),
            filter: "blur(10px)",
          },
          { opacity: 1, x: 0, y: 0, rotation: 0, filter: "blur(0px)", duration: 1.6, ease: "expo.out", stagger: { each: 0.035, from: "random" } },
          1.1
        );
        tl.fromTo(".f-heart", { scale: 0 }, { scale: 1, duration: 0.8, ease: "back.out(3)" }, ">-0.4");
        tl.fromTo(".f-bouquet", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.6, ease: "power3.out" }, 2.4);
        tl.fromTo(".f-tap", { opacity: 0 }, { opacity: 1, duration: 1 }, 4.2);
        const volley: [number, number, number, FireworkKind][] = [
          [2.0, -0.55, 0.5, "flower"],
          [2.6, 0.55, 0.55, "glitter"],
          [3.3, -0.2, 0.7, "burst"],
          [3.9, 0.35, 0.35, "heart"],
          [4.6, -0.6, 0.25, "ring"],
          [5.2, 0.62, 0.62, "flower"],
        ];
        volley.forEach(([t, x, y, kind], i) => {
          tl.call(() => queueFirework({ x, y, kind, hue: (i + 1) / 6 }), undefined, reduced ? t * 1.5 : t);
          tl.call(() => music.sfx("pop"), undefined, (reduced ? t * 1.5 : t) + 0.8);
        });
      };

      // the stage: flower in, fireworks, then quieter as she scrolls down
      ScrollTrigger.create({
        trigger: stage,
        start: "top 70%",
        end: "bottom top",
        onEnter: play,
        onEnterBack: play,
        onToggle: (self) => {
          ambient.forEach((t) => t.kill());
          ambient.length = 0;
          if (!self.isActive || reduced) return;
          const loop = () => {
            const t = gsap.delayedCall(gsap.utils.random(2.6, 4.4), () => {
              queueFirework({ x: gsap.utils.random(-0.7, 0.7), y: gsap.utils.random(0.25, 0.7), kind: KINDS[Math.floor(Math.random() * KINDS.length)] });
              setTimeout(() => music.sfx("pop"), 800);
              loop();
            });
            ambient.push(t as unknown as gsap.core.Tween);
          };
          loop();
        },
      });
      ScrollTrigger.create({
        trigger: stage,
        start: "top bottom",
        end: "top top",
        onUpdate: (self) => {
          world.heart.visible = self.progress;
          world.heart.lift = -0.42;
          world.heart.scale = 0.7;
          world.heart.cinematic = 0;
        },
        onEnter: ensureFlower,
      });
      ScrollTrigger.create({
        trigger: stage,
        start: "bottom 85%",
        end: "bottom 35%",
        onUpdate: (self) => {
          world.heart.visible = 1 - self.progress;
        },
      });

      // the wishes
      gsap.utils.toArray<HTMLElement>(".f-wish", el).forEach((w) => {
        const words = splitWords(w);
        gsap.set(w, { autoAlpha: 1 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: w, start: "top 82%" } });
        revealWords(tl, words, 0, { stagger: 0.05, duration: 1 });
      });
      gsap.fromTo(".f-cake-wrap", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.4, scrollTrigger: { trigger: ".f-cake-wrap", start: "top 78%" } });

      return () => ambient.forEach((t) => t.kill());
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true }
  );

  const tapSky = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const now = performance.now();
    if (now - lastTap.current < 260) return;
    lastTap.current = now;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -((e.clientY / window.innerHeight) * 2 - 1);
    queueFirework({ x, y, kind: KINDS[Math.floor(Math.random() * KINDS.length)] });
    setTimeout(() => music.sfx("pop"), 800);
  };

  const blow = () => {
    if (candleOut) return;
    useStore.getState().blowCandle();
    setSmoke(true);
    music.sfx("whoosh");
    useStore.getState().announce(copy.wished);
    [
      [0, -0.4, 0.55, "heart"],
      [350, 0.4, 0.6, "flower"],
      [700, 0, 0.7, "glitter"],
    ].forEach(([d, x, y, kind]) =>
      setTimeout(() => {
        queueFirework({ x: x as number, y: y as number, kind: kind as FireworkKind });
        setTimeout(() => music.sfx("pop"), 800);
      }, d as number)
    );
  };

  return (
    <section ref={root} id="finale" data-chapter={7} className="section" aria-label="Your day">
      <div className="f-stage relative h-[100svh] w-full cursor-crosshair select-none overflow-hidden" onPointerDown={tapSky}>
        <div className="pointer-events-none absolute inset-x-4 top-[calc(12%+var(--safe-top))] text-center">
          <p className="eyebrow text-blush/60">{copy.eyebrow}</p>
          <h2 className="f-greet invisible mt-3 leading-[0.95]">
            <span className="block font-serif text-[clamp(2.4rem,8.5vw,5.4rem)] font-light italic text-pale glow-text-soft">
              {copy.greeting.split(",")[0]},
            </span>
            <span className="mt-1 inline-block font-hand text-[clamp(3.6rem,15vw,8rem)] text-hot glow-text">
              {copy.greeting.split(",")[1]?.trim()}
              <span className="f-heart ml-3 inline-block text-[0.6em] text-candy" aria-hidden>
                ♡
              </span>
            </span>
          </h2>
        </div>
        <div className="f-bouquet pointer-events-none absolute bottom-[calc(2%+var(--safe-bottom))] left-1/2 -translate-x-1/2 opacity-0">
          <BouquetArt kinds={kinds} tied className="h-[min(24svh,250px)] w-auto overflow-visible md:h-[min(30svh,260px)]" />
        </div>
        <p className="f-tap pointer-events-none absolute left-0 right-0 top-[calc(12%+var(--safe-top))] -mt-7 text-center font-hand text-lg text-blush/60 opacity-0 md:bottom-[calc(4%+var(--safe-bottom))] md:left-auto md:right-[calc(5%+var(--safe-right))] md:top-auto md:mt-0 md:text-xl">
          {copy.tapSky}
        </p>
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-[7svh] px-7 py-[14svh] text-center">
        {copy.wishes.map((w, i) => (
          <p
            key={i}
            className={`f-wish invisible font-serif italic leading-snug ${
              i < 2 ? "text-[clamp(1.5rem,5vw,2.6rem)] text-pale" : "text-[clamp(1.25rem,4vw,2rem)] text-blush"
            } ${i === 1 ? "-mt-[5svh] text-candy glow-text-soft" : ""}`}
          >
            {w}
          </p>
        ))}
      </div>

      <div className="f-cake-wrap relative flex min-h-[90svh] flex-col items-center justify-center gap-4 px-6 pb-[10svh] text-center opacity-0">
        <p className="font-serif text-[clamp(1.2rem,4vw,1.8rem)] italic text-blush/80">{copy.wishPrompt}</p>
        <p className="font-hand text-[clamp(1.6rem,5vw,2.4rem)] text-candy">{candleOut ? copy.wished : copy.wishAction}</p>
        <div className="relative mt-6 h-[min(46vw,230px)] w-[min(60vw,300px)]">
          {/* glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-[-18%] h-40 w-40 -translate-x-1/2 rounded-full transition-opacity duration-1000"
            style={{ background: "radial-gradient(circle, rgba(255,200,150,0.45), rgba(255,20,147,0.12) 50%, transparent 70%)", opacity: candleOut ? 0 : 1 }}
            aria-hidden
          />
          <button
            type="button"
            onClick={blow}
            disabled={candleOut}
            aria-label={copy.wishAria}
            className="absolute left-1/2 top-[-17%] z-10 grid h-16 w-12 -translate-x-1/2 place-items-end justify-center"
          >
            <span
              className="block h-9 w-5 origin-bottom rounded-[50%_50%_45%_45%/60%_60%_40%_40%] transition-all duration-500"
              style={{
                background: "radial-gradient(circle at 50% 75%, #fff9fc 0 22%, #ffd08a 40%, #ff6fb6 72%, transparent 76%)",
                boxShadow: "0 0 18px 6px rgba(255,170,120,0.55), 0 0 40px 12px rgba(255,20,147,0.35)",
                animation: candleOut ? "none" : "flicker 0.9s ease-in-out infinite",
                transform: candleOut ? "scale(0)" : "scale(1)",
                opacity: candleOut ? 0 : 1,
              }}
            />
          </button>
          <AnimatePresence>
            {smoke && (
              <motion.svg
                viewBox="0 0 40 80"
                className="pointer-events-none absolute left-1/2 top-[-60%] h-28 w-14 -translate-x-1/2"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0, y: -30 }}
                transition={{ duration: 3.2, ease: "easeOut" }}
                aria-hidden
              >
                <motion.path
                  d="M20 78 C10 64 30 56 20 42 C10 28 30 20 20 4"
                  stroke="rgba(255,209,232,0.7)"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
          <PixelCake />
        </div>
        <StrayPixel className="left-[8%] top-[20%]" />
      </div>
    </section>
  );
}
