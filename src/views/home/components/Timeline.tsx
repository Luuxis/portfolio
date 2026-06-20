import { timeline } from '../../../models/portfolio'
import { SectionHead } from './SectionHead'

export function Timeline() {
  return (
    <section class="section" id="parcours">
      <SectionHead
        num="01"
        title="Parcours"
        description="De l'open source Minecraft au SaaS LuuxCraft — quatre ans de livraisons en production."
      />
      <div class="timeline">
        {timeline.map((event, index) => (
          <article class={`tl-item anim d${(index % 5) + 1}`}>
            <time class="tl-period">{event.period}</time>
            <div>
              <h3 class="tl-title">
                {event.href ? (
                  <a href={event.href} target="_blank" rel="noopener noreferrer">
                    {event.title} ↗
                  </a>
                ) : (
                  event.title
                )}
              </h3>
              {event.org ? <p class="tl-org">{event.org}</p> : null}
              <p class="tl-desc">{event.description}</p>
              {event.tags ? (
                <div class="tags">
                  {event.tags.map((tag) => (
                    <span class="tag">{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
