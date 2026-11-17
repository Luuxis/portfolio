import type { Document, Mail, MailAddress } from '../../../db/schema'
import { statusLabel, TYPE_LABEL } from '../../../lib/billing/labels'
import { formatDate, formatEuros, formatShortDate } from '../../../lib/billing/money'
import { parseJson } from '../../../lib/billing/identity'
import type { DocumentRow } from '../../../services/document.service'
import { Icon } from '../../shared/Icon'
import { Badge, Empty } from '../ui'

export function DocStatus({ doc }: { doc: Pick<Document, 'type' | 'status' | 'dueDate'> }) {
  const { label, tone } = statusLabel(doc)
  return <Badge tone={tone}>{label}</Badge>
}

export function DocumentsTable({ rows, showClient = true, emptyText }: { rows: DocumentRow[]; showClient?: boolean; emptyText?: string }) {
  if (!rows.length) return <Empty icon="receipt_long" title="Aucun document" text={emptyText} />
  const total = rows.reduce((sum, row) => sum + (row.type === 'credit_note' ? -row.totalTtcCents : row.totalTtcCents), 0)
  return (
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>N°</th>
            {showClient ? <th>Client</th> : null}
            <th>Objet</th>
            <th>Date</th>
            <th>Échéance</th>
            <th class="num">Montant</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr>
              <td class="nowrap">
                <a class="row-link" href={`/admin/documents/${row.id}`}>
                  {row.number ?? <span class="muted">Brouillon</span>}
                </a>
                {row.type === 'credit_note' ? <div class="small muted">{TYPE_LABEL[row.type]}</div> : null}
              </td>
              {showClient ? (
                <td>
                  <a href={`/admin/clients/${row.clientId}`}>{row.clientName}</a>
                </td>
              ) : null}
              <td>{row.subject ?? <span class="muted">—</span>}</td>
              <td class="nowrap">{formatDate(row.issueDate) || <span class="muted">—</span>}</td>
              <td class="nowrap">{formatDate(row.dueDate) || <span class="muted">—</span>}</td>
              <td class="num">{row.type === 'credit_note' ? `−${formatEuros(row.totalTtcCents)}` : formatEuros(row.totalTtcCents)}</td>
              <td>
                <DocStatus doc={row} />
              </td>
            </tr>
          ))}
        </tbody>
        {rows.length > 1 ? (
          <tfoot>
            <tr>
              <td colspan={showClient ? 5 : 4}>{rows.length} documents</td>
              <td class="num">{formatEuros(total)}</td>
              <td />
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  )
}

export function addresses(raw: string): MailAddress[] {
  return parseJson<MailAddress[]>(raw) ?? []
}

export function formatAddress(address: MailAddress): string {
  return address.name ? `${address.name} <${address.address}>` : address.address
}

export function MailsTable({ rows, clientNames, compact, selectable }: { rows: Mail[]; clientNames?: Map<string, string>; compact?: boolean; selectable?: boolean }) {
  if (!rows.length) return <Empty icon="inbox" title="Aucun mail" />
  if (compact) {
    // Colonne étroite (tableau de bord, fiche document) : une cellule par mail.
    return (
      <div class="table-wrap">
        <table class="table">
          <tbody>
            {rows.map((mail) => {
              const who = mail.direction === 'in' ? mail.fromName || mail.fromAddress || '?' : `À : ${addresses(mail.toAddresses).map((a) => a.name || a.address).join(', ')}`
              const client = mail.clientId ? clientNames?.get(mail.clientId) : undefined
              return (
                <tr class={mail.seen ? undefined : 'unread'}>
                  <td>
                    <a class="mail-row" href={`/admin/mails/${mail.id}`}>
                      <span class="mail-row-top">
                        <span>
                          {mail.seen ? null : <span class="dot" />} {who}
                          {client ? <span class="muted"> · {client}</span> : null}
                        </span>
                        <span>{formatShortDate(mail.date)}</span>
                      </span>
                      <strong>{mail.subject || '(sans objet)'}</strong>
                      <span class="small muted">{mail.snippet}</span>
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }
  return (
    <div class="table-wrap">
      <table class="table">
        <tbody>
          {rows.map((mail) => {
            const who = mail.direction === 'in' ? mail.fromName || mail.fromAddress || '?' : `À : ${addresses(mail.toAddresses).map((a) => a.name || a.address).join(', ')}`
            const attachments = parseJson<unknown[]>(mail.attachments)?.length ?? 0
            return (
              <tr class={mail.seen ? undefined : 'unread'}>
                {selectable ? (
                  <td class="pick">
                    <input type="checkbox" name="ids" value={mail.id} aria-label={`Sélectionner : ${mail.subject || '(sans objet)'}`} />
                  </td>
                ) : null}
                <td class="nowrap">
                  {mail.seen ? null : <span class="dot" />} {who}
                  {mail.clientId && clientNames?.get(mail.clientId) ? <div class="small muted">{clientNames.get(mail.clientId)}</div> : null}
                </td>
                <td>
                  <a class="row-link" href={`/admin/mails/${mail.id}`}>
                    {mail.subject || '(sans objet)'}
                  </a>
                  {mail.status === 'failed' ? (
                    <>
                      {' '}
                      <Badge tone="err">Échec</Badge>
                    </>
                  ) : null}
                  <div class="small muted">{mail.snippet}</div>
                </td>
                <td class="nowrap right">
                  {attachments ? <Icon name="attach_file" size={16} class="muted" /> : null}
                </td>
                <td class="nowrap right small">{formatShortDate(mail.date)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
