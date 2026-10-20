/**
 * Living lattice: one point cloud behind the page that morphs into a new shape per section.
 * Sections opt in with `data-shape` (see shapeFor). A section can mark an element with
 * `data-lattice-anchor` (the hero photo) and the shape centres and sizes itself on it.
 *
 * All per-point motion runs on the GPU. The CPU only uploads the two shapes being blended
 * when the visitor crosses into a new section; easing, cursor push, click ripples,
 * scroll warp and idle drift are computed in the vertex shader.
 */
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, NormalBlending, PerspectiveCamera,
  Plane, Points, Raycaster, Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as S from './shapes';

/** Stops where the shape faces the viewer instead of slowly spinning: the avatar and the line-art icons. */
const FLAT = new Set(['dots', 'bill', 'career', 'tenants', 'chat']);

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const INTERACTIVE = 'a, button, input, textarea, select, label, dialog, [role="dialog"]';

const vertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aDelay;
  attribute float aKind;
  attribute float aRand;

  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  uniform vec3 uRipple;
  uniform float uRippleTime;
  uniform float uVelocity;
  uniform float uMotion;
  uniform float uGrid;
  uniform vec3 uColA;
  uniform vec3 uColO;
  uniform vec3 uColW;
  uniform float uDark;

  varying vec3 vColor;
  varying float vAlpha;

  float easeInOut(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

  void main() {
    float k = easeInOut(clamp((uProgress - aDelay) / 0.65, 0.0, 1.0));
    vec3 p = mix(aFrom, aTo, k);

    // hero dot grid: a slow diagonal wave lifts dots toward the viewer and brightens them
    float edge = 1.0, glow = 0.0;
    if (uGrid > 0.001) {
      float w = sin(p.x * 0.22 + p.y * 0.16 - uTime * 0.9 * uMotion) * cos(p.y * 0.2 - uTime * 0.5 * uMotion);
      p.z += w * 1.6 * uGrid;
      glow = max(w, 0.0) * uGrid;
      edge = mix(1.0, 0.32 + 0.68 * glow, uGrid);
    }

    // idle drift, so the cloud never looks frozen
    float ph = aRand * 6.2831;
    p += uMotion * 0.03 * vec3(sin(uTime * 0.9 + ph), cos(uTime * 0.7 + ph), sin(uTime * 0.5 + ph * 1.3));

    // scroll-velocity warp: fast scrolling bends the shape, it settles when you stop
    p.x += sin(p.y * 0.35 + uTime * 1.4) * uVelocity * 0.9;
    p.z += cos(p.x * 0.30 + uTime) * uVelocity * 1.1;

    // cursor push in the shape's own plane
    vec2 d = p.xy - uMouse.xy;
    float dist = length(d);
    float push = uMouseStrength * smoothstep(4.2, 0.0, dist);
    p.xy += (d / max(dist, 0.001)) * push * 1.8;
    p.z += push * 1.4;

    // click ripple: an expanding ring that lifts points as it passes
    float rt = uTime - uRippleTime;
    if (rt > 0.0 && rt < 3.0) {
      float rd = length(p.xy - uRipple.xy);
      float ring = exp(-pow(rd - rt * 9.0, 2.0) / 3.0) * exp(-rt * 1.3);
      p.z += ring * 2.4;
      p.xy += normalize(p.xy - uRipple.xy + 0.0001) * ring * 0.6;
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    // same size attenuation as three's PointsMaterial: world size × (viewport half-height / depth)
    gl_PointSize = uSize * uPixelRatio * (uScale / depth) * (0.65 + 0.7 * aRand);

    vec3 pal = aKind < 0.5 ? uColA : (aKind < 1.5 ? uColO : uColW);
    vColor = pal;
    // depth-of-field feel: points far from the focal plane fade a little
    vAlpha = mix(1.0, 0.45, smoothstep(4.0, 14.0, abs(depth - 30.0))) * (1.0 + push * 0.6) * edge;
  }
`;

const fragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = pow(smoothstep(0.5, 0.0, d), 1.6);
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

function shapeFor(el: HTMLElement, n: number, sphere: S.Shape): S.Shape {
  switch (el.dataset.shape) {
    case 'dots': return S.dotGrid(n);
    case 'bill': return S.cloudBill(n);
    case 'career': return S.careerGraph(n);
    case 'tenants': return S.tenantDbs(n);
    case 'chat': return S.chatSpark(n);
    case 'orbits': return S.orbits(n, (el.dataset.sizes ?? '').split(',').map(Number).filter(Boolean));
    case 'gyro': return S.gyroscope(n);
    case 'ribbon': return S.ribbon(n);
    case 'ripples': return S.ripples(n);
    default: return new Float32Array(sphere);
  }
}

export function startLattice(canvas: HTMLCanvasElement) {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 900 || (navigator.hardwareConcurrency ?? 8) <= 4;
  // fewer, larger, softer dots: calmer than a dense cloud
  const N = reduce || small ? 4500 : 7000;
  const secs = [...document.querySelectorAll<HTMLElement>('[data-shape]')];
  const hud = document.getElementById('hud');
  if (!secs.length) return;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  const scene = new Scene();
  const cam = new PerspectiveCamera(42, 1, 0.1, 200);
  cam.position.set(0, 0, 30);

  const sphere = S.sphere(N);
  const shapes = secs.map((el) => shapeFor(el, N, sphere));
  const sides = secs.map((el) => (el.classList.contains('right') ? 1 : -1));
  const flat = secs.map((el) => FLAT.has(el.dataset.shape ?? ''));
  const gridIdx = secs.findIndex((el) => el.dataset.shape === 'dots');

  /* per-point attributes */
  const from = new Float32Array(shapes[0]), to = new Float32Array(shapes[Math.min(1, shapes.length - 1)]);
  const delay = new Float32Array(N), kind = new Float32Array(N), rand = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    delay[i] = Math.random() * 0.35;
    const q = Math.random();
    kind[i] = q < 0.8 ? 0 : q < 0.95 ? 1 : 2;
    rand[i] = Math.random();
  }
  const geo = new BufferGeometry();
  const aFrom = new BufferAttribute(from, 3), aTo = new BufferAttribute(to, 3);
  geo.setAttribute('position', aFrom); // three needs a position attribute; the shader reads aFrom/aTo
  geo.setAttribute('aFrom', aFrom);
  geo.setAttribute('aTo', aTo);
  geo.setAttribute('aDelay', new BufferAttribute(delay, 1));
  geo.setAttribute('aKind', new BufferAttribute(kind, 1));
  geo.setAttribute('aRand', new BufferAttribute(rand, 1));

  const uniforms = {
    uProgress: { value: 0 }, uTime: { value: 0 }, uSize: { value: 0.26 }, uPixelRatio: { value: dpr }, uScale: { value: innerHeight / 2 },
    uMouse: { value: new Vector3(99, 99, 0) }, uMouseStrength: { value: 0 },
    uRipple: { value: new Vector3() }, uRippleTime: { value: -10 },
    uVelocity: { value: 0 }, uGrid: { value: 0 }, uMotion: { value: reduce ? 0 : 1 },
    uColA: { value: new Color() }, uColO: { value: new Color() }, uColW: { value: new Color() },
    uDark: { value: 1 }, uOpacity: { value: 1 },
  };
  const mat = new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  const group = new Group();
  group.add(points);
  scene.add(group);

  /* bloom: dark theme on capable screens only; on a light page it just washes everything out */
  let composer: EffectComposer | null = null;
  let bloom: UnrealBloomPass | null = null;
  if (!small) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, cam));
    bloom = new UnrealBloomPass(new Vector2(innerWidth, innerHeight), 0.28, 0.6, 0.2);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  /* theme */
  let dark = true;
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  function applyTheme() {
    const cs = getComputedStyle(root);
    const css = (v: string) => new Color(cs.getPropertyValue(v).trim());
    dark = isDark();
    // The bloom path renders into a linear target and encodes once at the end; the direct path
    // encodes the clear colour itself. Same --bg either way.
    renderer.setClearColor(composer && dark ? css('--bg').convertSRGBToLinear() : css('--bg'));
    uniforms.uColA.value.copy(css('--pt-a'));
    uniforms.uColO.value.copy(css('--pt-o'));
    uniforms.uColW.value.copy(css('--pt-w'));
    uniforms.uDark.value = dark ? 1 : 0;
    uniforms.uOpacity.value = dark ? 0.85 : 0.95;
    uniforms.uSize.value = dark ? 0.26 : 0.28;
    mat.blending = dark ? AdditiveBlending : NormalBlending;
    mat.needsUpdate = true;
    if (bloom) bloom.enabled = dark;
  }
  applyTheme();
  document.addEventListener('themechange', applyTheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  /* Scroll position as a float stop index. Each section holds its shape (an integer) while it
     fills the screen, and the morph to the next shape happens in the band between sections,
     so tall sections never change shape mid-read. */
  let holds: [number, number][] = [];
  /* where each section's shape sits: centred in the free space beside its panel, scaled to fit */
  let place: { x: number; y: number; scale: number }[] = [];
  const measure = () => {
    const visH = 2 * Math.tan((cam.fov * Math.PI) / 360) * cam.position.z, visW = visH * cam.aspect;
    const pxToWorld = visH / innerHeight;
    place = secs.map((s, i) => {
      if (s.dataset.shape === 'dots') return { x: 0, y: 0, scale: 1 };
      /* anchored: centre on the element (the hero photo) and size the shape to frame it */
      const anchor = s.querySelector<HTMLElement>('[data-lattice-anchor]');
      if (anchor) {
        const a = anchor.getBoundingClientRect(), sr = s.getBoundingClientRect();
        const x = ((a.left + a.width / 2) / innerWidth - 0.5) * visW;
        const y = -((a.top + a.height / 2) - (sr.top + sr.height / 2)) * pxToWorld;
        // the floor's local units assume a photo about 19 units tall
        return { x, y, scale: (a.height * pxToWorld) / 19 };
      }
      const panel = s.querySelector<HTMLElement>('.panel');
      if (!panel || innerWidth <= 900) return { x: 0, y: 0, scale: 0.9 };
      const r = panel.getBoundingClientRect();
      const left = sides[i] > 0 ? 0 : r.right;
      // keep clear of the section index on the right edge (shown above 1100px)
      const right = sides[i] > 0 ? r.left : innerWidth - (innerWidth > 1100 ? 110 : 0);
      const freePx = Math.max(right - left - 48, 200);
      const x = ((left + right) / 2 / innerWidth - 0.5) * visW;
      return { x, y: 0, scale: Math.min(1, (freePx / innerWidth) * visW / 21) };
    });
    const pad = innerHeight * 0.38;
    holds = secs.map((s) => {
      const a = s.offsetTop + pad, b = s.offsetTop + s.offsetHeight - pad;
      const mid = s.offsetTop + s.offsetHeight / 2;
      return a < b ? [a, b] : [mid, mid];
    });
  };
  function raw() {
    const mid = scrollY + innerHeight / 2;
    if (mid <= holds[0][1]) return 0;
    for (let i = 0; i < holds.length - 1; i++) {
      if (mid <= holds[i][1]) return i;
      if (mid < holds[i + 1][0]) return i + (mid - holds[i][1]) / (holds[i + 1][0] - holds[i][1]);
    }
    return holds.length - 1;
  }

  /* pointer → a point on the shape's plane, in the group's local space */
  const ndc = new Vector2(), ray = new Raycaster(), plane = new Plane(new Vector3(0, 0, 1), 0), hit = new Vector3();
  let lastMove = -10, hasPointer = false;
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
    ndc.set(mouse.x, -mouse.y);
    hasPointer = true;
    lastMove = performance.now();
  });
  addEventListener('pointerdown', (e) => {
    if (reduce || (e.target as Element)?.closest?.(INTERACTIVE)) return;
    ndc.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
    if (project()) { uniforms.uRipple.value.copy(hit); uniforms.uRippleTime.value = uniforms.uTime.value; }
  });
  function project() {
    ray.setFromCamera(ndc, cam);
    plane.constant = -group.position.z;
    if (!ray.ray.intersectPlane(plane, hit)) return false;
    group.worldToLocal(hit);
    return true;
  }

  let W = innerWidth;
  function resize() {
    W = innerWidth;
    renderer.setSize(innerWidth, innerHeight, false);
    composer?.setSize(innerWidth, innerHeight);
    cam.aspect = innerWidth / innerHeight;
    cam.position.z = W < 900 ? 38 : 30;
    uniforms.uScale.value = innerHeight / 2;
    cam.updateProjectionMatrix();
    measure();
  }
  addEventListener('resize', resize);
  new ResizeObserver(measure).observe(document.body);
  resize();

  let s = raw(), prevRaw = s, vel = 0, rx = 0, ry = 0, last = -1, seg = -1, running = true;
  const t0 = performance.now();
  let prevNow = t0;
  /* frame-rate independent smoothing: k(rate) is the share of the remaining distance covered this frame */
  let dt = 1 / 60;
  const k = (rate: number) => 1 - Math.exp(-rate * dt);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });

  function frame() {
    if (!running) return;
    const now = performance.now(), t = (now - t0) / 1000;
    dt = Math.min((now - prevNow) / 1000, 0.25);
    prevNow = now;
    uniforms.uTime.value = t;

    const target = raw();
    s += reduce ? target - s : (target - s) * k(5);
    vel += ((reduce ? 0 : Math.max(-1, Math.min(1, ((target - prevRaw) / dt) * 0.1))) - vel) * k(6);
    prevRaw = target;
    uniforms.uVelocity.value = vel;

    const active = Math.round(s);
    if (active !== last && hud) {
      last = active;
      [...hud.children].forEach((el, i) => el.classList.toggle('on', i === active));
    }

    const i0 = Math.min(Math.floor(s), shapes.length - 2), f = clamp01(s - i0);

    if (i0 !== seg) {
      seg = i0;
      from.set(shapes[i0]);
      to.set(shapes[Math.min(i0 + 1, shapes.length - 1)]);
      aFrom.needsUpdate = true;
      aTo.needsUpdate = true;
    }
    uniforms.uProgress.value = f;
    uniforms.uGrid.value = gridIdx >= 0 ? Math.max(0, 1 - Math.abs(s - gridIdx)) : 0;

    /* layout: shape sits opposite the panel on wide screens */
    const pa = place[i0], pb = place[i0 + 1] ?? pa, pf = ease(f);
    group.position.x = pa.x + (pb.x - pa.x) * pf;
    group.position.y = pa.y + (pb.y - pa.y) * pf;
    group.scale.setScalar(pa.scale + (pb.scale - pa.scale) * pf);
    const fl = (flat[i0] ? 1 - f : 0) + (flat[i0 + 1] ? f : 0);
    ry += ((reduce ? 0 : t * 0.12) + mouse.x * 0.5 - ry) * k(3.6);
    rx += (mouse.y * 0.25 - rx) * k(3.6);
    group.rotation.y = ry * (1 - fl) + mouse.x * 0.3 * fl;
    group.rotation.x = rx;
    group.updateMatrixWorld();

    /* cursor push fades in while the mouse moves and eases out after it stops */
    const wantPush = !reduce && hasPointer && now - lastMove < 1800 ? 1 : 0;
    uniforms.uMouseStrength.value += (wantPush - uniforms.uMouseStrength.value) * k(5);
    if (hasPointer && project()) uniforms.uMouse.value.lerp(hit, k(15));

    if (composer && dark) composer.render();
    else renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
