import type { Document, DocumentStatus, DocumentType } from '../../db/schema'
import { todayIso } from './money'

export const TYPE_LABEL: Record<DocumentType, string> = {
  quote: 'Devis',
  invoice: 'Facture',
  credit_note: 'Avoir',
}

/** Pour les phrases : « le devis », « la facture », « l'avoir ». */
export const TYPE_ARTICLE: Record<DocumentType, string> = {
  quote: 'le devis',
  invoice: 'la facture',
  credit_note: "l'avoir",
}

export const TYPE_SLUG: Record<DocumentType, string> = {
  quote: 'devis',
  invoice: 'facture',
  credit_note: 'avoir',
}

export type StatusTone = 'off' | 'info' | 'warn' | 'ok' | 'err'

export type DisplayStatus = DocumentStatus | 'overdue'

const STATUS_LABEL: Record<DocumentType, Partial<Record<DisplayStatus, string>>> = {
  quote: {
    draft: 'Brouillon',
    issued: 'À envoyer',
    sent: 'En attente',
    accepted: 'Accepté',
    refused: 'Refusé',
    expired: 'Expiré',
  },
  invoice: {
    draft: 'Brouillon',
    issued: 'À envoyer',
    sent: 'Envoyée',
    overdue: 'En retard',
    paid: 'Payée',
    cancelled: 'Annulée',
  },
  credit_note: {
    draft: 'Brouillon',
    issued: 'À envoyer',
    sent: 'Envoyé',
  },
}

const STATUS_TONE: Record<DisplayStatus, StatusTone> = {
  draft: 'off',
  issued: 'info',
  sent: 'info',
  accepted: 'ok',
  refused: 'err',
  expired: 'off',
  paid: 'ok',
  cancelled: 'off',
  overdue: 'err',
}

/** Une facture envoyée et non réglée après son échéance est « en retard ». */
export function displayStatus(doc: Pick<Document, 'type' | 'status' | 'dueDate'>, today = todayIso()): DisplayStatus {
  if (doc.type === 'invoice' && (doc.status === 'issued' || doc.status === 'sent') && doc.dueDate && doc.dueDate < today) {
    return 'overdue'
  }
  return doc.status
}

export function statusLabel(doc: Pick<Document, 'type' | 'status' | 'dueDate'>, today?: string): { label: string; tone: StatusTone } {
  const status = displayStatus(doc, today)
  return { label: STATUS_LABEL[doc.type][status] ?? status, tone: STATUS_TONE[status] }
}

export const PAYMENT_METHODS = {
  transfer: 'Virement',
  card: 'Carte bancaire',
  check: 'Chèque',
  cash: 'Espèces',
  other: 'Autre',
} as const

export type PaymentMethod = keyof typeof PAYMENT_METHODS
