"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

let registered = false;

export function ensureGsap() {
  if (registered || typeof window === "undefined") return;
  registered = true;
  gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin, CustomEase, useGSAP);
  // a soft, petal-like opening
  CustomEase.create("bloom", "M0,0 C0.18,0 0.24,0.62 0.42,0.86 0.56,1.04 0.76,1 1,1");
  // slow in, long luxurious settle
  CustomEase.create("silk", "M0,0 C0.4,0 0.2,1 1,1");
  // heartbeat: quick swell, slow release
  CustomEase.create("beat", "M0,0 C0.1,0.9 0.25,1 0.4,0.78 0.6,0.5 0.8,0.2 1,0");
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: "power3.out", duration: 1 });
}

ensureGsap();

export { gsap, ScrollTrigger, SplitText, MotionPathPlugin, CustomEase, useGSAP };
