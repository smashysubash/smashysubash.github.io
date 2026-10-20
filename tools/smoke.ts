/**
 * Smoke + accessibility check of the built site. Run after `bun --bun run build`:
 *
 *   bun tools/smoke.ts
 *
 * Fails (exit 1) when a page throws or logs an error, an internal link or asset is missing,
 * the lattice draws nothing, or axe-core finds serious/critical accessibility issues.
 * CI runs this before deploying, so a broken build never goes live.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { join } from 'node:path';
import sharp from 'sharp';

const dist = new URL('../dist/', import.meta.url).pathname;
const server = Bun.serve({
  port: 0,
  async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = Bun.file(join(dist, path));
    return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 });
  },
});
const base = `http://localhost:${server.port}`;
const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
// axe needs pages that live in an explicit context
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const page = await context.newPage();
page.on('pageerror', (e) => fail(`page error on ${page.url()}: ${e.message}`));
page.on('console', (m) => {
  // swiftshader performance chatter is not a site problem
  if (m.type() === 'error' && !/GL Driver Message|GPU stall/.test(m.text())) fail(`console error on ${page.url()}: ${m.text()}`);
});

/* 1. the home page loads and the lattice draws something */
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
// the lattice sets data-frames once it renders; then look for lit dots in a strip with no content
const frames = await page.evaluate(() => Number(document.getElementById('lattice')?.dataset.frames ?? -1));
const strip = await page.screenshot({ clip: { x: 0, y: 800, width: 1440, height: 100 } });
const { data } = await sharp(strip).greyscale().raw().toBuffer({ resolveWithObject: true });
let lit = frames < 0 ? -1 : 0;
if (frames > 0) for (const v of data) if (v > 45) lit++;
if (frames === 0) fail('lattice never rendered a frame');
if (lit < 0) fail('lattice canvas is missing');
else if (lit < 20) fail(`lattice looks blank (${lit} lit pixels)`);

/* 2. every internal link and image on the home page resolves */
const refs = await page.evaluate(() => [
  ...[...document.querySelectorAll<HTMLAnchorElement>('a[href]')].map((a) => a.href),
  ...[...document.querySelectorAll<HTMLImageElement>('img[src]')].map((i) => i.src),
  ...[...document.querySelectorAll<HTMLMetaElement>('meta[property="og:image"]')].map((m) => m.content),
]);
const internal = [...new Set(refs.filter((u) => u.startsWith(base) || u.includes('smashysubash.github.io')))].map((u) =>
  u.replace('https://smashysubash.github.io', base).split('#')[0],
);
for (const u of new Set(internal)) {
  const res = await fetch(u);
  if (!res.ok) fail(`broken link ${u.replace(base, '')} (${res.status})`);
}

/* 3. accessibility on the main page types */
for (const path of ['/', '/projects/multi-tenant-platform/', '/blog/']) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  for (const v of violations) {
    const line = `a11y ${v.impact} on ${path}: ${v.id} (${v.nodes.length}×) ${v.help}`;
    if (v.impact === 'serious' || v.impact === 'critical') fail(line);
    else console.log('  note: ' + line);
  }
}

await browser.close();
server.stop();
if (problems.length) {
  console.error(`smoke check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`smoke check passed (lattice: ${lit} lit pixels, ${internal.length} internal links checked)`);
