/**
 * Screenshot the built site at a few scroll stops, in both themes, to check the lattice renders.
 *
 *   bun --bun run build && bun tools/shots.ts [outDir]
 *
 * Serves dist/ itself, so no dev server is needed. Uses software WebGL in headless Chromium.
 */
import { chromium } from 'playwright';
import { join } from 'node:path';

const out = process.argv[2] ?? 'shots';
/** `--only intro,impact` limits the section shots and skips the dialog and phone shots. */
const onlyArg = process.argv.indexOf('--only');
const only = onlyArg > 0 ? process.argv[onlyArg + 1].split(',') : null;
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

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors: string[] = [];
for (const theme of ['dark', 'light'] as const) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${theme}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[${theme}] ${e.message}`));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  for (const id of only ?? ['intro', 'impact', 'experience', 'platform', 'ai', 'skills', 'certs', 'writing', 'contact']) {
    await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }), id);
    await page.waitForTimeout(6000);
    await page.screenshot({ path: `${out}/${theme}-${id}.png` });
  }
  await page.close();
}
/* dialogs: command menu (with a search typed) and the recruiter TL;DR */
if (!only) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
  page.on('pageerror', (e) => errors.push(`[ui] ${e.message}`));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.keyboard.press('Control+k');
  await page.keyboard.type('case');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/ui-cmdk.png` });
  await page.keyboard.press('Escape');
  await page.click('header [data-tldr]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/ui-tldr.png` });
  await page.keyboard.press('Escape');
  await page.goto(base + '/projects/multi-tenant-platform/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/ui-case.png`, fullPage: true });
  await page.close();
}
if (!only) {
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', isMobile: true, hasTouch: true });
await mobile.goto(base + '/', { waitUntil: 'networkidle' });
await mobile.waitForTimeout(2500);
await mobile.screenshot({ path: `${out}/mobile-intro.png` });
}
await browser.close();
server.stop();
console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors');
