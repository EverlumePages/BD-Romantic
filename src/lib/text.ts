"use client";

import { gsap, SplitText } from "./gsap";

/** Split into words (kept accessible: the parent gets an aria-label). */
export function splitWords(el: Element) {
  return SplitText.create(el, { type: "words", wordsClass: "split-word" }).words as HTMLElement[];
}

export function splitChars(el: Element) {
  return SplitText.create(el, { type: "words,chars", wordsClass: "split-word", charsClass: "split-char" })
    .chars as HTMLElement[];
}

export const WORD_HIDDEN = { opacity: 0, yPercent: 55, filter: "blur(10px)" };
export const WORD_SHOWN = { opacity: 1, yPercent: 0, filter: "blur(0px)" };

/** Add a soft word-by-word reveal to a timeline. */
export function revealWords(
  tl: gsap.core.Timeline,
  words: Element[],
  position: gsap.Position = ">",
  opts: { stagger?: number; duration?: number; ease?: string } = {}
) {
  tl.fromTo(
    words,
    WORD_HIDDEN,
    { ...WORD_SHOWN, stagger: opts.stagger ?? 0.06, duration: opts.duration ?? 0.9, ease: opts.ease ?? "power3.out" },
    position
  );
  return tl;
}

/** Fade words away upward into a blur. */
export function dissolveWords(
  tl: gsap.core.Timeline,
  words: Element[],
  position: gsap.Position = ">",
  opts: { stagger?: number; duration?: number } = {}
) {
  tl.to(
    words,
    { opacity: 0, yPercent: -40, filter: "blur(8px)", stagger: opts.stagger ?? 0.03, duration: opts.duration ?? 0.6, ease: "power2.in" },
    position
  );
  return tl;
}

/** Handwritten "ink" reveal for elements with the .ink class. */
export function inkIn(tl: gsap.core.Timeline, el: gsap.TweenTarget, position: gsap.Position = ">", duration = 1.4) {
  tl.fromTo(el, { "--ink": "0%" }, { "--ink": "115%", duration, ease: "power1.inOut", stagger: 0.25 }, position);
  return tl;
}
