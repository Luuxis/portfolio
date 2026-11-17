import type { Child } from 'hono/jsx'
import type { StatusTone } from '../../lib/billing/labels'
import { Icon, type IconName } from '../shared/Icon'

export type Flash = { type: 'ok' | 'err' | 'info' | 'warn'; message: string }

const FLASH_ICON: Record<Flash['type'], IconName> = {
  ok: 'task_alt',
  err: 'warning',
  info: 'notifications_active',
  warn: 'warning',
}

export function FlashMessage({ flash }: { flash?: Flash | null }) {
  if (!flash) return null
  return (
    <div class={`flash flash-${flash.type}`} role={flash.type === 'err' ? 'alert' : 'status'}>
      <Icon name={FLASH_ICON[flash.type]} size={20} />
      <p>{flash.message}</p>
    </div>
  )
}

export function PageHead({
  title,
  intro,
  back,
  children,
}: {
  title: Child
  intro?: Child
  back?: { href: string; label: string }
  children?: Child
}) {
  return (
    <header class="head">
      <div>
        {back ? (
          <a class="crumb" href={back.href}>
            <Icon name="arrow_back" size={16} />
            {back.label}
          </a>
        ) : null}
        <h1>{title}</h1>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children ? <div class="actions">{children}</div> : null}
    </header>
  )
}

export function Card({
  title,
  icon,
  actions,
  flush,
  children,
  id,
}: {
  title?: Child
  icon?: IconName
  actions?: Child
  flush?: boolean
  children?: Child
  id?: string
}) {
  return (
    <section class="card" id={id}>
      {title ? (
        <div class="card-head">
          <h2>
            {icon ? <Icon name={icon} size={18} /> : null}
            {title}
          </h2>
          {actions ? <div class="actions">{actions}</div> : null}
        </div>
      ) : null}
      <div class={flush ? 'card-flush' : 'card-body'}>{children}</div>
    </section>
  )
}

export function Badge({ tone, children }: { tone: StatusTone; children: Child }) {
  return <span class={`badge b-${tone}`}>{children}</span>
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: Child }) {
  return (
    <div class="empty">
      <Icon name={icon} size={36} />
      <h3>{title}</h3>
      {text ? <p>{text}</p> : null}
      {action}
    </div>
  )
}

export function ButtonLink({
  href,
  icon,
  variant = 'secondary',
  size,
  children,
  target,
}: {
  href: string
  icon?: IconName
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm'
  children: Child
  target?: string
}) {
  const classes = ['btn', variant === 'secondary' ? '' : `btn-${variant}`, size ? `btn-${size}` : ''].filter(Boolean).join(' ')
  return (
    <a class={classes} href={href} target={target} rel={target ? 'noopener' : undefined}>
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </a>
  )
}

/** Un bouton qui poste un formulaire (action d'une ligne, d'un en-tête…). */
export function PostButton({
  action,
  icon,
  variant = 'secondary',
  size,
  confirm,
  children,
  fields,
}: {
  action: string
  icon?: IconName
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm'
  confirm?: string
  children: Child
  fields?: Record<string, string>
}) {
  const classes = ['btn', variant === 'secondary' ? '' : `btn-${variant}`, size ? `btn-${size}` : ''].filter(Boolean).join(' ')
  return (
    <form method="post" action={action} data-confirm={confirm}>
      {fields ? Object.entries(fields).map(([name, value]) => <input type="hidden" name={name} value={value} />) : null}
      <button type="submit" class={classes}>
        {icon ? <Icon name={icon} size={18} /> : null}
        {children}
      </button>
    </form>
  )
}

type FieldProps = {
  label: string
  name: string
  value?: string | number | null
  type?: string
  placeholder?: string
  hint?: Child
  required?: boolean
  full?: boolean
  autocomplete?: string
  inputmode?: 'text' | 'search' | 'email' | 'decimal' | 'numeric' | 'tel' | 'url' | 'none'
  min?: string
  step?: string
  readonly?: boolean
  pattern?: string
  maxlength?: number
}

export function Field(props: FieldProps) {
  return (
    <label class={props.full ? 'field full' : 'field'}>
      <span>{props.label}</span>
      <input
        class="input"
        type={props.type ?? 'text'}
        name={props.name}
        value={props.value ?? ''}
        placeholder={props.placeholder}
        required={props.required}
        autocomplete={props.autocomplete}
        inputmode={props.inputmode}
        min={props.min}
        step={props.step}
        readonly={props.readonly}
        pattern={props.pattern}
        maxlength={props.maxlength}
      />
      {props.hint ? <small>{props.hint}</small> : null}
    </label>
  )
}

export function TextArea({
  label,
  name,
  value,
  hint,
  rows,
  full = true,
  tall,
  placeholder,
  required,
}: {
  label: string
  name: string
  value?: string | null
  hint?: Child
  rows?: number
  full?: boolean
  tall?: boolean
  placeholder?: string
  required?: boolean
}) {
  return (
    <label class={full ? 'field full' : 'field'}>
      <span>{label}</span>
      <textarea class={tall ? 'textarea tall' : 'textarea'} name={name} rows={rows} placeholder={placeholder} required={required}>
        {value ?? ''}
      </textarea>
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function Select({
  label,
  name,
  value,
  options,
  hint,
  full,
  autosubmit,
}: {
  label: string
  name: string
  value?: string | null
  options: { value: string; label: string }[]
  hint?: Child
  full?: boolean
  autosubmit?: boolean
}) {
  return (
    <label class={full ? 'field full' : 'field'}>
      <span>{label}</span>
      <select class="select" name={name} data-autosubmit={autosubmit ? '' : undefined}>
        {options.map((option) => (
          <option value={option.value} selected={option.value === (value ?? '')}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export function Check({ label, name, checked, hint, value = 'true' }: { label: string; name: string; checked?: boolean; hint?: string; value?: string }) {
  return (
    <label class="check">
      <input type="checkbox" name={name} value={value} checked={checked} />
      <span>
        {label}
        {hint ? <small class="muted">{hint}</small> : null}
      </span>
    </label>
  )
}

export function Tabs({ items, current }: { items: { href: string; label: string; key: string; count?: number }[]; current: string }) {
  return (
    <nav class="tabs" aria-label="Filtres">
      {items.map((item) => (
        <a href={item.href} aria-current={item.key === current ? 'page' : undefined}>
          {item.label}
          {item.count ? <span class="muted">{item.count}</span> : null}
        </a>
      ))}
    </nav>
  )
}
