/**
 * Structured data (JSON-LD) so search engines understand who the site is about.
 * Only confirmed facts from site.ts; nothing here is shown on the page.
 */
import { profile, experience, skills, heroPhoto } from '../data/site';

const site = 'https://smashysubash.github.io/';

export const personId = `${site}#person`;

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': personId,
    name: 'Subash S',
    alternateName: 'Subash S.',
    url: site,
    image: new URL(heroPhoto.src, site).href,
    jobTitle: 'Software Engineer',
    description: `${profile.headline} ${profile.tagline}`,
    email: `mailto:${profile.email}`,
    worksFor: { '@type': 'Organization', name: experience.company, url: 'https://vlinder.io' },
    address: { '@type': 'PostalAddress', addressLocality: 'Bengaluru', addressCountry: 'IN' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'National Engineering College' },
    knowsAbout: skills.flatMap((g) => g.items.filter((s) => s.core).map((s) => s.name)).concat(['Backend engineering', 'Platform engineering', 'AI agents']),
    sameAs: [profile.github, profile.linkedin],
  };
}

export function homeSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      personSchema(),
      { '@type': 'WebSite', '@id': `${site}#website`, url: site, name: 'Subash S.', about: { '@id': personId }, inLanguage: 'en' },
      { '@type': 'ProfilePage', '@id': `${site}#profile`, url: site, mainEntity: { '@id': personId }, isPartOf: { '@id': `${site}#website` } },
    ],
  };
}

/** Case studies and posts: an article written by Subash. */
export function articleSchema(opts: { title: string; description: string; url: string; image: string; date?: Date }) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      personSchema(),
      {
        '@type': 'Article',
        headline: opts.title,
        description: opts.description,
        url: opts.url,
        image: opts.image,
        author: { '@id': personId },
        ...(opts.date ? { datePublished: opts.date.toISOString() } : {}),
        mainEntityOfPage: opts.url,
      },
    ],
  };
}
