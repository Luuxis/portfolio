import type { Child } from 'hono/jsx'

const strongClass = 'text-slate-700 font-semibold'
const profileStrongClass = 'text-slate-800 font-semibold'

export function RichText({
  text,
  strongClassName = strongClass,
}: {
  text: string
  strongClassName?: string
}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} class={strongClassName}>
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })}
    </>
  )
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul class="cv-bullets text-slate-600">
      {items.map((item) => (
        <li class="bullet-item">
          <RichText text={item} />
        </li>
      ))}
    </ul>
  )
}

export function SectionHead({
  icon,
  title,
  srOnly,
}: {
  icon: string
  title: string
  srOnly?: string
}) {
  return (
    <div class="cv-section-head">
      <span class="section-icon-bg w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0">
        <i class={`fa-solid ${icon} text-[9px]`}></i>
      </span>
      <h2 class="text-[10.5px] font-extrabold text-slate-800 uppercase tracking-[1.5px]">
        {title}
        {srOnly ? <span class="sr-only">{srOnly}</span> : null}
      </h2>
    </div>
  )
}

export function SidebarBlockTitle({ icon, title, srOnly }: { icon: string; title: string; srOnly?: string }) {
  return (
    <div class="flex items-center gap-1.5 text-[8px] font-bold text-indigo-400 uppercase tracking-[1.8px] mb-2">
      <i class={`fa-solid ${icon} text-[8px]`}></i> {title}
      {srOnly ? <span class="sr-only">{srOnly}</span> : null}
    </div>
  )
}

export type TimelineDot = 'active' | 'past' | 'old'

const dotClass: Record<TimelineDot, string> = {
  active: 'timeline-dot-active',
  past: 'timeline-dot-past',
  old: 'timeline-dot-old',
}

export function TimelineDot({ variant }: { variant: TimelineDot }) {
  return <div class={`${dotClass[variant]} absolute left-[-7px] top-[12px] w-[12px] h-[12px] rounded-full`}></div>
}

export function CvCard({
  children,
  featured,
  class: className,
}: {
  children: Child
  featured?: boolean
  class?: string
}) {
  return (
    <div
      class={`cv-card ${featured ? 'cv-card-featured' : ''} rounded-xl cv-card-pad relative overflow-hidden ${className ?? ''}`}
    >
      {children}
    </div>
  )
}
