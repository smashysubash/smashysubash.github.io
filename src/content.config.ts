import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** Which home-page section the card sits in. */
    section: z.enum(['platform', 'ai']),
    /** Small label on the card: "MVP", "Live · 10+ tenants", "Freelance", "Side project". */
    badge: z.string().optional(),
    badgeStyle: z.enum(['status', 'kind']).default('status'),
    /** The one big card at the top of its section. */
    featured: z.boolean().default(false),
    points: z.array(z.string()).default([]),
    stack: z.array(z.string()).default([]),
    order: z.number(),
    /** Small cards with no case study yet stay unlinked. */
    caseStudy: z.boolean().default(true),
  }),
});

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    pubDate: z.coerce.date().optional(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { projects, blog };
