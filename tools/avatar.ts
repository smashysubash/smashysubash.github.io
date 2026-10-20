/**
 * Line-art avatar → hero lattice points.
 *
 *   bun tools/avatar.ts [--photo path.jpg] [--out dir]
 *
 * The avatar is drawn by hand as feature outlines (hair, brows, eyes, nose, beard, ...) on a
 * 600×720 canvas traced over a front-facing photo, cross-checked against the other photos.
 * It is rendered to SVG, then sampled into soft points: dotted outlines plus a light fill in
 * the hair and beard. Writes public/portrait.bin (same format the lattice already reads).
 *
 * --photo writes an overlay preview so the drawing can be checked against the face.
 * The photo is only read locally; nothing from it is published except this drawing's points.
 */
import sharp from 'sharp';

type P = [number, number];
const W = 600, H = 720;

/* ---------- the drawing (600×720 canvas, y down) ---------- */

/** Outer silhouette of the hair, left temple → crown → right temple. */
const hairOuter: P[] = [[172, 268], [146, 240], [122, 214], [104, 186], [98, 160], [104, 134], [118, 110], [134, 94], [152, 78], [172, 64], [194, 50], [218, 40], [242, 30], [264, 28], [284, 22], [306, 26], [326, 20], [348, 28], [370, 36], [390, 50], [406, 68], [420, 92], [430, 120], [432, 150], [428, 184], [420, 220], [414, 262]];
/** Hairline over the forehead, right temple → left temple, closing the hair shape. */
const hairline: P[] = [[414, 262], [406, 226], [392, 202], [362, 186], [324, 178], [300, 182], [276, 178], [240, 186], [206, 204], [186, 232], [172, 268]];
/** A few swept strands for texture, from the front hairline up and back. */
const strands: P[][] = [
  // long sweeps fanning out from the front: centre goes up, sides sweep out and back
  [[298, 182], [296, 140], [290, 92], [280, 40]],
  [[266, 184], [250, 140], [234, 96], [212, 56]],
  [[332, 182], [344, 140], [350, 96], [346, 50]],
  [[232, 194], [204, 156], [176, 122], [150, 96]],
  [[366, 190], [390, 152], [404, 112], [408, 80]],
  [[200, 210], [164, 186], [134, 158], [114, 128]],
  [[398, 212], [418, 182], [426, 146]],
  // shorter inner strands for texture
  [[282, 120], [268, 84], [250, 58]],
  [[318, 116], [326, 80], [324, 50]],
  [[220, 140], [196, 110], [172, 92]],
  [[372, 126], [384, 94], [384, 66]],
];
/** Face outline: left temple → jaw → chin → right temple. */
const face: P[] = [[176, 266], [180, 306], [188, 356], [202, 412], [222, 454], [252, 482], [304, 496], [354, 484], [388, 456], [412, 412], [424, 360], [426, 306], [418, 264]];
const earL: P[] = [[180, 300], [164, 300], [154, 322], [158, 352], [170, 376], [188, 386]];
const earR: P[] = [[424, 302], [438, 310], [440, 340], [434, 368], [422, 380]];
const browL: P[] = [[204, 290], [226, 279], [254, 275], [284, 283]];
const browR: P[] = [[320, 280], [348, 270], [378, 267], [406, 278]];
const eyeL: P[] = [[210, 317], [224, 306], [246, 304], [266, 315], [246, 324], [226, 324], [210, 317]];
const eyeR: P[] = [[336, 306], [352, 295], [374, 294], [393, 303], [374, 313], [354, 314], [336, 306]];
const irisL: P = [238, 314], irisR: P = [363, 303];
const noseBridge: P[] = [[288, 318], [284, 344], [276, 368]];
const noseBase: P[] = [[268, 372], [276, 386], [300, 393], [324, 386], [334, 372]];
const nostrils: P[][] = [[[282, 384], [290, 380]], [[312, 380], [320, 384]]];
const moustache: P[] = [[262, 404], [284, 394], [304, 397], [324, 393], [348, 403]];
const lipTop: P[] = [[276, 413], [292, 408], [304, 411], [318, 408], [336, 413]];
const lipBottom: P[] = [[282, 420], [304, 434], [330, 420]];
/** Beard area: along the jaw from ear to ear, under the lips to the chin. Closed shape. */
const beard: P[] = [[188, 366], [196, 408], [214, 446], [244, 478], [304, 496], [360, 482], [392, 452], [412, 410], [422, 366], [408, 392], [380, 418], [350, 420], [336, 432], [304, 446], [272, 432], [256, 420], [226, 414], [200, 392]];
const neck: P[][] = [[[258, 484], [256, 520]], [[352, 484], [356, 516]]];
const collar: P[] = [[214, 478], [246, 516], [304, 532], [362, 514], [394, 474]];
const shoulderL: P[] = [[214, 478], [150, 504], [80, 530], [24, 566]];
const shoulderR: P[] = [[394, 474], [460, 488], [530, 516], [584, 556]];

/* ---------- geometry helpers ---------- */

/** Catmull-Rom through the points → smooth SVG path. */
function smooth(pts: P[], closed = false) {
  const p = closed ? [pts[pts.length - 2], ...pts, pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [p0, p1, p2, p3] = [p[i - 1], p[i], p[i + 1], p[i + 2]];
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return closed ? d + ' Z' : d;
}
const lines = [hairOuter, hairline, ...strands, face, earL, earR, browL, browR, eyeL, eyeR, noseBridge, noseBase, ...nostrils, moustache, lipTop, lipBottom, ...neck, collar, shoulderL, shoulderR];
const strokeSvg = (color: string, width: number) =>
  lines.map((l) => `<path d="${smooth(l)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`).join('') +
  [irisL, irisR].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${color}"/>`).join('');
const hairShape = smooth([...hairOuter, ...hairline.slice(1)], true);
const beardShape = smooth(beard, true);
const faceShape = smooth([...face, ...hairline.slice(1, -1)], true);

const svg = (body: string, bg = 'none') => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${body}</svg>`;
async function raster(body: string) {
  const { data } = await sharp(Buffer.from(svg(body, 'black'))).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data; // 1 channel, 0..255
}

/* ---------- args ---------- */
const args = process.argv.slice(2);
const opt = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const photo = opt('--photo');
const out = opt('--out') ?? '.';

/* ---------- previews ---------- */
await sharp(Buffer.from(svg(`<path d="${hairShape}" fill="#1b2a4a"/><path d="${beardShape}" fill="#1b2a4a"/>` + strokeSvg('#7DA2FF', 3), '#090D15'))).png().toFile(`${out}/avatar-lines.png`);
if (photo) {
  const base = await sharp(photo).rotate().extract(await (async () => {
    const m = await sharp(photo).rotate().toBuffer({ resolveWithObject: true }).then((r) => r.info);
    // same crop as the tracing canvas: x 0.12–0.88, y 0–0.80 of the photo
    return { left: Math.round(m.width * 0.12), top: 0, width: Math.round(m.width * 0.76), height: Math.round(m.height * 0.8) };
  })()).resize(W, H).toBuffer();
  await sharp(base).composite([{ input: Buffer.from(svg(strokeSvg('#00ff88', 2.5))) }]).jpeg({ quality: 88 }).toFile(`${out}/avatar-overlay.jpg`);
}

/* ---------- points ---------- */
const N = 16000;
const strokesR = await raster(strokeSvg('white', 4));
const hairR = await raster(`<path d="${hairShape}" fill="white"/>`);
const beardR = await raster(`<path d="${beardShape}" fill="white"/>`);
const faceR = await raster(`<path d="${faceShape}" fill="white"/>`);
const bodyR = await raster(`<path d="M24,566 C80,530 150,504 214,478 L394,474 C460,488 530,516 584,556 L600,720 L0,720 Z" fill="white"/>`);

const rnd = Math.random;
const outQ = new Int16Array(N * 4);
let n = 0;
/* world units: 18 tall, centred on the face */
const S = 18 / H, cx = 300, cy = 330;
function depth(x: number, y: number) {
  // head as an ellipsoid; body sits further back
  const hx = (x - 300) / 165, hy = (y - 290) / 230;
  const h = 1 - hx * hx - hy * hy;
  if (y < 500 && h > 0) return Math.sqrt(h) * 3.4 + (Math.abs(x - 301) < 20 && y > 330 && y < 395 ? (395 - Math.abs(y - 362)) / 395 * 0.9 : 0);
  return Math.max(0, 1.2 - Math.abs(x - 300) / 300) * 1.4 - 0.6;
}
function emit(x: number, y: number, shade: number) {
  outQ[n * 4] = Math.round((x - cx) * S * 1000);
  outQ[n * 4 + 1] = Math.round(-(y - cy) * S * 1000);
  outQ[n * 4 + 2] = Math.round((depth(x, y) + (rnd() - 0.5) * 0.12) * 1000);
  outQ[n * 4 + 3] = Math.round(shade * 32767);
  n++;
}
/** Rejection-sample `count` points where `weight(i)` says so. */
function sample(count: number, weight: (i: number, x: number, y: number) => number, shade: number) {
  for (let k = 0, guard = 0; k < count && guard < count * 3000; guard++) {
    const x = rnd() * W, y = rnd() * H, i = Math.floor(y) * W + Math.floor(x);
    if (rnd() > weight(i, x, y)) continue;
    emit(x, y, shade + (rnd() - 0.5) * 0.1);
    k++;
  }
}
// Budget: outlines carry the likeness; fills are light so it reads soft, never as a mask.
sample(Math.round(N * 0.6), (i) => strokesR[i] / 255, 1);
sample(Math.round(N * 0.16), (i) => (hairR[i] / 255) * 0.9, 0.75);
sample(Math.round(N * 0.1), (i) => (beardR[i] / 255) * 0.9, 0.7);
sample(Math.round(N * 0.04), (i) => (faceR[i] / 255) * (hairR[i] || beardR[i] ? 0 : 0.5), 0.5);
sample(N - n, (i, _x, y) => (bodyR[i] / 255) * Math.max(0.05, 1 - (y - 480) / 160), 0.45);

for (let i = N - 1; i > 0; i--) {
  const j = Math.floor(rnd() * (i + 1));
  for (let c = 0; c < 4; c++) { const t = outQ[i * 4 + c]; outQ[i * 4 + c] = outQ[j * 4 + c]; outQ[j * 4 + c] = t; }
}
await Bun.write(new URL('../public/portrait.bin', import.meta.url), outQ.buffer);

/* dots preview: orthographic, like the OG card */
const PV = new Float32Array(W * H);
for (let k = 0; k < N; k++) {
  const x = Math.round(outQ[k * 4] / 1000 / S + cx), y = Math.round(-outQ[k * 4 + 1] / 1000 / S + cy);
  if (x >= 0 && y >= 0 && x < W && y < H) PV[y * W + x] += 0.5 + 0.5 * (outQ[k * 4 + 3] / 32767);
}
const rgb = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) { const a = Math.min(1, PV[i]); rgb[i * 3] = 9 + a * 116; rgb[i * 3 + 1] = 13 + a * 149; rgb[i * 3 + 2] = 21 + a * 234; }
await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).png().toFile(`${out}/avatar-dots.png`);
console.log(`portrait.bin: ${n} points → ${out}/avatar-lines.png, avatar-dots.png${photo ? ', avatar-overlay.jpg' : ''}`);
