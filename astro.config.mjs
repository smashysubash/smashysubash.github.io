// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages user site. If this moves to a project repo, set `base: '/<repo>'`;
// every internal link goes through `url()` in src/lib/url.ts, so nothing else changes.
export default defineConfig({
  site: 'https://smashysubash.github.io',
  integrations: [mdx(), sitemap()],
  // one-page site: inlining the CSS saves a render-blocking request
  build: { inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss()],
    // The lattice chunk is three.js (~130 kB gzipped). It loads after the page content, so the size is expected.
    build: { chunkSizeWarningLimit: 600 },
  },
});
