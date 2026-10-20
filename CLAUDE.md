# Subash S. portfolio

Astro 7 + Tailwind 4 + MDX, built with Bun, deployed to GitHub Pages (`.github/workflows/deploy.yml`).

## Commands

- `bun --bun run dev` · dev server (Node is not installed; always pass `--bun`)
- `bun --bun run build` · static build to `dist/`
- `bun --bun x astro check` · type check (needs TypeScript 6; `astro check` does not support TS 7)
- `bun tools/hero-photo.ts <photo.jpg> <x0> <y0> <x1>` · crop a 4:5 head-and-shoulders frame and tone it blue duotone into `public/hero.webp` + `hero-sm.webp` (current: photo 5 `MyImage-1783447430-00.jpg`, `0.16 0.12 0.84`; the original stays local)
- `bun tools/shots.ts <dir>` · after a build, screenshot sections, dialogs and a case study in headless Chromium (software WebGL)

## Where things live

- `src/data/site.ts` · profile, impact numbers, experience, skills, certifications, hero portrait settings
- `src/content/projects/*.mdx` · one file per project; frontmatter drives the home-page card, body is the case study (`caseStudy: false` = card only)
- `src/content/blog/*.mdx` · posts; `draft: true` shows a "Draft" card and builds no page
- `src/scripts/lattice.ts` + `shapes.ts` · the three.js point lattice. Each home section sets `data-shape`; order of sections = order of shapes. Hero `halo` and icons (bill, career, tenants, chat) face the viewer; abstract forms (orbits, gyro, ribbon, ripples) rotate. Look: ~7k soft dots (4.5k on phones), light bloom
- Hero: arch-framed duotone photo (`heroPhoto` in `site.ts`); the lattice draws a `halo` around it via `data-lattice-anchor`. Social cards reuse the same photo
- `src/data/site.ts` → `services` · Umami website ID and Web3Forms key (empty = feature off), `tldr` · recruiter summary
- `src/pages/og/[...slug].png.ts` + `src/lib/og.ts` · build-time social preview images
- `src/components/CommandMenu.astro`, `Tldr.astro`, `ContactForm.astro` · ⌘K menu, recruiter dialog, contact form
- Analytics events use `data-umami-event` attributes or `track()` from `src/lib/analytics.ts`; `?ref=…` visits are recorded, never shown on the page
- `public/resume.pdf` · copy of `~/Documents/resumes/subash_remote.pdf`, linked as-is by Subash's choice

## Content rules (do not break)

- Never mention the platform's total product-unit count (the "billions" figure) anywhere on the site.
- Never name the employer's product, its clients, or the industry. Say "enterprise consumer-product brands". (This repo is public: keep those names out of code and comments too.)
- Never describe the ML R&D technique. NFC stays generic ("NFC-based product authentication").
- No phone number in site copy. No CGPA. Python is not a listed skill.
- Only add content Subash has confirmed. Voice: no em dashes, short sentences, digits for numbers.
