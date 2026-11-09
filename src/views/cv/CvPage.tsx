import { avatarDataUrl } from '../../models/avatar'
import {
  courses,
  currently,
  headline,
  intro,
  jobs,
  languages,
  outside,
  sideProjects,
  skills,
} from '../../models/cv'
import { person, schemaLdJson } from '../../models/profile'
import { jsonLd } from '../shared/html'
import { Icon, type IconName } from '../shared/Icon'
import { cvFitScript, cvStyles } from './styles'

const contacts: { icon: IconName; label: string; href?: string }[] = [
  { icon: 'location_on', label: `${person.city}, ${person.country}` },
  { icon: 'mail', label: person.email, href: `mailto:${person.email}` },
  { icon: 'call', label: person.phone, href: person.phoneHref },
  { icon: 'language', label: person.websiteLabel, href: person.website },
  { icon: 'code', label: person.githubLabel, href: person.github },
  { icon: 'groups', label: person.linkedinLabel, href: person.linkedin },
]

function CvHeader() {
  return (
    <header class="cv-head">
      <div>
        <h1 class="cv-name">{person.fullName}</h1>
        <p class="cv-role">
          <span>{headline}</span>
        </p>
        <p class="cv-now">{currently}</p>
      </div>
      <img class="cv-photo" src={avatarDataUrl} alt={`Photo d'${person.fullName}`} width="88" height="88" />
      <ul class="cv-contact">
        {contacts.map((item) => (
          <li>
            <Icon name={item.icon} size={13} />
            {item.href ? <a href={item.href}>{item.label}</a> : item.label}
          </li>
        ))}
      </ul>
    </header>
  )
}

function Experience() {
  return (
    <section>
      <h2 class="cv-h">Expérience</h2>
      {jobs.map((job) => (
        <article class="job">
          <p class="job-when">
            {job.period}
            {job.place ? <span class="job-place">{job.place}</span> : null}
          </p>
          <div>
            <h3>
              {job.org} <span class="job-role">· {job.role}</span>
            </h3>
            {job.context ? <p class="job-ctx">{job.context}</p> : null}
            <ul class="job-list">
              {job.points.map((point) => (
                <li>{point}</li>
              ))}
            </ul>
            <p class="job-stack">
              <b>Outils&nbsp;:</b> {job.stack}
            </p>
          </div>
        </article>
      ))}
    </section>
  )
}

function Projects() {
  return (
    <section>
      <h2 class="cv-h">Projets perso</h2>
      {sideProjects.map((project) => (
        <article class="proj">
          <h3>
            {project.name}{' '}
            <span class="proj-meta">{project.meta}</span>
          </h3>
          <p>{project.text}</p>
        </article>
      ))}
      <h2 class="cv-h">À côté</h2>
      <p class="outside">{outside}</p>
    </section>
  )
}

function Side() {
  return (
    <div>
      <section>
        <h2 class="cv-h">Formation</h2>
        <ul class="edu">
          {courses.map((course) => (
            <li>
              <h3>
                {course.title}, {course.school}
              </h3>
              <p>{course.period}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 class="cv-h">Compétences</h2>
        <dl class="skills">
          {skills.map((row) => (
            <>
              <dt>{row.label}</dt>
              <dd>{row.items}</dd>
            </>
          ))}
        </dl>
      </section>
      <section>
        <h2 class="cv-h">Langues</h2>
        <ul class="langs">
          {languages.map((lang) => (
            <li>
              <b>{lang.name}</b>&nbsp;: <span>{lang.level}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function CvPage() {
  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>CV d'{person.fullName}, développeur full-stack</title>
        <meta
          name="description"
          content="CV d'André Gallo : développeur full-stack à Lille, alternant chez FLEAP, fondateur de LuuxCraft. TypeScript, Rust, Ruby on Rails, Cloudflare."
        />
        <meta name="author" content={person.fullName} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schemaLdJson) }} />
        <style dangerouslySetInnerHTML={{ __html: cvStyles }} />
      </head>
      <body>
        <div class="cv-screen">
          <nav class="toolbar" aria-label="Actions">
            <a class="btn" href="/">
              <Icon name="arrow_back" size={18} />
              Le site
            </a>
            <a class="btn btn-primary" href={person.cv}>
              <Icon name="download" size={18} />
              Télécharger en PDF
            </a>
          </nav>
          <main class="sheet">
            <CvHeader />
            <p class="cv-intro">{intro}</p>
            <Experience />
            <div class="cv-cols">
              <Projects />
              <Side />
            </div>
            <div class="cv-terrain" aria-hidden="true"></div>
          </main>
        </div>
        <script dangerouslySetInnerHTML={{ __html: cvFitScript }} />
      </body>
    </html>
  )
}
