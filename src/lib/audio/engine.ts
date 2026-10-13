"use client";

/**
 * An original, generative little soundtrack — no audio files, no licensing.
 * A warm detuned pad, a soft bass and a music-box melody in F major at
 * ~68 bpm, through a generated convolution reverb. Each chapter changes
 * the mix (the confession drops to the pad alone; the finale adds a
 * sparkling arpeggio). It only ever starts from a user gesture.
 */

const BPM = 68;
const EIGHTH = 60 / BPM / 2;
const STEPS_PER_BAR = 8;

type Chord = { bass: number; pad: number[] };

const CHORDS: Chord[] = [
  { bass: 41, pad: [53, 57, 60, 64] }, // Fmaj7
  { bass: 45, pad: [55, 57, 60, 64] }, // Am7
  { bass: 46, pad: [53, 57, 58, 62] }, // B♭maj7
  { bass: 48, pad: [55, 57, 60, 64] }, // C6
  { bass: 38, pad: [53, 57, 60, 62] }, // Dm7
  { bass: 45, pad: [55, 57, 60, 64] }, // Am7
  { bass: 46, pad: [53, 57, 58, 62] }, // B♭maj7
  { bass: 48, pad: [53, 55, 60, 65] }, // Csus4
];

// melody per bar: [step, midi]
const MELODY: [number, number][][] = [
  [[0, 81], [2, 84], [4, 81], [5, 79], [6, 77]],
  [[0, 76], [2, 79], [4, 81], [6, 76]],
  [[0, 77], [2, 81], [3, 82], [4, 81], [6, 77]],
  [[0, 79], [2, 76], [4, 72], [6, 74]],
  [[0, 77], [2, 81], [4, 84], [5, 86], [6, 84]],
  [[0, 81], [2, 79], [4, 76], [6, 79]],
  [[0, 77], [2, 74], [4, 77], [6, 81]],
  [[0, 79], [3, 77], [6, 76]],
];

const MIX: { pad: number; mel: number; spk: number }[] = [
  { pad: 0.8, mel: 0.45, spk: 0 },
  { pad: 0.9, mel: 0.9, spk: 0 },
  { pad: 0.85, mel: 0.55, spk: 0 },
  { pad: 0.8, mel: 0.9, spk: 0.1 },
  { pad: 0.75, mel: 1, spk: 0.15 },
  { pad: 0.75, mel: 1, spk: 0.2 },
  { pad: 0.9, mel: 0.05, spk: 0 },
  { pad: 1, mel: 1, spk: 0.75 },
  { pad: 0.9, mel: 0.8, spk: 0.35 },
];

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

class Music {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private padBus!: GainNode;
  private melBus!: GainNode;
  private spkBus!: GainNode;
  private sfxBus!: GainNode;
  private wet!: GainNode;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private step = 0;
  private enabled = false;
  private chapter = 0;
  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) this.ctx.suspend();
    else if (this.enabled) this.ctx.resume();
  };

  get isEnabled() {
    return this.enabled;
  }

  private build() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return false;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    // generated stereo impulse response — a soft, airy room
    const len = Math.floor(ctx.sampleRate * 3.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = ir;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.55;
    reverb.connect(this.wet).connect(this.master);

    const bus = (gain: number) => {
      const g = ctx.createGain();
      g.gain.value = gain;
      g.connect(this.master);
      g.connect(reverb);
      return g;
    };
    this.padBus = bus(0.8);
    this.melBus = bus(0.5);
    this.spkBus = bus(0);
    this.sfxBus = bus(0.7);
    document.addEventListener("visibilitychange", this.onVisibility);
    return true;
  }

  /** Call from inside a click/tap handler. */
  setEnabled(on: boolean) {
    if (on === this.enabled) return;
    if (on) {
      if (!this.ctx && !this.build()) return;
      const ctx = this.ctx!;
      ctx.resume();
      this.enabled = true;
      this.nextTime = ctx.currentTime + 0.1;
      this.applyMix(0.1);
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 2.5);
      if (!this.timer) this.timer = setInterval(() => this.schedule(), 50);
    } else if (this.ctx) {
      const ctx = this.ctx;
      this.enabled = false;
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
      setTimeout(() => {
        if (!this.enabled) {
          if (this.timer) clearInterval(this.timer);
          this.timer = null;
          ctx.suspend();
        }
      }, 1300);
    }
  }

  setChapter(i: number) {
    this.chapter = Math.max(0, Math.min(MIX.length - 1, i));
    if (this.ctx && this.enabled) this.applyMix(2.2);
  }

  private applyMix(time: number) {
    if (!this.ctx) return;
    const m = MIX[this.chapter];
    const t = this.ctx.currentTime;
    for (const [node, v] of [
      [this.padBus, m.pad * 0.8],
      [this.melBus, m.mel * 0.5],
      [this.spkBus, m.spk * 0.28],
    ] as [GainNode, number][]) {
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(v, t + time);
    }
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    while (this.nextTime < ctx.currentTime + 0.25) {
      const bar = Math.floor(this.step / STEPS_PER_BAR) % CHORDS.length;
      const s = this.step % STEPS_PER_BAR;
      const t = this.nextTime;
      const chord = CHORDS[bar];
      if (s === 0) {
        const dur = EIGHTH * STEPS_PER_BAR;
        chord.pad.forEach((n, k) => this.pad(n, t + k * 0.04, dur + 1.2));
        this.bass(chord.bass, t, dur);
      }
      for (const [st, note] of MELODY[bar]) if (st === s) this.bell(note, t, 0.22, this.melBus);
      // finale sparkle: gentle 8th-note arpeggio high up
      const arp = chord.pad[s % chord.pad.length] + 24;
      this.bell(arp, t + EIGHTH * 0.5, 0.06, this.spkBus, 0.9);
      this.nextTime += EIGHTH;
      this.step++;
    }
  }

  private pad(midi: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    f.Q.value = 0.4;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.045, t + 1.6);
    g.gain.setValueAtTime(0.045, t + dur - 1.4);
    g.gain.linearRampToValueAtTime(0, t + dur);
    f.connect(g).connect(this.padBus);
    for (const [type, detune] of [
      ["triangle", -7],
      ["sawtooth", 6],
    ] as [OscillatorType, number][]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = hz(midi);
      o.detune.value = detune;
      const og = ctx.createGain();
      og.gain.value = type === "sawtooth" ? 0.35 : 1;
      o.connect(og).connect(f);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }

  private bass(midi: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = hz(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.6);
    o.connect(g).connect(this.padBus);
    o.start(t);
    o.stop(t + dur + 0.7);
  }

  /** music-box tine: a few sine partials with a fast, glassy decay */
  private bell(midi: number, t: number, vel: number, bus: GainNode, decay = 1.8) {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(vel, t + 0.005);
    out.gain.exponentialRampToValueAtTime(0.0008, t + decay);
    out.connect(bus);
    for (const [ratio, amp] of [
      [1, 1],
      [2, 0.32],
      [3, 0.1],
      [4.17, 0.05],
    ]) {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = hz(midi) * ratio;
      const g = ctx.createGain();
      g.gain.value = amp;
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + decay + 0.05);
    }
  }

  /** Small interaction sounds — silent unless music is on. */
  sfx(kind: "chime" | "sparkle" | "bloom" | "pop" | "whoosh") {
    const ctx = this.ctx;
    if (!ctx || !this.enabled) return;
    const t = ctx.currentTime + 0.01;
    const pent = [72, 74, 77, 79, 81, 84, 86, 89];
    const pick = () => pent[Math.floor(Math.random() * pent.length)];
    if (kind === "chime") this.bell(pick() + 12, t, 0.12, this.sfxBus, 1.6);
    if (kind === "sparkle") [0, 0.07, 0.14].forEach((d, i) => this.bell(pick() + 12 + i * 2, t + d, 0.08, this.sfxBus, 1.2));
    if (kind === "bloom") [77, 81, 84, 89, 93].forEach((n, i) => this.bell(n, t + i * 0.11, 0.1, this.sfxBus, 2.4));
    if (kind === "pop" || kind === "whoosh") {
      const len = kind === "pop" ? 0.5 : 1.2;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, kind === "pop" ? 4 : 1.5);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = kind === "pop" ? "lowpass" : "bandpass";
      f.frequency.setValueAtTime(kind === "pop" ? 1400 : 400, t);
      if (kind === "whoosh") f.frequency.exponentialRampToValueAtTime(2400, t + len);
      const g = ctx.createGain();
      g.gain.value = kind === "pop" ? 0.22 : 0.08;
      src.connect(f).connect(g).connect(this.sfxBus);
      src.start(t);
      if (kind === "pop") this.bell(pick() + 12, t + 0.03, 0.05, this.sfxBus, 1.4);
    }
  }
}

export const music = new Music();
