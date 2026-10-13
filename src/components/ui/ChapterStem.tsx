"use client";

import { useStore } from "@/lib/store";
import { chapters, ui } from "@/content/copy";
import { scrollToElement, scrollToY } from "@/lib/scroll";

const LIGHT = new Set([4, 5]);

function Bud({ state, light }: { state: "bud" | "open" | "current"; light: boolean }) {
  const petal = light ? "#c2185b" : "#ff2d96";
  const dim = light ? "rgba(140,20,86,0.35)" : "rgba(255,209,232,0.4)";
  if (state === "bud")
    return (
      <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden>
        <circle cx="10" cy="10" r="3.2" fill="none" stroke={dim} strokeWidth="1.6" />
      </svg>
    );
  const big = state === "current";
  return (
    <svg
      viewBox="0 0 20 20"
      className={`transition-all duration-700 ${big ? "h-5 w-5 drop-shadow-[0_0_6px_rgba(255,20,147,0.9)]" : "h-3.5 w-3.5"}`}
      aria-hidden
    >
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="10" cy="5.4" rx="2.9" ry="4.4" transform={`rotate(${r} 10 10)`} fill={petal} opacity={big ? 1 : 0.75} />
      ))}
      <circle cx="10" cy="10" r="2.3" fill={light ? "#fff0f7" : "#ffe4f1"} />
    </svg>
  );
}

/** A thin stem of buds — each chapter blooms once she has seen it. */
export default function ChapterStem() {
  const chapter = useStore((s) => s.chapter);
  const visited = useStore((s) => s.visited);
  const started = useStore((s) => s.started);
  const hidden = useStore((s) => s.uiHidden);
  const light = LIGHT.has(chapter);

  const go = (i: number) => {
    if (i <= 1) return scrollToY(0);
    const el = document.getElementById(chapters[i].id);
    if (el) scrollToElement(el);
  };

  const show = started && !hidden;
  const items = chapters.map((c, i) => ({ ...c, i })).slice(1);

  return (
    <nav
      aria-label={ui.chapters}
      className={`fixed z-40 transition-opacity duration-700 ${show ? "opacity-100" : "pointer-events-none opacity-0"}
        left-[calc(14px+var(--safe-left))] right-[calc(70px+var(--safe-right))] top-[calc(12px+var(--safe-top))]
        md:left-auto md:right-[calc(18px+var(--safe-right))] md:top-1/2 md:-translate-y-1/2`}
    >
      <div className="relative">
        <span
          aria-hidden
          className={`absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 md:bottom-3 md:left-1/2 md:right-auto md:top-3 md:h-auto md:w-px md:-translate-x-1/2 md:translate-y-0 ${
            light ? "bg-berry/25" : "bg-blush/20"
          }`}
        />
        <ol className="relative flex items-center justify-between md:flex-col md:gap-3">
          {items.map((c) => {
            const state = c.i === chapter ? "current" : visited[c.i] ? "open" : "bud";
            return (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => go(c.i)}
                  aria-label={c.label}
                  aria-current={c.i === chapter ? "step" : undefined}
                  className="grid h-8 w-8 place-items-center rounded-full"
                >
                  <Bud state={state} light={light} />
                </button>
                <span
                  className={`pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 whitespace-nowrap font-hand text-lg opacity-0 transition-all duration-500 group-hover:opacity-100 md:block ${
                    light ? "text-berry" : "text-blush"
                  }`}
                >
                  {c.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className={`mt-0.5 pl-1 font-hand text-[0.95rem] leading-none md:hidden ${light ? "text-berry/80" : "text-blush/70"}`} aria-hidden>
        {chapters[Math.max(1, chapter)].label}
      </p>
    </nav>
  );
}
