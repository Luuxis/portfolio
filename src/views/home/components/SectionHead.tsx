export function SectionHead({
  num,
  title,
  description,
}: {
  num: string
  title: string
  description: string
}) {
  return (
    <div class="section-head anim">
      <span class="section-num">{num}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}
