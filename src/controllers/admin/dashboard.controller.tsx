import { and, desc, eq } from 'drizzle-orm'
import { clients, mails } from '../../db/schema'
import { formatDateTime, formatEuros, todayIso } from '../../lib/billing/money'
import { DocumentService } from '../../services/document.service'
import { Icon } from '../../views/shared/Icon'
import { DocumentsTable, MailsTable } from '../../views/admin/pages/shared'
import { ButtonLink, Card, PageHead } from '../../views/admin/ui'
import { adminPage, type AdminContext } from './_shared'

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export async function index(c: AdminContext) {
  const db = c.get('db')
  const documents = new DocumentService(db, c.get('settings'))
  const today = todayIso()
  const year = today.slice(0, 4)
  const [stats, byMonth, overdue, pending, drafts, unread, clientRows, sync] = await Promise.all([
    documents.stats(today),
    documents.paidByMonth(year),
    documents.list({ types: ['invoice'], overdue: true, limit: 10 }),
    documents.list({ types: ['quote'], statuses: ['issued', 'sent'], limit: 10 }),
    documents.list({ types: ['quote', 'invoice', 'credit_note'], statuses: ['draft'], limit: 10 }),
    db.select().from(mails).where(and(eq(mails.direction, 'in'), eq(mails.seen, false))).orderBy(desc(mails.date)).limit(6),
    db.select({ id: clients.id, name: clients.name }).from(clients),
    c.get('settings').many(['imap.last_sync', 'imap.last_error', 'imap.enabled']),
  ])
  const clientNames = new Map(clientRows.map((row) => [row.id, row.name]))
  const max = Math.max(...byMonth, 1)
  const currentMonth = Number(today.slice(5, 7)) - 1

  return adminPage(
    c,
    { title: 'Tableau de bord', active: 'dashboard' },
    <>
      <PageHead title="Tableau de bord" intro={`Encaissé en ${year} : ${formatEuros(stats.paidYearCents)}`}>
        <ButtonLink href="/admin/clients/nouveau" icon="person">
          Client
        </ButtonLink>
        <ButtonLink href="/admin/devis/nouveau" icon="request_quote">
          Devis
        </ButtonLink>
        <ButtonLink href="/admin/factures/nouvelle" icon="receipt_long" variant="primary">
          Facture
        </ButtonLink>
      </PageHead>

      <div class="grid grid-4">
        <a class="card stat" href="/admin/factures?filtre=a-encaisser">
          <p class="stat-label">À encaisser</p>
          <p class="stat-value">{formatEuros(stats.unpaidCents)}</p>
          <p class="stat-note">{stats.unpaidCount} facture{stats.unpaidCount > 1 ? 's' : ''}</p>
        </a>
        <a class="card stat" href="/admin/factures?filtre=en-retard">
          <p class="stat-label">En retard</p>
          <p class="stat-value">{formatEuros(stats.overdueCents)}</p>
          <p class="stat-note">{stats.overdueCount ? `${stats.overdueCount} à relancer` : 'Rien en retard'}</p>
        </a>
        <a class="card stat" href="/admin/devis?filtre=en-attente">
          <p class="stat-label">Devis en attente</p>
          <p class="stat-value">{formatEuros(stats.pendingQuotesCents)}</p>
          <p class="stat-note">{stats.pendingQuotesCount} devis</p>
        </a>
        <div class="card stat">
          <p class="stat-label">Encaissé</p>
          <p class="stat-value">{formatEuros(stats.paidMonthCents)}</p>
          <p class="stat-note">ce mois · {formatEuros(stats.paidQuarterCents)} ce trimestre</p>
        </div>
      </div>

      <div class="grid grid-side">
        <div class="stack">
          {overdue.length ? (
            <Card title="Factures en retard" icon="warning" flush>
              <DocumentsTable rows={overdue} />
            </Card>
          ) : null}
          <Card
            title="Devis en attente de réponse"
            icon="request_quote"
            flush
            actions={
              <ButtonLink href="/admin/devis" size="sm">
                Tous les devis
              </ButtonLink>
            }
          >
            <DocumentsTable rows={pending} emptyText="Aucun devis envoyé n'attend de réponse." />
          </Card>
          {drafts.length ? (
            <Card title="Brouillons" icon="edit" flush>
              <DocumentsTable rows={drafts} />
            </Card>
          ) : null}
        </div>
        <div class="stack">
          <Card
            title="Mails non lus"
            icon="inbox"
            flush
            actions={
              <ButtonLink href="/admin/mails" size="sm">
                Boîte
              </ButtonLink>
            }
          >
            <MailsTable rows={unread} clientNames={clientNames} compact />
          </Card>
          <Card title={`Encaissements ${year}`} icon="payments">
            <div class="bars" role="img" aria-label={`Encaissements par mois en ${year}`}>
              {byMonth.map((cents, month) => (
                <div class={month === currentMonth ? 'bar now' : 'bar'} title={`${MONTHS[month]} : ${formatEuros(cents)}`}>
                  <span style={`--h:${Math.round((cents / max) * 100)}%`} />
                  <small>{MONTHS[month].slice(0, 1).toUpperCase()}</small>
                </div>
              ))}
            </div>
            <p class="small muted">Montants réglés, par mois d'encaissement : ce que tu déclares à l'Urssaf.</p>
          </Card>
          {sync['imap.enabled'] === 'true' ? (
            <p class="small muted">
              <Icon name="refresh" size={14} class="inline" /> Boîte relue le {formatDateTime(sync['imap.last_sync'] ? new Date(sync['imap.last_sync']) : null) || 'jamais'}
              {sync['imap.last_error'] ? <span class="b-err badge">{sync['imap.last_error']}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </>,
  )
}
