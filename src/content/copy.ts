/**
 * Every word of the experience lives here so it can be personalised
 * without touching any animation code.
 */

export const meta = {
  title: "for you ♡",
  description: "a little something, made just for you.",
  ogLine: "a little something for you ♡",
};

export const signature = "♡";

export const chapters = [
  { id: "invitation", label: "the invitation" },
  { id: "world", label: "october 13" },
  { id: "spark", label: "the little spark" },
  { id: "little-things", label: "little things" },
  { id: "duo", label: "just the two of us" },
  { id: "garden", label: "the secret garden" },
  { id: "confession", label: "something honest" },
  { id: "finale", label: "your day" },
  { id: "surprise", label: "one more thing" },
] as const;

export type ChapterId = (typeof chapters)[number]["id"];

export const invitation = {
  lines: ["Hey, baby...", "I made a little something for you.", "Actually... maybe not so little."],
  ready: "Ready?",
  yes: "I'm ready",
  // each tap on "not yet" shrinks it and swaps the text
  noSteps: ["not yet", "are you sure?", "pretty please?", "the other button is right there...", "okay fine ♡"],
  musicLabel: "with a little music?",
  loading: "gathering a little stardust…",
};

export const world = {
  eyebrow: "mark the calendar",
  month: "October",
  day: "13",
  note: "your day ♡",
  line: "A day worth making a little extra magical.",
  greeting: "Happy Birthday, baby",
};

export const spark = {
  eyebrow: "chapter three",
  intro: "Everything beautiful starts somewhere.",
  holdHint: "hold the heart",
  holdHintKeyboard: "press and hold — or tap a few times",
  holdAria: "Hold to make the heart bloom",
  during: ["Some beautiful things", "start with the smallest little spark."],
  after: "And somehow, the little things started to bloom.",
};

export const littleThings = {
  eyebrow: "little things",
  title: "A sky full of little things",
  hint: "tap the stars",
  notes: [
    "Your presence makes everything feel a little lighter.",
    "Some conversations are just harder to end. Ours are usually like that.",
    "You make me smile without even trying. Honestly, it's a little unfair.",
    "You make the little things feel unexpectedly special.",
    "Somewhere between the jokes and the late-night calls, talking to you became one of the best parts of my day.",
    "You have a way of making ordinary days feel a little more magical.",
    "If I collected every little moment that made me happy lately, you'd be in more of them than you realise.",
    "You're a pretty lovely coincidence.",
  ],
  complete: ["Eight little things.", "There are a lot more — I just ran out of stars."],
  counter: (n: number, total: number) => `${n} of ${total}`,
};

export const duo = {
  eyebrow: "our little universe",
  jump: "drifting in…",
  lines: ["Somewhere between the first hellos...", "...the random conversations...", "...and all those little moments..."],
  dropHint: "a little gift box! tap it",
  dropAria: "Open the gift box",
  dropTag: "a little gift, just for you",
  card: {
    rarity: "one of a kind",
    line: "Of all the people out there, I'm really glad I found you.",
    name: "I'm really glad I met you, darling.",
  },
  highFive: "high five ✦",
  secret: "ready for the next surprise? ;)",
};

export type FlowerKind = "rose" | "peony" | "tulip" | "cosmos" | "sakura" | "ranunculus" | "lily";

export const garden = {
  eyebrow: "the secret garden",
  title: "Pick a few for yourself",
  hint: "tap a bud to bloom it · tap again to pick it",
  counter: (n: number) => (n === 0 ? "your bouquet is empty… for now" : `${n} in your bouquet`),
  tie: "tie the bouquet ♡",
  message: "These are for you, darling.",
  later: "(they'll be waiting for you at the end)",
  butterfly: ["psst...", "the butterfly thinks you're cute.", "(it's not the only one.)"],
  flowers: {
    rose: "for making ordinary days feel better",
    peony: "for your laugh — it's kind of contagious",
    tulip: "for the conversations that run way past bedtime",
    cosmos: "for being ridiculously good company",
    sakura: "for the little things you don't even notice you do",
    ranunculus: "for making me smile at my phone like an idiot",
    lily: "for simply being you",
  } satisfies Record<FlowerKind, string>,
};

export const confession = {
  lines: [
    "Can I tell you something?",
    "I wasn't really planning on meeting someone like you.",
    "But sometimes the unexpected things...",
    "...turn out to be the ones you look forward to the most.",
    "Somewhere between the random conversations and the late-night calls, you became someone I genuinely look forward to.",
    "And I guess...",
    "you're one of my favourite little surprises.",
  ],
  letterPrompt: "I wrote the rest down.",
  letterAria: "Open the letter",
  close: "fold it back up",
};

export const letter = {
  greeting: "Dear baby,",
  paragraphs: [
    "I'll be honest — I spent way too long on this. Somewhere along the way it stopped being just \"a birthday thing\" and turned into an excuse to say a few things I don't always say out loud.",
    "You make ordinary days feel lighter. Talking to you has a funny way of turning five minutes into two hours, and somehow the late-night calls became something I look forward to all day.",
    "Wherever this little story takes us next, I already know one thing: I'm really glad the universe decided our paths should cross.",
    "So today is all about you. I hope it's soft and loud and full of people who adore you, and I hope this year brings you every good thing you've been quietly hoping for.",
  ],
  closing: "Happy birthday, darling.",
};

export const finale = {
  eyebrow: "october 13",
  greeting: "Happy Birthday, darling",
  wishes: [
    "I hope today gives you a hundred little reasons to smile —",
    "and I hope this is one of them.",
    "You deserve a day as lovely as the happiness you quietly bring to everyone around you.",
    "Here's to a year of soft mornings, loud laughs, lucky stars, and everything you've been quietly wishing for.",
  ],
  tapSky: "tap the sky ✦",
  wishPrompt: "one more thing before the last thing —",
  wishAction: "make a wish, then tap the flame",
  wishAria: "Blow out the candle",
  wished: "I hope it comes true ♡",
};

export const surprise = {
  hint: "psst. one pixel never made it into the flower.",
  pixelAria: "Tap the little pixel",
  early: "not yet ;) find me at the end",
  lines: ["Oh, and one more thing...", "Of all the people the universe could've put on my path...", "I'm really glad it was you."],
  date: "13 · 10",
  final: "happy birthday, baby",
  keep: "keep this moment",
  keepHint: "tap anywhere to bring the buttons back",
  replay: "watch the bloom again",
  restart: "from the beginning",
  footer: "made with way too much effort, just for you",
};

export const easterEgg = {
  line: "ready for the next surprise? ;)",
};

export const ui = {
  musicOn: "music on",
  musicOff: "music off",
  scroll: "scroll gently",
  chapters: "chapters",
};
