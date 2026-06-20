import { person, skillGroups } from './cv'

export type TimelineEvent = {
  period: string
  title: string
  org?: string
  description: string
  tags?: string[]
  href?: string
  kind: 'work' | 'oss' | 'edu' | 'milestone'
}

export type Project = {
  name: string
  role: string
  description: string
  metrics?: string[]
  stack: string[]
  href?: string
  status: 'prod' | 'oss' | 'client'
}

export type Metric = {
  value: string
  label: string
  detail?: string
}

export const intro = {
  handle: 'Luuxis',
  role: 'Développeur full-stack & DevOps',
  location: 'Lille, France',
    pitch:
      "Je conçois et déploie des produits web et desktop en production — du launcher open source utilisé par des centaines de milliers de joueurs au SaaS LuuxCraft qui distribue des gigaoctets chaque jour. Full-stack et DevOps : une seule personne de l'architecture au monitoring.",
  availability: 'Ouvert aux missions full-stack, SaaS et outils techniques.',
}

export const metrics: Metric[] = [
  { value: '150k+', label: 'joueurs touchés', detail: 'écosystème launchers' },
  { value: '1,7k', label: 'forks OSS', detail: 'Selvania & dérivés' },
  { value: '219', label: 'étoiles GitHub', detail: 'Selvania-Launcher' },
  { value: '20k', label: 'req / jour', detail: 'Rails @ Farahon' },
  { value: '4 ans', label: 'en production', detail: 'web & desktop' },
  { value: '23', label: 'repos publics', detail: 'GitHub depuis 2020' },
]

export const timeline: TimelineEvent[] = [
  {
    period: '2026 →',
    title: 'Bachelor Développement Web',
    org: 'Epitech Lille',
    description: 'Poursuite du cursus en parallèle du lead technique chez LuuxCraft.',
    kind: 'edu',
  },
  {
    period: '2025 →',
    title: 'Lead Developer',
    org: 'LuuxCraft',
    description:
      'Conception du panel SaaS : auth Microsoft/AzAuth, abonnements Stripe, builds Electron multi-plateforme via GitHub Actions, infra Cloudflare Workers + R2 (~10 Go/j de distribution).',
    tags: ['TypeScript', 'React', 'Hono', 'Cloudflare', 'Stripe', 'Electron'],
    href: 'https://luuxcraft.fr',
    kind: 'work',
  },
  {
    period: 'oct. 2024 – fév. 2026',
    title: 'Développeur Full-Stack',
    org: 'Farahon / LastWill',
    description:
      'Rails 8 sur LastWill (coffre-fort numérique, NFC, assurance obsèques). Portail EPF, paiements Stancer/Stripe, OTP/2FA. Perf −30 %, Sentry −70 %, couverture tests ≥ 85 %.',
    tags: ['Rails 8', 'PostgreSQL', 'Hotwire', 'Kamal', 'Docker'],
    kind: 'work',
  },
  {
    period: '2024',
    title: 'Selvania référencé',
    org: '9Minecraft, communauté moddée',
    description:
      'Le launcher devient une référence pour les serveurs moddés francophones. Support Forge, Fabric, NeoForge, Quilt — Java auto, auth Microsoft.',
    tags: ['Electron', 'Node.js', 'CI/CD'],
    href: 'https://github.com/Luuxis/Selvania-Launcher',
    kind: 'oss',
  },
  {
    period: '2023 – 2025',
    title: 'Web@cadémie',
    org: 'Epitech Lille',
    description: 'Formation intensive dev web : projets, autonomie, culture technique.',
    kind: 'edu',
  },
  {
    period: '2020 – 2023',
    title: 'Freelance & projets clients',
    org: 'MPDH, associations, PME',
    description:
      '+30 livrables : Symfony 8 + EasyAdmin pour MPDH, APIs REST, SEO, analytics. Premiers pas sérieux en architecture et relation client.',
    tags: ['Symfony', 'PostgreSQL', 'Tailwind', 'Docker'],
    kind: 'work',
  },
  {
    period: 'fév. 2021',
    title: 'Selvania Launcher',
    org: 'Open source',
    description:
      'Création du launcher modulaire Electron/React. 36 releases, builds Win/Mac/Linux, mises à jour auto via GitHub. Base forkée 1 700+ fois.',
    tags: ['Electron', 'React', 'JavaScript'],
    href: 'https://github.com/Luuxis/Selvania-Launcher',
    kind: 'oss',
  },
  {
    period: 'mars 2020',
    title: 'Premiers commits publics',
    org: 'GitHub @ Luuxis',
    description: 'Début du code open source autour de Minecraft et Node.js — minecraft-java-core, modules launcher.',
    href: 'https://github.com/Luuxis',
    kind: 'milestone',
  },
]

export const projects: Project[] = [
  {
    name: 'LuuxCraft Panel',
    role: 'Lead dev · SaaS',
    description:
      'Panel pour créer, héberger et distribuer un launcher Minecraft custom. Instances multi-loaders, push mods instantané, dédup SHA1, CDN intégré.',
    metrics: ['150k+ utilisateurs', '~10 Go/j', 'Win · Mac · Linux'],
    stack: ['TypeScript', 'React', 'Hono', 'Workers', 'R2', 'Stripe'],
    href: 'https://luuxcraft.fr',
    status: 'prod',
  },
  {
    name: 'Selvania Launcher',
    role: 'Créateur · OSS',
    description:
      'Launcher moddé open source. Auth Microsoft, install Java auto, news feed, statut serveur live. Le repo le plus forké de mon GitHub.',
    metrics: ['219 ★', '1 710 forks', '36 releases'],
    stack: ['Electron', 'Node.js', 'React', 'GitHub Actions'],
    href: 'https://github.com/Luuxis/Selvania-Launcher',
    status: 'oss',
  },
  {
    name: 'LastWill',
    role: 'Full-stack · Farahon',
    description:
      'Plateforme de préparation de fin de vie : coffre-fort, parcours assurance obsèques, intégrations NFC. Stack Rails 8 en prod à 20k visites/j.',
    metrics: ['20k visites/j', 'tests ≥ 85 %', 'perf −30 %'],
    stack: ['Rails 8', 'PostgreSQL', 'Redis', 'Stimulus', 'Kamal'],
    status: 'prod',
  },
  {
    name: 'MPDH',
    role: 'Freelance',
    description: 'Site associatif avec CMS EasyAdmin, dons, modération, SEO et JSON-LD.',
    metrics: ['CMS complet', 'analytics'],
    stack: ['Symfony 8', 'PostgreSQL', 'Tailwind', 'EasyAdmin'],
    status: 'client',
  },
  {
    name: 'minecraft-java-core',
    role: 'OSS · Node',
    description: 'Lib pour gérer installations Java/Minecraft côté launcher — utilisée dans plusieurs projets communautaires.',
    metrics: ['29 ★ GitHub'],
    stack: ['Node.js', 'TypeScript'],
    href: 'https://github.com/Luuxis/minecraft-java-core',
    status: 'oss',
  },
  {
    name: 'Paquets NPM',
    role: 'Maintenance',
    description: 'Modules utilitaires pour launchers et tooling Electron — téléchargements récurrents chaque mois.',
    metrics: ['1k+ DL / mois'],
    stack: ['Node.js', 'TypeScript'],
    status: 'oss',
  },
]

export const capabilities = [
  {
    title: 'Produit & architecture',
    items: [
      'Du brief au déploiement sans silo',
      'API REST, auth, paiements récurrents',
      'Choix stack pragmatiques (monolithe Rails ou Workers edge)',
    ],
  },
  {
    title: 'Frontend & desktop',
    items: [
      'React, Tailwind, interfaces denses mais lisibles',
      'Electron multi-OS, auto-update, builds CI',
      'Hotwire/Stimulus sur apps Rails',
    ],
  },
  {
    title: 'Infra & fiabilité',
    items: [
      'Docker, Kamal, GitHub Actions',
      'Cloudflare Workers, R2, D1',
      'Monitoring Sentry, optimisation perf mesurée',
    ],
  },
]

export const links = {
  email: person.email,
  github: person.github,
  githubHandle: person.githubLabel,
  website: person.website,
  malt: 'https://www.malt.fr/profile/andregallo1',
  cv: '/cv.pdf',
}

export { person, skillGroups }
