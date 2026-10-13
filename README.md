# for you ♡

A cinematic, interactive birthday experience for October 13, built with Next.js 16, React 19, Three.js / React Three Fiber, GSAP and Lenis.

One spark of pink light becomes a pixel heart, blooms into a flower, and carries the visitor through nine chapters. Every visual is procedural (WebGL, SVG, CSS), so there are no image files to lose. The soundtrack is generated in the browser and is off until the visitor turns it on.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy (Vercel)

Pick one:

- **GitHub:** push this folder to a private GitHub repo, then go to https://vercel.com/new, import it and keep the default settings.
- **CLI:** run `npx vercel` from this folder and follow the prompts. Then run `npx vercel --prod` for the final URL.

The page is marked `noindex`, so search engines won't list it. When the link is shared, the preview shows a glowing pixel heart and "a little something for you ♡". No names appear anywhere.

**Before you share it:** open the deployed URL on a phone and scroll through it once.

## Make it yours

All the words live in **`src/content/copy.ts`**: the invitation, every note, the flower tags, the confession lines, the letter (`letter.paragraphs`), the finale wishes and the last line. Edit them there. No animation code needs to change.

- **Signature:** `signature` (currently just `♡`).
- **Pet names:** "baby" and "darling" are used inline in the copy. Swap them for the recipient's own.

## The chapters

| # | Chapter | What happens |
|---|---------|--------------|
| 1 | Invitation | A breathing spark, three lines, and a "Ready?" with a teasing *not yet* button. |
| 2 | October 13 | A tiny calendar lights up to the 13th. The other days fall like petals, and the 13 grows huge. |
| 3 | The little spark | **The signature moment.** Dust gathers into a 3D pixel heart. Holding it (or tapping it a few times) races its heartbeat until it breaks into light and spirals into a blooming flower. |
| 4 | Little things | Eight stars hide eight notes. Opening them all draws a heart constellation. |
| 5 | Just the two of us | A toy plane, two tiny parachuters, a flower island, and a gift box that floats down. |
| 6 | Secret garden | Bloom buds, pick flowers, tie a bouquet ("These are for you, darling."). The bouquet returns in the finale. |
| 7 | Something honest | A quiet scroll-driven confession, then a sealed letter that unfolds. |
| 8 | Your day | A firework heart, "Happy Birthday, darling ♡", the bouquet, tap-the-sky fireworks, and a pixel cake to blow out. |
| 9 | One more thing | The pixel that never made it into the flower: "I'm really glad it was you." Controls to keep the moment (hides all UI for a screenshot), replay the bloom, or start over. |

### Hidden things (so you know they're there)

- **The stray pixel:** during the bloom, one pixel flies off. It blinks in a corner of later chapters, and tapping it early says "not yet ;)".
- **The keyword:** typing **lovely** on a keyboard, or triple-tapping the pink figure in the duo chapter, sends two mini parachuters across the screen.
- **The butterfly:** the butterfly in the garden has something to say.

## Quality, accessibility and fallbacks

- **Device tiers:** the experience picks a quality tier per device (voxel counts, pixel ratio, bloom) and steps down automatically if the frame rate drops.
- **No WebGL:** without WebGL it switches to a Canvas2D renderer. That renderer still has the pixel heart, the bloom and the fireworks.
- **Reduced motion:** `prefers-reduced-motion` gives a calm version, with no smooth-scroll hijacking and a gentle gather instead of a swirl.
- **Keyboard:** every interactive object is a real button. The heart can be held with Space or Enter.

### Testing switches (URL parameters)

| Parameter | Effect |
|-----------|--------|
| `?start=1` | Skip the invitation |
| `?webgl=0` | Force the Canvas2D fallback |
| `?motion=reduced` | Force reduced motion |
| `?tier=low` / `medium` / `high` | Force a quality tier |

## Project map

```
src/content/copy.ts            all the words
src/components/chapters/       one file per chapter (+ duo/, garden/, letter/)
src/components/world/          the single WebGL canvas: backdrop, dust, petals, fireworks, camera
src/components/world/heartflower/  the pixel heart → flower (voxel + petal shaders)
src/lib/shapes/                heart voxels + flower petal math (shared by WebGL and the 2D fallback)
src/lib/audio/engine.ts        the generated music-box soundtrack
src/components/fallback/       Canvas2D renderer for devices without WebGL
```
