# Subash S. portfolio

Astro 7 + Tailwind 4 + MDX, built with Bun, deployed to GitHub Pages (`.github/workflows/deploy.yml`).

## Commands

- `bun --bun run dev` · dev server (Node is not installed; always pass `--bun`)
- `bun --bun run build` · static build to `dist/`
- `bun --bun x astro check` · type check (needs TypeScript 6; `astro check` does not support TS 7)
- `bun add -d @imgly/background-removal-node && bun tools/hero-photo.ts <photo> <x0> <y0> <x1> <y1>` · cut the person out (local ML model), tone blue duotone, write `public/hero.webp` + `hero-sm.webp` with transparency; then `bun remove @imgly/background-removal-node` (keep it out of package.json). Current: photo 5 `MyImage-1783447430-00.jpg`, `0.11 0.105 0.995 0.915`
- `bun tools/shots.ts <dir>` · after a build, screenshot sections, dialogs and a case study in headless Chromium (software WebGL)

## Where things live

- `src/data/site.ts` · profile, impact numbers, experience, skills, certifications, hero photo
- `src/content/projects/*.mdx` · one file per project; frontmatter drives the home-page card, body is the case study (`caseStudy: false` = card only)
- `src/content/blog/*.mdx` · posts; `draft: true` shows a "Draft" card and builds no page
- `src/scripts/lattice.ts` + `shapes.ts` · the three.js point lattice. Each home section sets `data-shape`; order of sections = order of shapes. Hero `dots` grid and icons (bill, career, tenants, chat) face the viewer; abstract forms (orbits, gyro, ribbon, ripples) rotate. Look: ~7k soft dots (4.5k on phones), light bloom
- Hero: duotone cut-out standing in a rounded card, head breaking above the card edge (`heroPhoto` in `site.ts`, styles in `index.astro`). Behind it the lattice is a loose full-screen dot grid (`dots`) with a slow brightening wave. Never put a ring/halo around the face: it read like a memorial poster. Social cards reuse the cut-out
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
