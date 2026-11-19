import type { WorkerMailerOptions } from 'worker-mailer'
import { isEmail } from '../lib/http/form'
import type { ImapConfig } from '../lib/imap'
import { settingBool, settingInt, type SettingsMap, type SettingsService } from './settings.service'

export type Security = 'tls' | 'starttls' | 'none'

export type SmtpSetup = {
  server: WorkerMailerOptions
  from: { name: string; email: string }
  /** Où vont les réponses, si ce n'est pas l'adresse d'envoi. */
  replyTo: string | null
}

/**
 * L'adresse qui reçoit les réponses : celle des réglages, sinon celle de la
 * boîte IMAP. On peut ainsi envoyer depuis un noreply et lire les réponses
 * dans l'admin.
 */
export function replyAddress(s: SettingsMap): string {
  return s['smtp.reply_to'] || (isEmail(s['imap.user']) ? s['imap.user'] : '')
}

export type ImapSetup = {
  config: ImapConfig
  inbox: string
  sent: string | null
  trash: string | null
  initialDays: number
}

/** Le serveur SMTP des réglages, ou ce qu'il manque pour envoyer. */
export async function loadSmtp(settings: SettingsService, map?: SettingsMap): Promise<SmtpSetup | { error: string }> {
  const s = map ?? (await settings.all())
  const password = await settings.reveal('smtp.password', s)
  const port = settingInt(s['smtp.port'], 0)
  const missing = [
    !s['smtp.host'] && 'serveur',
    !port && 'port',
    !s['smtp.user'] && 'identifiant',
    !password && 'mot de passe',
    !(s['smtp.from_email'] || s['smtp.user'].includes('@')) && "adresse d'envoi",
  ].filter(Boolean)
  if (missing.length) return { error: `Envoi de mails pas configuré (Réglages → Messagerie : ${missing.join(', ')}).` }
  const security = s['smtp.security'] as Security
  const fromEmail = s['smtp.from_email'] || s['smtp.user']
  const replyTo = replyAddress(s)
  return {
    server: {
      host: s['smtp.host'],
      port,
      secure: security === 'tls',
      startTls: security === 'starttls',
      credentials: { username: s['smtp.user'], password },
      authType: ['plain', 'login'],
      socketTimeoutMs: 20_000,
      responseTimeoutMs: 20_000,
    },
    from: {
      email: fromEmail,
      name: s['smtp.from_name'] || s['issuer.legal_name'] || '',
    },
    replyTo: replyTo && replyTo.toLowerCase() !== fromEmail.toLowerCase() ? replyTo : null,
  }
}

/** La boîte IMAP des réglages ; null si la lecture des mails est coupée ou incomplète. */
export async function loadImap(settings: SettingsService, map?: SettingsMap): Promise<ImapSetup | null> {
  const s = map ?? (await settings.all())
  if (!settingBool(s['imap.enabled'])) return null
  const password = await settings.reveal('imap.password', s)
  const port = settingInt(s['imap.port'], 0)
  if (!s['imap.host'] || !port || !s['imap.user'] || !password) return null
  const security = s['imap.security'] as Security
  return {
    config: {
      host: s['imap.host'],
      port,
      secure: security === 'tls',
      startTls: security === 'starttls',
      user: s['imap.user'],
      password,
      timeoutMs: 25_000,
    },
    inbox: s['imap.inbox'] || 'INBOX',
    sent: s['imap.sent'] || null,
    trash: s['imap.trash'] || null,
    initialDays: Math.min(365, Math.max(1, settingInt(s['imap.initial_days'], 30))),
  }
}
