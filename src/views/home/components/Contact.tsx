import { intro, links, person } from '../../../models/portfolio'
import { SectionHead } from './SectionHead'

export function Contact() {
  return (
    <section class="section" id="contact">
      <SectionHead
        num="04"
        title="Contact"
        description="Un projet, une mission, une question technique — je réponds sous 48h."
      />
      <div class="contact-box anim d2">
        <div>
          <h2>Travaillons ensemble</h2>
          <p>{intro.availability}</p>
        </div>
        <div class="contact-links">
          <a class="btn btn-primary" href={`mailto:${links.email}`}>
            {links.email}
          </a>
          <a class="btn" href={links.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a class="btn" href={links.cv}>
            CV PDF
          </a>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer class="wrap footer">
      <p>
        © {new Date().getFullYear()} {person.fullName} ·{' '}
        <a href={links.github}>GitHub</a> · Cloudflare Workers
      </p>
    </footer>
  )
}
