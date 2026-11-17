import { inArray } from 'drizzle-orm'
import type { Db } from '../db'
import { startsWith } from '../db/sql'
import { settings } from '../db/schema'
import { seal, unseal } from '../lib/security/crypto'

/**
 * Valeurs par défaut des réglages. Tout est modifiable dans Réglages ; une clé
 * absente de la base prend sa valeur ici. Les mots de passe et le secret TOTP
 * sont rangés chiffrés (`seal`), sous les clés de SEALED_KEYS.
 */
export const DEFAULT_SETTINGS = {
  'issuer.legal_name': '',
  'issuer.legal_form': 'EI',
  'issuer.trade_name': '',
  'issuer.address': '',
  'issuer.postal_code': '',
  'issuer.city': '',
  'issuer.country': 'France',
  'issuer.siren': '',
  'issuer.vat_number': '',
  'issuer.registration': '',
  'issuer.email': '',
  'issuer.phone': '',
  'issuer.website': '',

  /** Vide : franchise en base de TVA. */
  'billing.vat_rate': '',
  'billing.payment_days': '30',
  'billing.quote_validity_days': '30',
  'billing.default_unit': 'jour',
  'billing.iban': '',
  'billing.bic': '',
  'billing.bank': '',
  'billing.payment_terms':
    "Règlement sous {delai} jours à compter de la date d'émission, par virement bancaire. Merci d'indiquer la référence {numero} dans le libellé du virement.",
  'billing.late_penalties':
    "Pénalités de retard : taux d'intérêt de la BCE majoré de 10 points. Indemnité forfaitaire pour frais de recouvrement : 40 € (art. L. 441-10 du Code de commerce), due par les clients professionnels. Pas d'escompte pour paiement anticipé.",
  'billing.quote_acceptance': 'Devis valable jusqu’au {validite}. Bon pour accord : date, signature et mention « Bon pour accord ».',
  'billing.extra_mention': '',

  'numbering.invoice': 'F{YYYY}-{NNN}',
  'numbering.quote': 'D{YYYY}-{MM}-{NNN}',
  'numbering.credit_note': 'A{YYYY}-{NNN}',

  'reminders.auto': 'false',
  'reminders.after_days': '3',
  'reminders.every_days': '7',
  'reminders.max': '3',

  'mail.signature': '',
  'mail.quote.subject': 'Devis {numero} : {objet}',
  'mail.quote.body':
    'Bonjour {contact},\n\nVous trouverez ci-joint le devis {numero}, d’un montant de {montant}. Il est valable jusqu’au {validite}.\n\nPour l’accepter, il suffit de me répondre par mail ou de me renvoyer le devis signé.\n\nBonne journée,',
  'mail.invoice.subject': 'Facture {numero} : {objet}',
  'mail.invoice.body':
    'Bonjour {contact},\n\nVous trouverez ci-joint la facture {numero} d’un montant de {montant}, à régler avant le {echeance}.\n\nMerci et bonne journée,',
  'mail.reminder.subject': 'Rappel : facture {numero} à régler',
  'mail.reminder.body':
    'Bonjour {contact},\n\nSauf erreur de ma part, la facture {numero} d’un montant de {montant}, arrivée à échéance le {echeance}, n’a pas encore été réglée. Je vous la remets en pièce jointe.\n\nSi le virement est déjà parti, ne tenez pas compte de ce message.\n\nBonne journée,',
  'mail.credit_note.subject': 'Avoir {numero}',
  'mail.credit_note.body':
    'Bonjour {contact},\n\nVous trouverez ci-joint l’avoir {numero} d’un montant de {montant}, qui annule la facture {facture}.\n\nBonne journée,',

  'smtp.host': '',
  'smtp.port': '465',
  'smtp.security': 'tls',
  'smtp.user': '',
  'smtp.password': '',
  'smtp.from_email': '',
  'smtp.from_name': '',

  'imap.enabled': 'false',
  'imap.host': '',
  'imap.port': '993',
  'imap.security': 'tls',
  'imap.user': '',
  'imap.password': '',
  'imap.inbox': 'INBOX',
  /** Dossier des messages envoyés : chaque envoi y est copié, et il est relu comme la boîte de réception. */
  'imap.sent': '',
  /** Où vont les mails supprimés ; vide : la corbeille annoncée par le serveur, sinon effacement définitif. */
  'imap.trash': '',
  'imap.initial_days': '30',
  'imap.last_sync': '',
  'imap.last_error': '',

  'auth.totp_secret': '',
  'auth.totp_pending': '',
  'auth.totp_enabled': 'false',
  'auth.totp_last_counter': '-1',
  'auth.session_version': '1',
} as const

export type SettingKey = keyof typeof DEFAULT_SETTINGS
export type SettingsMap = Record<SettingKey, string>

const SEALED_KEYS: SettingKey[] = ['smtp.password', 'imap.password', 'auth.totp_secret', 'auth.totp_pending']

export function isSealedKey(key: string): boolean {
  return (SEALED_KEYS as string[]).includes(key)
}

export class SettingsService {
  constructor(
    private readonly db: Db,
    private readonly secret: string,
  ) {}

  /** Tous les réglages, défauts compris ; les valeurs chiffrées restent chiffrées. */
  async all(): Promise<SettingsMap> {
    const rows = await this.db.select().from(settings)
    const values: Record<string, string> = { ...DEFAULT_SETTINGS }
    for (const row of rows) values[row.key] = row.value
    return values as SettingsMap
  }

  async get(key: SettingKey): Promise<string> {
    const values = await this.many([key])
    return values[key]
  }

  async many<K extends SettingKey>(keys: K[]): Promise<Record<K, string>> {
    const rows = await this.db.select().from(settings).where(inArray(settings.key, keys))
    const values = Object.fromEntries(keys.map((key) => [key, DEFAULT_SETTINGS[key] as string])) as unknown as Record<K, string>
    for (const row of rows) values[row.key as K] = row.value
    return values
  }

  /** Enregistre des valeurs en clair ; une valeur null rend la valeur par défaut. */
  async set(values: Partial<Record<SettingKey, string | null>>): Promise<void> {
    await this.setRaw(values)
  }

  async setRaw(values: Record<string, string | null | undefined>): Promise<void> {
    const now = new Date()
    const statements = []
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) continue
      if (value === null) {
        statements.push(this.db.delete(settings).where(inArray(settings.key, [key])))
      } else {
        const stored = isSealedKey(key) && value !== '' ? await seal(this.secret, value) : value
        statements.push(
          this.db
            .insert(settings)
            .values({ key, value: stored, updatedAt: now })
            .onConflictDoUpdate({ target: settings.key, set: { value: stored, updatedAt: now } }),
        )
      }
    }
    if (statements.length === 0) return
    const [first, ...rest] = statements
    await this.db.batch([first, ...rest])
  }

  /** Valeur chiffrée relue en clair ; vide si absente ou illisible. */
  async reveal(key: SettingKey, map?: Partial<Record<SettingKey, string>>): Promise<string> {
    const raw = map && key in map ? map[key] : await this.get(key)
    if (!raw) return ''
    return (await unseal(this.secret, raw)) ?? ''
  }

  /** Clés libres (état de synchronisation IMAP par dossier, par exemple). */
  async getPrefixed(prefix: string): Promise<Record<string, string>> {
    const rows = await this.db.select().from(settings).where(startsWith(settings.key, prefix))
    return Object.fromEntries(rows.map((row) => [row.key, row.value]))
  }
}

export function settingBool(value: string): boolean {
  return value === 'true'
}

export function settingInt(value: string, fallback: number): number {
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) ? number : fallback
}
