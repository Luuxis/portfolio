import { person } from '../../../models/profile'
import { Icon } from '../../shared/Icon'

export function Contact() {
  return (
    <section class="section" id="contact" aria-labelledby="contact-title">
      <div class="wrap">
        <div class="contact">
          <div>
            <p class="lbl">Contact</p>
            <h2 id="contact-title" class="disp">
              Un projet, une question&nbsp;?
            </h2>
            <p>Le plus simple, c'est un mail. Je réponds sous 48&nbsp;h.</p>
            <a class="contact-mail link-arrow" href={`mailto:${person.email}`}>
              <Icon name="mail" size={28} />
              {person.email}
            </a>
          </div>
          <div class="contact-links">
            <a class="btn btn-secondary" href={person.linkedin} target="_blank" rel="noopener noreferrer">
              <Icon name="groups" size={20} />
              LinkedIn
            </a>
            <a class="btn btn-secondary" href={person.github} target="_blank" rel="noopener noreferrer">
              <Icon name="code" size={20} />
              GitHub
            </a>
            <a class="btn btn-secondary" href={person.malt} target="_blank" rel="noopener noreferrer">
              <Icon name="handshake" size={20} />
              Malt
            </a>
            <a class="btn btn-primary" href={person.cv}>
              <Icon name="download" size={20} />
              CV en PDF
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer class="site-footer">
      <div class="wrap footer-inner">
        <p>
          © {new Date().getFullYear()} {person.fullName}. Codé à Lille, servi par Cloudflare Workers.
        </p>
        <nav aria-label="Liens">
          <a href={person.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={person.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href="/cv">CV</a>
        </nav>
      </div>
    </footer>
  )
}
