import type { DocumentType } from '../../db/schema'

/**
 * Numérotation d'après un modèle : {YYYY}, {YY}, {MM} et un compteur {NNN}
 * (autant de N que de chiffres). Le compteur repart à 1 chaque année, ou
 * chaque mois si le modèle contient {MM} : « D{YYYY}-{MM}-{NNN} » donne
 * D2026-08-001, le premier devis d'août.
 */

export type NumberParts = {
  /** Clé du compteur dans `sequences`. */
  key: string
  prefix: string
  /** Format printf du compteur : %03d. */
  counterFormat: string
  suffix: string
}

const COUNTER = /\{(N+)\}/

export function isValidPattern(pattern: string): boolean {
  const counters = pattern.match(/\{N+\}/g) ?? []
  return counters.length === 1 && pattern.replace(/\{(YYYY|YY|MM|N+)\}/g, '').match(/[{}]/) === null && pattern.length <= 40
}

export function numberParts(type: DocumentType, pattern: string, issueDate: string): NumberParts {
  const [year, month] = issueDate.split('-')
  const fill = (part: string) => part.replace(/\{YYYY\}/g, year).replace(/\{YY\}/g, year.slice(2)).replace(/\{MM\}/g, month)
  const match = pattern.match(COUNTER)
  if (!match || match.index === undefined) throw new Error(`Modèle de numérotation sans compteur : ${pattern}`)
  const monthly = pattern.includes('{MM}')
  return {
    key: `${type}:${monthly ? `${year}-${month}` : year}`,
    prefix: fill(pattern.slice(0, match.index)),
    counterFormat: `%0${match[1].length}d`,
    suffix: fill(pattern.slice(match.index + match[0].length)),
  }
}

export function formatNumber(parts: NumberParts, counter: number): string {
  const width = Number(parts.counterFormat.slice(2, -1))
  return `${parts.prefix}${String(counter).padStart(width, '0')}${parts.suffix}`
}

/** Clé du compteur de la période en cours, pour le réglage « dernier numéro utilisé ». */
export function currentSequenceKey(type: DocumentType, pattern: string, today: string): string {
  return numberParts(type, pattern, today).key
}
