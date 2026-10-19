/**
 * Point-cloud shapes for the lattice, one per home-page section.
 * Each builder returns a Float32Array of N xyz triples, roughly within a 20-unit box around the origin.
 */

export type Shape = Float32Array;

const rnd = Math.random;
const jit = (a: number) => (rnd() - 0.5) * a;

function ball(r: number): [number, number, number] {
  let x = jit(2), y = jit(2), z = jit(2);
  const l = Math.hypot(x, y, z) || 1;
  const k = (r * Math.cbrt(rnd())) / l;
  return [x * k, y * k, z * k];
}

function build(n: number, fn: (i: number) => [number, number, number]): Shape {
  const o = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) o.set(fn(i), i * 3);
  return o;
}

/** Point along the outline of a w×h rectangle centred on the origin. */
function rectEdge(w: number, h: number): [number, number] {
  const t = rnd() * 4;
  if (t < 1) return [-w / 2 + w * t, -h / 2];
  if (t < 2) return [w / 2, -h / 2 + h * (t - 1)];
  if (t < 3) return [w / 2 - w * (t - 2), h / 2];
  return [-w / 2, h / 2 - h * (t - 3)];
}

/** Intro fallback until the portrait loads. */
export function sphere(n: number): Shape {
  const g = Math.PI * (3 - Math.sqrt(5));
  return build(n, (i) => {
    const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i;
    return [Math.cos(t) * r * 8.5, y * 8.5, Math.sin(t) * r * 8.5];
  });
}

/** Impact: 12 server racks, the last 4 cut down (the 35%). */
export function fleet(n: number): Shape {
  return build(n, (i) => {
    const k = i % 12, cx = ((k % 4) - 1.5) * 4.2, cz = (Math.floor(k / 4) - 1) * 4.2, h = k > 7 ? 3.8 : 6.8;
    return [cx + jit(2.6), -4.5 + rnd() * h, cz + jit(2.6)];
  });
}

/** Experience: three rising steps, intern to SE. */
export function ladder(n: number): Shape {
  return build(n, (i) => {
    const k = i % 3;
    if (rnd() < 0.9) return [(k - 1) * 6.5 + jit(5), (k - 1) * 4.2 + jit(0.9), jit(4.5)];
    const t = rnd();
    return [-6.5 + 13 * t + jit(0.2), -4.2 + 8.4 * t + 1.2 + jit(0.2), jit(0.2)];
  });
}

/** Platform: one core service, six tenant databases, links between. */
export function tenants(n: number): Shape {
  const nodes: [number, number, number][] = [];
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; nodes.push([Math.cos(a) * 8, Math.sin(a) * 5, Math.sin(a * 2) * 3]); }
  return build(n, (i) => {
    const q = rnd(), node = nodes[i % 6];
    if (q < 0.3) return ball(2.7);
    if (q < 0.62) { const w = ball(1.3); return [node[0] + w[0], node[1] + w[1], node[2] + w[2]]; }
    const t = rnd();
    return [node[0] * t + jit(0.25), node[1] * t + jit(0.25), node[2] * t + jit(0.25)];
  });
}

/** AI: three layers of nodes with links between neighbours. */
export function neural(n: number): Shape {
  const L: [number, number, number, number][] = [];
  for (let l = 0; l < 3; l++) for (let a = 0; a < 5; a++) for (let b = 0; b < 5; b++) L.push([(l - 1) * 7, (a - 2) * 2.2, (b - 2) * 2.2, l]);
  return build(n, (i) => {
    if (rnd() < 0.4) { const p = L[i % 75]; return [p[0] + jit(0.5), p[1] + jit(0.5), p[2] + jit(0.5)]; }
    const A = L[Math.floor(rnd() * 50)], B = L[(A[3] + 1) * 25 + Math.floor(rnd() * 25)], t = rnd();
    return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
  });
}

/** Skills: one cluster per skill group, sized by how many skills it holds. */
export function clusters(n: number, sizes: number[]): Shape {
  const total = sizes.reduce((a, b) => a + b, 0) || 1;
  const centres = sizes.map((s, k) => {
    const a = (k / sizes.length) * Math.PI * 2 - Math.PI / 2;
    return { c: [Math.cos(a) * 7.5, Math.sin(a) * 6.2, 0], r: 0.9 + Math.sqrt(s) * 0.6 };
  });
  return build(n, (i) => {
    const u = i % total; let k = 0, acc = 0;
    for (; k < sizes.length - 1; k++) { acc += sizes[k]; if (u < acc) break; }
    const g = centres[k], v = ball(g.r);
    return [g.c[0] + v[0], g.c[1] + v[1], g.c[2] + v[2]];
  });
}

/** Certifications: hexagon badge with ribbon tails. */
export function badge(n: number): Shape {
  return build(n, () => {
    const q = rnd();
    if (q < 0.45) {
      const s = Math.floor(rnd() * 6), t = rnd();
      const a0 = (s / 6) * Math.PI * 2 + Math.PI / 6, a1 = ((s + 1) / 6) * Math.PI * 2 + Math.PI / 6;
      return [6.5 * (Math.cos(a0) + (Math.cos(a1) - Math.cos(a0)) * t) + jit(0.15), 1.5 + 6.5 * (Math.sin(a0) + (Math.sin(a1) - Math.sin(a0)) * t) + jit(0.15), jit(0.4)];
    }
    if (q < 0.75) { const a = rnd() * Math.PI * 2, r = 4 + jit(0.2); return [Math.cos(a) * r, 1.5 + Math.sin(a) * r, jit(0.3)]; }
    const side = rnd() < 0.5 ? -1 : 1, t = rnd();
    return [side * (1.5 + t * 2) + jit(0.6), -4.5 - t * 5, jit(0.3)];
  });
}

/** Writing: three stacked sheets with lines of text. */
export function pages(n: number): Shape {
  return build(n, (i) => {
    const k = i % 3, ox = (k - 1) * 1.6, oy = (1 - k) * 1.2, oz = (k - 1) * 2.2;
    let x: number, y: number;
    if (rnd() < 0.35) [x, y] = rectEdge(8, 11);
    else { const ln = Math.floor(rnd() * 7); x = -3 + rnd() * (ln % 3 === 2 ? 4 : 6); y = 4 - ln * 1.35; }
    return [x + ox + jit(0.1), y + oy + jit(0.1), oz + jit(0.15)];
  });
}

/** Contact: an NFC tag with its wave mark and a tick. */
export function nfcTag(n: number): Shape {
  return build(n, (i) => {
    const q = rnd();
    let x: number, y: number;
    if (q < 0.4) [x, y] = rectEdge(13, 9);
    else if (q < 0.9) { const r = [1.4, 2.6, 3.8][i % 3], a = (rnd() - 0.5) * Math.PI * 0.6; x = -3 + Math.cos(a) * r; y = Math.sin(a) * r; }
    else {
      const t = rnd();
      if (t < 0.35) { x = 2 + (t / 0.35) * 1.2; y = -0.5 - (t / 0.35) * 1.2; }
      else { const k = (t - 0.35) / 0.65; x = 3.2 + k * 2.6; y = -1.7 + k * 3.2; }
    }
    return [x + jit(0.12), y + jit(0.12), jit(0.3)];
  });
}

export type PortraitConfig = {
  src: string;
  crop: number[];
  focus: number[];
  radius: number;
  height: number;
  depth: number;
};

/**
 * Portrait relief: points land where the photo is bright, faded out towards the edges,
 * with depth from brightness plus a gentle bulge. Resolves to null if the image fails.
 */
export function portrait(n: number, cfg: PortraitConfig): Promise<{ shape: Shape; lum: Float32Array } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      const S = 160, c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d', { willReadFrequently: true });
      if (!g) return resolve(null);
      const [x0, y0, x1, y1] = cfg.crop;
      const sw = img.width * (x1 - x0), sh = img.height * (y1 - y0);
      g.drawImage(img, img.width * x0, img.height * y0, sw, sh, 0, 0, S, S);
      const d = g.getImageData(0, 0, S, S).data, L = new Float32Array(S * S);
      for (let p = 0; p < S * S; p++) L[p] = (0.299 * d[p * 4] + 0.587 * d[p * 4 + 1] + 0.114 * d[p * 4 + 2]) / 255;
      const fx = (cfg.focus[0] - x0) / (x1 - x0), fy = (cfg.focus[1] - y0) / (y1 - y0);
      const out = new Float32Array(n * 3), lum = new Float32Array(n), asp = sw / sh, H = cfg.height;
      let k = 0, guard = 0;
      while (k < n && guard < n * 400) {
        guard++;
        const u = rnd(), v = rnd(), l = L[Math.floor(v * S) * S + Math.floor(u * S)];
        const dd = Math.hypot((u - fx) * asp, v - fy) / cfg.radius;
        if (rnd() > Math.pow(l, 1.5) * Math.min(Math.max(1.35 - dd, 0), 1)) continue;
        const bulge = Math.cos(Math.min(dd, 1.2) * 1.2) * 2.2;
        out.set([(u - 0.5) * H * asp + jit(0.08), -(v - 0.5) * H + jit(0.08), (l - 0.5) * cfg.depth + bulge + jit(0.15)], k * 3);
        lum[k] = l;
        k++;
      }
      resolve(k < n ? null : { shape: out, lum });
    };
    img.src = cfg.src;
  });
}
