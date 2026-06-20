import { person, schemaLdJson } from '../../models/cv'
import { Contact, Footer } from './components/Contact'
import { Expertise } from './components/Expertise'
import { Hero } from './components/Hero'
import { Metrics } from './components/Metrics'
import { Nav } from './components/Nav'
import { Projects } from './components/Projects'
import { Timeline } from './components/Timeline'
import { homeStyles } from './styles'

export function HomePage() {
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{person.fullName} — Développeur Full-Stack & DevOps</title>
        <meta
          name="description"
          content="Portfolio d'André Gallo (Luuxis) — développeur full-stack & DevOps à Lille. LuuxCraft, Selvania Launcher, Rails, TypeScript, Cloudflare."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script type="application/ld+json">{JSON.stringify(schemaLdJson)}</script>
        <style>{homeStyles}</style>
      </head>
      <body>
        <Nav />
        <main class="wrap">
          <Hero />
          <Metrics />
          <Timeline />
          <Projects />
          <Expertise />
          <Contact />
        </main>
        <Footer />
      </body>
    </html>
  )
}
