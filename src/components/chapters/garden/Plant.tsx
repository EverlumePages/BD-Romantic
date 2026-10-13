"use client";

import { forwardRef, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { FlowerKind } from "@/content/copy";
import { Bud, FlowerHead, FLOWER_NAMES } from "./Flower";

export type PlantState = "bud" | "bloomed" | "picked";

type Props = {
  kind: FlowerKind;
  state: PlantState;
  onTap: () => void;
  stem: number; // relative stem height 0.6 … 1.2
  sway: number;
  reduced: boolean;
};

/** One swaying plant: tap the bud to bloom, tap the flower to pick it. */
export const Plant = forwardRef<HTMLButtonElement, Props>(function Plant({ kind, state, onTap, stem, sway, reduced }, ref) {
  const head = useRef<SVGGElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (state !== "bloomed" || !head.current) return;
      const petals = head.current.querySelectorAll(".petal");
      gsap.fromTo(
        petals,
        { scale: 0.1, rotation: -35, opacity: 0, transformOrigin: "50% 100%" },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: reduced ? 0.4 : 1.1,
          ease: "back.out(1.6)",
          stagger: { each: reduced ? 0 : 0.025, from: "end" },
        }
      );
      gsap.fromTo(head.current.querySelector(".flower-glow"), { scale: 0.2, opacity: 0 }, { scale: 1.3, opacity: 0.5, duration: 1.2, ease: "power2.out", transformOrigin: "50% 50%" });
    },
    { dependencies: [state], scope: wrap }
  );

  const name = FLOWER_NAMES[kind];
  const label = state === "bud" ? `${name} bud — tap to let it bloom` : state === "bloomed" ? `${name} — tap to pick it for your bouquet` : `${name} (picked)`;

  return (
    <div
      ref={wrap}
      className="plant relative flex flex-col items-center"
      style={{ animation: reduced ? "none" : `sway ${3.4 + sway}s ease-in-out ${-sway * 2}s infinite`, transformOrigin: "50% 100%" }}
    >
      <button
        ref={ref}
        type="button"
        onClick={onTap}
        disabled={state === "picked"}
        aria-label={label}
        className="group relative z-10 -mb-[6%] aspect-square w-[min(21vw,112px)] rounded-full transition-transform duration-500 hover:scale-105 disabled:cursor-default"
      >
        <svg viewBox="-60 -60 120 120" className="h-full w-full overflow-visible transition-[filter] duration-500 group-hover:drop-shadow-[0_0_14px_rgba(255,20,147,0.45)]">
          {state === "bud" && (
            <g style={{ animation: reduced ? "none" : "breathe 3s ease-in-out infinite", transformOrigin: "0 0", transformBox: "view-box" }}>
              <Bud kind={kind} />
            </g>
          )}
          {state === "bloomed" && <FlowerHead ref={head} kind={kind} />}
          {state === "picked" && (
            <g opacity="0.6">
              <path d="M0 6 C-3 1 -10 2 -10 7 C-10 12 -4 14 0 18 C4 14 10 12 10 7 C10 2 3 1 0 6Z" fill="#ff8dc7" transform="translate(0 -14)" />
            </g>
          )}
        </svg>
      </button>
      <svg viewBox="0 0 40 200" preserveAspectRatio="none" className="w-[min(10vw,46px)]" style={{ height: `calc(${stem} * clamp(64px, 15svh, 170px))` }} aria-hidden>
        <path d="M20 0 C14 60 26 120 20 200" stroke="#5c8f6f" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke" />
        <path d="M20 90 C6 78 2 92 0 104 C10 104 18 98 20 90Z" fill="#6fa483" />
        <path d="M20 130 C34 118 38 132 40 144 C30 144 22 138 20 130Z" fill="#5f9474" />
      </svg>
    </div>
  );
});
