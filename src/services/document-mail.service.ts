import type { Db } from '../db'
import { emailList } from '../lib/http/form'
import { fillSubject, fillTemplate } from '../lib/billing/identity'
import { todayIso } from '../lib/billing/money'
import type { CloudflareBindings } from '../types/bindings'
import { DocumentPdfService } from './document-pdf.service'
import { DocumentService, type DocumentFull } from './document.service'
import { MailService } from './mail.service'
import { settingBool, settingInt, type SettingsMap, type SettingsService } from './settings.service'

export type DocumentMailKind = 'sent' | 'reminder'

export type DocumentMailDraft = { to: string; cc: string; subject: string; body: string; attach: boolean }

/** Le modèle de mail d'un document : envoi d'un devis, d'une facture, d'un avoir, ou relance. */
export function templateKeys(full: DocumentFull, kind: DocumentMailKind) {
  const name = kind === 'reminder' ? 'reminder' : full.doc.type
  return { subject: `mail.${name}.subject` as const, body: `mail.${name}.body` as const }
}

/**
 * Envoi d'un document par mail : émission si c'est encore un brouillon, PDF
 * en pièce jointe, mail gardé dans l'historique du document et du client.
 */
export class DocumentMailService {
  readonly documents: DocumentService
  readonly pdf: DocumentPdfService
  readonly mail: MailService

  constructor(
    db: Db,
    private readonly settings: SettingsService,
    env: CloudflareBindings,
  ) {
    this.documents = new DocumentService(db, settings)
    this.pdf = new DocumentPdfService(env, this.documents)
    this.mail = new MailService(db, settings, env.files)
  }

  /** Le mail prérempli ; pour un brouillon, {numero} reste à remplacer à l'émission. */
  draft(full: DocumentFull, kind: DocumentMailKind, s: SettingsMap): DocumentMailDraft {
    const keys = templateKeys(full, kind)
    const vars = this.documents.templateVars(full)
    // Pas encore émis : numéro et échéance restent en variables, remplies à l'envoi.
    if (!full.doc.number) delete vars.numero
    if (!full.doc.dueDate) {
      delete vars.echeance
      delete vars.validite
    }
    return {
      to: full.client.email ?? '',
      cc: full.client.ccEmails ?? '',
      subject: fillSubject(s[keys.subject], vars),
      body: fillTemplate(s[keys.body], vars),
      attach: true,
    }
  }

  async send(
    id: string,
    draft: DocumentMailDraft,
    kind: DocumentMailKind,
    waitUntil?: (promise: Promise<unknown>) => void,
  ): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
    let full = await this.documents.get(id)
    if (!full) return { ok: false, error: "Ce document n'existe pas." }

    const to = emailList(draft.to)
    if (!to.length) return { ok: false, error: 'Indique au moins un destinataire.' }
    if (!draft.subject.trim() || !draft.body.trim()) return { ok: false, error: "L'objet et le message sont obligatoires." }

    let issuedNow = false
    if (full.doc.status === 'draft') {
      const issued = await this.documents.issue(id)
      if (!issued.ok) return issued
      issuedNow = true
      full = (await this.documents.get(id))!
    }

    const vars = this.documents.templateVars(full)
    const attachments = []
    if (draft.attach) {
      try {
        attachments.push({ filename: this.pdf.filename(full), content: await this.pdf.get(full), mimeType: 'application/pdf' })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          ok: false,
          error: `${issuedNow ? `Document émis sous le numéro ${full.doc.number}, mais ` : ''}le PDF n'a pas pu être généré (${message}). Rien n'a été envoyé.`,
        }
      }
    }

    const sent = await this.mail.send(
      {
        to,
        cc: emailList(draft.cc),
        subject: fillSubject(draft.subject, vars),
        text: fillTemplate(draft.body, vars),
        attachments,
        clientId: full.client.id,
        documentId: full.doc.id,
      },
      waitUntil,
    )
    if (!sent.ok) {
      return { ok: false, error: `${issuedNow ? `Document émis sous le numéro ${full.doc.number}, mais pas envoyé : ` : ''}${sent.error}` }
    }
    await this.documents.markSent(full.doc.id, to.join(', '), kind)
    return { ok: true, message: `${full.doc.number} envoyé à ${to.join(', ')}.` }
  }

  /** Tâche quotidienne : relance des factures en retard, si elle est activée. */
  async autoReminders(): Promise<number> {
    const s = await this.settings.all()
    if (!settingBool(s['reminders.auto'])) return 0
    const due = await this.documents.invoicesToRemind(
      todayIso(),
      settingInt(s['reminders.after_days'], 3),
      Math.max(1, settingInt(s['reminders.every_days'], 7)),
      settingInt(s['reminders.max'], 3),
    )
    let sent = 0
    for (const doc of due) {
      const full = await this.documents.get(doc.id)
      if (!full?.client.email) continue
      const result = await this.send(doc.id, this.draft(full, 'reminder', s), 'reminder')
      if (result.ok) sent += 1
      else console.error(`relance de ${doc.number} impossible :`, result.error)
    }
    return sent
  }
}
