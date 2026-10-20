/**
 * Build-time social preview images (1200×630): Satori lays out the card, sharp rasterises it.
 * The photo on the right is the same cut-out-in-a-card as the hero.
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

/** The hero cut-out standing in its card, head above the card's top edge, as a PNG data URI. */
let photoP: Promise<string> | null = null;
function photo(w = 400, h = 500) {
  photoP ??= (async () => {
    const top = Math.round(h * 0.26), r = 26;
    const card = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs><radialGradient id="g" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="${C.accent}" stop-opacity=".45"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></radialGradient></defs>
      <rect x="0.5" y="${top}" width="${w - 1}" height="${h - top - 0.5}" rx="${r}" fill="#0D131F" stroke="${C.line}"/>
      <rect x="0.5" y="${top}" width="${w - 1}" height="${h - top - 0.5}" rx="${r}" fill="url(#g)"/></svg>`);
    const person = await sharp(join(root, 'public/hero.webp')).resize(w).png().toBuffer();
    const pm = await sharp(person).metadata();
    // round the person's bottom corners to match the card
    const clip = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${pm.height}"><path d="M0,0 H${w} V${pm.height! - r} Q${w},${pm.height} ${w - r},${pm.height} H${r} Q0,${pm.height} 0,${pm.height! - r} Z" fill="#fff"/></svg>`);
    const clipped = await sharp(person).composite([{ input: clip, blend: 'dest-in' }]).png().toBuffer();
    const png = await sharp(card).composite([{ input: clipped, left: 0, top: h - pm.height! }]).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  })();
  return photoP;
}

/** Cut at a word boundary so previews never end mid-word. */
const clip = (t: string, n: number) => (t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n - 1)).replace(/[,.;:]$/, '') + '…');

type Node = { type: string; props: Record<string, unknown> & { children?: unknown } };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

export async function renderOg(opts: { eyebrow: string; title: string; subtitle: string; chips?: string[] }) {
  const img = await photo();
  const tree = el('div', { width: W, height: H, display: 'flex', background: C.bg, color: C.ink, fontFamily: 'Plex Mono', position: 'relative' }, [
    el('img', { position: 'absolute', right: 70, top: 65, width: 400, height: 500 }, undefined, { src: img, width: 400, height: 500 }),
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
