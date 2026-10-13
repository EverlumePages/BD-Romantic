"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { lockScroll } from "@/lib/scroll";
import { letter, signature, confession } from "@/content/copy";
import { PIXEL_HEART } from "@/lib/shapes/heart";

export function PixelHeartMark({ size = 22, color = "#fff0f7" }: { size?: number; color?: string }) {
  const rows = PIXEL_HEART;
  return (
    <svg viewBox={`0 0 ${rows[0].length} ${rows.length}`} width={size} height={(size * rows.length) / rows[0].length} shapeRendering="crispEdges" aria-hidden>
      {rows.flatMap((row, y) => row.split("").map((c, x) => (c === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} /> : null)))}
    </svg>
  );
}

/**
 * The letter: a tri-fold sheet that unfolds, then the words appear as if
 * written in ink, one line after another.
 */
export default function Letter({ onClose, reduced }: { onClose: () => void; reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    lockScroll(true);
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // tiny focus trap: the close button is the only control
        e.preventDefault();
        closeBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [onClose]);

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.fromTo(".lt-backdrop", { opacity: 0 }, { opacity: 1, duration: 0.6 });
      tl.fromTo(".lt-sheet", { y: 80, opacity: 0, rotateX: 18 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.9, ease: "power3.out" }, "-=0.2");
      if (!reduced) {
        tl.fromTo(".lt-fold-2", { rotateX: -178 }, { rotateX: 0, duration: 0.9, ease: "power2.inOut" }, "-=0.3");
        tl.fromTo(".lt-fold-3", { rotateX: 178 }, { rotateX: 0, duration: 0.9, ease: "power2.inOut" }, "-=0.45");
      }
      tl.fromTo(".lt-ink", { "--ink": "0%" }, { "--ink": "115%", duration: reduced ? 0.4 : 1.5, ease: "power1.inOut", stagger: reduced ? 0.1 : 0.9 }, "-=0.2");
      tl.fromTo(".lt-close", { opacity: 0 }, { opacity: 1, duration: 0.8 }, "-=0.6");
    },
    { scope: root }
  );

  return (
    <div ref={root} className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="A letter for you">
      <div className="lt-backdrop absolute inset-0 bg-night/80 backdrop-blur-sm" onClick={onClose} />
      <div className="lt-sheet relative w-[min(94vw,580px)]" style={{ perspective: "1600px" }}>
        <div
          className="relative max-h-[86svh] overflow-y-auto overscroll-contain rounded-[6px] px-6 pb-8 pt-12 text-ink shadow-[0_30px_80px_-20px_rgba(255,20,147,0.45)] sm:px-11"
          data-lenis-prevent
          style={{
            background:
              "repeating-linear-gradient(180deg, transparent 0 33px, rgba(255,141,199,0.2) 33px 34px) 0 12px / 100% 34px local, radial-gradient(120% 80% at 50% 0%, #fffafd, #fff0f7 60%, #ffe4f1)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* fold shading panels (decorative) */}
          <div className="lt-fold-2 pointer-events-none absolute inset-x-0 top-1/3 h-1/3 origin-top border-t border-candy/20" style={{ backfaceVisibility: "hidden" }} aria-hidden />
          <div className="lt-fold-3 pointer-events-none absolute inset-x-0 top-2/3 h-1/3 origin-top border-t border-candy/20" style={{ backfaceVisibility: "hidden" }} aria-hidden />

          <div className="absolute right-6 top-6 opacity-70">
            <PixelHeartMark size={26} color="#ff2d96" />
          </div>
          <p className="lt-ink ink font-hand text-[1.9rem] leading-[34px] text-berry">{letter.greeting}</p>
          {letter.paragraphs.map((p, i) => (
            <p key={i} className="lt-ink ink mt-[34px] font-hand text-[1.42rem] leading-[34px] sm:text-[1.55rem]">
              {p}
            </p>
          ))}
          <p className="lt-ink ink mt-[34px] font-hand text-[1.7rem] leading-[34px] text-hot">{letter.closing}</p>
          <p className="lt-ink ink mt-2 text-right font-hand text-[2.2rem] leading-[34px] text-hot">{signature}</p>
          <div className="mt-8 flex justify-center">
            <button ref={closeBtn} type="button" onClick={onClose} className="lt-close btn-ghost-dark px-5 py-2 font-hand text-xl">
              {confession.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
