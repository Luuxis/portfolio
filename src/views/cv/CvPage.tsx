import { atsParseText, person, schemaLdJson } from '../../models/cv'
import { cvStyles } from './styles'
import { MainContent } from './components/MainContent'
import { Sidebar } from './components/Sidebar'

const tailwindConfig = `
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        indigo: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe',
          300: '#a5b4fc', 400: '#818cf8', 500: '#6366f1',
          600: '#4f46e5', 700: '#4338ca', 900: '#312e81',
        }
      }
    }
  }
}
`

export function CvPage() {
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>
          {person.fullName} — {person.title}
        </title>
        <meta
          name="description"
          content={`CV ${person.fullName} — Développeur Full-Stack, Lead Developer, Software Engineer. TypeScript, React, Ruby on Rails, Symfony, PostgreSQL, Cloudflare Workers, Docker, CI/CD. SaaS en production, +150k utilisateurs, 20k req/jour. Lille, France.`}
        />
        <meta
          name="keywords"
          content="Développeur Full-Stack, Lead Developer, Software Engineer, Ingénieur logiciel, TypeScript, JavaScript, React, Node.js, Hono, Ruby on Rails, Rails, Symfony, PHP, PostgreSQL, Redis, Docker, DevOps, CI/CD, Cloudflare Workers, Stripe, API REST, SaaS, Electron, GitHub Actions, Kamal, Sentry, Tailwind, Hotwire, EasyAdmin, AWS S3, Lille"
        />
        <meta name="author" content={person.fullName} />
        <script type="application/ld+json">{JSON.stringify(schemaLdJson)}</script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
        <script>{tailwindConfig}</script>
        <style>{cvStyles}</style>
      </head>
      <body class="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] min-h-screen flex justify-center items-start py-8 px-5 print:p-0 print:m-0 print:bg-white print:block">
        <main
          class="cv-wrap w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] bg-white rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,.45)] flex overflow-hidden print:rounded-none print:shadow-none"
          itemscope
          itemtype="https://schema.org/Person"
        >
          <meta itemprop="name" content={person.fullName} />
          <meta itemprop="email" content={person.email} />
          <link itemprop="url" href={person.website} />
          <meta itemprop="jobTitle" content="Développeur Full-Stack" />
          <Sidebar />
          <MainContent />
          <p class="ats-parse" aria-hidden="true">
            {atsParseText}
          </p>
        </main>
      </body>
    </html>
  )
}
