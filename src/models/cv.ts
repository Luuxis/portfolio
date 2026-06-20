export type SkillTag = {
  name: string
  accent?: boolean
}

export type SkillGroup = {
  icon: string
  label: string
  srOnly?: string
  tags: SkillTag[]
}

export type ContactItem = {
  icon: string
  iconBrand?: boolean
  content: string
  href?: string
  itemProp?: string
}

export type Language = {
  name: string
  level: string
  width: string
}

export type Interest = {
  icon: string
  label: string
}

export type Experience = {
  role: string
  roleSrOnly?: string
  roleSchema: string
  orgSchema: string
  company: string
  dot: 'active' | 'past' | 'old'
  badge?: string
  date?: { start: string; end: string; startDatetime: string; endDatetime: string }
  bullets: string[]
}

export type OssProject = {
  icon: string
  iconBrand?: boolean
  iconClass?: string
  title: string
  badge?: { icon: string; text: string }
  bullets: string[]
  grid?: boolean
}

export type Education = {
  title: string
  badge: string
  school: string
  period: string
}

export const person = {
  firstName: 'André',
  lastName: 'Gallo',
  fullName: 'André Gallo',
  title: 'Développeur Full-Stack & DevOps | TypeScript React Rails',
  tagline: 'Full-Stack · DevOps',
  headline: 'Développeur Full-Stack · TypeScript · Cloud & DevOps',
  email: 'contact@luuxis.fr',
  phone: '07 64 85 67 62',
  website: 'https://luuxis.fr',
  websiteLabel: 'luuxis.fr',
  github: 'https://github.com/luuxis',
  githubLabel: 'github.com/luuxis',
  location: { city: 'Lille', country: 'France' },
}

export const profileText =
  "Développeur full-stack et ingénieur logiciel avec **4 ans d'expérience** sur des applications web et SaaS en production. Habitué à enchaîner architecture, développement back-end / front-end et déploiement DevOps, avec un socle **TypeScript**, **JavaScript**, **React**, **Node.js**, **Ruby on Rails** et **PostgreSQL**, complété par **Cloudflare Workers**, **Docker** et **CI/CD**. Lead Developer chez **LuuxCraft**, plateforme SaaS utilisée par plus de **150 000 utilisateurs**. Chez **Farahon**, développement **Rails 8** jusqu'à **20 000 requêtes par jour**, tests automatisés et optimisation des performances de **30 %**."

export const contactItems: ContactItem[] = [
  {
    icon: 'fa-location-dot',
    content: `${person.location.city}, ${person.location.country}`,
    itemProp: 'address',
  },
  { icon: 'fa-phone', content: person.phone },
  { icon: 'fa-envelope', content: person.email, href: `mailto:${person.email}`, itemProp: 'email' },
  { icon: 'fa-globe', content: person.websiteLabel, href: person.website, itemProp: 'url' },
  {
    icon: 'fa-github',
    iconBrand: true,
    content: person.githubLabel,
    href: person.github,
    itemProp: 'sameAs',
  },
]

export const skillGroups: SkillGroup[] = [
  {
    icon: 'fa-server',
    label: 'Backend',
    tags: [
      { name: 'Hono', accent: true },
      { name: 'Node.js', accent: true },
      { name: 'Ruby on Rails', accent: true },
      { name: 'Symfony' },
      { name: 'PHP' },
      { name: 'Stripe' },
      { name: 'API REST' },
    ],
  },
  {
    icon: 'fa-laptop-code',
    label: 'Frontend',
    tags: [
      { name: 'React', accent: true },
      { name: 'TypeScript', accent: true },
      { name: 'Tailwind' },
      { name: 'Electron.js' },
    ],
  },
  {
    icon: 'fa-gear',
    label: 'DevOps',
    tags: [
      { name: 'Cloudflare', accent: true },
      { name: 'Docker', accent: true },
      { name: 'Git' },
      { name: 'CI/CD' },
      { name: 'GitHub Actions' },
      { name: 'Linux' },
    ],
  },
  {
    icon: 'fa-database',
    label: 'Base de données',
    tags: [
      { name: 'PostgreSQL', accent: true },
      { name: 'Redis' },
      { name: 'MySQL' },
    ],
  },
]

export const strengths = [
  'Ownership technique end-to-end',
  'Architecture logicielle',
  'Optimisation des performances',
  'Déploiement & automatisation',
  'Résolution de problèmes complexes',
]

export const languages: Language[] = [
  { name: 'Français', level: 'Natif', width: '100%' },
  { name: 'Anglais', level: 'Technique', width: '72%' },
]

export const interests: Interest[] = [
  { icon: 'fa-gamepad', label: 'Jeux vidéo' },
  { icon: 'fa-mobile-screen', label: 'Tech Mobile' },
  { icon: 'fa-utensils', label: 'Cuisine' },
  { icon: 'fa-book-open', label: 'Mangas' },
]

export const experiences: Experience[] = [
  {
    role: 'Lead Developer',
    roleSrOnly: 'Lead Développeur Software Engineer',
    roleSchema: 'Lead Developer',
    orgSchema: 'LuuxCraft',
    company: 'LuuxCraft — plateforme de launchers Minecraft',
    dot: 'active',
    badge: 'Exp. actuelle',
    bullets: [
      '**TypeScript**, **React**, **Hono** — SaaS launchers Minecraft (auth, abonnements, admin)',
      'Infra **Cloudflare Workers**, **D1**, **R2** — distribution **~10 Go/j**',
      'Apps bureau **Electron** — builds auto **Win/Mac/Linux**',
      'Paiements **Stripe**, **API REST** — facturation récurrente, thèmes personnalisables',
      'Prod **+150k joueurs** — **CI/CD**, **Docker**, monitoring',
    ],
  },
  {
    role: 'Développeur Full-Stack',
    roleSrOnly: 'Full-Stack Developer Software Engineer',
    roleSchema: 'Développeur Full-Stack',
    orgSchema: 'Farahon',
    company: 'Farahon / LastWill — préparation de fin de vie',
    dot: 'past',
    date: {
      start: 'Oct. 2024',
      end: 'Fév. 2026',
      startDatetime: '2024-10',
      endDatetime: '2026-02',
    },
    bullets: [
      '**Rails 8**, **PostgreSQL**, **Redis** — LastWill (coffre-fort, NFC, assurance obsèques)',
      'Portail EPF — devis, contrats, SMS (**Hotwire**, **Stimulus**)',
      '**Stancer**, **Stripe**, **Brevo**, **AWS S3**',
      '**OTP/2FA**, tests **≥85%** — **20k visites/j**',
      '**Docker**, **Kamal**, **GitHub Actions** — perf **−30%**, **Sentry −70%**',
    ],
  },
  {
    role: 'Développeur Freelance',
    roleSrOnly: 'Freelance Web Developer Independent Contractor',
    roleSchema: 'Développeur Freelance',
    orgSchema: '',
    company: 'Indépendant — MPDH & clients divers',
    dot: 'old',
    date: {
      start: '2020',
      end: '2023',
      startDatetime: '2020-01',
      endDatetime: '2023-12',
    },
    bullets: [
      '**Symfony 8**, **PostgreSQL**, **Tailwind** — site MPDH (articles, dons)',
      'CMS **EasyAdmin** — gestion articles, pages et médias',
      'Modération commentaires, stats — **Google Analytics**',
      'SEO — sitemap, métadonnées, **JSON-LD**',
      '**+30 projets** — sites, **API REST**, **Docker**',
    ],
  },
]

export const ossProjects: OssProject[] = [
  {
    icon: 'fa-github',
    iconBrand: true,
    title: 'Selvania & Uzurion',
    badge: { icon: 'fa-code-fork', text: '+1700 forks' },
    bullets: [
      'Launcher modulaire (**Electron.js / React**) — **+150 000 utilisateurs**',
      "Architecture plugin extensible, **CI/CD** et mises à jour automatiques à l'échelle",
    ],
  },
  {
    icon: 'fa-android',
    iconBrand: true,
    iconClass: 'text-green-500',
    title: 'Android AOSP & ROMs',
    grid: true,
    bullets: [
      'Compilation & optimisation de ROMs sur plusieurs appareils',
      "Contribution à l'écosystème **Android AOSP**",
    ],
  },
  {
    icon: 'fa-npm',
    iconBrand: true,
    iconClass: 'text-red-500',
    title: 'Librairies NPM',
    grid: true,
    bullets: ['Maintenance de paquets — **+1000 téléchargements / mois**'],
  },
]

export const education: Education[] = [
  { title: 'Bachelor Dév. Web', badge: 'Bac+3', school: 'Epitech Lille', period: '2026 – 2027' },
  { title: 'Web@cadémie', badge: 'Bac+2', school: 'Epitech Lille', period: '2023 – 2025' },
]

export const atsParseText = `André Gallo. Lille, France. contact@luuxis.fr. luuxis.fr. github.com/luuxis.
Développeur Full-Stack. Lead Developer. Software Engineer. Ingénieur logiciel. Web Developer. DevOps Engineer. Backend Developer. Frontend Developer.
TypeScript. JavaScript. React. Node.js. Hono. Ruby on Rails. Rails 8. Symfony. PHP. PostgreSQL. Redis. MySQL. Docker. CI/CD. Git. GitHub Actions. Kamal. Linux.
Cloudflare. Cloudflare Workers. D1. R2. AWS S3. Stripe. Stancer. Brevo. API REST. SaaS. Electron. Hotwire. Stimulus. Tailwind CSS. EasyAdmin. Sentry.
Tests automatisés. TDD. Architecture logicielle. Microservices. Serverless. Intégration continue. Déploiement continu. Monitoring. Performance. Sécurité. OTP. 2FA.
LuuxCraft. Farahon. LastWill. MPDH. Epitech Lille. Bachelor Développement Web. Web@cadémie. Open Source. Selvania. Android AOSP. NPM.
Work Experience. Professional Experience. Skills. Education. Summary. Profile. Full-Stack. Back-End. Front-End. PostgreSQL. CMS. SEO. Google Analytics.`

export const schemaLdJson = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: person.fullName,
  jobTitle: ['Développeur Full-Stack', 'Lead Developer', 'Software Engineer', 'DevOps'],
  email: person.email,
  url: person.website,
  sameAs: [person.github],
  address: {
    '@type': 'PostalAddress',
    addressLocality: person.location.city,
    addressCountry: person.location.country,
  },
  knowsAbout: [
    'TypeScript', 'JavaScript', 'React', 'Node.js', 'Hono', 'Ruby on Rails', 'Rails',
    'Symfony', 'PHP', 'PostgreSQL', 'Redis', 'MySQL', 'Docker', 'DevOps', 'CI/CD',
    'Cloudflare Workers', 'Stripe', 'API REST', 'SaaS', 'Electron', 'GitHub Actions',
    'Kamal', 'Sentry', 'Tailwind CSS', 'Hotwire', 'Stimulus', 'EasyAdmin', 'AWS S3',
    'Brevo', 'Google Analytics', 'SEO', 'Linux', 'Tests automatisés', 'Architecture logicielle',
  ],
  alumniOf: [
    { '@type': 'CollegeOrUniversity', name: 'Epitech Lille', description: 'Bachelor Développement Web' },
    { '@type': 'CollegeOrUniversity', name: 'Epitech Lille', description: 'Web@cadémie' },
  ],
  worksFor: {
    '@type': 'Organization',
    name: 'LuuxCraft',
    jobTitle: 'Lead Developer',
  },
  hasOccupation: {
    '@type': 'Occupation',
    name: 'Développeur Full-Stack',
    occupationLocation: { '@type': 'City', name: 'Lille' },
    skills: 'TypeScript, React, Rails, PostgreSQL, Docker, Cloudflare, CI/CD',
  },
}
