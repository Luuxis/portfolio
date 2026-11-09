export function SectionHead({
  id,
  label,
  title,
  text,
}: {
  id: string
  label: string
  title: string
  text: string
}) {
  return (
    <div class="section-head">
      <p class="lbl">{label}</p>
      <h2 id={id} class="disp">
        {title}
      </h2>
      <p>{text}</p>
    </div>
  )
}
