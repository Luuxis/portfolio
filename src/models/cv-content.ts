import { avatarDataUrl } from './avatar'
import { courses, currently, headline, intro, jobs, languages, outside, sideProjects, skills, type Course, type Job, type SideProject, type SkillRow } from './cv'
import { person } from './profile'

export type Language = { name: string; level: string }

export type CvPerson = {
  fullName: string
  headline: string
  currently: string
  city: string
  country: string
  email: string
  phone: string
  website: string
  websiteLabel: string
  github: string
  githubLabel: string
  linkedin: string
  linkedinLabel: string
}

export type CvTitles = {
  experience: string
  projects: string
  outside: string
  education: string
  skills: string
  languages: string
}

/**
 * Tout le contenu du CV, tel qu'il est rangé en base (une version par
 * enregistrement depuis l'admin). Sans version enregistrée, le CV affiche
 * `defaultCv`, le contenu écrit dans `cv.ts`.
 */
export type CvContent = {
  photo: string
  person: CvPerson
  intro: string
  jobs: Job[]
  sideProjects: SideProject[]
  courses: Course[]
  skills: SkillRow[]
  languages: Language[]
  outside: string
  titles: CvTitles
}

export const defaultTitles: CvTitles = {
  experience: 'Expérience',
  projects: 'Projets perso',
  outside: 'À côté',
  education: 'Formation',
  skills: 'Compétences',
  languages: 'Langues',
}

export const defaultCv: CvContent = {
  photo: avatarDataUrl,
  person: {
    fullName: person.fullName,
    headline,
    currently,
    city: person.city,
    country: person.country,
    email: person.email,
    phone: person.phone,
    website: person.website,
    websiteLabel: person.websiteLabel,
    github: person.github,
    githubLabel: person.githubLabel,
    linkedin: person.linkedin,
    linkedinLabel: person.linkedinLabel,
  },
  intro,
  jobs,
  sideProjects,
  courses,
  skills,
  languages,
  outside,
  titles: defaultTitles,
}

/** « 07 64 85 67 62 » → « tel:+33764856762 ». */
export function phoneHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  if (/^0\d{9}$/.test(digits)) return `tel:+33${digits.slice(1)}`
  return `tel:${digits}`
}

/** Complète un contenu partiel (version ancienne, champ ajouté depuis) avec les valeurs par défaut. */
export function normalizeCv(raw: Partial<CvContent> | null | undefined): CvContent {
  if (!raw) return defaultCv
  return {
    photo: typeof raw.photo === 'string' && raw.photo.startsWith('data:image/') ? raw.photo : defaultCv.photo,
    person: { ...defaultCv.person, ...(raw.person ?? {}) },
    intro: raw.intro ?? '',
    jobs: Array.isArray(raw.jobs) ? raw.jobs : [],
    sideProjects: Array.isArray(raw.sideProjects) ? raw.sideProjects : [],
    courses: Array.isArray(raw.courses) ? raw.courses : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    languages: Array.isArray(raw.languages) ? raw.languages : [],
    outside: raw.outside ?? '',
    titles: { ...defaultTitles, ...(raw.titles ?? {}) },
  }
}
