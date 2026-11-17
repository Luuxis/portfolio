import { Email, WorkerMailer, type EmailOptions } from 'worker-mailer'
import type { Db } from '../db'
import { mails, type MailAddress, type MailAttachmentMeta } from '../db/schema'
import { connectImap } from '../lib/imap'
import { toBase64 } from '../lib/security/crypto'
import { renderMailHtml, withSignature } from '../views/mail/layout'
import { loadImap, loadSmtp } from './mail-config'
import type { SettingsService } from './settings.service'

export type OutgoingAttachment = { filename: string; content: Uint8Array; mimeType: string }

export type OutgoingMail = {
  to: string[]
  cc?: string[]
  subject: string
  /** Texte brut ; la version HTML est mise en page à partir de lui. */
  text: string
  attachments?: OutgoingAttachment[]
  inReplyTo?: string | null
  references?: string | null
  clientId?: string | null
  documentId?: string | null
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string; id?: string }

/** Nom de fichier sûr pour un en-tête MIME (worker-mailer ne l'encode pas). */
function asciiFilename(name: string): string {
  return (
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'piece-jointe'
  )
}

function snippetOf(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.startsWith('>'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

/**
 * Envoi par SMTP (worker-mailer, socket TCP des Workers). Chaque envoi est
 * gardé : une ligne dans `mails`, le message brut dans R2, et une copie dans
 * le dossier « Envoyés » de la boîte IMAP si elle est configurée, pour que le
 * mail apparaisse aussi dans le webmail et le téléphone.
 */
export class MailService {
  constructor(
    private readonly db: Db,
    private readonly settings: SettingsService,
    private readonly files: R2Bucket,
  ) {}

  async send(mail: OutgoingMail, waitUntil?: (promise: Promise<unknown>) => void): Promise<SendResult> {
    const s = await this.settings.all()
    const smtp = await loadSmtp(this.settings, s)
    if ('error' in smtp) return { ok: false, error: smtp.error }

    const signature = s['mail.signature'] || [s['issuer.legal_name'], s['issuer.trade_name'], s['issuer.website']].filter(Boolean).join(' · ')
    const domain = smtp.from.email.split('@').pop() || 'localhost'
    const id = crypto.randomUUID()
    const messageId = `<${id}@${domain}>`
    const date = new Date()

    const headers: Record<string, string> = { 'Message-ID': messageId, Date: date.toUTCString() }
    if (mail.inReplyTo) headers['In-Reply-To'] = mail.inReplyTo
    const references = [...new Set([mail.references, mail.inReplyTo].join(' ').split(/\s+/).filter(Boolean))].join(' ')
    if (references) headers.References = references

    const options: EmailOptions = {
      from: smtp.from,
      to: mail.to,
      cc: mail.cc?.length ? mail.cc : undefined,
      subject: mail.subject,
      text: withSignature(mail.text, signature),
      html: renderMailHtml({ text: mail.text, signature, preheader: snippetOf(mail.text).slice(0, 120) }),
      headers,
      attachments: mail.attachments?.map((file) => ({
        filename: asciiFilename(file.filename),
        content: toBase64(file.content),
        mimeType: file.mimeType,
      })),
    }

    const attachmentsMeta: MailAttachmentMeta[] = (mail.attachments ?? []).map((file) => ({
      filename: asciiFilename(file.filename),
      mimeType: file.mimeType,
      size: file.content.byteLength,
    }))
    const toAddresses: MailAddress[] = mail.to.map((address) => ({ name: null, address }))
    const ccAddresses: MailAddress[] = (mail.cc ?? []).map((address) => ({ name: null, address }))
    const base = {
      id,
      direction: 'out' as const,
      messageId,
      inReplyTo: mail.inReplyTo ?? null,
      references: references || null,
      fromAddress: smtp.from.email,
      fromName: smtp.from.name || null,
      toAddresses: JSON.stringify(toAddresses),
      ccAddresses: JSON.stringify(ccAddresses),
      subject: mail.subject,
      snippet: snippetOf(mail.text),
      textBody: mail.text,
      hasHtml: true,
      attachments: JSON.stringify(attachmentsMeta),
      date,
      seen: true,
      clientId: mail.clientId ?? null,
      documentId: mail.documentId ?? null,
      createdAt: date,
    }

    try {
      await WorkerMailer.send(smtp.server, options)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.db.insert(mails).values({ ...base, status: 'failed', error: message.slice(0, 1000) })
      return { ok: false, error: `Le serveur SMTP a refusé l'envoi : ${message}`, id }
    }

    // Le mail est parti : à partir d'ici, plus rien ne doit renvoyer une erreur
    // (on croirait l'envoi raté et on l'enverrait deux fois). L'archive est un bonus.
    const raw = new TextEncoder().encode(rawMessage(options))
    let rawKey: string | null = `mails/out/${date.toISOString().slice(0, 7)}/${id}.eml`
    try {
      await this.files.put(rawKey, raw, { httpMetadata: { contentType: 'message/rfc822' } })
    } catch (error) {
      console.error('archive R2 du mail envoyé impossible :', error)
      rawKey = null
    }
    try {
      await this.db.insert(mails).values({ ...base, rawKey, size: raw.byteLength, status: 'sent' })
    } catch (error) {
      console.error('historique du mail envoyé impossible :', error)
    }

    const copy = this.copyToSent(raw, date).catch((error) => console.error('copie dans Envoyés impossible :', error))
    if (waitUntil) waitUntil(copy)
    else await copy
    return { ok: true, id }
  }

  /** Teste la connexion SMTP sans rien envoyer à personne d'autre que soi. */
  async test(to: string): Promise<SendResult> {
    return this.send({
      to: [to],
      subject: 'Test d’envoi depuis l’admin luuxis.fr',
      text: 'Si tu lis ce message, l’envoi de mails depuis l’admin fonctionne.',
    })
  }

  private async copyToSent(raw: Uint8Array, date: Date): Promise<void> {
    const imap = await loadImap(this.settings)
    if (!imap?.sent) return
    const client = await connectImap(imap.config)
    try {
      await client.append(imap.sent, raw, ['\\Seen'], date)
    } finally {
      await client.logout()
    }
  }
}

/**
 * Le message MIME que worker-mailer envoie, sans le bourrage de points du
 * protocole SMTP ni la ligne « . » finale.
 */
function rawMessage(options: EmailOptions): string {
  const data = new Email({ ...options, headers: { ...options.headers } }).getEmailData()
  return data
    .replace(/\r\n\.\r\n$/, '\r\n')
    .replace(/\r\n\.\./g, '\r\n.')
    .replace(/^\.\./, '.')
}
