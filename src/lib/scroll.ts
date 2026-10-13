"use client";

import type Lenis from "lenis";

let lenis: Lenis | null = null;
let locked = false;
let navigatingUntil = 0;

/** true while a programmatic jump (chapter nav) is in flight */
export function isNavigating() {
  return performance.now() < navigatingUntil;
}

export function setLenis(instance: Lenis | null) {
  lenis = instance;
  if (lenis && locked) lenis.stop();
}

export function getLenis() {
  return lenis;
}

/** Lock / unlock page scrolling (works with or without Lenis). */
export function lockScroll(lock: boolean) {
  locked = lock;
  if (typeof document === "undefined") return;
  window.dispatchEvent(new CustomEvent("scroll-lock", { detail: lock }));
  document.body.classList.toggle("is-locked", lock);
  if (lenis) {
    if (lock) lenis.stop();
    else lenis.start();
  }
}

export function isScrollLocked() {
  return locked;
}

export function scrollToY(y: number, opts: { immediate?: boolean; duration?: number } = {}) {
  navigatingUntil = performance.now() + (opts.immediate ? 300 : (opts.duration ?? 1.8) * 1000 + 400);
  if (lenis) {
    lenis.scrollTo(y, { immediate: opts.immediate, duration: opts.duration ?? 1.8, force: true });
  } else {
    window.scrollTo({ top: y, behavior: opts.immediate ? "auto" : "smooth" });
  }
}

export function scrollToElement(el: HTMLElement, opts: { immediate?: boolean; duration?: number; offset?: number } = {}) {
  const y = el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0);
  scrollToY(y, opts);
}
