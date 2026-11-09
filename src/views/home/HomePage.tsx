import { person, schemaLdJson } from '../../models/profile'
import { jsonLd } from '../shared/html'
import { themeBootScript, themeToggleScript } from '../shared/theme'
import { Contact, Footer } from './components/Contact'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Projects } from './components/Projects'
import { Timeline } from './components/Timeline'
import { Tools } from './components/Tools'
import { homeStyles } from './styles'

const title = `${person.fullName} (Luuxis), développeur full-stack à Lille`
const description =
  "André Gallo, alias Luuxis : développeur full-stack à Lille, fondateur de LuuxCraft, alternant chez FLEAP. Launchers Minecraft, Rust, TypeScript, Rails et Cloudflare."

export function HomePage() {
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="author" content={person.fullName} />
        <link rel="canonical" href={`${person.website}/`} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#E8E4DA" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#24231F" media="(prefers-color-scheme: dark)" />
        <meta property="og:type" content="profile" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${person.website}/`} />
        <meta property="og:image" content={`${person.website}/images/og.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemaLdJson) }} />
        <style dangerouslySetInnerHTML={{ __html: homeStyles }} />
      </head>
      <body>
        <a class="skip" href="#contenu">
          Aller au contenu
        </a>
        <Header />
        <main id="contenu">
          <Hero />
          <Projects />
          <Timeline />
          <Tools />
          <Contact />
        </main>
        <Footer />
        <script dangerouslySetInnerHTML={{ __html: themeToggleScript }} />
      </body>
    </html>
  )
}
