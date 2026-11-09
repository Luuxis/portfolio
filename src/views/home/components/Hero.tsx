import { avatarDataUrl } from '../../../models/avatar'
import { availability, facts, hero, now } from '../../../models/portfolio'
import { person } from '../../../models/profile'
import { Icon } from '../../shared/Icon'

export function Hero() {
  return (
    <section class="hero" aria-labelledby="hero-title">
      <div class="wrap hero-grid">
        <div>
          <p class="lbl">{hero.label}</p>
          <h1 id="hero-title" class="disp hero-title">
            {person.fullName}{' '}
            <span class="hero-handle">
              alias <b>{person.handle}</b>
            </span>
          </h1>
          <p class="hero-lead">{hero.lead}</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href={person.cv}>
              <Icon name="description" size={20} />
              Voir mon CV
            </a>
            <a class="btn btn-secondary" href={`mailto:${person.email}`}>
              <Icon name="mail" size={20} />
              M'écrire
            </a>
            <a class="link-arrow" href={person.github} target="_blank" rel="noopener noreferrer">
              GitHub
              <Icon name="arrow_outward" size={18} />
            </a>
          </div>
          <dl class="facts">
            {facts.map((fact) => (
              <div>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure class="hero-card win">
          <div class="win-bar" aria-hidden="true">
            <span>profil.txt</span>
            <span class="win-ctrls">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </div>
          <div class="profile">
            <div class="profile-top">
              <img
                class="profile-photo"
                src={avatarDataUrl}
                alt={`Photo d'${person.fullName}`}
                width="104"
                height="104"
              />
              <figcaption>
                <p class="profile-name">{person.fullName}</p>
                <p class="profile-handle">@{person.handle.toLowerCase()}</p>
              </figcaption>
            </div>
            <ul class="profile-list">
              {now.map((item) => (
                <li>
                  <Icon name={item.icon} size={22} />
                  {item.text}
                </li>
              ))}
            </ul>
            <p class="status">
              <i></i>
              {availability}
            </p>
          </div>
        </figure>
      </div>
      <div class="terrain" aria-hidden="true"></div>
    </section>
  )
}
