import { and, asc, desc, eq, gte, inArray, isNull, lt, lte, or, sql, type SQL } from 'drizzle-orm'
import type { Db } from '../db'
import { contains } from '../db/sql'
import {
  clients,
  documentEvents,
  documentLines,
  documents,
  type Client,
  type Document,
  type DocumentEvent,
  type DocumentLine,
  type DocumentStatus,
  type DocumentType,
} from '../db/schema'
import {
  clientSnapshot,
  issuerFromSettings,
  legalFromSettings,
  missingIssuerFields,
  parseJson,
  type ClientSnapshot,
  type IssuerSnapshot,
} from '../lib/billing/identity'
import { TYPE_LABEL, PAYMENT_METHODS, type PaymentMethod } from '../lib/billing/labels'
import { addDays, computeTotals, formatEuros, lineTotal, todayIso } from '../lib/billing/money'
import { numberParts } from '../lib/billing/numbering'
import { settingInt, type SettingsService } from './settings.service'

export type LineInput = {
  title: string
  details: string
  quantity: number
  unit: string
  unitPriceCents: number
}

export type DraftInput = {
  clientId: string
  subject: string | null
  /** Échéance (facture) ou fin de validité (devis) ; vide : calculée à l'émission. */
  dueDate: string | null
  vatRate: number | null
  notes: string | null
  lines: LineInput[]
}

export type DocumentRow = Document & { clientName: string }

export type DocumentFull = {
  doc: Document
  lines: DocumentLine[]
  client: Client
  events: DocumentEvent[]
  /** Devis d'une facture, facture d'un avoir. */
  source: Document | null
  /** Factures tirées d'un devis, avoir d'une facture. */
  children: Document[]
}

/** Ce qu'un document imprime : figé s'il est émis, d'après les réglages sinon. */
export type PrintableDocument = {
  doc: Document
  lines: DocumentLine[]
  issuer: IssuerSnapshot
  client: ClientSnapshot
  sourceNumber: string | null
}

export type Result<T = undefined> = ({ ok: true } & (T extends undefined ? unknown : { value: T })) | { ok: false; error: string }

const OPEN_INVOICE: DocumentStatus[] = ['issued', 'sent']

export class DocumentService {
  constructor(
    private readonly db: Db,
    private readonly settings: SettingsService,
  ) {}

  async list(options: {
    types: DocumentType[]
    statuses?: DocumentStatus[]
    overdue?: boolean
    clientId?: string
    q?: string
    limit?: number
  }): Promise<DocumentRow[]> {
    const filters: SQL[] = [inArray(documents.type, options.types)]
    if (options.statuses) filters.push(inArray(documents.status, options.statuses))
    if (options.overdue) filters.push(inArray(documents.status, OPEN_INVOICE), lt(documents.dueDate, todayIso()))
    if (options.clientId) filters.push(eq(documents.clientId, options.clientId))
    if (options.q) {
      filters.push(or(contains(documents.number, options.q), contains(documents.subject, options.q), contains(clients.name, options.q))!)
    }
    const rows = await this.db
      .select({ doc: documents, clientName: clients.name })
      .from(documents)
      .innerJoin(clients, eq(clients.id, documents.clientId))
      .where(and(...filters))
      .orderBy(sql`${documents.status} = 'draft' desc`, desc(documents.issueDate), desc(documents.number), desc(documents.createdAt))
      .limit(options.limit ?? 500)
    return rows.map((row) => ({ ...row.doc, clientName: row.clientName }))
  }

  async get(id: string): Promise<DocumentFull | null> {
    const [row] = await this.db
      .select({ doc: documents, client: clients })
      .from(documents)
      .innerJoin(clients, eq(clients.id, documents.clientId))
      .where(eq(documents.id, id))
      .limit(1)
    if (!row) return null
    const [lines, events, source, children] = await Promise.all([
      this.db.select().from(documentLines).where(eq(documentLines.documentId, id)).orderBy(asc(documentLines.position)),
      this.db.select().from(documentEvents).where(eq(documentEvents.documentId, id)).orderBy(desc(documentEvents.at), desc(documentEvents.id)),
      row.doc.sourceId ? this.db.select().from(documents).where(eq(documents.id, row.doc.sourceId)).limit(1) : Promise.resolve([]),
      this.db.select().from(documents).where(eq(documents.sourceId, id)).orderBy(asc(documents.createdAt)),
    ])
    return { doc: row.doc, client: row.client, lines, events, source: source[0] ?? null, children }
  }

  /** Les données à imprimer, figées pour un document émis. */
  async printable(full: DocumentFull): Promise<PrintableDocument> {
    const frozenIssuer = parseJson<IssuerSnapshot>(full.doc.issuerSnapshot)
    const frozenClient = parseJson<ClientSnapshot>(full.doc.clientSnapshot)
    let issuer = frozenIssuer
    if (!issuer) {
      const s = await this.settings.all()
      issuer = { issuer: issuerFromSettings(s), legal: legalFromSettings(s) }
    }
    return {
      doc: full.doc,
      lines: full.lines,
      issuer,
      client: frozenClient ?? clientSnapshot(full.client),
      sourceNumber: full.source?.number ?? null,
    }
  }

  async createDraft(type: DocumentType, input: DraftInput, sourceId: string | null = null): Promise<Result<string>> {
    const client = await this.clientOf(input.clientId)
    if (!client) return { ok: false, error: "Ce client n'existe pas." }
    const id = crypto.randomUUID()
    const now = new Date()
    const lines = this.buildLines(id, input.lines)
    const totals = computeTotals(lines, input.vatRate)
    const [first, ...rest] = [
      this.db.insert(documents).values({
        id,
        type,
        status: 'draft',
        clientId: client.id,
        sourceId,
        subject: input.subject,
        dueDate: input.dueDate,
        vatRate: input.vatRate,
        notes: input.notes,
        ...totals,
        createdAt: now,
        updatedAt: now,
      }),
      ...(lines.length ? [this.db.insert(documentLines).values(lines)] : []),
      this.db.insert(documentEvents).values({ documentId: id, kind: 'created', detail: 'Brouillon créé', at: now }),
    ]
    await this.db.batch([first, ...rest])
    return { ok: true, value: id }
  }

  async updateDraft(id: string, input: DraftInput): Promise<Result> {
    const [doc] = await this.db.select().from(documents).where(eq(documents.id, id)).limit(1)
    if (!doc) return { ok: false, error: "Ce document n'existe pas." }
    if (doc.status !== 'draft') return { ok: false, error: 'Un document émis ne se modifie plus. Duplique-le, ou annule la facture par un avoir.' }
    const client = await this.clientOf(input.clientId)
    if (!client) return { ok: false, error: "Ce client n'existe pas." }
    const lines = this.buildLines(id, input.lines)
    const totals = computeTotals(lines, input.vatRate)
    await this.db.batch([
      this.db
        .update(documents)
        .set({
          clientId: client.id,
          subject: input.subject,
          dueDate: input.dueDate,
          vatRate: input.vatRate,
          notes: input.notes,
          ...totals,
          updatedAt: new Date(),
        })
        .where(and(eq(documents.id, id), eq(documents.status, 'draft'))),
      this.db.delete(documentLines).where(eq(documentLines.documentId, id)),
      ...(lines.length ? [this.db.insert(documentLines).values(lines)] : []),
    ])
    return { ok: true }
  }

  async deleteDraft(id: string): Promise<Result> {
    const result = await this.db.delete(documents).where(and(eq(documents.id, id), eq(documents.status, 'draft'))).returning({ id: documents.id })
    return result.length ? { ok: true } : { ok: false, error: 'Seul un brouillon peut être supprimé.' }
  }

  /**
   * Nouveau brouillon à partir d'un document : copie (même type), facture d'un
   * devis, avoir d'une facture.
   */
  async derive(sourceId: string, type: DocumentType): Promise<Result<string>> {
    const full = await this.get(sourceId)
    if (!full) return { ok: false, error: "Ce document n'existe pas." }
    const { doc, lines } = full
    if (type === 'credit_note') {
      if (doc.type !== 'invoice' || !['issued', 'sent', 'paid'].includes(doc.status)) {
        return { ok: false, error: 'Un avoir annule une facture émise.' }
      }
      if (full.children.some((child) => child.type === 'credit_note')) {
        return { ok: false, error: 'Cette facture a déjà un avoir.' }
      }
    }
    if (type === 'invoice' && doc.type === 'quote' && doc.status === 'draft') {
      return { ok: false, error: 'Émets le devis avant d’en tirer une facture.' }
    }
    const linked = type !== doc.type
    const result = await this.createDraft(
      type,
      {
        clientId: doc.clientId,
        subject: doc.subject,
        dueDate: null,
        vatRate: doc.vatRate,
        notes: type === 'credit_note' ? `Avoir annulant la facture ${doc.number}.` : doc.notes,
        lines: lines.map((line) => ({
          title: line.title,
          details: line.details ?? '',
          quantity: line.quantity,
          unit: line.unit ?? '',
          unitPriceCents: line.unitPriceCents,
        })),
      },
      linked ? doc.id : null,
    )
    if (result.ok && linked) {
      const detail = type === 'invoice' ? 'Facture créée à partir du devis' : 'Avoir en préparation'
      await this.event(doc.id, type === 'invoice' ? 'invoiced' : 'credit_note', detail)
    }
    return result
  }

  /**
   * Émission : numéro pris sur la série (sans trou ni doublon), dates, client
   * et émetteur figés. Le tout dans un seul lot D1 ; si le document n'est plus
   * un brouillon (double clic), rien n'est écrit, compteur compris.
   */
  async issue(id: string): Promise<Result<string>> {
    const full = await this.get(id)
    if (!full) return { ok: false, error: "Ce document n'existe pas." }
    const { doc, lines, client, source } = full
    if (doc.status !== 'draft') return { ok: false, error: `${TYPE_LABEL[doc.type]} déjà émis${doc.type === 'invoice' ? 'e' : ''}.` }
    if (lines.length === 0) return { ok: false, error: 'Ajoute au moins une ligne avant d’émettre.' }
    if (doc.type === 'credit_note' && (!source || source.type !== 'invoice' || source.status === 'cancelled' || source.status === 'draft')) {
      return { ok: false, error: "La facture de cet avoir n'est plus annulable." }
    }

    const s = await this.settings.all()
    const issuer = issuerFromSettings(s)
    const missing = missingIssuerFields(issuer)
    if (missing.length) {
      return { ok: false, error: `Complète l'émetteur dans Réglages avant d'émettre (${missing.join(', ')}).` }
    }

    const today = todayIso()
    const parts = numberParts(doc.type, s[`numbering.${doc.type}`], today)
    let dueDate: string | null = null
    if (doc.type === 'invoice') {
      const days = client.paymentTermsDays ?? settingInt(s['billing.payment_days'], 30)
      dueDate = doc.dueDate && doc.dueDate >= today ? doc.dueDate : addDays(today, days)
    } else if (doc.type === 'quote') {
      dueDate = doc.dueDate && doc.dueDate >= today ? doc.dueDate : addDays(today, settingInt(s['billing.quote_validity_days'], 30))
    }
    const terms = doc.type === 'invoice' ? s['billing.payment_terms'] : doc.type === 'quote' ? s['billing.quote_acceptance'] : null
    const snapshot: IssuerSnapshot = { issuer, legal: legalFromSettings(s) }
    const now = Math.floor(Date.now() / 1000)

    const d1 = this.db.$client
    const statements = [
      d1
        .prepare(
          `INSERT INTO sequences (key, value)
           SELECT ?1, 1 WHERE EXISTS (SELECT 1 FROM documents WHERE id = ?2 AND status = 'draft')
           ON CONFLICT(key) DO UPDATE SET value = value + 1`,
        )
        .bind(parts.key, id),
      d1
        .prepare(
          `UPDATE documents SET
             number = ?1 || printf(?2, (SELECT value FROM sequences WHERE key = ?3)) || ?4,
             status = 'issued', issue_date = ?5, due_date = ?6, terms = ?7,
             client_snapshot = ?8, issuer_snapshot = ?9, updated_at = ?10
           WHERE id = ?11 AND status = 'draft'`,
        )
        .bind(parts.prefix, parts.counterFormat, parts.key, parts.suffix, today, dueDate, terms, JSON.stringify(clientSnapshot(client)), JSON.stringify(snapshot), now, id),
      d1
        .prepare(
          `INSERT INTO document_events (document_id, kind, detail, at)
           SELECT id, 'issued', 'Émis sous le numéro ' || number, ?2 FROM documents WHERE id = ?1 AND issue_date = ?3 AND number IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM document_events WHERE document_id = ?1 AND kind = 'issued')`,
        )
        .bind(id, now, today),
    ]
    if (doc.type === 'credit_note' && source) {
      statements.push(
        d1
          .prepare(`UPDATE documents SET status = 'cancelled', updated_at = ?2 WHERE id = ?1 AND status IN ('issued', 'sent', 'paid')`)
          .bind(source.id, now),
        d1
          .prepare(
            `INSERT INTO document_events (document_id, kind, detail, at)
             SELECT ?1, 'cancelled', 'Annulée par l''avoir ' || number, ?3 FROM documents WHERE id = ?2`,
          )
          .bind(source.id, id, now),
      )
    }
    await d1.batch(statements)

    const [issued] = await this.db.select({ number: documents.number, status: documents.status }).from(documents).where(eq(documents.id, id))
    if (!issued?.number) return { ok: false, error: "L'émission n'a pas abouti, réessaie." }
    return { ok: true, value: issued.number }
  }

  async setPdfKey(id: string, key: string): Promise<void> {
    await this.db.update(documents).set({ pdfKey: key }).where(eq(documents.id, id))
  }

  /** Après un envoi : « à envoyer » devient « envoyé ». */
  async markSent(id: string, to: string, kind: 'sent' | 'reminder'): Promise<void> {
    const [doc] = await this.db.select().from(documents).where(eq(documents.id, id))
    if (!doc) return
    const now = new Date()
    await this.db
      .update(documents)
      .set({
        status: doc.status === 'issued' ? 'sent' : doc.status,
        sentAt: doc.sentAt ?? now,
        ...(kind === 'reminder' ? { lastReminderAt: now, reminderCount: doc.reminderCount + 1 } : {}),
        updatedAt: now,
      })
      .where(eq(documents.id, id))
    await this.event(id, kind, kind === 'reminder' ? `Relance envoyée à ${to}` : `Envoyé à ${to}`)
  }

  async markPaid(id: string, paidOn: string, method: PaymentMethod): Promise<Result> {
    const paidAt = new Date(`${paidOn}T12:00:00Z`)
    const result = await this.db
      .update(documents)
      .set({ status: 'paid', paidAt, paymentMethod: method, updatedAt: new Date() })
      .where(and(eq(documents.id, id), eq(documents.type, 'invoice'), inArray(documents.status, OPEN_INVOICE)))
      .returning({ id: documents.id })
    if (!result.length) return { ok: false, error: 'Seule une facture émise et non réglée peut être marquée payée.' }
    await this.event(id, 'paid', `Réglée le ${paidOn.split('-').reverse().join('/')} (${PAYMENT_METHODS[method].toLowerCase()})`)
    return { ok: true }
  }

  async markUnpaid(id: string): Promise<Result> {
    const [doc] = await this.db.select().from(documents).where(eq(documents.id, id))
    if (!doc || doc.type !== 'invoice' || doc.status !== 'paid') return { ok: false, error: "Cette facture n'est pas marquée payée." }
    await this.db
      .update(documents)
      .set({ status: doc.sentAt ? 'sent' : 'issued', paidAt: null, paymentMethod: null, updatedAt: new Date() })
      .where(eq(documents.id, id))
    await this.event(id, 'unpaid', 'Paiement annulé')
    return { ok: true }
  }

  async setQuoteOutcome(id: string, outcome: 'accepted' | 'refused' | 'sent'): Promise<Result> {
    const [doc] = await this.db.select().from(documents).where(eq(documents.id, id))
    if (!doc || doc.type !== 'quote' || doc.status === 'draft') return { ok: false, error: 'Seul un devis émis peut changer de réponse.' }
    const now = new Date()
    const status = outcome === 'sent' ? (doc.sentAt ? 'sent' : 'issued') : outcome
    await this.db
      .update(documents)
      .set({
        status,
        acceptedAt: outcome === 'accepted' ? now : null,
        refusedAt: outcome === 'refused' ? now : null,
        updatedAt: now,
      })
      .where(eq(documents.id, id))
    const detail = { accepted: 'Devis accepté', refused: 'Devis refusé', sent: 'Réponse effacée' }[outcome]
    await this.event(id, outcome === 'sent' ? 'reopened' : outcome, detail)
    return { ok: true }
  }

  async event(documentId: string, kind: string, detail: string): Promise<void> {
    await this.db.insert(documentEvents).values({ documentId, kind, detail, at: new Date() })
  }

  /** Tâche quotidienne : un devis sans réponse après sa date de validité expire. */
  async expireQuotes(today = todayIso()): Promise<number> {
    const expired = await this.db
      .update(documents)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(and(eq(documents.type, 'quote'), inArray(documents.status, ['issued', 'sent']), lt(documents.dueDate, today)))
      .returning({ id: documents.id })
    for (const row of expired) await this.event(row.id, 'expired', 'Devis expiré sans réponse')
    return expired.length
  }

  /** Factures en retard à relancer d'après les réglages (relance automatique). */
  async invoicesToRemind(today: string, afterDays: number, everyDays: number, max: number): Promise<Document[]> {
    const dueBefore = addDays(today, -afterDays)
    const remindedBefore = new Date(Date.now() - everyDays * 86_400_000 + 3_600_000)
    return this.db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.type, 'invoice'),
          eq(documents.status, 'sent'),
          lte(documents.dueDate, dueBefore),
          lt(documents.reminderCount, max),
          or(isNull(documents.lastReminderAt), lt(documents.lastReminderAt, remindedBefore)),
        ),
      )
  }

  async stats(today = todayIso()) {
    const year = today.slice(0, 4)
    const month = today.slice(0, 7)
    const quarterStartMonth = String(Math.floor((Number(today.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0')
    const quarterStart = new Date(`${year}-${quarterStartMonth}-01T00:00:00Z`)
    const yearStart = new Date(`${year}-01-01T00:00:00Z`)
    const monthStart = new Date(`${month}-01T00:00:00Z`)
    const [row] = await this.db
      .select({
        unpaidCents: sql<number>`coalesce(sum(case when ${documents.type} = 'invoice' and ${documents.status} in ('issued', 'sent') then ${documents.totalTtcCents} end), 0)`,
        unpaidCount: sql<number>`count(case when ${documents.type} = 'invoice' and ${documents.status} in ('issued', 'sent') then 1 end)`,
        overdueCents: sql<number>`coalesce(sum(case when ${documents.type} = 'invoice' and ${documents.status} in ('issued', 'sent') and ${documents.dueDate} < ${today} then ${documents.totalTtcCents} end), 0)`,
        overdueCount: sql<number>`count(case when ${documents.type} = 'invoice' and ${documents.status} in ('issued', 'sent') and ${documents.dueDate} < ${today} then 1 end)`,
        pendingQuotesCents: sql<number>`coalesce(sum(case when ${documents.type} = 'quote' and ${documents.status} = 'sent' then ${documents.totalTtcCents} end), 0)`,
        pendingQuotesCount: sql<number>`count(case when ${documents.type} = 'quote' and ${documents.status} = 'sent' then 1 end)`,
        drafts: sql<number>`count(case when ${documents.status} = 'draft' then 1 end)`,
        paidYearCents: sql<number>`coalesce(sum(case when ${documents.type} = 'invoice' and ${documents.status} = 'paid' and ${documents.paidAt} >= ${Math.floor(yearStart.getTime() / 1000)} then ${documents.totalTtcCents} end), 0)`,
        paidQuarterCents: sql<number>`coalesce(sum(case when ${documents.type} = 'invoice' and ${documents.status} = 'paid' and ${documents.paidAt} >= ${Math.floor(quarterStart.getTime() / 1000)} then ${documents.totalTtcCents} end), 0)`,
        paidMonthCents: sql<number>`coalesce(sum(case when ${documents.type} = 'invoice' and ${documents.status} = 'paid' and ${documents.paidAt} >= ${Math.floor(monthStart.getTime() / 1000)} then ${documents.totalTtcCents} end), 0)`,
      })
      .from(documents)
    return row
  }

  /** Encaissements par mois de l'année (déclaration URSSAF), en centimes. */
  async paidByMonth(year: string): Promise<number[]> {
    const start = Math.floor(Date.parse(`${year}-01-01T00:00:00Z`) / 1000)
    const end = Math.floor(Date.parse(`${Number(year) + 1}-01-01T00:00:00Z`) / 1000)
    const rows = await this.db
      .select({
        month: sql<string>`strftime('%m', ${documents.paidAt}, 'unixepoch')`,
        cents: sql<number>`sum(${documents.totalTtcCents})`,
      })
      .from(documents)
      .where(and(eq(documents.type, 'invoice'), eq(documents.status, 'paid'), gte(documents.paidAt, new Date(start * 1000)), lt(documents.paidAt, new Date(end * 1000))))
      .groupBy(sql`1`)
    const months = Array.from({ length: 12 }, () => 0)
    for (const row of rows) months[Number(row.month) - 1] = row.cents
    return months
  }

  /** Variables des modèles de mails pour un document. */
  templateVars(full: DocumentFull): Record<string, string> {
    const { doc, client } = full
    return {
      numero: doc.number ?? '(brouillon)',
      objet: doc.subject ?? '',
      client: client.name,
      contact: client.contactName || client.name,
      montant: formatEuros(doc.totalTtcCents),
      echeance: doc.dueDate ? doc.dueDate.split('-').reverse().join('/') : '',
      validite: doc.dueDate ? doc.dueDate.split('-').reverse().join('/') : '',
      facture: full.source?.number ?? '',
      devis: full.source?.number ?? '',
    }
  }

  private async clientOf(id: string): Promise<Client | null> {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, id)).limit(1)
    return client ?? null
  }

  private buildLines(documentId: string, lines: LineInput[]) {
    return lines.map((line, position) => ({
      id: crypto.randomUUID(),
      documentId,
      position,
      title: line.title,
      details: line.details || null,
      quantity: line.quantity,
      unit: line.unit || null,
      unitPriceCents: line.unitPriceCents,
      totalCents: lineTotal(line.quantity, line.unitPriceCents),
    }))
  }
}

