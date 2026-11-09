/** Identité et coordonnées, partagées par le site et le CV. */
export const person = {
  firstName: 'André',
  lastName: 'Gallo',
  fullName: 'André Gallo',
  handle: 'Luuxis',
  role: 'Développeur full-stack',
  city: 'Lille',
  country: 'France',
  email: 'contact@luuxis.fr',
  phone: '07 64 85 67 62',
  phoneHref: 'tel:+33764856762',
  website: 'https://luuxis.fr',
  websiteLabel: 'luuxis.fr',
  github: 'https://github.com/luuxis',
  githubLabel: 'github.com/luuxis',
  linkedin: 'https://www.linkedin.com/in/luuxis',
  linkedinLabel: 'linkedin.com/in/luuxis',
  malt: 'https://www.malt.fr/profile/andregallo1',
  cv: '/cv.pdf',
}

export const schemaLdJson = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: person.fullName,
  alternateName: person.handle,
  jobTitle: person.role,
  email: person.email,
  url: person.website,
  sameAs: [person.github, person.linkedin],
  address: {
    '@type': 'PostalAddress',
    addressLocality: person.city,
    addressCountry: 'FR',
  },
  worksFor: [
    { '@type': 'Organization', name: 'FLEAP' },
    { '@type': 'Organization', name: 'LuuxCraft', url: 'https://luuxcraft.fr' },
  ],
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Epitech Lille' },
  knowsAbout: [
    'TypeScript', 'React', 'Hono', 'Node.js', 'Rust', 'Tauri', 'Ruby on Rails', 'Symfony',
    'PostgreSQL', 'Cloudflare Workers', 'Docker', 'Linux', 'Electron',
  ],
}
