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
  linkedin: 'https://www.linkedin.com/in/luuxis',
  linkedinLabel: 'linkedin.com/in/luuxis',
  location: { city: 'Lille', country: 'France' },
}

export const profileText =
  "**Développeur Full-Stack senior** avec **4 ans d'expérience** à concevoir et opérer des plateformes web et SaaS en production avec **TypeScript**, **React**, **Node.js**, **Ruby on Rails**, **PostgreSQL**, **Docker** et **CI/CD**. Gains mesurables de **performance**, **fiabilité** et **scalabilité** sur des produits servant **+150 000 utilisateurs** et **20 000 requêtes/jour**."

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
  {
    icon: 'fa-linkedin',
    iconBrand: true,
    content: person.linkedinLabel,
    href: person.linkedin,
    itemProp: 'sameAs',
  },
]

export const skillGroups: SkillGroup[] = [
  {
    icon: 'fa-laptop-code',
    label: 'Front-end',
    tags: [
      { name: 'React', accent: true },
      { name: 'TypeScript', accent: true },
      { name: 'JavaScript', accent: true },
      { name: 'Tailwind' },
      { name: 'Hotwire' },
      { name: 'Electron.js' },
    ],
  },
  {
    icon: 'fa-server',
    label: 'Back-end',
    tags: [
      { name: 'Ruby on Rails', accent: true },
      { name: 'Node.js', accent: true },
      { name: 'Hono', accent: true },
      { name: 'Symfony' },
      { name: 'PHP' },
      { name: 'API REST' },
      { name: 'Stripe' },
    ],
  },
  {
    icon: 'fa-database',
    label: 'Bases de données',
    tags: [
      { name: 'PostgreSQL', accent: true },
      { name: 'Redis' },
      { name: 'MySQL' },
    ],
  },
  {
    icon: 'fa-gear',
    label: 'DevOps & Cloud',
    tags: [
      { name: 'Docker', accent: true },
      { name: 'CI/CD', accent: true },
      { name: 'GitHub Actions' },
      { name: 'Cloudflare' },
      { name: 'AWS S3' },
      { name: 'Linux' },
      { name: 'Git' },
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
    badge: '2025 – aujourd’hui',
    bullets: [
      "**Pilote** la plateforme back-end d'un SaaS de launchers Minecraft pour **+150 000 joueurs** — auth, abonnements et back-office (**TypeScript**, **React**, **Hono**)",
      '**Conçois** la distribution de contenu sur **Cloudflare Workers**, **D1** et **R2** — **~10 Go/jour** servis de manière fiable',
      '**Automatise** les builds des apps bureau **Electron** (**Win/Mac/Linux**) — releases reproductibles, exploitation simplifiée',
      '**Intègre** les paiements **Stripe** via **API REST** — facturation récurrente et thèmes personnalisables en self-service',
      '**Fiabilise** la production — **CI/CD**, **Docker** et supervision pour des déploiements continus',
    ],
  },
  {
    role: 'Développeur Full-Stack',
    roleSrOnly: 'Full-Stack Developer Software Engineer',
    roleSchema: 'Développeur Full-Stack',
    orgSchema: 'Farahon',
    company: 'Farahon / LastWill — préparation de fin de vie',
    dot: 'past',
    badge: 'oct. 2024 – fév. 2026',
    bullets: [
      '**Développe** le coffre-fort numérique **LastWill** (NFC, assurance obsèques) — **Rails 8**, **PostgreSQL**, **Redis**',
      '**Livre** le portail EPF — parcours devis, contrats et SMS (**Hotwire**, **Stimulus**)',
      '**Intègre** paiements et services tiers — **Stancer**, **Stripe**, **Brevo**, **AWS S3**',
      "**Sécurise** l'application — **OTP/2FA** et **≥85%** de couverture de tests",
      "**Optimise** la production à **20 000 visites/jour** — **−30%** de latence, **−70%** d'erreurs **Sentry** (**Docker**, **Kamal**, **GitHub Actions**)",
    ],
  },
  {
    role: 'Développeur Freelance',
    roleSrOnly: 'Freelance Web Developer Independent Contractor',
    roleSchema: 'Développeur Freelance',
    orgSchema: '',
    company: 'Indépendant — MPDH & clients divers',
    dot: 'old',
    badge: 'oct. 2020 – nov. 2023',
    bullets: [
      '**Livre** plus de **30 projets** clients — sites, **API REST** et déploiements **Docker**',
      '**Standardise** une stack réutilisable — **Symfony 8**, **PostgreSQL**, **Tailwind**',
      '**Développe** le site **MPDH** — articles et dons en production',
      '**Outille** un **CMS EasyAdmin** réutilisable — pages, médias, modération des commentaires',
      '**Améliore** la visibilité — **SEO** (sitemap, métadonnées, **JSON-LD**) et suivi **Google Analytics**',
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
      "**Créateur & mainteneur** d'un launcher modulaire **Electron.js / React** — **+150 000 utilisateurs**",
      'Architecture à plugins, **CI/CD** et auto-update — base **forkée +1700 fois**',
    ],
  },
  {
    icon: 'fa-android',
    iconBrand: true,
    iconClass: 'text-green-500',
    title: 'Android AOSP & ROMs',
    grid: true,
    bullets: ['**Contributeur AOSP** — compilation & optimisation de ROMs multi-appareils'],
  },
  {
    icon: 'fa-npm',
    iconBrand: true,
    iconClass: 'text-red-500',
    title: 'Librairies NPM',
    grid: true,
    bullets: ['**Mainteneur** de paquets **npm** — **+1000 téléchargements/mois**'],
  },
]

export const education: Education[] = [
  { title: 'Bachelor Dév. Web', badge: 'Bac+3', school: 'Epitech Lille', period: '2026 – en cours' },
  { title: 'Web@cadémie', badge: 'Bac+2', school: 'Epitech Lille', period: '2023 – 2025' },
]

export const schemaLdJson = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: person.fullName,
  jobTitle: ['Développeur Full-Stack', 'Lead Developer', 'Software Engineer', 'DevOps'],
  email: person.email,
  url: person.website,
  sameAs: [person.github, person.linkedin],
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
