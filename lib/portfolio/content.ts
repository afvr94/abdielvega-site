export const profile = {
  name: 'Abdiel Vega',
  fullName: 'Abdiel F. Vega Ramos',
  title: 'Full-stack engineer',
  city: 'Minneola, Florida',
  email: 'me@abdielvega.com',
  since: 2018,
  photo: 'https://abdielvegabucket.s3.amazonaws.com/1639234866541.jpeg',
  resume: 'https://abdielvegabucket.s3.amazonaws.com/Abdiel_Vega_Resume.pdf',
  strapline: 'Computer Engineering · Systems · Web · Florida, USA',
} as const;

export const socials = [
  { name: 'GitHub', handle: '@afvr94', url: 'https://github.com/afvr94', primary: true },
  {
    name: 'LinkedIn',
    handle: 'in/afvr94',
    url: 'https://www.linkedin.com/in/afvr94',
    primary: true,
  },
  { name: 'Instagram', handle: '@afvr94', url: 'https://www.instagram.com/afvr94', primary: false },
  {
    name: 'Facebook',
    handle: 'abdiel.vega.9',
    url: 'https://www.facebook.com/abdiel.vega.9',
    primary: false,
  },
] as const;

export const stack = [
  {
    label: 'Frontend',
    items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'styled-components'],
  },
  {
    label: 'Backend',
    items: ['Node.js', 'Python', 'Django', 'REST · GraphQL'],
  },
  {
    label: 'Databases',
    items: ['PostgreSQL', 'MongoDB', 'MySQL'],
  },
  {
    label: 'Infrastructure',
    items: ['AWS', 'Docker', 'Vercel', 'Supabase'],
  },
] as const;

export const languages = [
  { name: 'Spanish', note: 'Native' },
  { name: 'English', note: 'Fluent' },
] as const;

export const bio = {
  lede: 'Computer Engineer by training and full-stack engineer by practice. I build considered, durable software — frontends that feel inevitable and backends you don’t have to babysit.',
  full: [
    'I graduated from the University of Puerto Rico, Mayagüez, with a degree in Computer Engineering, and have spent the years since shipping web applications across the stack. The work spans React and Next.js on the front, Node.js and Python (Django) on the back, and Postgres / Mongo for whatever’s persistent.',
    'I care about taste in code the way some people care about taste in furniture — obvious names, load-bearing joints, nothing ornamental that doesn’t also hold weight. I prefer fewer abstractions and clearer seams.',
    'When I’m not shipping, I’m cycling around central Florida, lifting, or disappearing into whatever engineering rabbit hole caught me that week.',
  ],
} as const;

export const nav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/contact', label: 'Contact' },
] as const;
