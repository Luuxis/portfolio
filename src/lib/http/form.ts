/**
 * Lecture des formulaires postés (`c.req.parseBody({ all: true })`).
 * Les blocs répétés arrivent en `lines.0.title`, `lines.1.title`… et
 * ressortent en tableau, dans l'ordre des indices.
 */

export type FormBody = Record<string, string | File | (string | File)[]>

export function str(form: FormBody, key: string, max = 20_000): string {
  const value = form[key]
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first.trim().slice(0, max) : ''
}

/** Texte multiligne : on garde les retours à la ligne, on retire les espaces de fin. */
export function text(form: FormBody, key: string, max = 50_000): string {
  const value = form[key]
  const first = Array.isArray(value) ? value[0] : value
  if (typeof first !== 'string') return ''
  return first
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
    .slice(0, max)
}

export function nullable(value: string): string | null {
  return value === '' ? null : value
}

export function bool(form: FormBody, key: string): boolean {
  const value = str(form, key)
  return value === 'true' || value === 'on' || value === '1'
}

export function list(form: FormBody, key: string): string[] {
  const value = form[key]
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return values.filter((item): item is string => typeof item === 'string').map((item) => item.trim())
}

/** `prefix.<i>.<champ>` → [{ champ: valeur }, …] trié par indice. */
export function indexed(form: FormBody, prefix: string): Record<string, string>[] {
  const rows = new Map<number, Record<string, string>>()
  const pattern = new RegExp(`^${prefix.replace(/\./g, '\\.')}\\.(\\d+)\\.([a-zA-Z0-9_]+)$`)
  for (const [key, raw] of Object.entries(form)) {
    const match = key.match(pattern)
    if (!match) continue
    const value = Array.isArray(raw) ? raw[0] : raw
    if (typeof value !== 'string') continue
    const index = Number(match[1])
    const row = rows.get(index) ?? {}
    row[match[2]] = value.replace(/\r\n?/g, '\n').trim()
    rows.set(index, row)
  }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row)
}

export function isEmail(value: string): boolean {
  return /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/.test(value)
}

/** « a@b.fr, c@d.fr ; e@f.fr » → adresses valides, sans doublon. */
export function emailList(value: string): string[] {
  const seen = new Set<string>()
  for (const part of value.split(/[,;\s]+/)) {
    const email = part.trim().replace(/^<|>$/g, '')
    if (email && isEmail(email)) seen.add(email)
  }
  return [...seen]
}

/** Chemin de retour sûr : une adresse de l'admin, jamais un autre site. */
export function safeNext(value: string | undefined, fallback = '/admin'): string {
  if (!value || !value.startsWith('/admin') || value.startsWith('//') || value.includes('\\')) return fallback
  return value
}
