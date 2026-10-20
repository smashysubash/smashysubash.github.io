/**
 * Point-cloud shapes for the lattice, one per home-page section.
 * Each builder returns a Float32Array of n xyz triples, roughly within a 20-unit box around the origin.
 *
 * Two families:
 * - icons (Impact, Experience, Platform, AI): line art drawn as dotted outlines.
 *   They face the viewer, so the lattice keeps them flat-on and only tilts them with the cursor.
 * - abstract forms (Skills, Certs, Writing, Contact): calm 3D figures that slowly rotate.
 */

export type Shape = Float32Array;
type P = [number, number];

const rnd = Math.random;
const jit = (a: number) => (rnd() - 0.5) * a;
const TAU = Math.PI * 2;

/* ---------- line-art helpers ---------- */

/** Points on a circle/ellipse arc, as a polyline. */
function arc(cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = TAU, steps = 48): P[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / steps;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
}
/** Rounded rectangle outline, centred. */
function roundRect(cx: number, cy: number, w: number, h: number, r: number): P[] {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  return [
    ...arc(x1 - r, y1 - r, r, r, 0, Math.PI / 2, 8),
    ...arc(x0 + r, y1 - r, r, r, Math.PI / 2, Math.PI, 8),
    ...arc(x0 + r, y0 + r, r, r, Math.PI, Math.PI * 1.5, 8),
    ...arc(x1 - r, y0 + r, r, r, Math.PI * 1.5, TAU, 8),
    [x1, y1 - r],
  ];
}

/**
 * Turn polylines into points spread evenly by length (the outline), plus an optional light
 * fill inside closed polygons. Points sit on two layers (z = ±depth) so icons have a little
 * thickness when they tilt.
 */
function lineArt(n: number, strokes: P[][], fills: P[][] = [], { fillShare = 0.12, depth = 0.5, scale = 1 } = {}): Shape {
  const segs: { a: P; b: P; len: number }[] = [];
  let total = 0;
  for (const s of strokes) for (let i = 1; i < s.length; i++) {
    const len = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
    if (len > 0) { segs.push({ a: s[i - 1], b: s[i], len }); total += len; }
  }
  const out = new Float32Array(n * 3);
  const nFill = fills.length ? Math.round(n * fillShare) : 0;
  for (let i = 0; i < n - nFill; i++) {
    let d = rnd() * total, k = 0;
    while (k < segs.length - 1 && d > segs[k].len) d -= segs[k++].len;
    const { a, b, len } = segs[k], t = d / len;
    const layer = rnd() < 0.5 ? -depth : depth;
    out.set([(a[0] + (b[0] - a[0]) * t + jit(0.12)) * scale, (a[1] + (b[1] - a[1]) * t + jit(0.12)) * scale, layer + jit(0.15)], i * 3);
  }
  /* fill: rejection-sample inside the polygons' bounding box */
  const inside = (x: number, y: number, poly: P[]) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  for (let i = n - nFill; i < n; ) {
    const poly = fills[Math.floor(rnd() * fills.length)];
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const x = Math.min(...xs) + rnd() * (Math.max(...xs) - Math.min(...xs)), y = Math.min(...ys) + rnd() * (Math.max(...ys) - Math.min(...ys));
    if (!inside(x, y, poly)) continue;
    out.set([x * scale, y * scale, jit(depth * 2)], i * 3);
    i++;
  }
  return out;
}

/* ---------- fallback + hero ---------- */

/** Fallback for an unknown shape name. */
export function sphere(n: number): Shape {
  const g = Math.PI * (3 - Math.sqrt(5)), o = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
    o.set([Math.cos(t) * r * 8.5, y * 8.5, Math.sin(t) * r * 8.5], i * 3);
  }
  return o;
}

/**
 * Hero: an even dot grid spread across the whole screen behind the text and photo.
 * Spacing is loose on purpose (about 45px on a laptop). Points beyond the visible grid
 * continue it off-screen, so they fly in from the edges when the next shape forms.
 * The vertex shader animates it (uGrid): a slow wave lifts and brightens dots as it passes.
 */
export function dotGrid(n: number, spacing = 1.15): Shape {
  const o = new Float32Array(n * 3);
  const side = Math.ceil(Math.sqrt(n));
  // fill outward in rings from the centre, so the first points cover the screen evenly
  const cells: [number, number][] = [];
  for (let gy = -side; gy <= side; gy++) for (let gx = -side; gx <= side; gx++) cells.push([gx, gy]);
  cells.sort((a, b) => Math.max(Math.abs(a[0]) * 0.58, Math.abs(a[1])) - Math.max(Math.abs(b[0]) * 0.58, Math.abs(b[1])));
  for (let i = 0; i < n; i++) {
    const [gx, gy] = cells[i];
    o.set([gx * spacing, gy * spacing, 0], i * 3);
  }
  return o;
}

/* ---------- icons ---------- */

/** Impact: a cloud over three shrinking bars and a downward arrow, the cloud bill coming down. */
export function cloudBill(n: number): Shape {
  // three puffs over a flat base, traced as one outline (y is up)
  const cloud: P[] = [
    ...arc(-4.4, 3.8, 2.2, 2.2, Math.PI * 1.5, Math.PI * 0.35, 22),
    ...arc(-0.4, 5.1, 3.0, 3.0, Math.PI * 0.9, Math.PI * 0.12, 26),
    ...arc(3.9, 3.9, 2.3, 2.3, Math.PI * 0.62, -Math.PI * 0.5, 24),
    [-4.4, 1.6],
  ];
  const bars = [[-5.5, 3.6], [-1.5, 2.6], [2.5, 1.6]].map(([x, h], i) => {
    const top = -0.6 - (3 - h) - i * 0.9, w = 2.6;
    return [[x, -8.5], [x, top], [x + w, top], [x + w, -8.5]] as P[];
  });
  const axis: P[] = [[-7, -8.5], [7.5, -8.5]];
  const arrow: P[][] = [[[5.6, -1.2], [7.4, -6.2]], [[6.1, -5.6], [7.4, -6.2], [7.9, -4.8]]];
  return lineArt(n, [cloud, ...bars, axis, ...arrow], bars, { fillShare: 0.14 });
}

/** Experience: a git graph. Three commits climb Intern → Associate → SE; a branch merges back in. */
export function careerGraph(n: number): Shape {
  const nodes: P[] = [[-6, -6], [0, 0], [6, 6]];
  const main: P[] = [[-8.5, -8.5], [-6, -6], [0, 0], [6, 6], [8.5, 8.5]];
  const branch: P[] = [[-6, -6], [-6.8, -2.4], [-4.8, 1.6], [0, 0]];
  const branch2: P[] = [[0, 0], [1.6, 4.8], [4.4, 6.8], [6, 6]];
  const rings = nodes.map(([x, y], i) => arc(x, y, 1.1 + i * 0.25, 1.1 + i * 0.25, 0, TAU, 28));
  const inner = nodes.map(([x, y], i) => arc(x, y, 0.45 + i * 0.1, 0.45 + i * 0.1, 0, TAU, 14));
  const side = [arc(-6.8, -2.4, 0.55, 0.55, 0, TAU, 14), arc(1.6, 4.8, 0.55, 0.55, 0, TAU, 14)];
  return lineArt(n, [main, branch, branch2, ...rings, ...inner, ...side], rings, { fillShare: 0.08 });
}

/** Platform: one service in the middle, wired to six tenant databases. */
export function tenantDbs(n: number): Shape {
  const hub = roundRect(0, 0, 5.2, 3.6, 0.8);
  const hubLines: P[][] = [[[-1.6, 0.6], [1.6, 0.6]], [[-1.6, -0.6], [1.6, -0.6]]];
  const strokes: P[][] = [hub, ...hubLines];
  const fills: P[][] = [hub];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + Math.PI / 6, cx = Math.cos(a) * 8, cy = Math.sin(a) * 6.2;
    const rx = 1.5, ry = 0.5, h = 2.4, top = cy + h / 2, bot = cy - h / 2;
    strokes.push(
      arc(cx, top, rx, ry, 0, TAU, 28),
      arc(cx, bot, rx, ry, Math.PI, TAU, 16),
      [[cx - rx, top], [cx - rx, bot]],
      [[cx + rx, top], [cx + rx, bot]],
      arc(cx, cy, rx, ry, Math.PI, TAU, 16),
      // wire from the hub edge to the database
      [[Math.cos(a) * 3.1, Math.sin(a) * 2.2], [cx - Math.cos(a) * 1.9, cy - Math.sin(a) * 1.7]],
    );
  }
  return lineArt(n, strokes, fills, { fillShare: 0.06 });
}

/** AI: a chat bubble with a four-point spark and a typing indicator. */
export function chatSpark(n: number): Shape {
  const bubble: P[] = [...roundRect(0, 1, 15, 10.5, 2.4).slice(0, -1)];
  // tail at the bottom-left
  const tail: P[] = [[-4.2, -4.25], [-6, -7.6], [-1.6, -4.25]];
  // four-point sparkle with curved sides (an astroid)
  const spark = (cx: number, cy: number, r: number): P[] =>
    Array.from({ length: 73 }, (_, i) => {
      const t = (i / 72) * TAU;
      return [cx + r * Math.cos(t) ** 3, cy + r * Math.sin(t) ** 3] as P;
    });
  const big = spark(-1.2, 2.2, 3.4), small = spark(3.6, 4.6, 1.5);
  const dots = [-1.6, 0.6, 2.8].map((x) => arc(x + 1.3, -1.9, 0.38, 0.38, 0, TAU, 10));
  return lineArt(n, [bubble, tail, big, small, ...dots], [big, small], { fillShare: 0.12 });
}

/* ---------- abstract forms ---------- */

/** Skills: three tilted orbits, one node per skill group sized by how many skills it holds. */
export function orbits(n: number, sizes: number[]): Shape {
  const o = new Float32Array(n * 3);
  const tilts = [[0.25, 0], [-0.35, 0.5], [0.55, -0.45]];
  const R = [8.2, 7.2, 6.2];
  const total = sizes.reduce((a, b) => a + b, 0) || 1;
  const nodes = sizes.map((s, k) => ({ ring: k % 3, a: (k / sizes.length) * TAU * 1.7, r: 0.45 + Math.sqrt(s / total) * 2.4 }));
  const place = (ring: number, a: number, off: [number, number, number] = [0, 0, 0]) => {
    let x = Math.cos(a) * R[ring] + off[0], y = Math.sin(a) * R[ring] * 0.6 + off[1], z = off[2];
    const [tx, tz] = tilts[ring];
    [y, z] = [y * Math.cos(tx) - z * Math.sin(tx), y * Math.sin(tx) + z * Math.cos(tx)];
    [x, y] = [x * Math.cos(tz) - y * Math.sin(tz), x * Math.sin(tz) + y * Math.cos(tz)];
    return [x, y, z];
  };
  for (let i = 0; i < n; i++) {
    if (rnd() < 0.55) {
      const ring = i % 3;
      o.set(place(ring, rnd() * TAU, [jit(0.1), jit(0.1), jit(0.1)]), i * 3);
    } else if (rnd() < 0.92) {
      const nd = nodes[i % nodes.length], u = rnd() * TAU, v = Math.acos(2 * rnd() - 1), r = nd.r * Math.cbrt(rnd());
      o.set(place(nd.ring, nd.a, [r * Math.sin(v) * Math.cos(u), r * Math.sin(v) * Math.sin(u), r * Math.cos(v)]), i * 3);
    } else {
      const u = rnd() * TAU, v = Math.acos(2 * rnd() - 1), r = 1.2 * Math.cbrt(rnd());
      o.set([r * Math.sin(v) * Math.cos(u), r * Math.sin(v) * Math.sin(u), r * Math.cos(v)], i * 3);
    }
  }
  return o;
}

/** Certifications: nested rings at different angles, like a gyroscope. */
export function gyroscope(n: number): Shape {
  const o = new Float32Array(n * 3);
  const rings = [
    { r: 8, rx: 0, ry: 0 },
    { r: 6.6, rx: Math.PI / 2, ry: 0.4 },
    { r: 5.2, rx: 0.9, ry: Math.PI / 2 },
    { r: 3.8, rx: -0.6, ry: -0.9 },
  ];
  for (let i = 0; i < n; i++) {
    const ring = rings[i % rings.length], a = rnd() * TAU;
    let x = Math.cos(a) * ring.r + jit(0.15), y = Math.sin(a) * ring.r + jit(0.15), z = jit(0.3);
    [y, z] = [y * Math.cos(ring.rx) - z * Math.sin(ring.rx), y * Math.sin(ring.rx) + z * Math.cos(ring.rx)];
    [x, z] = [x * Math.cos(ring.ry) + z * Math.sin(ring.ry), -x * Math.sin(ring.ry) + z * Math.cos(ring.ry)];
    o.set([x, y, z], i * 3);
  }
  return o;
}

/** Writing: a flowing ribbon of wave lines, like lines of text in motion. */
export function ribbon(n: number): Shape {
  const o = new Float32Array(n * 3), lines = 9;
  for (let i = 0; i < n; i++) {
    const l = i % lines, u = rnd() * 2 - 1;
    const x = u * 10, base = (l - (lines - 1) / 2) * 1.2;
    const y = base + Math.sin(u * 3 + l * 0.35) * 2.2 * (1 - Math.abs(u) * 0.3);
    const z = Math.cos(u * 2.4 + l * 0.5) * 3.2;
    o.set([x + jit(0.08), y + jit(0.08), z + jit(0.12)], i * 3);
  }
  return o;
}

/** Contact: signal ripples spreading from one point. */
export function ripples(n: number): Shape {
  const o = new Float32Array(n * 3), rings = 7;
  for (let i = 0; i < n; i++) {
    const k = i % rings, r = 1.2 + k * 1.25, a = rnd() * TAU;
    // rings sit on a gentle dome, so it reads as a wave rather than a target
    const z = Math.cos((r / 10) * Math.PI) * 2.4 - k * 0.15;
    o.set([Math.cos(a) * r + jit(0.1), Math.sin(a) * r * 0.62 + jit(0.1), z + jit(0.12)], i * 3);
  }
  return o;
}
