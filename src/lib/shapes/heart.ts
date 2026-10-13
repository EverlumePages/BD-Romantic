/**
 * A pixel-art heart, "inflated" into a voxel shell.
 *
 * The front silhouette is the classic implicit heart filled on a square grid,
 * so it reads instantly as a pixel heart; depth comes from a distance
 * transform (cells deep inside the heart get thicker), giving a soft pillow
 * shape when it rotates. Only the visible shell is emitted.
 */

export type HeartVoxels = {
  /** xyz triplets, centred around the origin */
  positions: Float32Array;
  /** 0 (centre) … 1 (outer edge) — used to stagger the crumble */
  edge: Float32Array;
  count: number;
  /** size of one voxel in world units */
  cell: number;
  /** index of the voxel that "never makes it into the flower" */
  strayIndex: number;
};

// the classic parametric heart, sampled into a polygon for point-in-polygon tests
const HEART_POLY: [number, number][] = Array.from({ length: 240 }, (_, i) => {
  const t = (i / 240) * Math.PI * 2;
  const s = Math.sin(t);
  return [(16 * s * s * s) / 16, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16];
});

const inside = (x: number, y: number) => {
  let hit = false;
  for (let i = 0, j = HEART_POLY.length - 1; i < HEART_POLY.length; j = i++) {
    const [xi, yi] = HEART_POLY[i];
    const [xj, yj] = HEART_POLY[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

function build(res: number, width: number): HeartVoxels {
  // sample domain
  const x0 = -1.06, x1 = 1.06, y0 = -1.1, y1 = 0.82;
  const step = (x1 - x0) / res;
  const cols = res;
  const rows = Math.ceil((y1 - y0) / step);
  const grid = new Int32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = x0 + (i + 0.5) * step;
      const y = y0 + (j + 0.5) * step;
      grid[j * cols + i] = inside(x, y) ? 1 : 0;
    }
  }

  // chessboard distance transform (number of steps to the outside)
  const dist = new Int32Array(cols * rows).fill(0);
  let frontier: number[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const id = j * cols + i;
      if (!grid[id]) continue;
      let border = false;
      for (let dj = -1; dj <= 1 && !border; dj++)
        for (let di = -1; di <= 1; di++) {
          const ni = i + di, nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows || !grid[nj * cols + ni]) {
            border = true;
            break;
          }
        }
      if (border) {
        dist[id] = 1;
        frontier.push(id);
      }
    }
  let d = 1;
  while (frontier.length) {
    const next: number[] = [];
    for (const id of frontier) {
      const i = id % cols, j = (id / cols) | 0;
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          const ni = i + di, nj = j + dj;
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
          const nid = nj * cols + ni;
          if (grid[nid] && dist[nid] === 0) {
            dist[nid] = d + 1;
            next.push(nid);
          }
        }
    }
    frontier = next;
    d++;
  }
  const maxDist = Math.max(1, d - 1);
  const maxDepth = Math.max(1, Math.round(res * 0.13));
  const rim = Math.max(2, Math.round(maxDist * 0.45));
  const depthOf = (id: number) => (grid[id] ? Math.round(maxDepth * Math.sqrt(Math.min(1, dist[id] / rim))) : -1);

  const pts: number[] = [];
  const edge: number[] = [];
  const scale = width / (x1 - x0);
  const cell = step * scale;
  const cx = 0, cy = (y0 + y1) / 2 + 0.02;

  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const id = j * cols + i;
      if (!grid[id]) continue;
      const k = depthOf(id);
      // smallest neighbour depth decides how much side wall is visible
      let minN = k;
      const nbs = [
        [1, 0], [-1, 0], [0, 1], [0, -1],
      ];
      for (const [di, dj] of nbs) {
        const ni = i + di, nj = j + dj;
        const nd = ni < 0 || nj < 0 || ni >= cols || nj >= rows ? -1 : depthOf(nj * cols + ni);
        minN = Math.min(minN, nd);
      }
      const zs = new Set<number>([k, -k]);
      for (let z = Math.max(0, minN + 1); z < k; z++) {
        zs.add(z);
        zs.add(-z);
      }
      if (k === 0) zs.add(0);
      const x = (x0 + (i + 0.5) * step - cx) * scale;
      const y = (y0 + (j + 0.5) * step - cy) * scale;
      const e = 1 - (dist[id] - 1) / maxDist;
      for (const z of zs) {
        pts.push(x, y, z * cell);
        edge.push(e);
      }
    }

  const count = pts.length / 3;
  // stray pixel: a front-facing voxel near the top of the right lobe
  let strayIndex = 0;
  let best = -Infinity;
  for (let n = 0; n < count; n++) {
    const x = pts[n * 3], y = pts[n * 3 + 1], z = pts[n * 3 + 2];
    const score = x * 0.6 + y + z * 2;
    if (score > best) {
      best = score;
      strayIndex = n;
    }
  }
  return { positions: new Float32Array(pts), edge: new Float32Array(edge), count, cell, strayIndex };
}

/** Find the grid resolution whose voxel count lands closest to `target`. */
export function heartVoxels(target: number, width = 3.4): HeartVoxels {
  // even column counts only: a symmetric heart with a two-pixel notch and tip
  let lo = 4, hi = 32;
  let best = build(lo * 2, width);
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const h = build(mid * 2, width);
    if (Math.abs(h.count - target) < Math.abs(best.count - target)) best = h;
    if (h.count < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return best;
}

/** 2D pixel heart rows used by DOM/canvas art (1 = filled). */
export const PIXEL_HEART = [
  "0110000110",
  "1111001111",
  "1111111111",
  "1111111111",
  "0111111110",
  "0011111100",
  "0001111000",
  "0000110000",
];
