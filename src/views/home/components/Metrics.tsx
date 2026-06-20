import { metrics } from '../../../models/portfolio'

export function Metrics() {
  return (
    <section class="metrics anim d1" aria-label="Chiffres clés">
      {metrics.map((metric) => (
        <div class="metric">
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
          {metric.detail ? <small>{metric.detail}</small> : null}
        </div>
      ))}
    </section>
  )
}
