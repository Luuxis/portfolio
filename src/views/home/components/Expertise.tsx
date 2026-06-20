import { capabilities, skillGroups } from '../../../models/portfolio'
import { SectionHead } from './SectionHead'

export function Expertise() {
  return (
    <section class="section" id="stack">
      <SectionHead
        num="03"
        title="Expertise"
        description="Ce que je fais concrètement — pas une liste de technologies copiée-collée."
      />

      <div class="caps">
        {capabilities.map((cap, index) => (
          <div class={`cap anim d${index + 1}`}>
            <h3>{cap.title}</h3>
            <ul>
              {cap.items.map((item) => (
                <li>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div class="stack-panel anim d4">
        {skillGroups.map((group) => (
          <div class="stack-group">
            <h4>{group.label}</h4>
            <div class="stack-grid">
              {group.tags.map((tag) => (
                <span class={`tag ${tag.accent ? 'tag-accent' : ''}`}>{tag.name}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
