import { projects } from '../../../models/portfolio'
import { SectionHead } from './SectionHead'

const statusLabel = {
  prod: 'Production',
  oss: 'Open source',
  client: 'Client',
} as const

export function Projects() {
  return (
    <section class="section" id="projets">
      <SectionHead
        num="02"
        title="Projets sélectionnés"
        description="Produits que j'ai conçus, maintenus ou mis en production."
      />
      <div class="projects">
        {projects.map((project, index) => (
          <article class={`project anim d${(index % 4) + 1} ${index === 0 ? 'featured' : ''}`}>
            <div>
              <div class="project-top">
                <span class={`status status-${project.status}`}>{statusLabel[project.status]}</span>
              </div>
              <h3>
                {project.href ? (
                  <a href={project.href} target="_blank" rel="noopener noreferrer">
                    {project.name}
                  </a>
                ) : (
                  project.name
                )}
              </h3>
              <p class="project-role">{project.role}</p>
              <p>{project.description}</p>
              {project.metrics ? (
                <div class="project-metrics">
                  {project.metrics.map((m) => (
                    <span>{m}</span>
                  ))}
                </div>
              ) : null}
            </div>
            <div class="project-stack">
              {project.stack.map((tech) => (
                <span class="tag">{tech}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
