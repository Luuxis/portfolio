import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const createdAt = () => integer('created_at', { mode: 'timestamp' }).notNull()
const updatedAt = () => integer('updated_at', { mode: 'timestamp' }).notNull()

/**
 * Réglages de l'admin (émetteur des factures, numérotation, modèles de mails,
 * serveurs de messagerie, 2FA…) en clé/valeur. Les valeurs sensibles (mots de
 * passe SMTP et IMAP, secret TOTP) sont chiffrées avant d'arriver ici.
 */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: updatedAt(),
})

export const clients = sqliteTable(
  'clients',
  {
    id: text('id').primaryKey(),
    kind: text('kind', { enum: ['company', 'person'] }).notNull().default('company'),
    /** Raison sociale, ou nom et prénom pour un particulier. */
    name: text('name').notNull(),
    contactName: text('contact_name'),
    email: text('email'),
    /** Adresses mises en copie des envois, séparées par des virgules. */
    ccEmails: text('cc_emails'),
    phone: text('phone'),
    address: text('address'),
    postalCode: text('postal_code'),
    city: text('city'),
    country: text('country').notNull().default('France'),
    siren: text('siren'),
    vatNumber: text('vat_number'),
    /** Délai de paiement propre au client, en jours ; sinon celui des réglages. */
    paymentTermsDays: integer('payment_terms_days'),
    notes: text('notes'),
    archivedAt: integer('archived_at', { mode: 'timestamp' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('idx_clients_email').on(table.email)],
)

export const DOCUMENT_TYPES = ['quote', 'invoice', 'credit_note'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

/**
 * draft : brouillon, modifiable, sans numéro.
 * issued : numéroté et figé (le PDF ne change plus).
 * sent : envoyé au client.
 * accepted / refused / expired : réponse à un devis.
 * paid : facture réglée. cancelled : facture annulée par un avoir.
 */
export const DOCUMENT_STATUSES = ['draft', 'issued', 'sent', 'accepted', 'refused', 'expired', 'paid', 'cancelled'] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

/**
 * Devis, factures et avoirs dans une même table : mêmes lignes, même PDF,
 * même envoi. Une fois émis, un document ne change plus : client et émetteur
 * sont recopiés (snapshots JSON) et le PDF est rangé dans R2.
 */
export const documents = sqliteTable(
  'documents',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: DOCUMENT_TYPES }).notNull(),
    /** Null tant que le document est un brouillon. */
    number: text('number').unique(),
    status: text('status', { enum: DOCUMENT_STATUSES }).notNull().default('draft'),
    clientId: text('client_id')
      .notNull()
      .references(() => clients.id),
    /** Devis d'origine d'une facture, facture annulée par un avoir. */
    sourceId: text('source_id'),
    subject: text('subject'),
    /** Dates calendaires AAAA-MM-JJ. */
    issueDate: text('issue_date'),
    /** Échéance d'une facture, fin de validité d'un devis. */
    dueDate: text('due_date'),
    /** Taux en pourcentage ; null : TVA non applicable (art. 293 B du CGI). */
    vatRate: real('vat_rate'),
    totalHtCents: integer('total_ht_cents').notNull().default(0),
    vatCents: integer('vat_cents').notNull().default(0),
    totalTtcCents: integer('total_ttc_cents').notNull().default(0),
    /** Texte libre imprimé sous les lignes. */
    notes: text('notes'),
    /** Modalités de règlement, recopiées des réglages à l'émission. */
    terms: text('terms'),
    clientSnapshot: text('client_snapshot'),
    issuerSnapshot: text('issuer_snapshot'),
    pdfKey: text('pdf_key'),
    sentAt: integer('sent_at', { mode: 'timestamp' }),
    acceptedAt: integer('accepted_at', { mode: 'timestamp' }),
    refusedAt: integer('refused_at', { mode: 'timestamp' }),
    paidAt: integer('paid_at', { mode: 'timestamp' }),
    paymentMethod: text('payment_method'),
    lastReminderAt: integer('last_reminder_at', { mode: 'timestamp' }),
    reminderCount: integer('reminder_count').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index('idx_documents_type_status').on(table.type, table.status),
    index('idx_documents_client').on(table.clientId),
    index('idx_documents_source').on(table.sourceId),
  ],
)

export const documentLines = sqliteTable(
  'document_lines',
  {
    id: text('id').primaryKey(),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    title: text('title').notNull(),
    /** Lignes de détail, une par ligne. */
    details: text('details'),
    quantity: real('quantity').notNull().default(1),
    /** jour, heure, forfait… */
    unit: text('unit'),
    unitPriceCents: integer('unit_price_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
  },
  (table) => [index('idx_document_lines_document').on(table.documentId, table.position)],
)

/** Historique d'un document : création, émission, envoi, relance, paiement… */
export const documentEvents = sqliteTable(
  'document_events',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    detail: text('detail'),
    at: integer('at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_document_events_document').on(table.documentId, table.at)],
)

/**
 * Compteurs de numérotation : une clé par série et par période
 * (`invoice:2026`, `quote:2026-08`). Sans trou ni doublon : le numéro est pris
 * dans le même lot que l'émission du document.
 */
export const sequences = sqliteTable('sequences', {
  key: text('key').primaryKey(),
  value: integer('value').notNull(),
})

export type MailAddress = { name: string | null; address: string }
export type MailAttachmentMeta = { filename: string; mimeType: string; size: number }

/**
 * Mails reçus (copiés depuis l'IMAP) et envoyés depuis l'admin. Le message
 * brut (.eml) est dans R2 ; ici, de quoi lister, chercher et relier au client.
 */
export const mails = sqliteTable(
  'mails',
  {
    id: text('id').primaryKey(),
    direction: text('direction', { enum: ['in', 'out'] }).notNull(),
    /** Dossier IMAP d'où vient le message (INBOX, Sent…), null pour un envoi pas encore copié. */
    mailbox: text('mailbox'),
    uidValidity: integer('uid_validity'),
    uid: integer('uid'),
    messageId: text('message_id'),
    inReplyTo: text('in_reply_to'),
    references: text('references'),
    fromAddress: text('from_address'),
    fromName: text('from_name'),
    /** JSON MailAddress[] */
    toAddresses: text('to_addresses').notNull().default('[]'),
    ccAddresses: text('cc_addresses').notNull().default('[]'),
    /** JSON MailAddress[] : l'en-tête Reply-To ; null pour un mail copié avant qu'on le garde. */
    replyTo: text('reply_to'),
    subject: text('subject'),
    snippet: text('snippet'),
    textBody: text('text_body'),
    hasHtml: integer('has_html', { mode: 'boolean' }).notNull().default(false),
    /** JSON MailAttachmentMeta[] */
    attachments: text('attachments').notNull().default('[]'),
    rawKey: text('raw_key'),
    size: integer('size').notNull().default(0),
    /** Message trop gros : seuls les en-têtes ont été copiés. */
    partial: integer('partial', { mode: 'boolean' }).notNull().default(false),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    seen: integer('seen', { mode: 'boolean' }).notNull().default(false),
    clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }),
    documentId: text('document_id').references(() => documents.id, { onDelete: 'set null' }),
    /** received, sent, failed */
    status: text('status').notNull(),
    error: text('error'),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('uniq_mails_imap').on(table.mailbox, table.uidValidity, table.uid),
    index('idx_mails_direction_date').on(table.direction, table.date),
    index('idx_mails_client').on(table.clientId, table.date),
    index('idx_mails_document').on(table.documentId),
    index('idx_mails_message_id').on(table.messageId),
  ],
)

/** Chaque enregistrement du CV ajoute une version : la dernière est en ligne. */
export const cvVersions = sqliteTable('cv_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  note: text('note'),
  createdAt: createdAt(),
})

export const loginAttempts = sqliteTable(
  'login_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    ip: text('ip').notNull(),
    ok: integer('ok', { mode: 'boolean' }).notNull(),
    at: integer('at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [index('idx_login_attempts_ip_at').on(table.ip, table.at), index('idx_login_attempts_at').on(table.at)],
)

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert
export type Document = typeof documents.$inferSelect
export type DocumentLine = typeof documentLines.$inferSelect
export type DocumentEvent = typeof documentEvents.$inferSelect
export type Mail = typeof mails.$inferSelect
export type CvVersion = typeof cvVersions.$inferSelect
