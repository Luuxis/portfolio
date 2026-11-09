import { tools } from '../../../models/portfolio'
import { Icon } from '../../shared/Icon'
import { SectionHead } from './SectionHead'

export function Tools() {
  return (
    <section class="section band" id="outils" aria-labelledby="outils-title">
      <div class="wrap">
        <SectionHead
          id="outils-title"
          label="Outils"
          title="Avec quoi je travaille"
          text="Ce que j'utilise en ce moment, pas tout ce que j'ai touché une fois."
        />
        <div class="win tools">
          <div class="win-bar" aria-hidden="true">
            <span>outils.txt</span>
            <span class="win-ctrls">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </div>
          <ul class="tool-rows">
            {tools.map((group) => (
              <li>
                <h3>
                  <Icon name={group.icon} size={24} />
                  {group.title}
                </h3>
                <ul class="tags">
                  {group.items.map((item) => (
                    <li class="tag">{item}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
