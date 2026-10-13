"use client";

import { create } from "zustand";
import type { FlowerKind } from "@/content/copy";

export type Tier = "high" | "medium" | "low" | "none";
export type HeartPhase = "idle" | "charging" | "blooming" | "bloomed";

type State = {
  /** environment detection finished */
  ready: boolean;
  tier: Tier;
  reducedMotion: boolean;
  coarse: boolean;
  /** WebGL canvas rendered its first frame */
  worldReady: boolean;
  /** user passed the invitation gate */
  started: boolean;
  /** bumping this remounts every chapter for a clean replay */
  runId: number;
  chapter: number;
  visited: boolean[];
  musicOn: boolean;
  heartPhase: HeartPhase;
  bouquet: FlowerKind[];
  bouquetTied: boolean;
  candleOut: boolean;
  strayFound: boolean;
  uiHidden: boolean;
  /** increments each time the hidden duo easter egg fires */
  duoEgg: number;
  /** text announced to screen readers */
  announcement: string;
};

type Actions = {
  setEnv: (env: { tier: Tier; reducedMotion: boolean; coarse: boolean }) => void;
  setTier: (tier: Tier) => void;
  setWorldReady: (v: boolean) => void;
  start: () => void;
  setChapter: (i: number) => void;
  setMusic: (v: boolean) => void;
  setHeartPhase: (p: HeartPhase) => void;
  addFlower: (f: FlowerKind) => void;
  tieBouquet: () => void;
  blowCandle: () => void;
  findStray: () => void;
  setUiHidden: (v: boolean) => void;
  fireDuoEgg: () => void;
  announce: (text: string) => void;
  restart: () => void;
};

const freshRun = () => ({
  chapter: 0,
  visited: Array.from({ length: 9 }, (_, i) => i === 0),
  heartPhase: "idle" as HeartPhase,
  bouquet: [] as FlowerKind[],
  bouquetTied: false,
  candleOut: false,
  strayFound: false,
  uiHidden: false,
});

export const useStore = create<State & Actions>((set) => ({
  ready: false,
  tier: "medium",
  reducedMotion: false,
  coarse: false,
  worldReady: false,
  started: false,
  runId: 0,
  musicOn: false,
  duoEgg: 0,
  announcement: "",
  ...freshRun(),

  setEnv: (env) => set({ ...env, ready: true }),
  setTier: (tier) => set({ tier }),
  setWorldReady: (v) => set({ worldReady: v }),
  start: () => set({ started: true }),
  setChapter: (i) =>
    set((s) => {
      if (s.chapter === i && s.visited[i]) return s;
      const visited = s.visited.slice();
      visited[i] = true;
      return { chapter: i, visited };
    }),
  setMusic: (v) => set({ musicOn: v }),
  setHeartPhase: (p) => set({ heartPhase: p }),
  addFlower: (f) => set((s) => (s.bouquet.length >= 7 ? s : { bouquet: [...s.bouquet, f] })),
  tieBouquet: () => set({ bouquetTied: true }),
  blowCandle: () => set({ candleOut: true }),
  findStray: () => set({ strayFound: true }),
  setUiHidden: (v) => set({ uiHidden: v }),
  fireDuoEgg: () => set((s) => ({ duoEgg: s.duoEgg + 1 })),
  announce: (text) => set({ announcement: text }),
  restart: () => set((s) => ({ ...freshRun(), started: false, runId: s.runId + 1 })),
}));
