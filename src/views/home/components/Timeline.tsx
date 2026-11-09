import { steps } from '../../../models/portfolio'
import { SectionHead } from './SectionHead'

export function Timeline() {
  return (
    <section class="section" id="parcours" aria-labelledby="parcours-title">
      <div class="wrap">
        <SectionHead
          id="parcours-title"
          label="Parcours"
          title="D'où je viens"
          text="Le freelance d'abord, puis une appli en production chez Farahon, puis LuuxCraft. Aujourd'hui, l'alternance chez FLEAP en parallèle d'Epitech."
        />
        <ol class="steps">
          {steps.map((step) => (
            <li class={step.current ? 'step current' : 'step'}>
              <p class="step-period">{step.period}</p>
              <div>
                <h3>
                  {step.title} <span class="step-org">· {step.org}</span>
                </h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
