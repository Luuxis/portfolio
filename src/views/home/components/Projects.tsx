import { luuxcraft, projects } from '../../../models/portfolio'
import { Icon } from '../../shared/Icon'
import { SectionHead } from './SectionHead'

function LuuxCraftFeature() {
  return (
    <article class="feature" aria-labelledby="luuxcraft-title">
      <div class="feature-media band">
        <img src={luuxcraft.image} alt={luuxcraft.imageAlt} width="1200" height="630" loading="lazy" />
      </div>
      <div class="feature-body">
        <p class="lbl">{luuxcraft.since}</p>
        <h3 id="luuxcraft-title" class="disp">
          {luuxcraft.title}
        </h3>
        <p>{luuxcraft.text}</p>
        <div class="feature-links">
          <a class="link-arrow" href={luuxcraft.href} target="_blank" rel="noopener noreferrer">
            luuxcraft.fr
            <Icon name="arrow_outward" size={18} />
          </a>
          <a class="link-arrow" href={luuxcraft.docs} target="_blank" rel="noopener noreferrer">
            Doc de l'API
            <Icon name="arrow_outward" size={18} />
          </a>
        </div>
      </div>
      <ul class="parts">
        {luuxcraft.parts.map((part) => (
          <li>
            <span class="part-ico">
              <Icon name={part.icon} size={24} />
            </span>
            <div>
              <strong>{part.name}</strong>
              <p>{part.text}</p>
              <small>{part.stack}</small>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function Projects() {
  return (
    <section class="section" id="projets" aria-labelledby="projets-title">
      <div class="wrap">
        <SectionHead
          id="projets-title"
          label="Projets"
          title="Ce que je construis"
          text="LuuxCraft prend la plus grosse partie de mon temps. Le reste vient de l'open source, de l'école et des boîtes où j'ai travaillé."
        />
        <LuuxCraftFeature />
        <div class="projects">
          {projects.map((project) => (
            <article class="card">
              <div class="card-top">
                <span class="card-ico">
                  <Icon name={project.icon} size={26} />
                </span>
                {project.href ? (
                  <span class="card-go">
                    {project.linkLabel}
                    <Icon name="arrow_outward" size={16} />
                  </span>
                ) : null}
              </div>
              <h3>
                {project.href ? (
                  <a class="card-link" href={project.href} target="_blank" rel="noopener noreferrer">
                    {project.name}
                  </a>
                ) : (
                  project.name
                )}
              </h3>
              <p class="card-meta">{project.meta}</p>
              <p>{project.text}</p>
              {project.stat ? (
                <p class="card-stat">
                  <Icon name="star" size={16} />
                  {project.stat}
                </p>
              ) : null}
              <ul class="tags" aria-label="Technologies">
                {project.tags.map((tag) => (
                  <li class="tag">{tag}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
