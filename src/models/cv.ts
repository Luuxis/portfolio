/**
 * Contenu du CV (une page A4). Écrit comme un CV qu'on rédige soi-même :
 * des faits, peu de chiffres, pas de mots-clés empilés.
 */

import { typo } from './typo'

export type Job = {
  org: string
  role: string
  period: string
  place?: string
  context?: string
  points: string[]
  stack: string
}

export type SideProject = {
  name: string
  meta: string
  text: string
}

export type Course = {
  title: string
  school: string
  period: string
}

export type SkillRow = {
  label: string
  items: string
}

export const headline = typo('Développeur full-stack')

export const currently = typo('Alternant chez FLEAP, fondateur de LuuxCraft, étudiant à Epitech Lille')

export const intro =
  typo("Je code depuis 2020. J'ai commencé par des launchers Minecraft open source, puis il y a eu le freelance, une appli Rails en production chez Farahon et la création de LuuxCraft, mon entreprise. J'aime avoir la main sur toute la chaîne : le schéma de la base, le code, le déploiement et le serveur qui fait tourner le tout.")

export const jobs: Job[] = typo([
  {
    org: 'FLEAP',
    role: 'Développeur full-stack en alternance',
    period: 'Depuis sept. 2026',
    place: 'Saint-Denis, à distance',
    context: 'Plateforme B2B de gestion et de suivi des collectes de déchets.',
    points: [
      "Tri automatique des documents envoyés par les clients (factures, bons de pesée) : une IA classe chaque fichier, une seconde passe vérifie, et un admin tranche quand les deux ne sont pas d'accord.",
    ],
    stack: 'Ruby on Rails 8.1, PostgreSQL, Sidekiq, React',
  },
  {
    org: 'LuuxCraft',
    role: 'Fondateur et développeur',
    period: 'Depuis 2025',
    place: 'Lille, auto-entrepreneur',
    context: 'Un SaaS qui donne à un serveur Minecraft son propre launcher, à son nom, sur Windows, macOS et Linux.',
    points: [
      'Le panel web : instances Forge, Fabric, NeoForge et Quilt, éditeur de thème, actualités, abonnements payés par Stancer.',
      "Le launcher en Rust avec Tauri 2. Un seul binaire pour tous les clients : le nom, le logo et l'installeur arrivent dans un pack généré par le panel. Mises à jour automatiques, ARM64 natif.",
      "L'agent installé sur les dédiés, lui aussi en Rust : chaque serveur Minecraft tourne dans son propre cgroup v2, sous son propre utilisateur, et reçoit ses ordres du panel par WebSocket.",
    ],
    stack: 'TypeScript, Hono, Cloudflare Workers, D1, R2, KV, Rust, Tauri 2, React',
  },
  {
    org: 'Farahon',
    role: 'Développeur full-stack',
    period: 'Oct. 2024 – févr. 2026',
    context: "LastWill, un coffre-fort numérique avec un parcours d'assurance obsèques.",
    points: [
      'Le coffre-fort, les cartes NFC et le portail EPF (devis, contrats, envoi de SMS), en Rails 8 avec Hotwire.',
      'Paiements Stancer et Stripe, e-mails Brevo, fichiers sur S3, double authentification par code à usage unique.',
      '20 000 visites par jour : temps de réponse réduits de 30 %, erreurs Sentry de 70 %, plus de 85 % du code testé.',
    ],
    stack: 'Ruby on Rails 8, PostgreSQL, Redis, Docker, Kamal, GitHub Actions',
  },
  {
    org: 'Indépendant',
    role: 'Développeur web freelance',
    period: 'Oct. 2020 – nov. 2023',
    points: [
      "Une trentaine de sites et d'API pour des associations et des petites entreprises.",
      'Le site du Mouvement pour un Développement Humain : articles, dons, back-office EasyAdmin, référencement.',
    ],
    stack: 'Symfony, PHP, PostgreSQL, Tailwind, Docker',
  },
])

export const sideProjects: SideProject[] = typo([
  {
    name: 'Selvania Launcher',
    meta: 'Electron, 2021',
    text: 'Mon launcher Minecraft open source, repris par beaucoup de serveurs moddés : 219 étoiles et plus de 1 700 forks.',
  },
  {
    name: 'minecraft-java-core',
    meta: 'TypeScript, npm',
    text: 'La bibliothèque qui installe et lance Minecraft, vanilla ou moddé. Selvania tourne dessus.',
  },
  {
    name: 'crust_core',
    meta: 'Rust, crates.io',
    text: "La même bibliothèque réécrite en Rust. C'est le moteur du launcher LuuxCraft.",
  },
  {
    name: 'Evolution X pour le Motorola Edge 40 Pro',
    meta: 'AOSP',
    text: 'Un build Android non officiel que je maintiens, avec mon propre serveur de mises à jour OTA.',
  },
  {
    name: 'CORELAB',
    meta: 'Epitech, à trois',
    text: 'Une plateforme de cours en ligne sur Cloudflare Workers : leçons, QCM qui débloquent la suite, suivi des notes.',
  },
])

export const courses: Course[] = typo([
  { title: 'Bachelor développement web', school: 'Epitech Lille', period: '2026 – en cours, en alternance' },
  { title: 'Web@cadémie', school: 'Epitech Lille', period: '2023 – 2025' },
])

export const skills: SkillRow[] = typo([
  { label: 'Langages', items: 'TypeScript, JavaScript, Rust, Ruby, PHP, SQL' },
  { label: 'Web', items: 'React, Hono, Node.js, Rails, Symfony, Tailwind' },
  { label: 'Desktop', items: 'Tauri 2, Electron' },
  { label: 'Données', items: 'PostgreSQL, SQLite (D1), Redis' },
  { label: 'Infra', items: 'Cloudflare, Docker, Kamal, GitHub Actions, Linux' },
])

export const languages = typo([
  { name: 'Français', level: 'langue maternelle' },
  { name: 'Anglais', level: 'lu et écrit tous les jours (doc, issues, code)' },
  { name: 'Italien', level: 'débutant, lu et écrit occasionnellement' }
])

export const outside =
  typo('Physique théorique et astronomie, mangas et Minecraft.')
