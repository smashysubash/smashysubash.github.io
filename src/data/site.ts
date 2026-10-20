/**
 * Everything on the one-page site that is not a project or a post.
 * Content rules live in CLAUDE.md. Only confirmed facts go here.
 */

export const profile = {
  name: 'Subash S.',
  headline: 'Backend engineer who ships AI.',
  tagline:
    '3 years building backend and cloud for enterprise consumer-product brands. APIs, pipelines, infra, and the AI that runs on top.',
  status: 'Open to remote backend and platform roles',
  location: 'Bengaluru, IST',
  email: 'smashysubash@gmail.com',
  github: 'https://github.com/smashysubash',
  linkedin: 'https://linkedin.com/in/subash07',
  resume: 'resume.pdf',
  contactHeadline: 'Need someone to own the backend and ship the AI?',
  contactLead: 'Open to remote backend and platform roles. Email is fastest.',
};

export type Stat = { value: string; unit: string; what: string; how: string };

export const impact: Stat[] = [
  { value: '35', unit: '%', what: 'Monthly cloud bill cut', how: 'Self-initiated. Visibility first, then every resource audited across 3 clouds.' },
  { value: '30', unit: '%', what: 'Faster dashboard queries', how: '$match before $lookup. Compound indexes.' },
  { value: '5', unit: 'x', what: 'Faster dashboard builds', how: 'Expo web to Vite + React.' },
  { value: '<1', unit: 'h', what: 'Redis outage restored', how: 'Cascading failure traced and fixed. No data lost.' },
];

export const experience = {
  company: 'Vlinder.io',
  period: 'Jul 2023 to present',
  ladder: [
    { role: 'Intern', since: 'Jul 2023' },
    { role: 'Associate SE', since: 'Sep 2024' },
    { role: 'Software Engineer', since: 'Oct 2025' },
  ],
  intro:
    'Product traceability and authentication for enterprise and mid-market consumer-product brands. I own the backend and the infra, and I get pulled in on the hard problems across teams.',
  groups: [
    {
      title: 'Backend + data',
      points: [
        'Traceability platform backend in Node.js, TypeScript, MongoDB.',
        'Multi-tenant from scratch: a database per tenant, 10+ tenants live.',
        'GS1 serialization and NFC authentication APIs.',
        'Dashboard queries 30% faster: $match before $lookup, compound indexes.',
        'BullMQ pipelines for reports, batch jobs, email and SMS, with retries.',
        'SAP integration APIs.',
      ],
    },
    {
      title: 'Cloud + reliability',
      points: [
        'Cut the monthly cloud bill 35%. Nobody asked.',
        'Led the Azure to AWS migration.',
        'Run DNS, SSL/TLS, networking and CI/CD on 3 clouds.',
        'Restored a Redis outage in under 1 hour. No data lost, root cause written up.',
        'Set up Beszel monitoring and Wazuh security alerts. On-call.',
      ],
    },
    {
      title: 'Payments',
      points: [
        'Razorpay: payment creation, webhooks, idempotent processing.',
        'Reconciliation so every payment matches its order.',
      ],
    },
    {
      title: 'People',
      points: ['Lead technical calls with clients.', 'Cross-team go-to for hard backend and infra problems.'],
    },
  ],
};

export type SkillGroup = { title: string; items: { name: string; core?: boolean }[] };

export const skills: SkillGroup[] = [
  { title: 'Languages', items: [{ name: 'TypeScript', core: true }, { name: 'JavaScript' }, { name: 'Java' }, { name: 'SQL' }] },
  {
    title: 'Backend',
    items: [
      { name: 'Node.js', core: true }, { name: 'NestJS' }, { name: 'Express' }, { name: 'REST' },
      { name: 'GraphQL' }, { name: 'BullMQ' }, { name: 'Webhooks' }, { name: 'Cron' },
    ],
  },
  { title: 'Data', items: [{ name: 'MongoDB', core: true }, { name: 'Redis', core: true }] },
  { title: 'AI', items: [{ name: 'MCP', core: true }, { name: 'Claude API', core: true }, { name: 'LLM tool use' }] },
  {
    title: 'Cloud + DevOps',
    items: [
      { name: 'AWS', core: true }, { name: 'EC2' }, { name: 'ECS' }, { name: 'Lambda' }, { name: 'S3' }, { name: 'IAM' },
      { name: 'CloudWatch' }, { name: 'Azure' }, { name: 'DigitalOcean' }, { name: 'Docker' }, { name: 'Nginx' },
      { name: 'PM2' }, { name: 'GitHub Actions' }, { name: 'IaC' }, { name: 'Load balancing' }, { name: 'Shell' },
      { name: 'DNS' }, { name: 'SSL/TLS' },
    ],
  },
  {
    title: 'Security',
    items: [{ name: 'Auth + RBAC' }, { name: 'Rate limiting' }, { name: 'Secrets (Vault)' }, { name: 'reCAPTCHA' }, { name: 'Wazuh' }],
  },
  {
    title: 'Frontend + mobile',
    items: [
      { name: 'React', core: true }, { name: 'React Native' }, { name: 'Expo' }, { name: 'Vite' },
      { name: 'Tailwind' }, { name: 'Zustand' }, { name: 'React Query' }, { name: 'Zod' },
    ],
  },
  { title: 'Domain', items: [{ name: 'GS1' }, { name: 'NFC' }, { name: 'SAP' }, { name: 'Payments' }] },
];

export const certifications = [
  { name: 'AI Fluency: Framework & Foundations', issuer: 'Anthropic' },
  { name: 'Introduction to Cloud Development with HTML, CSS, and JavaScript', issuer: 'edX · Verified certificate' },
];

/** Hero portrait points, generated by `bun tools/portrait.ts <photo>` (see CLAUDE.md). */
export const portraitPoints = 'portrait.bin';
