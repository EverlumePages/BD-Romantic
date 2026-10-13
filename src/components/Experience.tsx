"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { useStore } from "@/lib/store";
import { detectEnvironment } from "@/lib/quality";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { lockScroll, setLenis } from "@/lib/scroll";
import { world } from "@/lib/world";
import { music } from "@/lib/audio/engine";
import CursorTrail from "./ui/CursorTrail";
import ChapterStem from "./ui/ChapterStem";
import MusicToggle from "./ui/MusicToggle";
import ScrollHint from "./ui/ScrollHint";
import DuoEgg from "./ui/DuoEgg";
import Ch1Invitation from "./chapters/Ch1Invitation";
import Ch2World from "./chapters/Ch2World";
import Ch3Spark from "./chapters/Ch3Spark";
import Ch4LittleThings from "./chapters/Ch4LittleThings";
import Ch5Duo from "./chapters/Ch5Duo";
import Ch6Garden from "./chapters/Ch6Garden";
import Ch7Confession from "./chapters/Ch7Confession";
import Ch8Finale from "./chapters/Ch8Finale";
import Ch9Surprise from "./chapters/Ch9Surprise";

const WorldCanvas = dynamic(() => import("./world/WorldCanvas"), { ssr: false });
const Fallback2D = dynamic(() => import("./fallback/Fallback2D"), { ssr: false });

/** Detect device capability once, on the client. */
function useEnvironment() {
  const setEnv = useStore((s) => s.setEnv);
  useEffect(() => {
    const env = detectEnvironment();
    document.documentElement.classList.toggle("reduced-motion", env.reducedMotion);
    setEnv(env);
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __world: world, __store: useStore, __ST: ScrollTrigger });
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, [setEnv]);
}

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
function useSmoothScroll() {
  const ready = useStore((s) => s.ready);
  const reduced = useStore((s) => s.reducedMotion);
  useEffect(() => {
    if (!ready || reduced) return;
    const lenis = new Lenis({ autoRaf: false, duration: 1.15, smoothWheel: true, syncTouch: false });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, [ready, reduced]);
}

/** Global pointer → world (for parallax and shy particles). */
function usePointer() {
  useEffect(() => {
    let idle: ReturnType<typeof setTimeout>;
    const move = (e: PointerEvent) => {
      world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      world.pointer.active = 1;
      clearTimeout(idle);
      idle = setTimeout(() => (world.pointer.active = 0), e.pointerType === "touch" ? 300 : 2500);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", move, { passive: true });
    return () => {
      clearTimeout(idle);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", move);
    };
  }, []);
}

/**
 * Continuous mood index from the real layout: each chapter blends in as its
 * section rises through the viewport. Reading rects (instead of pre-computed
 * trigger positions) keeps this correct around pinned sections.
 */
function useScrollMood() {
  const setChapter = useStore((s) => s.setChapter);
  useEffect(() => {
    let sections: HTMLElement[] = [];
    const collect = () => {
      sections = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]")).sort(
        (a, b) => Number(a.dataset.chapter) - Number(b.dataset.chapter)
      );
    };
    collect();
    const observer = new MutationObserver(collect);
    const main = document.getElementById("story");
    if (main) observer.observe(main, { childList: true, subtree: false });
    let lastChapter = -1;
    const tick = () => {
      if (!sections.length || !sections[0].isConnected) collect();
      const vh = window.innerHeight;
      let mood = 1;
      let active = 1;
      for (let k = 1; k < sections.length; k++) {
        const top = sections[k].getBoundingClientRect().top;
        mood += Math.min(1, Math.max(0, (vh * 0.85 - top) / (vh * 0.7)));
        if (top <= vh * 0.5) active = Number(sections[k].dataset.chapter);
      }
      world.scrollMood = mood;
      const state = useStore.getState();
      const chapter = state.started ? active : 0;
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        setChapter(chapter);
        music.setChapter(chapter);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      observer.disconnect();
    };
  }, [setChapter]);
}

function useScrollLockWhileGated() {
  const started = useStore((s) => s.started);
  useEffect(() => {
    if (!started) lockScroll(true);
  }, [started]);
}

export default function Experience() {
  useEnvironment();
  useSmoothScroll();
  usePointer();
  useScrollMood();
  useScrollLockWhileGated();

  const ready = useStore((s) => s.ready);
  const tier = useStore((s) => s.tier);
  const runId = useStore((s) => s.runId);
  const announcement = useStore((s) => s.announcement);

  return (
    <>
      {ready && (tier === "none" ? <Fallback2D /> : <WorldCanvas />)}
      <CursorTrail />
      {/* chapters mount once the device profile is known, so every pin is built once, in order */}
      <main id="story" key={runId} className="relative z-10">
        {ready && (
          <>
        <Ch2World />
        <Ch3Spark />
        <Ch4LittleThings />
        <Ch5Duo />
        <Ch6Garden />
        <Ch7Confession />
        <Ch8Finale />
        <Ch9Surprise />
          </>
        )}
      </main>
      <Ch1Invitation key={`gate-${runId}`} />
      <ChapterStem />
      <MusicToggle />
      <ScrollHint />
      <DuoEgg />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </>
  );
}
