/* GLSL for the signature pixel-heart → flower transformation. */

export const COMMON_GLSL = /* glsl */ `
  #define PI 3.14159265
  #define TAU 6.28318531

  mat3 rotAxis(vec3 axis, float a) {
    float s = sin(a), c = cos(a), oc = 1.0 - c;
    return mat3(
      oc * axis.x * axis.x + c,          oc * axis.x * axis.y + axis.z * s, oc * axis.z * axis.x - axis.y * s,
      oc * axis.x * axis.y - axis.z * s, oc * axis.y * axis.y + c,          oc * axis.y * axis.z + axis.x * s,
      oc * axis.z * axis.x + axis.y * s, oc * axis.y * axis.z - axis.x * s, oc * axis.z * axis.z + c
    );
  }
  float easeInOutCubic(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5; }
  float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }
`;

export const DITHER_GLSL = /* glsl */ `
  float bayer4(vec2 p) {
    vec2 q = mod(floor(p), 4.0);
    float i = q.x + q.y * 4.0;
    // 4x4 Bayer matrix, normalised
    if (i < 0.5) return 0.0 / 16.0; if (i < 1.5) return 8.0 / 16.0; if (i < 2.5) return 2.0 / 16.0; if (i < 3.5) return 10.0 / 16.0;
    if (i < 4.5) return 12.0 / 16.0; if (i < 5.5) return 4.0 / 16.0; if (i < 6.5) return 14.0 / 16.0; if (i < 7.5) return 6.0 / 16.0;
    if (i < 8.5) return 3.0 / 16.0; if (i < 9.5) return 11.0 / 16.0; if (i < 10.5) return 1.0 / 16.0; if (i < 11.5) return 9.0 / 16.0;
    if (i < 12.5) return 15.0 / 16.0; if (i < 13.5) return 7.0 / 16.0; if (i < 14.5) return 13.0 / 16.0; return 5.0 / 16.0;
  }
`;

/** Twin of `petalPoint` in src/lib/shapes/flower.ts — keep in sync. */
export const PETAL_GLSL = /* glsl */ `
  // shape: L, W, cup, r0   angles: psi, aOpen, aClosed, curlOpen   extra: curlClosed, layer, y, rand
  float petalWidth(float v) {
    return v < 0.55 ? pow(max(v, 0.0) / 0.55, 0.65) : sqrt(max(0.0, 1.0 - pow((v - 0.55) / 0.45, 2.0)));
  }
  vec3 petalPoint(vec4 shape, vec4 angles, vec4 extra, float u, float v, float b) {
    float a0 = mix(angles.z, angles.y, b);
    float curl = mix(extra.x, angles.w, b);
    float sc = mix(0.35, 1.0, b);
    float L = shape.x * sc;
    float W = shape.y * mix(0.55, 1.0, b);
    float half_ = 0.5 * W * petalWidth(v);
    float s = (u * 2.0 - 1.0) * half_;
    float l = v * L;
    float k = curl / max(L, 0.001);
    float cy, cz;
    if (abs(k) < 1e-4) {
      cy = l * cos(a0);
      cz = l * sin(a0);
    } else {
      cy = (sin(a0 + k * l) - sin(a0)) / k;
      cz = (cos(a0) - cos(a0 + k * l)) / k;
    }
    float a = a0 + k * l;
    float cupOff = shape.z * s * s / max(W, 0.05);
    float px = s;
    float py = cy + sin(a) * cupOff;
    float pz = cz - cos(a) * cupOff;
    float cs = cos(angles.x), sn = sin(angles.x);
    float r = pz + shape.w;
    return vec3(-sn * px + cs * r, py + extra.z, cs * px + sn * r);
  }
  vec3 tiltX(vec3 p, float t) {
    float c = cos(t), s = sin(t);
    return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  }
`;

export const voxelVertex = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;
  uniform float uCharge;
  uniform float uBeat;
  uniform float uProgress;
  uniform float uCell;
  uniform float uVisible;
  uniform float uCalm;
  uniform vec3 uHot;
  uniform vec3 uRose;
  uniform vec3 uCandy;
  uniform vec3 uPale;
  uniform vec3 uBerry;
  uniform vec3 uGold;

  attribute vec3 aHeart;
  attribute vec3 aFlower;
  attribute vec3 aScatter;
  attribute vec4 aRand;   // x: crumble delay, y/z/w: random
  attribute float aLayer; // 0..4 petal layer, -1 centre, -2 stray

  varying vec3 vNormal;
  varying vec3 vLocal;
  varying vec3 vColor;
  varying float vGlow;
  varying float vAlpha;

  ${COMMON_GLSL}

  void main() {
    float d = aRand.x;
    float P = uProgress;
    bool isStray = aLayer < -1.5;
    bool isCentre = aLayer > -1.5 && aLayer < -0.5;
    float layerN = isCentre ? -0.12 : max(aLayer, 0.0) / 4.0;

    // —— 0. ambient dust gathers into the heart
    float tA = easeOutCubic(clamp((uAssemble - d * 0.45) / 0.55, 0.0, 1.0));
    float beat = uBeat * (0.05 + 0.07 * uCharge);
    vec3 heart = aHeart * (1.0 + beat);
    float tremble = uCharge * uCharge * uCell * 0.22;
    heart += vec3(sin(uTime * 41.0 + aRand.y * 60.0), cos(uTime * 37.0 + aRand.z * 50.0), sin(uTime * 33.0 + aRand.w * 40.0)) * tremble;
    vec3 base = mix(aScatter, heart, tA);
    base += vec3(sin(uTime * 0.3 + aRand.y * TAU), cos(uTime * 0.25 + aRand.z * TAU), 0.0) * 0.3 * (1.0 - tA);

    // —— 1. pixels lift away (outer edge first)
    float l0 = 0.04 + d * 0.1;
    float tL = smoothstep(l0, l0 + 0.12, P);
    vec3 radial = normalize(aHeart + vec3(0.0, 0.0001, 0.0));
    vec3 liftOff = radial * (0.25 + aRand.z * 0.45) + vec3(0.0, 0.12 + aRand.y * 0.3, (aRand.y - 0.5) * 0.9);
    vec3 lifted = base + liftOff * easeOutCubic(tL);

    // —— 2+3. one continuous spiral: swirl up & out, then gather onto the bloom
    float s0 = l0 + 0.12;
    float g1 = isStray ? 0.95 : 0.62 + layerN * 0.18 + d * 0.04;
    float tau = clamp((P - s0) / (g1 - s0), 0.0, 1.0);
    float e = easeInOutCubic(tau);
    float ang0 = atan(lifted.z, lifted.x);
    float rad0 = length(lifted.xz);
    float angT = atan(aFlower.z, aFlower.x);
    float radT = length(aFlower.xz);
    float turns = TAU * (1.0 + floor(aRand.z * 1.99)) * (1.0 - uCalm);
    float baseEnd = ang0 + turns;
    float angEnd = baseEnd + mod(angT - baseEnd, TAU);
    float ang = mix(ang0, angEnd, e);
    float arc = sin(tau * PI) * (1.0 - uCalm * 0.75);
    float rad = mix(rad0, radT, smoothstep(0.45, 1.0, tau)) + arc * (0.5 + aRand.y * 1.05);
    float y = mix(lifted.y, aFlower.y, smoothstep(0.3, 1.0, tau)) + arc * (0.45 + aRand.x * 0.95);
    vec3 pos = tau > 0.0 ? vec3(cos(ang) * rad, y, sin(ang) * rad) : lifted;

    // —— 4. landed: shrink into glowing dust, a few sparkles drift away
    float tD = smoothstep(g1, g1 + 0.12, P);
    pos += vec3(sin(uTime * 0.9 + aRand.y * 20.0), cos(uTime * 0.8 + aRand.z * 20.0), sin(uTime * 0.7 + aRand.x * 20.0)) * 0.035 * tD;
    float drifter = step(0.86, aRand.w) * (isStray ? 0.0 : 1.0);
    float tDrift = smoothstep(g1 + 0.04, 1.0, P) * drifter;
    pos += (normalize(aFlower + vec3(0.0, 0.3, 0.0)) * 1.6 + vec3(0.0, 0.8, 0.0)) * tDrift;

    // —— size & tumble
    float sc = mix(0.32, 1.0, tA);
    sc *= 1.0 + 0.3 * arc;
    // most landed pixels melt into the petals; a few stay on as sparkles
    float keep = isCentre ? 0.62 : (aRand.y > 0.6 ? 0.3 : 0.0);
    sc *= mix(1.0, keep, tD);
    sc *= 1.0 - tDrift * 0.6;
    float tumble = arc * (3.0 + aRand.z * 6.0) + (1.0 - tA) * aRand.y * 6.0;
    vec3 axis = normalize(vec3(aRand.y - 0.5, aRand.z - 0.5, aRand.w - 0.5) + 0.001);
    mat3 R = rotAxis(axis, tumble);
    vec3 transformed = R * (position * uCell * 0.9 * sc) + pos;

    vNormal = normalize(normalMatrix * (R * normal));
    vLocal = position;

    // —— colour story: hot pixels → white-hot flight → petal tones
    float hl = clamp((aHeart.y * 0.5 - aHeart.x * 0.35) / 1.6 + 0.45, 0.0, 1.0);
    vec3 heartCol = mix(uHot, uRose, aRand.w * 0.6);
    heartCol = mix(heartCol, uCandy, smoothstep(0.62, 1.0, hl) * 0.55);
    vec3 flowerCol = isCentre ? uGold : mix(mix(uBerry, uHot, 0.6), mix(uRose, uCandy, 0.7), clamp(layerN + aRand.y * 0.3, 0.0, 1.0));
    vec3 col = mix(heartCol, mix(uRose, uCandy, 0.6), arc * 0.5);
    col = mix(col, flowerCol, smoothstep(0.55, 1.0, tau));
    vColor = col;
    vGlow = 0.08 + uCharge * 0.75 + uBeat * 0.35 * (1.0 - tL) + arc * 0.8 + tD * 0.6;

    float strayFade = isStray ? 1.0 - smoothstep(0.9, 1.0, P) : 1.0;
    vAlpha = uVisible * strayFade * (1.0 - tDrift * smoothstep(0.6, 1.0, tDrift)) * mix(0.6, 1.0, tA);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const voxelFragment = /* glsl */ `
  uniform float uGlowGain;
  varying vec3 vNormal;
  varying vec3 vLocal;
  varying vec3 vColor;
  varying float vGlow;
  varying float vAlpha;

  ${DITHER_GLSL}

  void main() {
    if (vAlpha < 0.01) discard;
    vec3 n = normalize(vNormal);
    vec3 L = normalize(vec3(0.35, 0.8, 0.6));
    float diff = max(dot(n, L), 0.0) * 0.6 + 0.3;

    // glowing pixel tile: bright bevel at every face edge
    vec3 a = abs(vLocal) * 2.0;
    vec2 f = a.x >= a.y && a.x >= a.z ? a.yz : (a.y >= a.z ? a.xz : a.xy);
    float edge = max(f.x, f.y);
    float rim = smoothstep(0.7, 0.98, edge);

    vec3 col = vColor * diff;
    col += vColor * rim * 0.4;
    col *= 0.78 + 0.22 * (1.0 - edge);
    col += vColor * vGlow * 0.45 * uGlowGain;
    gl_FragColor = vec4(col, vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const petalVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uTilt;
  attribute vec4 aShape;
  attribute vec4 aAngles;
  attribute vec4 aExtra;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vBloom;
  varying float vLayer;

  ${COMMON_GLSL}
  ${PETAL_GLSL}

  void main() {
    float layerN = aExtra.y / 4.0;
    float b = smoothstep(0.58 + layerN * 0.18, 0.8 + layerN * 0.18, uProgress);
    float breathe = sin(uTime * 0.8 + aAngles.x * 2.0) * 0.03 * b;
    float bb = clamp(b + breathe, 0.0, 1.04);
    float u = uv.x, v = uv.y;
    vec3 p = petalPoint(aShape, aAngles, aExtra, u, v, bb);
    float uc = clamp(u, 0.02, 0.98), vc = clamp(v, 0.04, 0.97);
    vec3 pu0 = petalPoint(aShape, aAngles, aExtra, uc - 0.02, vc, bb);
    vec3 pu1 = petalPoint(aShape, aAngles, aExtra, uc + 0.02, vc, bb);
    vec3 pv0 = petalPoint(aShape, aAngles, aExtra, uc, vc - 0.03, bb);
    vec3 pv1 = petalPoint(aShape, aAngles, aExtra, uc, vc + 0.03, bb);
    vec3 n = normalize(cross(pu1 - pu0, pv1 - pv0));
    p = tiltX(p, uTilt);
    n = tiltX(n, uTilt);
    vUv = uv;
    vBloom = b;
    vLayer = aExtra.y;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewPos = mv.xyz;
    vNormal = normalize(normalMatrix * n);
    gl_Position = projectionMatrix * mv;
  }
`;

export const petalFragment = /* glsl */ `
  uniform vec3 uBerry;
  uniform vec3 uHot;
  uniform vec3 uCandy;
  uniform vec3 uPale;
  uniform float uGlow;
  uniform float uVisible;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vBloom;
  varying float vLayer;

  ${DITHER_GLSL}

  void main() {
    float a = smoothstep(0.0, 0.3, vBloom) * uVisible;
    if (a < 0.01) discard;
    vec3 n = normalize(vNormal);
    if (!gl_FrontFacing) n = -n;
    vec3 V = normalize(-vViewPos);
    float edge = abs(vUv.x - 0.5) * 2.0;
    float v = vUv.y;
    float layerN = vLayer / 4.0;

    vec3 col = mix(uBerry, uHot, smoothstep(0.0, 0.42, v));
    col = mix(col, uCandy, smoothstep(0.5, 1.0, v) * (0.18 + 0.4 * layerN));
    col = mix(col, uPale, smoothstep(0.82, 1.0, max(edge * 0.92, v * 0.96)) * (0.2 + 0.3 * layerN));
    float vein = smoothstep(0.8, 1.0, sin((vUv.x - 0.5) * 34.0 * (1.0 - v * 0.4))) * smoothstep(0.1, 0.7, v) * 0.1;
    col *= 1.0 - vein;

    vec3 L = normalize(vec3(0.3, 0.9, 0.7));
    float diff = dot(n, L) * 0.5 + 0.5;
    float back = pow(clamp(dot(-n, L), 0.0, 1.0), 2.0) * 0.45;
    float fres = pow(1.0 - abs(dot(n, V)), 2.4);
    vec3 c = col * (0.34 + 0.66 * diff) + col * back * 0.8 + uCandy * fres * 0.26;
    c *= 1.0 - 0.4 * (1.0 - smoothstep(0.0, 0.35, v));
    c += col * uGlow;
    gl_FragColor = vec4(c, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const haloVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const haloFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    float g = (exp(-r * r * 4.0) * 0.75 + exp(-r * r * 18.0) * 0.6) * smoothstep(1.0, 0.55, r);
    float rays = 0.85 + 0.15 * sin(atan(p.y, p.x) * 7.0 + uTime * 0.25);
    vec3 c = uColor * g * rays * uIntensity;
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;
