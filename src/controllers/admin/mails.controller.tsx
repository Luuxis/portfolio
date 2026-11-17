import { and, desc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm'
import { contains } from '../../db/sql'
import { clients, mails, type Mail, type MailAttachmentMeta } from '../../db/schema'
import { parseJson } from '../../lib/billing/identity'
import { formatDateTime } from '../../lib/billing/money'
import { emailList, list as formList, safeNext, str, text, type FormBody } from '../../lib/http/form'
import { ClientService } from '../../services/client.service'
import { InboxService } from '../../services/inbox.service'
import { MailService, type OutgoingAttachment } from '../../services/mail.service'
import { addresses, formatAddress, MailsTable } from '../../views/admin/pages/shared'
import { ButtonLink, Card, PageHead, PostButton, Select, Tabs } from '../../views/admin/ui'
import { Icon } from '../../views/shared/Icon'
import { adminPage, notFound, redirect, type AdminContext } from './_shared'

const PAGE_SIZE = 50
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024

function inbox(c: AdminContext) {
  return new InboxService(c.get('db'), c.get('settings'), c.env.files)
}

async function clientNames(c: AdminContext): Promise<Map<string, string>> {
  const rows = await c.get('db').select({ id: clients.id, name: clients.name }).from(clients)
  return new Map(rows.map((row) => [row.id, row.name]))
}

export async function list(c: AdminContext) {
  const db = c.get('db')
  const view = c.req.query('vue') ?? 'recus'
  const q = (c.req.query('q') ?? '').trim()
  const clientId = c.req.query('client')
  const page = Math.max(1, Number.parseInt(c.req.query('page') ?? '1', 10) || 1)

  const filters: SQL[] = []
  if (view === 'envoyes') filters.push(eq(mails.direction, 'out'))
  else if (view === 'non-lus') filters.push(eq(mails.direction, 'in'), eq(mails.seen, false))
  else if (view === 'clients') filters.push(eq(mails.direction, 'in'), sql`${mails.clientId} is not null`)
  else if (view !== 'tous') filters.push(eq(mails.direction, 'in'))
  if (clientId) filters.push(eq(mails.clientId, clientId))
  if (q) {
    filters.push(or(contains(mails.subject, q), contains(mails.fromAddress, q), contains(mails.fromName, q), contains(mails.toAddresses, q), contains(mails.snippet, q))!)
  }

  const [rows, names, sync] = await Promise.all([
    db
      .select()
      .from(mails)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(mails.date))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    clientNames(c),
    c.get('settings').many(['imap.enabled', 'imap.last_sync', 'imap.last_error']),
  ])
  const more = rows.length > PAGE_SIZE
  const link = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries({ vue: view, q: q || undefined, client: clientId, ...params })) {
      if (value !== undefined && value !== '') search.set(key, String(value))
    }
    return `/admin/mails?${search}`
  }

  return adminPage(
    c,
    { title: 'Mails', active: 'mails' },
    <>
      <PageHead
        title="Mails"
        intro={
          sync['imap.enabled'] === 'true'
            ? `Boîte relue toutes les 5 minutes${sync['imap.last_sync'] ? `, dernière fois le ${formatDateTime(new Date(sync['imap.last_sync']))}` : ''}.`
            : 'La lecture de la boîte n’est pas activée (Réglages → Messagerie).'
        }
      >
        {sync['imap.enabled'] === 'true' ? (
          <PostButton action="/admin/mails/synchroniser" icon="refresh">
            Relever
          </PostButton>
        ) : null}
        <ButtonLink href={`/admin/mails/nouveau${clientId ? `?client=${clientId}` : ''}`} icon="edit" variant="primary">
          Écrire
        </ButtonLink>
      </PageHead>
      {sync['imap.last_error'] ? (
        <p class="flash flash-err">
          <Icon name="warning" size={18} /> Dernière relève en erreur : {sync['imap.last_error']}
        </p>
      ) : null}
      {clientId && names.get(clientId) ? (
        <p class="flash flash-info">
          Mails de {names.get(clientId)} ·{' '}
          <a class="link" href="/admin/mails">
            tout afficher
          </a>
        </p>
      ) : null}
      <div class="toolbar-row">
        <Tabs
          current={view}
          items={[
            { key: 'recus', label: 'Reçus', href: link({ vue: 'recus', page: undefined }) },
            { key: 'non-lus', label: 'Non lus', href: link({ vue: 'non-lus', page: undefined }) },
            { key: 'clients', label: 'De clients', href: link({ vue: 'clients', page: undefined }) },
            { key: 'envoyes', label: 'Envoyés', href: link({ vue: 'envoyes', page: undefined }) },
            { key: 'tous', label: 'Tous', href: link({ vue: 'tous', page: undefined }) },
          ]}
        />
        <form class="search" method="get">
          <input type="hidden" name="vue" value={view} />
          {clientId ? <input type="hidden" name="client" value={clientId} /> : null}
          <input class="input input-sm" type="search" name="q" value={q} placeholder="Objet, expéditeur…" aria-label="Rechercher" />
          <button class="btn btn-sm" type="submit">
            <Icon name="search" size={16} />
          </button>
        </form>
      </div>
      <form method="post" action="/admin/mails/supprimer" data-confirm="Supprimer les mails cochés ? Ils partent aussi de ta boîte (dans sa corbeille).">
        <input type="hidden" name="back" value={link({ page: page > 1 ? page : undefined })} />
        <Card
          flush
          title={
            <label class="check small">
              <input type="checkbox" data-check-all="ids" aria-label="Tout cocher" />
              <span>Tout cocher</span>
            </label>
          }
          actions={
            <button type="submit" class="btn btn-sm btn-danger">
              <Icon name="delete" size={16} />
              Supprimer la sélection
            </button>
          }
        >
          <MailsTable rows={rows.slice(0, PAGE_SIZE)} clientNames={names} selectable />
        </Card>
      </form>
      {page > 1 || more ? (
        <div class="actions pager">
          {page > 1 ? (
            <ButtonLink href={link({ page: page - 1 })} icon="arrow_back" size="sm">
              Plus récents
            </ButtonLink>
          ) : null}
          {more ? (
            <ButtonLink href={link({ page: page + 1 })} size="sm">
              Plus anciens
            </ButtonLink>
          ) : null}
        </div>
      ) : null}
    </>,
  )
}

export async function sync(c: AdminContext) {
  const result = await inbox(c).sync({ force: true })
  if (!result.ok) return redirect(c, '/admin/mails', { type: 'err', message: result.error })
  return redirect(c, '/admin/mails', {
    type: 'ok',
    message: result.added ? `${result.added} nouveau${result.added > 1 ? 'x' : ''} message${result.added > 1 ? 's' : ''}.` : 'Rien de nouveau.',
  })
}

async function loadMail(c: AdminContext): Promise<Mail | null> {
  const [mail] = await c.get('db').select().from(mails).where(eq(mails.id, c.req.param('id')!)).limit(1)
  return mail ?? null
}

export async function show(c: AdminContext) {
  const mail = await loadMail(c)
  if (!mail) return notFound(c, 'Ce mail')
  if (!mail.seen && mail.direction === 'in') {
    // Lu dans l'admin, lu sur le serveur : sans attendre la réponse IMAP.
    c.executionCtx.waitUntil(inbox(c).setSeen(mail, true))
    mail.seen = true
  }
  const db = c.get('db')
  const [client, clientOptions, thread] = await Promise.all([
    mail.clientId ? new ClientService(db).get(mail.clientId) : Promise.resolve(null),
    mail.clientId ? Promise.resolve([]) : new ClientService(db).options(),
    mail.messageId || mail.inReplyTo
      ? db
          .select()
          .from(mails)
          .where(
            and(
              sql`${mails.id} != ${mail.id}`,
              or(
                mail.messageId ? eq(mails.inReplyTo, mail.messageId) : undefined,
                mail.inReplyTo ? eq(mails.messageId, mail.inReplyTo) : undefined,
                mail.messageId ? sql`instr(${mails.references}, ${mail.messageId}) > 0` : undefined,
              ),
            ),
          )
          .orderBy(desc(mails.date))
          .limit(10)
      : Promise.resolve([] as Mail[]),
  ])
  const attachments = parseJson<MailAttachmentMeta[]>(mail.attachments) ?? []
  const to = addresses(mail.toAddresses)
  const cc = addresses(mail.ccAddresses)
  const showHtml = mail.hasHtml && c.req.query('texte') !== '1' && Boolean(mail.rawKey)
  const counterpart = mail.direction === 'in' ? mail.fromAddress : to[0]?.address

  return adminPage(
    c,
    { title: mail.subject || '(sans objet)', active: 'mails' },
    <>
      <PageHead title={mail.subject || '(sans objet)'} back={{ href: mail.direction === 'out' ? '/admin/mails?vue=envoyes' : '/admin/mails', label: 'Mails' }}>
        {mail.direction === 'in' ? (
          <ButtonLink href={`/admin/mails/nouveau?reponse=${mail.id}`} icon="reply" variant="primary">
            Répondre
          </ButtonLink>
        ) : null}
        <ButtonLink href={`/admin/mails/nouveau?transfert=${mail.id}`} icon="forward_to_inbox">
          Transférer
        </ButtonLink>
        {mail.direction === 'in' ? (
          <PostButton action={`/admin/mails/${mail.id}/non-lu`} icon="mark_email_read">
            Non lu
          </PostButton>
        ) : null}
        <PostButton action={`/admin/mails/${mail.id}/supprimer`} icon="delete" variant="danger" confirm={mail.mailbox ? 'Supprimer ce mail ? Il part aussi de ta boîte (dans sa corbeille).' : 'Supprimer ce mail de l’admin ?'}>
          Supprimer
        </PostButton>
      </PageHead>
      <div class="grid grid-side">
        <Card flush>
          <div class="card-body">
            <div class="mail-meta">
              <p>
                <b>De</b> {mail.fromName ? `${mail.fromName} <${mail.fromAddress}>` : mail.fromAddress}
              </p>
              <p>
                <b>À</b> {to.map(formatAddress).join(', ') || '—'}
              </p>
              {cc.length ? (
                <p>
                  <b>Copie</b> {cc.map(formatAddress).join(', ')}
                </p>
              ) : null}
              <p>
                <b>Date</b> {formatDateTime(mail.date)}
              </p>
            </div>
            {mail.status === 'failed' ? <p class="flash flash-err">Envoi échoué : {mail.error}</p> : null}
            {mail.partial ? <p class="flash flash-warn">Message trop volumineux : seuls les en-têtes ont été copiés. Ouvre-le dans ton webmail.</p> : null}
            {attachments.length ? (
              <div class="attachments">
                {attachments.map((file, index) => (
                  <a href={`/admin/mails/${mail.id}/pieces/${index}`} target="_blank" rel="noopener">
                    <Icon name="attach_file" size={16} />
                    {file.filename} <span class="muted small">{Math.max(1, Math.round(file.size / 1024))} Ko</span>
                  </a>
                ))}
              </div>
            ) : null}
            {mail.hasHtml && mail.rawKey ? (
              <p class="small">
                {showHtml ? (
                  <a class="link" href={`/admin/mails/${mail.id}?texte=1`}>
                    Voir en texte
                  </a>
                ) : (
                  <a class="link" href={`/admin/mails/${mail.id}`}>
                    Voir la mise en page
                  </a>
                )}
                <span class="muted"> · les images distantes sont bloquées</span>
              </p>
            ) : null}
          </div>
          {showHtml ? (
            <iframe class="mail-frame" src={`/admin/mails/${mail.id}/html`} sandbox="allow-popups allow-popups-to-escape-sandbox" title="Contenu du mail" />
          ) : (
            <div class="card-body">
              <div class="mail-text">{mail.textBody || '(vide)'}</div>
            </div>
          )}
        </Card>
        <div class="stack">
          <Card title="Client" icon="person">
            {client ? (
              <>
                <p>
                  <a class="link" href={`/admin/clients/${client.id}`}>
                    {client.name}
                  </a>
                </p>
                <div class="actions">
                  <ButtonLink href={`/admin/devis/nouveau?client=${client.id}`} icon="request_quote" size="sm">
                    Devis
                  </ButtonLink>
                  <ButtonLink href={`/admin/factures/nouvelle?client=${client.id}`} icon="receipt_long" size="sm">
                    Facture
                  </ButtonLink>
                </div>
              </>
            ) : (
              <>
                <p class="muted">{counterpart ? `${counterpart} n'est rattaché à aucun client.` : 'Aucun client.'}</p>
                {clientOptions.length ? (
                  <form method="post" action={`/admin/mails/${mail.id}/client`} class="form">
                    <Select label="Rattacher à" name="clientId" options={[{ value: '', label: 'Choisir…' }, ...clientOptions.map((option) => ({ value: option.id, label: option.name }))]} />
                    <button type="submit" class="btn btn-sm">
                      <Icon name="link" size={16} />
                      Rattacher
                    </button>
                  </form>
                ) : null}
                {counterpart ? (
                  <PostButton action={`/admin/mails/${mail.id}/client`} fields={{ create: 'true' }} icon="add" size="sm">
                    Créer le client
                  </PostButton>
                ) : null}
              </>
            )}
          </Card>
          {thread.length ? (
            <Card title="Dans la conversation" icon="history" flush>
              <MailsTable rows={thread} compact />
            </Card>
          ) : null}
          {mail.rawKey ? (
            <p class="small">
              <a class="link" href={`/admin/mails/${mail.id}/brut`}>
                Télécharger le message (.eml)
              </a>
              {mail.mailbox ? <span class="muted"> · dossier {mail.mailbox}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </>,
  )
}

/**
 * Le HTML d'un mail reçu, affiché dans une iframe `sandbox` sans scripts ni
 * accès à l'admin. La CSP coupe aussi tout chargement distant (pixels de
 * suivi, polices) : seules les images embarquées s'affichent.
 */
export async function html(c: AdminContext) {
  const mail = await loadMail(c)
  if (!mail) return c.text('Introuvable', 404)
  const parsed = await inbox(c).parsed(mail)
  let body = parsed?.html ?? ''
  // Images jointes référencées par cid: → data: (seul format autorisé par la CSP).
  for (const file of parsed?.attachments ?? []) {
    if (!file.contentId || typeof file.content === 'string') continue
    const cid = file.contentId.replace(/^<|>$/g, '')
    if (!body.includes(`cid:${cid}`) || !file.mimeType.startsWith('image/') || file.content.byteLength > 2_000_000) continue
    const bytes = new Uint8Array(file.content instanceof ArrayBuffer ? file.content : file.content.buffer)
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    body = body.split(`cid:${cid}`).join(`data:${file.mimeType};base64,${btoa(binary)}`)
  }
  // La CSP et le sandbox bloquent déjà les scripts ; on les retire quand même du HTML servi.
  body = body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;font-size:14px;color:#1B1712;background:#FFFFFF;overflow-wrap:anywhere}img{max-width:100%;height:auto}</style></head><body>${body}</body></html>`
  return c.html(page, 200, {
    'Content-Security-Policy': "default-src 'none'; img-src data:; style-src 'unsafe-inline'; font-src data:; sandbox allow-popups allow-popups-to-escape-sandbox; frame-ancestors 'self'",
  })
}

export async function attachment(c: AdminContext) {
  const mail = await loadMail(c)
  if (!mail) return c.text('Introuvable', 404)
  const index = Number(c.req.param('index'))
  const parsed = await inbox(c).parsed(mail)
  if (!parsed) return c.text('Message brut indisponible', 404)
  const files = parsed.attachments.filter((file) => !(file.related || (file.disposition === 'inline' && file.contentId && file.mimeType.startsWith('image/'))))
  const file = files[index]
  if (!file) return c.text('Pièce jointe introuvable', 404)
  const content = typeof file.content === 'string' ? new TextEncoder().encode(file.content) : file.content
  const name = (file.filename || 'piece-jointe').replace(/["\\\r\n]/g, '')
  // Ce qui pourrait s'exécuter dans le navigateur (HTML, SVG) est téléchargé, jamais affiché.
  const safeInline = /^(application\/pdf|image\/(png|jpe?g|gif|webp)|text\/plain)$/.test(file.mimeType)
  return new Response(content, {
    headers: {
      'Content-Type': safeInline ? file.mimeType : 'application/octet-stream',
      'Content-Disposition': `${safeInline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  })
}

export async function raw(c: AdminContext) {
  const mail = await loadMail(c)
  if (!mail?.rawKey) return c.text('Introuvable', 404)
  const object = await c.env.files.get(mail.rawKey)
  if (!object) return c.text('Introuvable', 404)
  return new Response(object.body, {
    headers: {
      'Content-Type': 'message/rfc822',
      'Content-Disposition': `attachment; filename="mail-${mail.id.slice(0, 8)}.eml"`,
      'Cache-Control': 'private, no-store',
    },
  })
}

function removedMessage(removed: number, trashed: boolean): string {
  const what = removed > 1 ? `${removed} mails supprimés` : 'Mail supprimé'
  return trashed ? `${what} : ${removed > 1 ? 'ils sont' : 'il est'} dans la corbeille de ta boîte.` : `${what}.`
}

export async function remove(c: AdminContext) {
  const mail = await loadMail(c)
  if (!mail) return notFound(c, 'Ce mail')
  const result = await inbox(c).remove([mail])
  if (!result.ok) return redirect(c, `/admin/mails/${mail.id}`, { type: 'err', message: result.error })
  return redirect(c, mail.direction === 'out' ? '/admin/mails?vue=envoyes' : '/admin/mails', { type: 'ok', message: removedMessage(result.removed, result.trashed) })
}

/** Suppression de la sélection cochée dans la liste. */
export async function removeMany(c: AdminContext) {
  const form = (await c.req.parseBody({ all: true })) as FormBody
  const ids = formList(form, 'ids').filter(Boolean).slice(0, 200)
  const back = safeNext(str(form, 'back', 500), '/admin/mails')
  if (!ids.length) return redirect(c, back, { type: 'info', message: 'Coche les mails à supprimer.' })
  const rows = await c.get('db').select().from(mails).where(inArray(mails.id, ids))
  const result = await inbox(c).remove(rows)
  if (!result.ok) return redirect(c, back, { type: 'err', message: result.error })
  return redirect(c, back, { type: 'ok', message: removedMessage(result.removed, result.trashed) })
}

export async function markUnread(c: AdminContext) {
  const mail = await loadMail(c)
  if (!mail) return notFound(c, 'Ce mail')
  await inbox(c).setSeen(mail, false)
  return redirect(c, '/admin/mails', { type: 'ok', message: 'Marqué non lu.' })
}

export async function linkClient(c: AdminContext) {
  const mail = await loadMail(c)
  if (!mail) return notFound(c, 'Ce mail')
  const form = (await c.req.parseBody()) as FormBody
  const service = new ClientService(c.get('db'))
  const address = mail.direction === 'in' ? mail.fromAddress : addresses(mail.toAddresses)[0]?.address

  if (str(form, 'create') === 'true' && address) {
    const name = mail.direction === 'in' && mail.fromName ? mail.fromName : address
    const id = await service.create({ kind: 'company', name, contactName: mail.fromName ?? null, email: address.toLowerCase(), country: 'France' })
    return redirect(c, `/admin/clients/${id}/modifier`, { type: 'ok', message: 'Client créé à partir du mail : complète sa fiche.' })
  }
  const clientId = str(form, 'clientId')
  const client = clientId ? await service.get(clientId) : null
  if (!client) return redirect(c, `/admin/mails/${mail.id}`, { type: 'err', message: 'Choisis un client.' })
  await c.get('db').update(mails).set({ clientId: client.id }).where(eq(mails.id, mail.id))
  // Les autres mails de la même adresse suivent.
  if (address) {
    await c
      .get('db')
      .update(mails)
      .set({ clientId: client.id })
      .where(and(isNull(mails.clientId), eq(sql`lower(${mails.fromAddress})`, address.toLowerCase())))
  }
  return redirect(c, `/admin/mails/${mail.id}`, { type: 'ok', message: `Rattaché à ${client.name}.` })
}

type ComposeValues = { to: string; cc: string; subject: string; body: string; inReplyTo: string; references: string; clientId: string }

function quote(mail: Mail): string {
  const who = mail.fromName ? `${mail.fromName} <${mail.fromAddress}>` : mail.fromAddress
  const quoted = (mail.textBody ?? '')
    .split('\n')
    .slice(0, 200)
    .map((line) => `> ${line}`)
    .join('\n')
  return `\n\nLe ${formatDateTime(mail.date)}, ${who} a écrit :\n${quoted}`
}

function ComposePage({ values, error, forwarded }: { values: ComposeValues; error?: string; forwarded?: Mail | null }) {
  return (
    <form method="post" action="/admin/mails" class="form" enctype="multipart/form-data">
      <input type="hidden" name="inReplyTo" value={values.inReplyTo} />
      <input type="hidden" name="references" value={values.references} />
      <input type="hidden" name="clientId" value={values.clientId} />
      {forwarded ? <input type="hidden" name="forward" value={forwarded.id} /> : null}
      <Card title="Mail" icon="send">
        <div class="fields">
          <label class="field">
            <span>À</span>
            <input class="input" name="to" value={values.to} required />
          </label>
          <label class="field">
            <span>Copie</span>
            <input class="input" name="cc" value={values.cc} />
          </label>
          <label class="field full">
            <span>Objet</span>
            <input class="input" name="subject" value={values.subject} required />
          </label>
          <label class="field full">
            <span>Message</span>
            <textarea class="textarea tall" name="body" required autofocus>
              {values.body}
            </textarea>
            <small>La signature des réglages est ajoutée en bas.</small>
          </label>
          <label class="field full">
            <span>Pièces jointes</span>
            <input class="input" type="file" name="files" multiple />
            <small>
              15 Mo au total.
              {forwarded && (parseJson<MailAttachmentMeta[]>(forwarded.attachments) ?? []).length ? ' Les pièces jointes du mail transféré sont reprises.' : ''}
            </small>
          </label>
        </div>
      </Card>
      {error ? <p class="flash flash-err">{error}</p> : null}
      <div class="form-foot">
        <button type="submit" class="btn btn-primary">
          <Icon name="send" size={18} />
          Envoyer
        </button>
      </div>
    </form>
  )
}

export async function composeForm(c: AdminContext) {
  const db = c.get('db')
  const values: ComposeValues = { to: '', cc: '', subject: '', body: '', inReplyTo: '', references: '', clientId: '' }
  let forwarded: Mail | null = null
  const replyId = c.req.query('reponse')
  const forwardId = c.req.query('transfert')
  const clientId = c.req.query('client')

  if (replyId) {
    const [mail] = await db.select().from(mails).where(eq(mails.id, replyId)).limit(1)
    if (mail) {
      values.to = mail.fromAddress ?? ''
      values.subject = /^(re|tr|fwd?)\s*:/i.test(mail.subject ?? '') ? (mail.subject ?? '') : `Re : ${mail.subject ?? ''}`
      values.body = quote(mail)
      values.inReplyTo = mail.messageId ?? ''
      values.references = [mail.references, mail.messageId].filter(Boolean).join(' ')
      values.clientId = mail.clientId ?? ''
    }
  } else if (forwardId) {
    const [mail] = await db.select().from(mails).where(eq(mails.id, forwardId)).limit(1)
    if (mail) {
      forwarded = mail
      values.subject = `Tr : ${mail.subject ?? ''}`
      values.body = `\n\n---------- Message transféré ----------\nDe : ${mail.fromName ? `${mail.fromName} <${mail.fromAddress}>` : mail.fromAddress}\nDate : ${formatDateTime(mail.date)}\nObjet : ${mail.subject ?? ''}\n\n${mail.textBody ?? ''}`
    }
  } else if (clientId) {
    const client = await new ClientService(db).get(clientId)
    if (client) {
      values.to = client.email ?? ''
      values.cc = client.ccEmails ?? ''
      values.clientId = client.id
      values.body = `Bonjour ${client.contactName || ''},\n\n`.replace(' ,', ',')
    }
  }

  return adminPage(
    c,
    { title: 'Écrire', active: 'mails', narrow: true },
    <>
      <PageHead title={replyId ? 'Répondre' : forwardId ? 'Transférer' : 'Écrire'} back={{ href: '/admin/mails', label: 'Mails' }} />
      <ComposePage values={values} forwarded={forwarded} />
    </>,
  )
}

export async function send(c: AdminContext) {
  const form = (await c.req.parseBody({ all: true })) as FormBody
  const values: ComposeValues = {
    to: str(form, 'to', 1000),
    cc: str(form, 'cc', 1000),
    subject: str(form, 'subject', 300),
    body: text(form, 'body', 100_000),
    inReplyTo: str(form, 'inReplyTo', 1000),
    references: str(form, 'references', 4000),
    clientId: str(form, 'clientId'),
  }
  const fail = (error: string) =>
    adminPage(
      c,
      { title: 'Écrire', active: 'mails', narrow: true, status: 422 },
      <>
        <PageHead title="Écrire" back={{ href: '/admin/mails', label: 'Mails' }} />
        <ComposePage values={values} error={error} />
      </>,
    )

  const to = emailList(values.to)
  if (!to.length) return fail('Indique au moins un destinataire valide.')
  if (!values.subject || !values.body) return fail("L'objet et le message sont obligatoires.")

  const attachments: OutgoingAttachment[] = []
  let total = 0
  const uploads = form.files
  for (const file of (Array.isArray(uploads) ? uploads : uploads ? [uploads] : []).filter((item): item is File => typeof item !== 'string' && item.size > 0)) {
    total += file.size
    if (total > MAX_UPLOAD_BYTES) return fail('Pièces jointes trop lourdes (15 Mo au total).')
    attachments.push({ filename: file.name, content: new Uint8Array(await file.arrayBuffer()), mimeType: file.type || 'application/octet-stream' })
  }
  const forwardId = str(form, 'forward')
  if (forwardId) {
    const [original] = await c.get('db').select().from(mails).where(eq(mails.id, forwardId)).limit(1)
    const parsed = original ? await inbox(c).parsed(original) : null
    for (const file of parsed?.attachments ?? []) {
      if (file.related) continue
      const content = typeof file.content === 'string' ? new TextEncoder().encode(file.content) : new Uint8Array(file.content instanceof ArrayBuffer ? file.content : file.content.buffer)
      total += content.byteLength
      if (total > MAX_UPLOAD_BYTES) return fail('Pièces jointes du mail transféré trop lourdes (15 Mo au total).')
      attachments.push({ filename: file.filename || 'piece-jointe', content, mimeType: file.mimeType })
    }
  }

  // Le client : celui du mail auquel on répond, sinon celui du premier destinataire.
  const client = values.clientId ? await new ClientService(c.get('db')).get(values.clientId) : await new ClientService(c.get('db')).findByEmail(to[0])
  const result = await new MailService(c.get('db'), c.get('settings'), c.env.files).send(
    {
      to,
      cc: emailList(values.cc),
      subject: values.subject,
      text: values.body,
      attachments,
      inReplyTo: values.inReplyTo || null,
      references: values.references || null,
      clientId: client?.id ?? null,
    },
    c.executionCtx.waitUntil.bind(c.executionCtx),
  )
  if (!result.ok) return fail(result.error)
  return redirect(c, `/admin/mails/${result.id}`, { type: 'ok', message: `Envoyé à ${to.join(', ')}.` })
}
