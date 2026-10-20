/**
 * Turn a photo into the hero lattice's portrait point cloud.
 *
 *   bun tools/portrait.ts <photo.jpg> [--preview out.png]
 *
 * Writes public/portrait.bin: Int16 quads (x, y, z, shade) per point, shuffled so any prefix
 * is an even sample (phones use the first half). Positions are world units × 1000, shade is 0..1 × 32767.
 * The source photo never leaves this machine; only the derived points are published.
 *
 * Tuned for a head-and-shoulders photo on a plain wall. Adjust CFG for a new photo,
 * then check the preview before committing.
 */
import sharp from 'sharp';

const CFG = {
  /** Crop in fractions of the (EXIF-rotated) photo: x0, y0, x1, y1. Stops above the T-shirt print. */
  crop: [0.1, 0.02, 0.9, 0.79],
  /** Working width in pixels. */
  width: 360,
  /** Head ellipse in photo fractions: cx, cy, rx, ry. */
  head: [0.46, 0.3, 0.205, 0.27],
  /** Shoulder outline in photo fractions, as [y, xLeft, xRight] rows; interpolated between rows. */
  body: [
    [0.5, 0.36, 0.58],
    [0.56, 0.2, 0.72],
    [0.62, 0.06, 0.8],
    [0.8, 0.0, 0.88],
  ],
  /** RGB distance from the wall colour that still counts as wall. */
  wallTolerance: 58,
  points: 16000,
  /** Height of the portrait in world units. */
  height: 18,
  depth: 4.2,
};

const [src, ...rest] = process.argv.slice(2);
if (!src) {
  console.error('usage: bun tools/portrait.ts <photo.jpg> [--preview out.png]');
  process.exit(1);
}
const previewPath = rest[rest.indexOf('--preview') + 1] && rest.includes('--preview') ? rest[rest.indexOf('--preview') + 1] : null;

const rotated = sharp(src).rotate();
const meta = await sharp(await rotated.clone().toBuffer()).metadata();
const PW = meta.width!, PH = meta.height!;
const [cx0, cy0, cx1, cy1] = CFG.crop;
const left = Math.round(PW * cx0), top = Math.round(PH * cy0);
const cw = Math.round(PW * (cx1 - cx0)), ch = Math.round(PH * (cy1 - cy0));
const W = CFG.width, H = Math.round((W * ch) / cw);
const { data: rgb } = await rotated.extract({ left, top, width: cw, height: ch }).resize(W, H).removeAlpha().raw().toBuffer({ resolveWithObject: true });

const at = (x: number, y: number) => y * W + x;
/** Pixel → photo fraction, for the shape guide. */
const fx = (x: number) => cx0 + (x / W) * (cx1 - cx0);
const fy = (y: number) => cy0 + (y / H) * (cy1 - cy0);

/* --- luminance and blurred luminance --- */
const lum = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) lum[i] = (0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2]) / 255;
function blur(a: Float32Array, r = 1) {
  const o = new Float32Array(a.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let s = 0, n = 0;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H) { s += a[at(xx, yy)]; n++; }
    }
    o[at(x, y)] = s / n;
  }
  return o;
}
const soft = blur(lum, 1);

/* --- wall colour: median of the top corners and the gap beside the head --- */
const samples: number[][] = [];
for (const [sx, sy] of [[0.2, 0.06], [0.3, 0.1], [0.62, 0.06], [0.3, 0.45], [0.68, 0.4]]) {
  const x = Math.round(((sx - cx0) / (cx1 - cx0)) * W), y = Math.round(((sy - cy0) / (cy1 - cy0)) * H);
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
    const i = at(Math.min(W - 1, Math.max(0, x + dx)), Math.min(H - 1, Math.max(0, y + dy)));
    samples.push([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]);
  }
}
const wall = [0, 1, 2].map((c) => samples.map((s) => s[c]).sort((a, b) => a - b)[Math.floor(samples.length / 2)]);

/* --- shape guide: head ellipse + interpolated shoulder outline --- */
function inGuide(x: number, y: number) {
  const px = fx(x), py = fy(y);
  const [hx, hy, rx, ry] = CFG.head;
  if (((px - hx) / rx) ** 2 + ((py - hy) / ry) ** 2 <= 1) return true;
  const rows = CFG.body;
  if (py < rows[0][0]) return false;
  for (let i = 0; i < rows.length - 1; i++) {
    const [y0, l0, r0] = rows[i], [y1, l1, r1] = rows[i + 1];
    if (py >= y0 && py <= y1) {
      const t = (py - y0) / (y1 - y0);
      return px >= l0 + (l1 - l0) * t && px <= r0 + (r1 - r0) * t;
    }
  }
  return py > rows[rows.length - 1][0];
}

/* --- mask: inside the guide and not wall-coloured --- */
let mask = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = at(x, y);
  const d = Math.hypot(rgb[i * 3] - wall[0], rgb[i * 3 + 1] - wall[1], rgb[i * 3 + 2] - wall[2]);
  mask[i] = inGuide(x, y) && d > CFG.wallTolerance ? 1 : 0;
}
/* majority filter twice to smooth speckle */
for (let pass = 0; pass < 2; pass++) {
  const o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let s = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H) { s += mask[at(xx, yy)]; n++; }
    }
    o[at(x, y)] = s * 2 > n ? 1 : 0;
  }
  mask = o;
}
/* keep the largest connected region */
{
  const label = new Int32Array(W * H).fill(-1);
  let best = -1, bestSize = 0, id = 0;
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || label[i] >= 0) continue;
    const stack = [i]; label[i] = id; let size = 0;
    while (stack.length) {
      const p = stack.pop()!; size++;
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = at(xx, yy);
        if (mask[q] && label[q] < 0) { label[q] = id; stack.push(q); }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  for (let i = 0; i < W * H; i++) mask[i] = label[i] === best ? 1 : 0;
}
/* fill holes: anything the outside can't reach becomes part of the person */
{
  const seen = new Uint8Array(W * H), stack: number[] = [];
  for (let x = 0; x < W; x++) { stack.push(at(x, 0)); }
  for (let y = 0; y < H; y++) { stack.push(at(0, y), at(W - 1, y)); }
  while (stack.length) {
    const p = stack.pop()!;
    if (seen[p] || mask[p]) continue;
    seen[p] = 1;
    const x = p % W, y = (p / W) | 0;
    if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W);
  }
  for (let i = 0; i < W * H; i++) if (!seen[i]) mask[i] = 1;
}

/* --- distance to the silhouette edge (two-pass chamfer), used for depth --- */
const dist = new Float32Array(W * H);
for (let i = 0; i < W * H; i++) dist[i] = mask[i] ? 1e6 : 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = at(x, y); if (!dist[i]) continue;
  if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 1);
  if (y > 0) dist[i] = Math.min(dist[i], dist[i - W] + 1);
  if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - W - 1] + 1.414);
  if (x < W - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - W + 1] + 1.414);
}
for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
  const i = at(x, y); if (!dist[i]) continue;
  if (x < W - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 1);
  if (y < H - 1) dist[i] = Math.min(dist[i], dist[i + W] + 1);
  if (x < W - 1 && y < H - 1) dist[i] = Math.min(dist[i], dist[i + W + 1] + 1.414);
  if (x > 0 && y < H - 1) dist[i] = Math.min(dist[i], dist[i + W - 1] + 1.414);
}
let maxDist = 1;
for (let i = 0; i < W * H; i++) if (dist[i] > maxDist) maxDist = dist[i];

/* --- feature edges: Sobel on the blurred luminance, inside the mask --- */
const edge = new Float32Array(W * H);
let maxEdge = 1e-6;
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  const i = at(x, y); if (!mask[i] || dist[i] < 2.5) continue;
  const g = (dx: number, dy: number) => soft[at(x + dx, y + dy)];
  const gx = g(1, -1) + 2 * g(1, 0) + g(1, 1) - g(-1, -1) - 2 * g(-1, 0) - g(-1, 1);
  const gy = g(-1, 1) + 2 * g(0, 1) + g(1, 1) - g(-1, -1) - 2 * g(0, -1) - g(1, -1);
  edge[i] = Math.hypot(gx, gy);
  if (edge[i] > maxEdge) maxEdge = edge[i];
}
/* contrast-stretched luminance inside the mask (5th to 95th percentile → 0..1), for stippling density */
const tone = new Float32Array(W * H);
{
  const vals: number[] = [];
  for (let i = 0; i < W * H; i++) if (mask[i]) vals.push(soft[i]);
  vals.sort((a, b) => a - b);
  const lo = vals[Math.floor(vals.length * 0.05)], hi = vals[Math.floor(vals.length * 0.95)];
  for (let i = 0; i < W * H; i++) tone[i] = Math.min(1, Math.max(0, (soft[i] - lo) / (hi - lo || 1)));
}
const contour: number[] = [];
for (let i = 0; i < W * H; i++) if (mask[i] && dist[i] <= 1.5) contour.push(i);

/* --- sample points --- */
const N = CFG.points;
const out = new Int16Array(N * 4);
const asp = W / H, scaleY = CFG.height;
const headCx = ((CFG.head[0] - cx0) / (cx1 - cx0)) * W, headCy = ((CFG.head[1] - cy0) / (cy1 - cy0)) * H;
const headR = (CFG.head[2] / (cx1 - cx0)) * W;
const rnd = Math.random;
let n = 0;
function emit(px: number, py: number, kind: 'contour' | 'edge' | 'fill') {
  const i = at(Math.min(W - 1, Math.round(px)), Math.min(H - 1, Math.round(py)));
  const u = px / W, v = py / H;
  /* depth: a dome from the distance field, plus extra roundness on the head, plus a little from brightness */
  const dome = Math.sqrt(Math.min(dist[i] / maxDist, 1));
  const hd = Math.hypot(px - headCx, (py - headCy) * 0.85) / headR;
  const head = hd < 1 ? Math.sqrt(1 - hd * hd) * 0.6 : 0;
  const z = (dome * 0.7 + head) * CFG.depth + (soft[i] - 0.5) * 0.6 + (kind === 'contour' ? -0.2 : 0);
  /* near-even brightness: density draws the face, shade only adds a little modelling */
  const shade = 0.72 + 0.28 * (kind === 'fill' ? tone[i] : 1);
  out[n * 4] = Math.round((u - 0.5) * scaleY * asp * 1000);
  out[n * 4 + 1] = Math.round(-(v - 0.5) * scaleY * 1000);
  out[n * 4 + 2] = Math.round(z * 1000);
  out[n * 4 + 3] = Math.round(shade * 32767);
  n++;
}
/* Stippling: darker areas (hair, brows, eyes, beard) get denser points, which is what makes a face readable.
   Inside the head, edges and darkness count double so features beat the shirt for points. */
const inHead = (x: number, y: number) => Math.hypot(x - headCx, (y - headCy) * 0.8) < headR * 1.05;
const nContour = Math.round(N * 0.14), nEdge = Math.round(N * 0.3), nFill = N - nContour - nEdge;
for (let k = 0; k < nContour; k++) { const p = contour[Math.floor(rnd() * contour.length)]; emit((p % W) + rnd() - 0.5, ((p / W) | 0) + rnd() - 0.5, 'contour'); }
for (let k = 0, guard = 0; k < nEdge && guard < N * 4000; guard++) {
  const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), i = at(x, y);
  if (!mask[i]) continue;
  const w = Math.pow(edge[i] / maxEdge, 0.6) * (inHead(x, y) ? 2.4 : 0.3);
  if (rnd() > w) continue;
  emit(x + rnd() - 0.5, y + rnd() - 0.5, 'edge'); k++;
}
for (let k = 0, guard = 0; k < nFill && guard < N * 4000; guard++) {
  const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), i = at(x, y);
  if (!mask[i]) continue;
  const w = (0.03 + Math.pow(1 - tone[i], 3)) * (inHead(x, y) ? 1.4 : 0.18);
  if (rnd() > w) continue;
  emit(x + rnd() - 0.5, y + rnd() - 0.5, 'fill'); k++;
}
if (n < N) throw new Error(`only placed ${n} of ${N} points; loosen the mask`);

/* shuffle quads so any prefix is an even sample */
for (let i = N - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  for (let c = 0; c < 4; c++) { const t = out[i * 4 + c]; out[i * 4 + c] = out[j * 4 + c]; out[j * 4 + c] = t; }
}
await Bun.write(new URL('../public/portrait.bin', import.meta.url), out.buffer);
console.log(`portrait.bin: ${N} points, ${(out.byteLength / 1024).toFixed(0)} KB, mask ${((mask.reduce((a, b) => a + b, 0) / (W * H)) * 100).toFixed(0)}% of ${W}x${H}, wall rgb(${wall.join(',')})`);

/* preview: mask tint on the left, points on the right */
if (previewPath) {
  const PV = new Uint8Array(W * 2 * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = at(x, y), o = (y * W * 2 + x) * 3;
    PV[o] = mask[i] ? rgb[i * 3] : rgb[i * 3] * 0.25; PV[o + 1] = mask[i] ? rgb[i * 3 + 1] : rgb[i * 3 + 1] * 0.25; PV[o + 2] = mask[i] ? rgb[i * 3 + 2] : 120;
  }
  for (let k = 0; k < N; k++) {
    const x = Math.round((out[k * 4] / 1000 / (scaleY * asp) + 0.5) * W), y = Math.round((-out[k * 4 + 1] / 1000 / scaleY + 0.5) * H);
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const o = (y * W * 2 + W + x) * 3, s = 255 * (out[k * 4 + 3] / 32767);
    PV[o] = Math.min(255, PV[o] + s * 0.35); PV[o + 1] = Math.min(255, PV[o + 1] + s * 0.45); PV[o + 2] = Math.min(255, PV[o + 2] + s * 0.7);
  }
  await sharp(PV, { raw: { width: W * 2, height: H, channels: 3 } }).png().toFile(previewPath);
  console.log(`preview: ${previewPath}`);
}
