/**
 * Build-time social preview images (1200×630): Satori lays out the card, sharp rasterises it.
 * The portrait on the right is drawn from the same points as the hero lattice.
 */
import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const W = 1200, H = 630;
const C = { bg: '#090D15', ink: '#E8EDF5', muted: '#94A1B6', line: '#25314A', accent: '#7DA2FF', warm: '#FFB547' };
const root = process.cwd();
const font = (pkg: string, file: string) => readFile(join(root, 'node_modules/@fontsource', pkg, 'files', file));

let fontsP: Promise<{ name: string; data: Buffer; weight: 400 | 500 | 800 | 900; style: 'normal' }[]> | null = null;
function fonts() {
  fontsP ??= Promise.all([
    font('archivo', 'archivo-latin-800-normal.woff').then((data) => ({ name: 'Archivo', data, weight: 800 as const, style: 'normal' as const })),
    font('archivo', 'archivo-latin-900-normal.woff').then((data) => ({ name: 'Archivo', data, weight: 900 as const, style: 'normal' as const })),
    font('ibm-plex-mono', 'ibm-plex-mono-latin-400-normal.woff').then((data) => ({ name: 'Plex Mono', data, weight: 400 as const, style: 'normal' as const })),
    font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff').then((data) => ({ name: 'Plex Mono', data, weight: 500 as const, style: 'normal' as const })),
  ]);
  return fontsP;
}

/** Orthographic dot rendering of public/portrait.bin, as a PNG data URI. */
let portraitP: Promise<string> | null = null;
function portrait(w = 460, h = 560) {
  portraitP ??= (async () => {
    const q = new Int16Array((await readFile(join(root, 'public/portrait.bin'))).buffer.slice(0));
    const n = q.length / 4, acc = new Float32Array(w * h);
    // portrait spans roughly ±11 × ±9 world units; fit the height with a little margin
    const s = (h * 0.92) / 18;
    for (let i = 0; i < n; i++) {
      const x = Math.round(w / 2 + (q[i * 4] / 1000) * s), y = Math.round(h / 2 - (q[i * 4 + 1] / 1000) * s);
      const v = 0.5 + 0.5 * (q[i * 4 + 3] / 32767);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h) acc[yy * w + xx] += v * (dx || dy ? 0.18 : 0.75);
      }
    }
    const rgba = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      const a = Math.min(1, acc[i]);
      rgba[i * 4] = 125; rgba[i * 4 + 1] = 162; rgba[i * 4 + 2] = 255; rgba[i * 4 + 3] = Math.round(a * 255);
    }
    const png = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  })();
  return portraitP;
}

/** Cut at a word boundary so previews never end mid-word. */
const clip = (t: string, n: number) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n - 1)).replace(/[,.;:]$/, '') + '…');

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

export async function renderOg(opts: { eyebrow: string; title: string; subtitle: string; chips?: string[] }) {
  const img = await portrait();
  const tree = el('div', { width: W, height: H, display: 'flex', background: C.bg, color: C.ink, fontFamily: 'Plex Mono', position: 'relative' }, [
    el('img', { position: 'absolute', right: 30, top: 35, width: 460, height: 560, opacity: 0.95 }, undefined, { src: img, width: 460, height: 560 }),
    el('div', { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px 84px', width: 720, height: H, boxSizing: 'border-box' }, [
      el('div', { display: 'flex', fontSize: 22, letterSpacing: 3, color: C.warm, textTransform: 'uppercase' }, opts.eyebrow),
      el('div', { display: 'flex', flexDirection: 'column', gap: 18 }, [
        el('div', { display: 'flex', width: 576, fontFamily: 'Archivo', fontWeight: 900, fontSize: opts.title.length > 22 ? 58 : 76, lineHeight: 1.02, letterSpacing: -2 }, opts.title),
        el('div', { display: 'flex', width: 576, fontSize: 24, lineHeight: 1.45, color: C.muted }, clip(opts.subtitle, 118)),
      ]),
      el('div', { display: 'flex', width: 576, fontSize: 20, color: C.accent }, (opts.chips ?? []).slice(0, 5).join('  ·  ')),
    ]),
    el('div', { position: 'absolute', left: 72, bottom: 30, display: 'flex', fontSize: 18, color: C.accent }, 'smashysubash.github.io'),
  ]);
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: W, height: H, fonts: await fonts() });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
