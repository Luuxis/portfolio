import { desc, eq } from 'drizzle-orm'
import { mails, type DocumentStatus, type DocumentType } from '../../db/schema'
import { PAYMENT_METHODS, TYPE_LABEL, type PaymentMethod } from '../../lib/billing/labels'
import { formatDate, formatDateTime, formatEuros, formatRate, isIsoDate, parseAmount, parseQuantity, parseVatRate, todayIso } from '../../lib/billing/money'
import { bool, indexed, nullable, str, text, type FormBody } from '../../lib/http/form'
import { ClientService } from '../../services/client.service'
import { DocumentMailService, type DocumentMailKind } from '../../services/document-mail.service'
import type { DraftInput, DocumentFull, LineInput } from '../../services/document.service'
import { DocumentEditor, linesToEditor, PaidForm, typeTitle, type EditorValues } from '../../views/admin/pages/documents'
import { DocStatus, DocumentsTable, MailsTable } from '../../views/admin/pages/shared'
import { ButtonLink, Card, PageHead, PostButton, Tabs } from '../../views/admin/ui'
import { Icon } from '../../views/shared/Icon'
import { adminPage, notFound, redirect, type AdminContext } from './_shared'

function services(c: AdminContext) {
  return new DocumentMailService(c.get('db'), c.get('settings'), c.env)
}

const LIST_FILTERS = {
  quote: [
    { key: 'tous', label: 'Tous', statuses: undefined },
    { key: 'brouillons', label: 'Brouillons', statuses: ['draft'] },
    { key: 'en-attente', label: 'En attente', statuses: ['issued', 'sent'] },
    { key: 'acceptes', label: 'Acceptés', statuses: ['accepted'] },
    { key: 'clos', label: 'Refusés ou expirés', statuses: ['refused', 'expired'] },
  ],
  invoice: [
    { key: 'toutes', label: 'Toutes', statuses: undefined },
    { key: 'brouillons', label: 'Brouillons', statuses: ['draft'] },
    { key: 'a-encaisser', label: 'À encaisser', statuses: ['issued', 'sent'] },
    { key: 'en-retard', label: 'En retard', statuses: undefined, overdue: true },
    { key: 'payees', label: 'Payées', statuses: ['paid'] },
    { key: 'avoirs', label: 'Avoirs', statuses: undefined, creditNotes: true },
  ],
} as const satisfies Record<
  'quote' | 'invoice',
  readonly { key: string; label: string; statuses?: readonly DocumentStatus[]; overdue?: boolean; creditNotes?: boolean }[]
>

export function list(type: 'quote' | 'invoice') {
  return async (c: AdminContext) => {
    const filters = LIST_FILTERS[type]
    const filter = filters.find((item) => item.key === c.req.query('filtre')) ?? filters[0]
    const q = (c.req.query('q') ?? '').trim()
    const types: DocumentType[] = type === 'quote' ? ['quote'] : 'creditNotes' in filter ? ['credit_note'] : filter.key === 'toutes' ? ['invoice', 'credit_note'] : ['invoice']
    const rows = await services(c).documents.list({
      types,
      statuses: filter.statuses ? [...filter.statuses] : undefined,
      overdue: 'overdue' in filter ? filter.overdue : undefined,
      q: q || undefined,
    })
    const base = type === 'quote' ? '/admin/devis' : '/admin/factures'
    const title = type === 'quote' ? 'Devis' : 'Factures'
    return adminPage(
      c,
      { title, active: type === 'quote' ? 'quotes' : 'invoices' },
      <>
        <PageHead title={title} intro={type === 'quote' ? 'Numérotés à l’émission, figés une fois envoyés.' : 'Une facture émise ne se modifie plus : elle s’annule par un avoir.'}>
          <ButtonLink href={type === 'quote' ? '/admin/devis/nouveau' : '/admin/factures/nouvelle'} icon="add" variant="primary">
            {type === 'quote' ? 'Nouveau devis' : 'Nouvelle facture'}
          </ButtonLink>
        </PageHead>
        <div class="toolbar-row">
          <Tabs current={filter.key} items={filters.map((item) => ({ key: item.key, label: item.label, href: `${base}?filtre=${item.key}` }))} />
          <form class="search" method="get">
            <input type="hidden" name="filtre" value={filter.key} />
            <input class="input input-sm" type="search" name="q" value={q} placeholder="Numéro, objet, client…" aria-label="Rechercher" />
            <button class="btn btn-sm" type="submit">
              <Icon name="search" size={16} />
            </button>
          </form>
        </div>
        <Card flush>
          <DocumentsTable rows={rows} />
        </Card>
      </>,
    )
  }
}

function readDraft(form: FormBody): { input: DraftInput; values: EditorValues; error?: string } {
  const type = (['quote', 'invoice', 'credit_note'].includes(str(form, 'type')) ? str(form, 'type') : 'invoice') as DocumentType
  const rawLines = indexed(form, 'lines')
  const values: EditorValues = {
    type,
    clientId: str(form, 'clientId'),
    subject: str(form, 'subject', 300),
    dueDate: str(form, 'dueDate'),
    vatRate: str(form, 'vatRate'),
    notes: text(form, 'notes', 5000),
    lines: rawLines.map((line) => ({
      title: line.title ?? '',
      details: line.details ?? '',
      quantity: line.quantity ?? '',
      unit: line.unit ?? '',
      price: line.price ?? '',
    })),
  }
  const lines: LineInput[] = []
  let error: string | undefined
  for (const [index, line] of values.lines.entries()) {
    if (!line.title && !line.price && !line.details) continue
    const quantity = parseQuantity(line.quantity || '1')
    const price = parseAmount(line.price)
    if (!line.title) error ??= `Ligne ${index + 1} : la désignation manque.`
    if (quantity === null) error ??= `Ligne ${index + 1} : quantité illisible.`
    if (price === null) error ??= `Ligne ${index + 1} : prix illisible (ex. 450 ou 65,50).`
    lines.push({
      title: line.title.slice(0, 300),
      details: line.details.slice(0, 3000),
      quantity: quantity ?? 0,
      unit: line.unit.slice(0, 30),
      unitPriceCents: price ?? 0,
    })
  }
  const vatRate = parseVatRate(values.vatRate)
  if (vatRate === undefined) error ??= 'Taux de TVA illisible (ex. 20).'
  if (values.dueDate && !isIsoDate(values.dueDate)) error ??= 'Date illisible.'
  if (!values.clientId) error ??= 'Choisis un client.'
  if (lines.length > 100) error ??= '100 lignes au plus.'
  return {
    input: {
      clientId: values.clientId,
      subject: nullable(values.subject),
      dueDate: nullable(values.dueDate),
      vatRate: vatRate ?? null,
      notes: nullable(values.notes),
      lines,
    },
    values,
    error,
  }
}

async function editorPage(
  c: AdminContext,
  options: { values: EditorValues; action: string; isNew: boolean; error?: string; title: string; back: { href: string; label: string } },
) {
  const [clients, unit] = await Promise.all([new ClientService(c.get('db')).options(), c.get('settings').get('billing.default_unit')])
  return adminPage(
    c,
    { title: options.title, active: options.values.type === 'quote' ? 'quotes' : 'invoices', status: options.error ? 422 : 200 },
    <>
      <PageHead title={options.title} back={options.back} />
      <DocumentEditor values={options.values} clients={clients} action={options.action} defaultUnit={unit} error={options.error} isNew={options.isNew} />
    </>,
  )
}

export function newForm(type: 'quote' | 'invoice') {
  return async (c: AdminContext) => {
    const vatRate = await c.get('settings').get('billing.vat_rate')
    const label = type === 'quote' ? 'Nouveau devis' : 'Nouvelle facture'
    return editorPage(c, {
      values: { type, clientId: c.req.query('client') ?? '', subject: '', dueDate: '', vatRate, notes: '', lines: [] },
      action: '/admin/documents',
      isNew: true,
      title: label,
      back: type === 'quote' ? { href: '/admin/devis', label: 'Devis' } : { href: '/admin/factures', label: 'Factures' },
    })
  }
}

/** Après l'enregistrement d'un brouillon : rester, émettre, ou passer à l'envoi. */
async function afterSave(c: AdminContext, id: string, intent: string) {
  if (intent === 'send') return redirect(c, `/admin/documents/${id}/envoyer`)
  if (intent === 'issue') {
    const issued = await services(c).documents.issue(id)
    if (!issued.ok) return redirect(c, `/admin/documents/${id}`, { type: 'err', message: issued.error })
    return redirect(c, `/admin/documents/${id}`, { type: 'ok', message: `Émis sous le numéro ${issued.value}.` })
  }
  return redirect(c, `/admin/documents/${id}`, { type: 'ok', message: 'Brouillon enregistré.' })
}

export async function create(c: AdminContext) {
  const form = (await c.req.parseBody()) as FormBody
  const { input, values, error } = readDraft(form)
  const back = values.type === 'quote' ? { href: '/admin/devis', label: 'Devis' } : { href: '/admin/factures', label: 'Factures' }
  const title = values.type === 'quote' ? 'Nouveau devis' : 'Nouvelle facture'
  if (error) return editorPage(c, { values, action: '/admin/documents', isNew: true, error, title, back })
  const created = await services(c).documents.createDraft(values.type, input)
  if (!created.ok) return editorPage(c, { values, action: '/admin/documents', isNew: true, error: created.error, title, back })
  return afterSave(c, created.value, str(form, 'intent'))
}

async function load(c: AdminContext): Promise<DocumentFull | null> {
  return services(c).documents.get(c.req.param('id')!)
}

export async function editForm(c: AdminContext) {
  const full = await load(c)
  if (!full) return notFound(c, 'Ce document')
  if (full.doc.status !== 'draft') return redirect(c, `/admin/documents/${full.doc.id}`, { type: 'info', message: 'Un document émis ne se modifie plus.' })
  const { doc } = full
  return editorPage(c, {
    values: {
      type: doc.type,
      clientId: doc.clientId,
      subject: doc.subject ?? '',
      dueDate: doc.dueDate ?? '',
      vatRate: doc.vatRate == null ? '' : String(doc.vatRate).replace('.', ','),
      notes: doc.notes ?? '',
      lines: linesToEditor(full.lines),
    },
    action: `/admin/documents/${doc.id}`,
    isNew: false,
    title: `Modifier : ${typeTitle(doc.type, doc.number)}`,
    back: { href: `/admin/documents/${doc.id}`, label: typeTitle(doc.type, doc.number) },
  })
}

export async function update(c: AdminContext) {
  const id = c.req.param('id')!
  const form = (await c.req.parseBody()) as FormBody
  const { input, values, error } = readDraft(form)
  const options = {
    values,
    action: `/admin/documents/${id}`,
    isNew: false,
    title: 'Modifier le brouillon',
    back: { href: `/admin/documents/${id}`, label: 'Retour' },
  }
  if (error) return editorPage(c, { ...options, error })
  const updated = await services(c).documents.updateDraft(id, input)
  if (!updated.ok) return editorPage(c, { ...options, error: updated.error })
  return afterSave(c, id, str(form, 'intent'))
}

export async function show(c: AdminContext) {
  const full = await load(c)
  if (!full) return notFound(c, 'Ce document')
  const { doc, client, events, source, children } = full
  const db = c.get('db')
  const sentMails = await db.select().from(mails).where(eq(mails.documentId, doc.id)).orderBy(desc(mails.date)).limit(20)
  const today = todayIso()
  const open = doc.type === 'invoice' && (doc.status === 'issued' || doc.status === 'sent')
  const overdue = open && doc.dueDate !== null && doc.dueDate < today
  const base = `/admin/documents/${doc.id}`
  const title = typeTitle(doc.type, doc.number)
  const listHref = doc.type === 'quote' ? '/admin/devis' : '/admin/factures'
  const creditNote = children.find((child) => child.type === 'credit_note')

  return adminPage(
    c,
    { title, active: doc.type === 'quote' ? 'quotes' : 'invoices' },
    <>
      <PageHead
        title={
          <>
            {title} <DocStatus doc={doc} />
          </>
        }
        intro={
          <>
            <a class="link" href={`/admin/clients/${client.id}`}>
              {client.name}
            </a>
            {doc.subject ? ` · ${doc.subject}` : ''}
          </>
        }
        back={{ href: listHref, label: doc.type === 'quote' ? 'Devis' : 'Factures' }}
      >
        {doc.status === 'draft' ? (
          <>
            <ButtonLink href={`${base}/modifier`} icon="edit">
              Modifier
            </ButtonLink>
            <PostButton action={`${base}/emettre`} icon="task_alt" confirm="Émettre ce document ? Il prendra son numéro définitif et ne sera plus modifiable.">
              Émettre
            </PostButton>
            <ButtonLink href={`${base}/envoyer`} icon="send" variant="primary">
              Émettre et envoyer
            </ButtonLink>
          </>
        ) : (
          <>
            <ButtonLink href={`${base}/pdf`} icon="picture_as_pdf" target="_blank">
              PDF
            </ButtonLink>
            {doc.status !== 'cancelled' ? (
              <ButtonLink href={`${base}/envoyer`} icon="send" variant={doc.sentAt ? 'secondary' : 'primary'}>
                {doc.sentAt ? 'Renvoyer' : 'Envoyer'}
              </ButtonLink>
            ) : null}
            {open && doc.sentAt ? (
              <ButtonLink href={`${base}/envoyer?relance=1`} icon="notifications_active" variant={overdue ? 'primary' : 'secondary'}>
                Relancer
              </ButtonLink>
            ) : null}
          </>
        )}
      </PageHead>

      <div class="grid grid-side">
        <div>
          <iframe class="preview-frame" src={`${base}/apercu`} title={`Aperçu : ${title}`} loading="lazy" />
        </div>
        <div class="stack">
          <Card title="Montant" icon="payments">
            <dl class="kv">
              <dt>Total HT</dt>
              <dd>{formatEuros(doc.totalHtCents)}</dd>
              <dt>TVA</dt>
              <dd>{doc.vatRate ? `${formatEuros(doc.vatCents)} (${formatRate(doc.vatRate)})` : 'Non applicable'}</dd>
              <dt>{doc.type === 'invoice' ? 'Net à payer' : 'Total'}</dt>
              <dd>
                <b>{formatEuros(doc.totalTtcCents)}</b>
              </dd>
              {doc.issueDate ? (
                <>
                  <dt>Émis le</dt>
                  <dd>{formatDate(doc.issueDate)}</dd>
                </>
              ) : null}
              {doc.dueDate ? (
                <>
                  <dt>{doc.type === 'quote' ? 'Valable jusqu’au' : 'Échéance'}</dt>
                  <dd>{formatDate(doc.dueDate)}</dd>
                </>
              ) : null}
              {doc.paidAt ? (
                <>
                  <dt>Réglée le</dt>
                  <dd>
                    {formatDate(todayIso(doc.paidAt))}
                    {doc.paymentMethod ? ` (${PAYMENT_METHODS[doc.paymentMethod as PaymentMethod]?.toLowerCase() ?? doc.paymentMethod})` : ''}
                  </dd>
                </>
              ) : null}
              {doc.reminderCount ? (
                <>
                  <dt>Relances</dt>
                  <dd>{doc.reminderCount}</dd>
                </>
              ) : null}
            </dl>
          </Card>

          {open ? (
            <Card title="Paiement reçu ?" icon="payments">
              <PaidForm action={`${base}/payee`} />
            </Card>
          ) : null}

          <Card title="Actions" icon="settings">
            <div class="actions">
              {doc.type === 'quote' && doc.status !== 'draft' ? (
                <>
                  {doc.status !== 'accepted' ? (
                    <PostButton action={`${base}/reponse`} fields={{ outcome: 'accepted' }} icon="check" size="sm">
                      Accepté
                    </PostButton>
                  ) : null}
                  {doc.status !== 'refused' ? (
                    <PostButton action={`${base}/reponse`} fields={{ outcome: 'refused' }} icon="close" size="sm">
                      Refusé
                    </PostButton>
                  ) : null}
                  {doc.status === 'accepted' || doc.status === 'refused' || doc.status === 'expired' ? (
                    <PostButton action={`${base}/reponse`} fields={{ outcome: 'sent' }} icon="undo" size="sm">
                      Effacer la réponse
                    </PostButton>
                  ) : null}
                  <PostButton action={`${base}/facturer`} icon="receipt_long" size="sm" variant="primary">
                    Créer la facture
                  </PostButton>
                </>
              ) : null}
              {doc.type === 'invoice' && doc.status === 'paid' ? (
                <PostButton action={`${base}/impayee`} icon="undo" size="sm" confirm="Annuler l'enregistrement du paiement ?">
                  Annuler le paiement
                </PostButton>
              ) : null}
              {doc.type === 'invoice' && ['issued', 'sent', 'paid'].includes(doc.status) && !creditNote ? (
                <PostButton
                  action={`${base}/avoir`}
                  icon="cancel"
                  size="sm"
                  variant="danger"
                  confirm="Préparer un avoir qui annule cette facture ? La facture sera annulée quand l'avoir sera émis."
                >
                  Annuler par un avoir
                </PostButton>
              ) : null}
              {doc.type !== 'credit_note' ? (
                <PostButton action={`${base}/dupliquer`} icon="content_copy" size="sm">
                  Dupliquer
                </PostButton>
              ) : null}
              {doc.status === 'draft' ? (
                <>
                  <ButtonLink href={`${base}/pdf`} icon="picture_as_pdf" size="sm" target="_blank">
                    PDF du brouillon
                  </ButtonLink>
                  <PostButton action={`${base}/supprimer`} icon="delete" size="sm" variant="danger" confirm="Supprimer ce brouillon ?">
                    Supprimer
                  </PostButton>
                </>
              ) : null}
            </div>
          </Card>

          {source || children.length ? (
            <Card title="Documents liés" icon="link">
              <ul class="timeline">
                {source ? (
                  <li>
                    <span>
                      <a class="link" href={`/admin/documents/${source.id}`}>
                        {typeTitle(source.type, source.number)}
                      </a>
                      <small>{source.type === 'quote' ? 'Devis d’origine' : 'Facture annulée'}</small>
                    </span>
                  </li>
                ) : null}
                {children.map((child) => (
                  <li>
                    <span>
                      <a class="link" href={`/admin/documents/${child.id}`}>
                        {typeTitle(child.type, child.number)}
                      </a>
                      <small>
                        {TYPE_LABEL[child.type]} · {formatEuros(child.totalTtcCents)}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {sentMails.length ? (
            <Card title="Mails" icon="outgoing_mail" flush>
              <MailsTable rows={sentMails} compact />
            </Card>
          ) : null}

          <Card title="Historique" icon="history">
            <ul class="timeline">
              {events.map((event) => (
                <li>
                  <span>
                    {event.detail ?? event.kind}
                    <small>{formatDateTime(event.at)}</small>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>,
  )
}

export async function preview(c: AdminContext) {
  const full = await load(c)
  if (!full) return c.text('Introuvable', 404)
  return c.html(await services(c).pdf.html(full))
}

export async function pdf(c: AdminContext) {
  const full = await load(c)
  if (!full) return notFound(c, 'Ce document')
  const service = services(c)
  try {
    const bytes = await service.pdf.get(full)
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${service.pdf.filename(full)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('PDF impossible :', error)
    return redirect(c, `/admin/documents/${full.doc.id}`, { type: 'err', message: 'Le PDF n’a pas pu être généré (Browser Run indisponible ?). Réessaie dans un instant.' })
  }
}

export async function issue(c: AdminContext) {
  const id = c.req.param('id')!
  const issued = await services(c).documents.issue(id)
  if (!issued.ok) return redirect(c, `/admin/documents/${id}`, { type: 'err', message: issued.error })
  return redirect(c, `/admin/documents/${id}`, { type: 'ok', message: `Émis sous le numéro ${issued.value}.` })
}

export async function remove(c: AdminContext) {
  const id = c.req.param('id')!
  const full = await load(c)
  const removed = await services(c).documents.deleteDraft(id)
  if (!removed.ok) return redirect(c, `/admin/documents/${id}`, { type: 'err', message: removed.error })
  return redirect(c, full?.doc.type === 'quote' ? '/admin/devis' : '/admin/factures', { type: 'ok', message: 'Brouillon supprimé.' })
}

export function derive(type: DocumentType | 'same') {
  return async (c: AdminContext) => {
    const full = await load(c)
    if (!full) return notFound(c, 'Ce document')
    const result = await services(c).documents.derive(full.doc.id, type === 'same' ? full.doc.type : type)
    if (!result.ok) return redirect(c, `/admin/documents/${full.doc.id}`, { type: 'err', message: result.error })
    const message =
      type === 'invoice' ? 'Facture préparée à partir du devis : vérifie-la, puis émets-la.' : type === 'credit_note' ? "Avoir préparé : émets-le pour annuler la facture." : 'Copie créée.'
    return redirect(c, `/admin/documents/${result.value}/modifier`, { type: 'ok', message })
  }
}

export async function paid(c: AdminContext) {
  const id = c.req.param('id')!
  const form = (await c.req.parseBody()) as FormBody
  const paidOn = str(form, 'paidOn')
  const method = (str(form, 'method') in PAYMENT_METHODS ? str(form, 'method') : 'other') as PaymentMethod
  if (!isIsoDate(paidOn) || paidOn > todayIso()) return redirect(c, `/admin/documents/${id}`, { type: 'err', message: 'Date de paiement invalide.' })
  const result = await services(c).documents.markPaid(id, paidOn, method)
  return redirect(c, `/admin/documents/${id}`, result.ok ? { type: 'ok', message: 'Facture marquée payée.' } : { type: 'err', message: result.error })
}

export async function unpaid(c: AdminContext) {
  const id = c.req.param('id')!
  const result = await services(c).documents.markUnpaid(id)
  return redirect(c, `/admin/documents/${id}`, result.ok ? { type: 'ok', message: 'Paiement annulé.' } : { type: 'err', message: result.error })
}

export async function outcome(c: AdminContext) {
  const id = c.req.param('id')!
  const form = (await c.req.parseBody()) as FormBody
  const value = str(form, 'outcome')
  if (value !== 'accepted' && value !== 'refused' && value !== 'sent') return redirect(c, `/admin/documents/${id}`)
  const result = await services(c).documents.setQuoteOutcome(id, value)
  return redirect(c, `/admin/documents/${id}`, result.ok ? { type: 'ok', message: 'Réponse enregistrée.' } : { type: 'err', message: result.error })
}

function ComposeForm({ action, draft, isDraft, kind, filename, error }: {
  action: string
  draft: { to: string; cc: string; subject: string; body: string; attach: boolean }
  isDraft: boolean
  kind: DocumentMailKind
  filename: string
  error?: string
}) {
  return (
    <form method="post" action={action} class="form">
      <input type="hidden" name="kind" value={kind} />
      {isDraft ? (
        <p class="flash flash-info">
          Le document sera émis au moment de l'envoi : son numéro et son échéance définitifs remplaceront {'{numero}'} et {'{echeance}'} dans le mail.
        </p>
      ) : null}
      <Card title="Mail" icon="send">
        <div class="fields">
          <label class="field">
            <span>À</span>
            <input class="input" name="to" value={draft.to} required placeholder="client@exemple.fr" />
          </label>
          <label class="field">
            <span>Copie</span>
            <input class="input" name="cc" value={draft.cc} placeholder="Séparées par des virgules" />
          </label>
          <label class="field full">
            <span>Objet</span>
            <input class="input" name="subject" value={draft.subject} required />
          </label>
          <label class="field full">
            <span>Message</span>
            <textarea class="textarea tall" name="body" required>
              {draft.body}
            </textarea>
            <small>La signature des réglages est ajoutée en bas.</small>
          </label>
          <label class="check full">
            <input type="checkbox" name="attach" value="true" checked={draft.attach} />
            <span>
              Joindre le PDF <span class="muted mono">{filename}</span>
            </span>
          </label>
        </div>
      </Card>
      {error ? <p class="flash flash-err">{error}</p> : null}
      <div class="form-foot">
        <button type="submit" class="btn btn-primary">
          <Icon name="send" size={18} />
          {isDraft ? 'Émettre et envoyer' : kind === 'reminder' ? 'Envoyer la relance' : 'Envoyer'}
        </button>
      </div>
    </form>
  )
}

export async function composeForm(c: AdminContext) {
  const full = await load(c)
  if (!full) return notFound(c, 'Ce document')
  const service = services(c)
  const kind: DocumentMailKind = c.req.query('relance') === '1' && full.doc.type === 'invoice' ? 'reminder' : 'sent'
  const draft = service.draft(full, kind, await c.get('settings').all())
  const title = `${kind === 'reminder' ? 'Relancer' : 'Envoyer'} : ${typeTitle(full.doc.type, full.doc.number)}`
  return adminPage(
    c,
    { title, active: full.doc.type === 'quote' ? 'quotes' : 'invoices', narrow: true },
    <>
      <PageHead title={title} back={{ href: `/admin/documents/${full.doc.id}`, label: typeTitle(full.doc.type, full.doc.number) }} />
      <ComposeForm
        action={`/admin/documents/${full.doc.id}/envoyer`}
        draft={draft}
        isDraft={full.doc.status === 'draft'}
        kind={kind}
        filename={service.pdf.filename(full)}
      />
    </>,
  )
}

export async function send(c: AdminContext) {
  const id = c.req.param('id')!
  const form = (await c.req.parseBody()) as FormBody
  const kind: DocumentMailKind = str(form, 'kind') === 'reminder' ? 'reminder' : 'sent'
  const draft = { to: str(form, 'to', 1000), cc: str(form, 'cc', 1000), subject: str(form, 'subject', 300), body: text(form, 'body', 20_000), attach: bool(form, 'attach') }
  const service = services(c)
  const result = await service.send(id, draft, kind, c.executionCtx.waitUntil.bind(c.executionCtx))
  if (result.ok) return redirect(c, `/admin/documents/${id}`, { type: 'ok', message: result.message })

  const full = await service.documents.get(id)
  if (!full) return notFound(c, 'Ce document')
  const title = `Envoyer : ${typeTitle(full.doc.type, full.doc.number)}`
  return adminPage(
    c,
    { title, active: full.doc.type === 'quote' ? 'quotes' : 'invoices', narrow: true, status: 422 },
    <>
      <PageHead title={title} back={{ href: `/admin/documents/${id}`, label: typeTitle(full.doc.type, full.doc.number) }} />
      <ComposeForm
        action={`/admin/documents/${id}/envoyer`}
        draft={draft}
        isDraft={full.doc.status === 'draft'}
        kind={kind}
        filename={service.pdf.filename(full)}
        error={result.error}
      />
    </>,
  )
}
