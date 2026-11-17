/**
 * Montants en centimes entiers (jamais de flottant dans un total) et dates
 * calendaires AAAA-MM-JJ à l'heure de Paris.
 */

/** « 1 234,50 », « 1234.5 », « 65 € » → centimes ; null si illisible. */
export function parseAmount(raw: unknown): number | null {
  if (raw == null) return null
  const text = String(raw).replace(/[\s  €]/g, '').replace(',', '.')
  if (text === '') return null
  if (!/^-?\d+(\.\d{0,2})?$/.test(text)) return null
  return Math.round(Number(text) * 100)
}

export function parseQuantity(raw: unknown): number | null {
  if (raw == null) return null
  const text = String(raw).replace(/\s/g, '').replace(',', '.')
  if (text === '') return null
  const value = Number(text)
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 1000) / 1000 : null
}

/** Taux de TVA en pourcentage ; null (vide) : TVA non applicable. */
export function parseVatRate(raw: unknown): number | null | undefined {
  const text = String(raw ?? '').replace(/[\s%]/g, '').replace(',', '.')
  if (text === '') return null
  const value = Number(text)
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : undefined
}

export function lineTotal(quantity: number, unitPriceCents: number): number {
  return Math.round(quantity * unitPriceCents)
}

export type Totals = { totalHtCents: number; vatCents: number; totalTtcCents: number }

export function computeTotals(lines: { totalCents: number }[], vatRate: number | null): Totals {
  const totalHtCents = lines.reduce((sum, line) => sum + line.totalCents, 0)
  const vatCents = vatRate ? Math.round((totalHtCents * vatRate) / 100) : 0
  return { totalHtCents, vatCents, totalTtcCents: totalHtCents + vatCents }
}

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const decimal = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 })

/**
 * Intl sépare les milliers par une espace fine insécable (U+202F) qu'Arial
 * n'a pas partout : on la remplace par une espace insécable ordinaire.
 */
function nbsp(text: string): string {
  return text.replace(/ /g, ' ')
}

export function formatEuros(cents: number): string {
  return nbsp(euros.format(cents / 100))
}

export function formatQuantity(quantity: number): string {
  return nbsp(decimal.format(quantity))
}

/** Pour un champ de formulaire : « 65,00 ». */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export function formatRate(rate: number): string {
  return `${nbsp(decimal.format(rate))} %`
}

const parisDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' })

export function todayIso(now = new Date()): string {
  return parisDate.format(now)
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T12:00:00Z`) - Date.parse(`${fromIso}T12:00:00Z`)) / 86_400_000)
}

/** 31/07/2026 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** 31 juillet 2026 */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return longDate.format(new Date(`${iso}T12:00:00Z`))
}

const dateTime = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Paris',
})

export function formatDateTime(date: Date | null | undefined): string {
  return date ? dateTime.format(date).replace(' ', ' à ') : ''
}

const shortDay = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })
const hourMinute = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

/** « 14:32 » aujourd'hui, « 12 nov. » sinon, avec l'année si elle diffère. */
export function formatShortDate(date: Date, now = new Date()): string {
  if (todayIso(date) === todayIso(now)) return hourMinute.format(date)
  const sameYear = todayIso(date).slice(0, 4) === todayIso(now).slice(0, 4)
  return sameYear ? shortDay.format(date) : formatDate(todayIso(date))
}
