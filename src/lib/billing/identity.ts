import type { Client } from '../../db/schema'
import type { SettingsMap } from '../../services/settings.service'

/** L'émetteur tel qu'il est imprimé et figé sur un document émis. */
export type Issuer = {
  legalName: string
  legalForm: string
  tradeName: string
  address: string
  postalCode: string
  city: string
  country: string
  siren: string
  vatNumber: string
  registration: string
  email: string
  phone: string
  website: string
  iban: string
  bic: string
  bank: string
}

/** Les textes légaux, figés avec l'émetteur. */
export type LegalTexts = {
  paymentTerms: string
  latePenalties: string
  quoteAcceptance: string
  extraMention: string
}

export type IssuerSnapshot = { issuer: Issuer; legal: LegalTexts }

export type ClientSnapshot = {
  kind: 'company' | 'person'
  name: string
  contactName: string
  address: string
  postalCode: string
  city: string
  country: string
  siren: string
  vatNumber: string
  email: string
}

export function issuerFromSettings(s: SettingsMap): Issuer {
  return {
    legalName: s['issuer.legal_name'],
    legalForm: s['issuer.legal_form'],
    tradeName: s['issuer.trade_name'],
    address: s['issuer.address'],
    postalCode: s['issuer.postal_code'],
    city: s['issuer.city'],
    country: s['issuer.country'],
    siren: s['issuer.siren'],
    vatNumber: s['issuer.vat_number'],
    registration: s['issuer.registration'],
    email: s['issuer.email'],
    phone: s['issuer.phone'],
    website: s['issuer.website'],
    iban: s['billing.iban'],
    bic: s['billing.bic'],
    bank: s['billing.bank'],
  }
}

export function legalFromSettings(s: SettingsMap): LegalTexts {
  return {
    paymentTerms: s['billing.payment_terms'],
    latePenalties: s['billing.late_penalties'],
    quoteAcceptance: s['billing.quote_acceptance'],
    extraMention: s['billing.extra_mention'],
  }
}

/** Mentions sans lesquelles une facture n'est pas valable. */
export function missingIssuerFields(issuer: Issuer): string[] {
  const missing: string[] = []
  if (!issuer.legalName) missing.push('nom')
  if (!issuer.address || !issuer.postalCode || !issuer.city) missing.push('adresse')
  if (!issuer.siren) missing.push('SIREN')
  return missing
}

export function clientSnapshot(client: Client): ClientSnapshot {
  return {
    kind: client.kind,
    name: client.name,
    contactName: client.contactName ?? '',
    address: client.address ?? '',
    postalCode: client.postalCode ?? '',
    city: client.city ?? '',
    country: client.country ?? '',
    siren: client.siren ?? '',
    vatNumber: client.vatNumber ?? '',
    email: client.email ?? '',
  }
}

export function parseJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/** « 910156207 » → « 910 156 207 », SIRET « 910 156 207 00012 ». */
export function formatSiren(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 9) return digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
  if (digits.length === 14) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
  return value
}

/** SIREN (9 chiffres) ou SIRET (14), espaces permis ; vide accepté. */
export function parseSiren(raw: string): { ok: true; value: string | null } | { ok: false } {
  const digits = raw.replace(/[\s.]/g, '')
  if (digits === '') return { ok: true, value: null }
  return /^(\d{9}|\d{14})$/.test(digits) ? { ok: true, value: digits } : { ok: false }
}

/** Remplace les {variables} d'un modèle ; une variable inconnue reste telle quelle. */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-z_]+)\}/g, (match, key: string) => (key in vars ? vars[key] : match))
}

/** Pour un objet de mail : \u00ab Facture F2026-003 : \u00bb sans objet perd son deux-points. */
export function fillSubject(template: string, vars: Record<string, string>): string {
  return fillTemplate(template, vars)
    .replace(/[ \u00a0]*[:\u2013-][ \u00a0]*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}
