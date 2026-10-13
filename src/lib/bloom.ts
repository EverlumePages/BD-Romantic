"use client";

import { gsap } from "./gsap";
import { world, requestPetalBurst } from "./world";
import { music } from "./audio/engine";
import { useStore } from "./store";

let active: gsap.core.Timeline | null = null;

type Cues = (tl: gsap.core.Timeline, duration: number) => void;

/**
 * The signature transformation as one timeline: the heartbeat crescendo,
 * then `world.heart.progress` 0 → 1 which drives every phase in the shaders
 * (lift → spiral → gather → unfold → sparkle).
 */
export function playBloom(opts: { reduced: boolean; cues?: Cues; onComplete?: () => void }) {
  active?.kill();
  useStore.getState().setHeartPhase("blooming");
  world.heart.calm = opts.reduced ? 1 : 0;
  const dur = opts.reduced ? 4 : 8.8;
  const tl = gsap.timeline({
    onComplete: () => {
      useStore.getState().setHeartPhase("bloomed");
      requestPetalBurst();
      gsap.to(world.heart, { cinematic: 0.25, duration: 2.4, ease: "power2.inOut" });
      opts.onComplete?.();
    },
  });
  tl.to(world.heart, { cinematic: opts.reduced ? 0 : 1, duration: 1.4, ease: "power2.inOut" }, 0);
  tl.to(world.heart, { charge: 1, duration: opts.reduced ? 0.3 : 1.1, ease: "power2.in" }, 0);
  tl.addLabel("transform", ">-0.15");
  tl.to(world.heart, { progress: 1, duration: dur, ease: "power1.inOut" }, "transform");
  tl.to(world.heart, { charge: 0, duration: 1.6, ease: "power2.out" }, "transform+=0.6");
  tl.call(() => music.sfx("sparkle"), undefined, "transform+=0.3");
  tl.call(() => music.sfx("bloom"), undefined, `transform+=${dur * 0.62}`);
  opts.cues?.(tl, dur);
  active = tl;
  return tl;
}

/** Fold the flower back into the heart, then bloom it again. */
export function replayBloom(reduced: boolean) {
  active?.kill();
  const tl = gsap.timeline();
  world.heart.assemble = 1;
  tl.to(world.heart, { cinematic: reduced ? 0 : 0.6, duration: 1, ease: "power2.inOut" }, 0);
  tl.to(world.heart, { progress: 0, duration: reduced ? 1.6 : 3.4, ease: "power2.inOut" }, 0);
  tl.to({}, { duration: 0.8 });
  tl.call(() => {
    playBloom({ reduced });
  });
  active = tl;
}

export function stopBloom() {
  active?.kill();
  active = null;
}
