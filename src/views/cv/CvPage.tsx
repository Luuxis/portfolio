import { phoneHref, type CvContent } from '../../models/cv-content'
import { schemaLdJson } from '../../models/profile'
import { typo } from '../../models/typo'
import { jsonLd } from '../shared/html'
import { Icon, type IconName } from '../shared/Icon'
import { cvFitScript, cvStyles } from './styles'

type Contact = { icon: IconName; label: string; href?: string }

function contactsOf(cv: CvContent): Contact[] {
  const p = cv.person
  const label = (text: string, url: string) => text || url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  const items: (Contact | null)[] = [
    p.city || p.country ? { icon: 'location_on', label: [p.city, p.country].filter(Boolean).join(', ') } : null,
    p.email ? { icon: 'mail', label: p.email, href: `mailto:${p.email}` } : null,
    p.phone ? { icon: 'call', label: p.phone, href: phoneHref(p.phone) } : null,
    p.website ? { icon: 'language', label: label(p.websiteLabel, p.website), href: p.website } : null,
    p.github ? { icon: 'code', label: label(p.githubLabel, p.github), href: p.github } : null,
    p.linkedin ? { icon: 'groups', label: label(p.linkedinLabel, p.linkedin), href: p.linkedin } : null,
  ]
  return items.filter((item): item is Contact => item !== null)
}

function CvHeader({ cv }: { cv: CvContent }) {
  return (
    <header class="cv-head">
      <div>
        <h1 class="cv-name">{cv.person.fullName}</h1>
        {cv.person.headline ? (
          <p class="cv-role">
            <span>{cv.person.headline}</span>
          </p>
        ) : null}
        {cv.person.currently ? <p class="cv-now">{cv.person.currently}</p> : null}
      </div>
      {cv.photo ? <img class="cv-photo" src={cv.photo} alt={`Photo d'${cv.person.fullName}`} width="88" height="88" /> : null}
      <ul class="cv-contact">
        {contactsOf(cv).map((item) => (
          <li>
            <Icon name={item.icon} size={13} />
            {item.href ? <a href={item.href}>{item.label}</a> : item.label}
          </li>
        ))}
      </ul>
    </header>
  )
}

function Experience({ cv }: { cv: CvContent }) {
  if (!cv.jobs.length) return null
  return (
    <section>
      <h2 class="cv-h">{cv.titles.experience}</h2>
      {cv.jobs.map((job) => (
        <article class="job">
          <p class="job-when">
            {job.period}
            {job.place ? <span class="job-place">{job.place}</span> : null}
          </p>
          <div>
            <h3>
              {job.org}
              {job.role ? <span class="job-role"> · {job.role}</span> : null}
            </h3>
            {job.context ? <p class="job-ctx">{job.context}</p> : null}
            {job.points.length ? (
              <ul class="job-list">
                {job.points.map((point) => (
                  <li>{point}</li>
                ))}
              </ul>
            ) : null}
            {job.stack ? (
              <p class="job-stack">
                <b>Outils&nbsp;:</b> {job.stack}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </section>
  )
}

function Projects({ cv }: { cv: CvContent }) {
  return (
    <section>
      {cv.sideProjects.length ? <h2 class="cv-h">{cv.titles.projects}</h2> : null}
      {cv.sideProjects.map((project) => (
        <article class="proj">
          <h3>
            {project.name}
            {project.meta ? <span class="proj-meta"> {project.meta}</span> : null}
          </h3>
          <p>{project.text}</p>
        </article>
      ))}
      {cv.outside ? (
        <>
          <h2 class="cv-h">{cv.titles.outside}</h2>
          <p class="outside">{cv.outside}</p>
        </>
      ) : null}
    </section>
  )
}

function Side({ cv }: { cv: CvContent }) {
  return (
    <div>
      {cv.courses.length ? (
      <section>
        <h2 class="cv-h">{cv.titles.education}</h2>
        <ul class="edu">
          {cv.courses.map((course) => (
            <li>
              <h3>{[course.title, course.school].filter(Boolean).join(', ')}</h3>
              {course.period ? <p>{course.period}</p> : null}
            </li>
          ))}
        </ul>
      </section>
      ) : null}
      {cv.skills.length ? (
      <section>
        <h2 class="cv-h">{cv.titles.skills}</h2>
        <dl class="skills">
          {cv.skills.map((row) => (
            <>
              <dt>{row.label}</dt>
              <dd>{row.items}</dd>
            </>
          ))}
        </dl>
      </section>
      ) : null}
      {cv.languages.length ? (
      <section>
        <h2 class="cv-h">{cv.titles.languages}</h2>
        <ul class="langs">
          {cv.languages.map((lang) => (
            <li>
              <b>{lang.name}</b>
              {lang.level ? (
                <>
                  &nbsp;: <span>{lang.level}</span>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      ) : null}
    </div>
  )
}

export function CvPage({ cv: raw, toolbar = true }: { cv: CvContent; toolbar?: boolean }) {
  const cv = typo(raw)
  const description = [`CV d'${cv.person.fullName}`, cv.person.headline, cv.person.currently].filter(Boolean).join(' · ')
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`CV d'${cv.person.fullName}${cv.person.headline ? `, ${cv.person.headline.toLowerCase()}` : ''}`}</title>
        <meta name="description" content={description} />
        <meta name="author" content={cv.person.fullName} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemaLdJson) }} />
        <style dangerouslySetInnerHTML={{ __html: cvStyles }} />
      </head>
      <body>
        <div class="cv-screen">
          {toolbar ? (
          <nav class="toolbar" aria-label="Actions">
            <a class="btn" href="/">
              <Icon name="arrow_back" size={18} />
              Le site
            </a>
            <a class="btn btn-primary" href="/cv.pdf">
              <Icon name="download" size={18} />
              Télécharger en PDF
            </a>
          </nav>
          ) : null}
          <main class="sheet">
            <CvHeader cv={cv} />
            {cv.intro ? <p class="cv-intro">{cv.intro}</p> : null}
            <Experience cv={cv} />
            <div class="cv-cols">
              <Projects cv={cv} />
              <Side cv={cv} />
            </div>
            <div class="cv-terrain" aria-hidden="true"></div>
          </main>
        </div>
        <script dangerouslySetInnerHTML={{ __html: cvFitScript }} />
      </body>
    </html>
  )
}
