import { avatarDataUrl } from '../../../models/avatar'
import { intro, links, person } from '../../../models/portfolio'

export function Hero() {
  return (
    <section class="hero">
      <div class="hero-card anim">
        <div>
          <div class="eyebrow">
            <span class="eyebrow-loc">{intro.location}</span>
            <span class="status-pill">Disponible</span>
          </div>
          <h1>
            {person.firstName} {person.lastName}
            <span class="handle">@{intro.handle}</span>
          </h1>
          <p class="hero-role">{intro.role}</p>
          <p class="hero-pitch">{intro.pitch}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href={links.cv}>
              Télécharger le CV
            </a>
            <a class="btn" href={links.github} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a class="btn" href={links.malt} target="_blank" rel="noopener noreferrer">
              Malt
            </a>
          </div>
        </div>
        <div class="hero-visual avatar-wrap">
          <div class="avatar-frame">
            <img src={avatarDataUrl} alt={`Photo de ${person.fullName}`} width="122" height="122" />
          </div>
        </div>
      </div>
    </section>
  )
}
