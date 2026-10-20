/**
 * Hero photo: cut the person out of a photo and tone them in the site's blue duotone.
 *
 *   bun add -d @imgly/background-removal-node   # one-off, ~150 MB, not kept in package.json
 *   bun tools/hero-photo.ts <photo.jpg> <x0> <y0> <x1> <y1>
 *
 * x0..y1 crop the (EXIF-rotated) photo first, as fractions; use them to trim borders.
 * Writes public/hero.webp (800 wide) and public/hero-sm.webp (400 wide) with transparency.
 * The background removal runs locally; the original photo never leaves this machine and
 * only the toned cut-out is published.
 */
import sharp from 'sharp';

const [src, ...nums] = process.argv.slice(2);
if (!src || nums.length < 4) {
  console.error('usage: bun tools/hero-photo.ts <photo.jpg> <x0> <y0> <x1> <y1>   (e.g. 0.11 0.105 0.995 0.915)');
  process.exit(1);
}
const [x0, y0, x1, y1] = nums.map(Number);

let removeBackground: (img: Blob, cfg: object) => Promise<Blob>;
try {
  ({ removeBackground } = await import('@imgly/background-removal-node'));
} catch {
  console.error('Missing @imgly/background-removal-node. Run: bun add -d @imgly/background-removal-node');
  process.exit(1);
}

/* navy → blue → ice, the site palette */
const STOPS: [number, [number, number, number]][] = [[0, [9, 13, 30]], [0.55, [70, 100, 220]], [1, [200, 215, 255]]];
function ramp(t: number): [number, number, number] {
  for (let k = 0; k < STOPS.length - 1; k++) {
    const [t0, c0] = STOPS[k], [t1, c1] = STOPS[k + 1];
    if (t <= t1) { const f = (t - t0) / (t1 - t0); return [0, 1, 2].map((i) => Math.round(c0[i] + (c1[i] - c0[i]) * f)) as [number, number, number]; }
  }
  return STOPS[STOPS.length - 1][1];
}

const base = sharp(src).rotate();
const { width: PW = 0, height: PH = 0 } = await sharp(await base.clone().toBuffer()).metadata();
const crop = { left: Math.round(x0 * PW), top: Math.round(y0 * PH), width: Math.round((x1 - x0) * PW), height: Math.round((y1 - y0) * PH) };
const cropped = await base.clone().extract(crop).png().toBuffer();

const cut = Buffer.from(await (await removeBackground(new Blob([cropped], { type: 'image/png' }), { model: 'medium', output: { format: 'image/png' } })).arrayBuffer());

for (const [file, W] of [['hero.webp', 800], ['hero-sm.webp', 400]] as const) {
  const H = Math.round((W * crop.height) / crop.width);
  const { data } = await sharp(cut).resize(W, H).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // tone from the person's own brightness range, so the background never skews contrast
  const lum = new Float32Array(W * H);
  const vals: number[] = [];
  for (let i = 0; i < W * H; i++) {
    lum[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
    if (data[i * 4 + 3] > 200) vals.push(lum[i]);
  }
  vals.sort((a, b) => a - b);
  const lo = vals[Math.floor(vals.length * 0.01)], hi = vals[Math.floor(vals.length * 0.99)];
  const out = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const v = Math.min(1, Math.max(0, (lum[i] - lo) / (hi - lo) + (Math.random() - 0.5) * 0.04));
    const [r, g, b] = ramp(Math.pow(v, 0.9));
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b;
    // tighten the edge a little so no sky fringe survives around the hair
    out[i * 4 + 3] = Math.max(0, Math.min(255, (data[i * 4 + 3] - 30) * 1.15));
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 84, alphaQuality: 90 }).toFile(new URL(`../public/${file}`, import.meta.url).pathname);
  console.log(`public/${file} ${W}×${H}`);
}
