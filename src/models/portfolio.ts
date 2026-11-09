import { typo } from './typo'
import type { IconName } from '../views/shared/icons'

export type Fact = { label: string; value: string }

export type NowItem = { icon: IconName; text: string }

export type LuuxCraftPart = { icon: IconName; name: string; text: string; stack: string }

export type Project = {
  icon: IconName
  name: string
  meta: string
  text: string
  tags: string[]
  stat?: string
  href?: string
  linkLabel?: string
}

export type Step = {
  period: string
  title: string
  org: string
  text: string
  current?: boolean
}

export type ToolGroup = { icon: IconName; title: string; items: string[] }

export const hero = typo({
  label: 'Développeur full-stack à Lille',
  lead: "J'écris des applis web et desktop, et je m'occupe aussi des serveurs qui les font tourner. Ça a commencé avec des launchers Minecraft en 2020, c'est devenu un métier.",
})

export const facts: Fact[] = typo([
  { label: 'Premier commit public', value: '2020' },
  { label: 'Forks de Selvania', value: '1 700+' },
  { label: 'Joueurs sur mes launchers', value: '150 000+' },
])

export const now: NowItem[] = typo([
  { icon: 'location_on', text: 'Lille, France' },
  { icon: 'work', text: 'Alternance chez FLEAP' },
  { icon: 'rocket_launch', text: 'Fondateur de LuuxCraft' },
  { icon: 'school', text: 'Bachelor à Epitech Lille' },
])

export const availability = typo('Ouvert aux missions freelance')

export const luuxcraft = typo({
  since: 'Mon entreprise, depuis 2025',
  title: 'LuuxCraft',
  text: "Un serveur Minecraft crée son launcher sur le panel : nom, logo, versions, mods, thème, actualités. Ses joueurs téléchargent un installeur à son nom pour Windows, macOS ou Linux. Côté code, rien n'est recompilé par client : il n'y a qu'un moteur, et l'identité arrive dans un pack généré à la volée.",
  image: '/images/luuxcraft-panel.png',
  imageAlt: 'Visuel de LuuxCraft : « Le launcher Minecraft de votre serveur, à vos couleurs. »',
  href: 'https://luuxcraft.fr',
  docs: 'https://luuxcraft.app/docs',
  parts: [
    {
      icon: 'dashboard',
      name: 'Le panel',
      text: 'Instances, éditeur de thème, actualités, abonnements.',
      stack: 'TypeScript, Hono, Workers, D1, R2',
    },
    {
      icon: 'rocket_launch',
      name: 'Le launcher',
      text: 'Un seul binaire pour tous les serveurs, ARM64 compris.',
      stack: 'Rust, Tauri 2, React',
    },
    {
      icon: 'dns',
      name: "L'agent serveur",
      text: 'Un cgroup v2 et un utilisateur par serveur Minecraft.',
      stack: 'Rust, Linux, WebSocket',
    },
  ] satisfies LuuxCraftPart[],
})

export const projects: Project[] = typo([
  {
    icon: 'sports_esports',
    name: 'Selvania Launcher',
    meta: 'Open source, 2021',
    text: 'Mon premier gros projet public : un launcher Minecraft en Electron que beaucoup de serveurs moddés ont repris à leur compte.',
    tags: ['Electron', 'Node.js'],
    stat: '219 étoiles · 1 700+ forks',
    href: 'https://github.com/luuxis/Selvania-Launcher',
    linkLabel: 'GitHub',
  },
  {
    icon: 'package_2',
    name: 'minecraft-java-core',
    meta: 'Open source, npm',
    text: 'La bibliothèque qui télécharge, installe et lance Minecraft, vanilla ou avec Forge, NeoForge, Fabric et Quilt.',
    tags: ['TypeScript', 'Node.js'],
    href: 'https://github.com/luuxis/minecraft-java-core',
    linkLabel: 'GitHub',
  },
  {
    icon: 'deployed_code',
    name: 'crust_core',
    meta: 'Open source, crates.io',
    text: "minecraft-java-core réécrit en Rust, avec les mêmes loaders et les comptes Microsoft. C'est lui qui tourne dans le launcher LuuxCraft.",
    tags: ['Rust', 'Tokio'],
    href: 'https://crates.io/crates/crust_core',
    linkLabel: 'crates.io',
  },
  {
    icon: 'android',
    name: 'Evolution X, Edge 40 Pro',
    meta: 'Android',
    text: "Un build officiel d'Evolution X pour le Motorola Edge 40 Pro, version d'Android modifiée par la communauté permettant de bénéficier de fonctionnalités avancées et d'un support optimal.",
    tags: ['AOSP', 'Linux', 'Caddy'],
  },
  {
    icon: 'school',
    name: 'CORELAB',
    meta: 'Epitech, à trois',
    text: 'Une plateforme de cours en ligne : des leçons, un QCM par leçon qui débloque la suivante, et le suivi des notes pour les admins.',
    tags: ['Hono', 'Workers', 'D1', 'Drizzle'],
  },
  {
    icon: 'shield_lock',
    name: 'LastWill',
    meta: 'Chez Farahon, 2024 – 2026',
    text: 'Un coffre-fort numérique avec cartes NFC et assurance obsèques. Rails 8 en production, autour de 20 000 visites par jour.',
    tags: ['Rails 8', 'PostgreSQL', 'Kamal'],
  },
])

export const steps: Step[] = typo([
  {
    period: 'Depuis sept. 2026',
    title: 'Développeur full-stack en alternance',
    org: 'FLEAP',
    text: "Je construis le tri automatique des documents que les clients déposent, factures et bons de pesée : l'IA classe, une seconde passe vérifie, un admin tranche en cas de doute.",
    current: true,
  },
  {
    period: 'Depuis 2026',
    title: 'Bachelor développement web',
    org: 'Epitech Lille',
    text: "En alternance, après la Web@cadémie. C'est là qu'on a monté CORELAB à trois.",
    current: true,
  },
  {
    period: 'Depuis 2025',
    title: 'Fondateur',
    org: 'LuuxCraft',
    text: "Le panel, le launcher, l'agent serveur, les mails, la facturation : tout passe par moi.",
    current: true,
  },
  {
    period: '2024 – 2026',
    title: 'Développeur full-stack',
    org: 'Farahon',
    text: 'LastWill en Rails 8 : coffre-fort, portail EPF, paiements, double authentification. Temps de réponse en baisse de 30 %, erreurs Sentry de 70 %.',
  },
  {
    period: '2023 – 2025',
    title: 'Web@cadémie',
    org: 'Epitech Lille',
    text: 'Deux ans de formation par projets, en autonomie, avant le Bachelor.',
  },
  {
    period: '2020 – 2023',
    title: 'Développeur web freelance',
    org: 'Indépendant',
    text: "Une trentaine de sites et d'API pour des associations et des petites boîtes. Le site du Mouvement pour un Développement Humain, fait en Symfony à l'époque, je l'ai réécrit depuis en Hono sur Cloudflare Workers.",
  },
  {
    period: '2020',
    title: 'Premiers commits',
    org: 'GitHub',
    text: 'minecraft-java-core, puis Selvania Launcher en 2021. Tout part de là.',
  },
])

export const tools: ToolGroup[] = typo([
  {
    icon: 'terminal',
    title: 'Langages',
    items: ['TypeScript', 'JavaScript', 'Rust', 'Ruby', 'PHP', 'SQL'],
  },
  {
    icon: 'web',
    title: 'Web',
    items: ['React', 'Hono', 'Node.js', 'Ruby on Rails', 'Symfony', 'Tailwind', 'Hotwire'],
  },
  {
    icon: 'desktop_windows',
    title: 'Desktop et mobile',
    items: ['Tauri 2', 'Electron', 'AOSP'],
  },
  {
    icon: 'cloud',
    title: 'Infra et données',
    items: ['Cloudflare Workers', 'D1', 'R2', 'KV', 'PostgreSQL', 'Redis', 'Docker', 'Kamal', 'GitHub Actions', 'Linux', 'Caddy', 'Traefik'],
  },
])
