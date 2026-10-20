/**
 * Hero photo: crop a head-and-shoulders 4:5 frame and tone it in the site's blue duotone.
 *
 *   bun tools/hero-photo.ts <photo.jpg> <x0> <y0> <x1>
 *
 * x0, y0, x1 are fractions of the (EXIF-rotated) photo: left edge, top edge, right edge.
 * The height follows from the 4:5 ratio. Writes public/hero.webp (880×1100) and
 * public/hero-sm.webp (440×550). Only the toned result is published; the original stays local.
 */
import sharp from 'sharp';

const [src, ...nums] = process.argv.slice(2);
if (!src || nums.length < 3) {
  console.error('usage: bun tools/hero-photo.ts <photo.jpg> <x0> <y0> <x1>   (e.g. 0.16 0.12 0.84)');
  process.exit(1);
}
const [x0, y0, x1] = nums.map(Number);

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
const w = Math.round((x1 - x0) * PW), h = Math.round(w * 1.25);
const left = Math.round(x0 * PW), top = Math.round(y0 * PH);
if (top + h > PH) throw new Error(`crop runs past the bottom of the photo (${top + h} > ${PH}); lower y0 or narrow x0..x1`);

for (const [file, W] of [['hero.webp', 880], ['hero-sm.webp', 440]] as const) {
  const H = Math.round(W * 1.25);
  const { data } = await base.clone().extract({ left, top, width: w, height: h }).resize(W, H).greyscale().linear(1.15, -18).normalise({ lower: 1, upper: 99 }).raw().toBuffer({ resolveWithObject: true });
  const rgb = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    // light film grain so flat areas don't band
    const v = Math.min(255, Math.max(0, data[i] + (Math.random() - 0.5) * 10)) / 255;
    const [r, g, b] = ramp(v);
    rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b;
  }
  await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 82 }).toFile(new URL(`../public/${file}`, import.meta.url).pathname);
  console.log(`public/${file} ${W}×${H}`);
}
