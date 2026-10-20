import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { profile } from '../../data/site';
import { renderOg } from '../../lib/og';

type Card = { eyebrow: string; title: string; subtitle: string; chips?: string[] };

export const getStaticPaths = (async () => {
  const projects = await getCollection('projects', (p) => p.data.caseStudy);
  const posts = await getCollection('blog', (p) => !p.data.draft);
  return [
    {
      params: { slug: 'index' },
      props: { eyebrow: 'Portfolio', title: profile.name, subtitle: `${profile.headline} ${profile.tagline}`, chips: ['Node.js', 'TypeScript', 'MongoDB', 'AWS', 'AI'] } satisfies Card,
    },
    ...projects.map((p) => ({
      params: { slug: `projects/${p.id}` },
      props: { eyebrow: p.data.section === 'ai' ? 'AI, shipped · Case study' : 'Platform · Case study', title: p.data.title, subtitle: p.data.summary, chips: p.data.stack } satisfies Card,
    })),
    ...posts.map((p) => ({
      params: { slug: `blog/${p.id}` },
      props: { eyebrow: 'Writing', title: p.data.title, subtitle: p.data.summary } satisfies Card,
    })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as Card);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
