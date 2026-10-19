/**
 * Living lattice: one point cloud behind the page that morphs into a new shape per section.
 * Sections opt in with `data-shape` (see SHAPES); the hero uses `data-shape="portrait"`.
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Color, Group,
  NormalBlending, PerspectiveCamera, Points, PointsMaterial, Scene, WebGLRenderer,
} from 'three';
import * as S from './shapes';

const N = 4200;
/** Stops where the shape faces the viewer instead of slowly spinning. */
const FLAT = new Set(['portrait', 'badge', 'pages', 'tag']);

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

function shapeFor(el: HTMLElement, sphere: S.Shape): S.Shape {
  switch (el.dataset.shape) {
    case 'fleet': return S.fleet(N);
    case 'ladder': return S.ladder(N);
    case 'tenants': return S.tenants(N);
    case 'neural': return S.neural(N);
    case 'clusters': return S.clusters(N, (el.dataset.sizes ?? '').split(',').map(Number).filter(Boolean));
    case 'badge': return S.badge(N);
    case 'pages': return S.pages(N);
    case 'tag': return S.nfcTag(N);
    default: return new Float32Array(sphere);
  }
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,.65)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

export function startLattice(canvas: HTMLCanvasElement) {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const secs = [...document.querySelectorAll<HTMLElement>('[data-shape]')];
  const hud = document.getElementById('hud');
  if (!secs.length) return;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true });
  } catch {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new Scene();
  const cam = new PerspectiveCamera(42, 1, 0.1, 200);
  cam.position.set(0, 0, 30);

  const sphere = S.sphere(N);
  const shapes = secs.map((el) => shapeFor(el, sphere));
  const sides = secs.map((el) => (el.classList.contains('right') ? 1 : -1));
  const flat = secs.map((el) => FLAT.has(el.dataset.shape ?? ''));
  const heroIdx = secs.findIndex((el) => el.dataset.shape === 'portrait');

  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), kcol = new Float32Array(N * 3);
  const delay = new Float32Array(N), kind = new Uint8Array(N);
  let lum: Float32Array = new Float32Array(N).fill(0.6);
  for (let i = 0; i < N; i++) { delay[i] = Math.random() * 0.35; const q = Math.random(); kind[i] = q < 0.8 ? 0 : q < 0.95 ? 1 : 2; }
  pos.set(shapes[0]);

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('color', new BufferAttribute(col, 3));
  const mat = new PointsMaterial({ size: 0.26, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false });
  const group = new Group();
  group.add(new Points(geo, mat));
  scene.add(group);

  /* theme */
  const accent = new Color();
  let dark = true;
  const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme() {
    const cs = getComputedStyle(root);
    dark = isDark();
    renderer.setClearColor(new Color(cs.getPropertyValue('--bg').trim()));
    const pal = ['--pt-a', '--pt-o', '--pt-w'].map((v) => new Color(cs.getPropertyValue(v).trim()));
    for (let i = 0; i < N; i++) { const c = pal[kind[i]]; kcol[i * 3] = c.r; kcol[i * 3 + 1] = c.g; kcol[i * 3 + 2] = c.b; }
    accent.copy(pal[0]);
    mat.blending = dark ? AdditiveBlending : NormalBlending;
    mat.opacity = dark ? 1 : 0.8;
    mat.size = dark ? 0.26 : 0.22;
    mat.needsUpdate = true;
  }
  applyTheme();
  document.addEventListener('themechange', applyTheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  /* portrait assembles out of the sphere once the photo is ready */
  let heroTarget: S.Shape | null = null, heroBlend = 0;
  const hero = heroIdx >= 0 ? shapes[heroIdx] : null;
  const pcfg = canvas.dataset.portrait ? (JSON.parse(canvas.dataset.portrait) as S.PortraitConfig) : null;
  if (hero && pcfg) {
    S.portrait(N, pcfg).then((r) => { if (r) { heroTarget = r.shape; lum = r.lum; } });
  }

  /* scroll position as a float: 0 at the first section's centre, 1 at the second's, ... */
  function raw() {
    const mid = scrollY + innerHeight / 2;
    const c = secs.map((s) => s.offsetTop + s.offsetHeight / 2);
    if (mid <= c[0]) return 0;
    for (let i = 0; i < c.length - 1; i++) if (mid < c[i + 1]) return i + (mid - c[i]) / (c[i + 1] - c[i]);
    return c.length - 1;
  }
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; });

  let W = 1;
  function resize() {
    W = innerWidth;
    renderer.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight;
    cam.position.z = W < 900 ? 38 : 30;
    cam.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();

  let s = raw(), rx = 0, ry = 0, last = -1, running = true;
  const t0 = performance.now();
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(frame); });

  function frame() {
    if (!running) return;
    const t = (performance.now() - t0) / 1000;
    const target = raw();
    s += reduce ? target - s : (target - s) * 0.08;

    const active = Math.round(s);
    if (active !== last && hud) { last = active; [...hud.children].forEach((el, i) => el.classList.toggle('on', i === active)); }

    if (hero && heroTarget && heroBlend < 1) {
      heroBlend = reduce ? 1 : Math.min(1, heroBlend + 0.012);
      const hb = ease(heroBlend);
      for (let h = 0; h < N * 3; h++) hero[h] = sphere[h] + (heroTarget[h] - sphere[h]) * hb;
    }

    /* colour: shaded by photo brightness at the hero, palette colours elsewhere */
    const pw = heroTarget && heroIdx >= 0 ? Math.max(0, 1 - Math.abs(s - heroIdx)) * ease(heroBlend) : 0;
    for (let i = 0; i < N; i++) {
      const sh = dark ? 0.3 + 0.9 * lum[i] : 1.15 - 0.5 * lum[i], j = i * 3;
      col[j] = kcol[j] + (accent.r * sh - kcol[j]) * pw;
      col[j + 1] = kcol[j + 1] + (accent.g * sh - kcol[j + 1]) * pw;
      col[j + 2] = kcol[j + 2] + (accent.b * sh - kcol[j + 2]) * pw;
    }
    geo.attributes.color.needsUpdate = true;

    const i0 = Math.min(Math.floor(s), shapes.length - 2), f = clamp01(s - i0);
    const A = shapes[i0], B = shapes[Math.min(i0 + 1, shapes.length - 1)];
    for (let i = 0; i < N; i++) {
      const k = ease(clamp01((f - delay[i]) / 0.65)), j = i * 3;
      pos[j] = A[j] + (B[j] - A[j]) * k;
      pos[j + 1] = A[j + 1] + (B[j + 1] - A[j + 1]) * k;
      pos[j + 2] = A[j + 2] + (B[j + 2] - A[j + 2]) * k;
    }
    geo.attributes.position.needsUpdate = true;

    const sd = sides[i0] + ((sides[i0 + 1] ?? sides[i0]) - sides[i0]) * ease(f), wide = W > 900;
    group.position.x = wide ? -sd * (W > 1300 ? 9 : 8) : 0;
    group.scale.setScalar(wide ? (W > 1300 ? 1 : 0.85) : 0.9);
    const fl = (flat[i0] ? 1 - f : 0) + (flat[i0 + 1] ? f : 0);
    ry += ((reduce ? 0 : t * 0.12) + mouse.x * 0.5 - ry) * 0.06;
    rx += (mouse.y * 0.25 - rx) * 0.06;
    group.rotation.y = ry * (1 - fl) + mouse.x * 0.3 * fl;
    group.rotation.x = rx;

    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
