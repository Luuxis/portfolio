import { desc, eq } from 'drizzle-orm'
import { mails, type Client } from '../../db/schema'
import { formatSiren, parseSiren } from '../../lib/billing/identity'
import { formatEuros } from '../../lib/billing/money'
import { emailList, isEmail, nullable, str, text, type FormBody } from '../../lib/http/form'
import { ClientService, type ClientInput } from '../../services/client.service'
import { DocumentService } from '../../services/document.service'
import { DocumentsTable, MailsTable } from '../../views/admin/pages/shared'
import { ButtonLink, Card, Empty, Field, PageHead, PostButton, Select, Tabs, TextArea } from '../../views/admin/ui'
import { Icon } from '../../views/shared/Icon'
import { adminPage, notFound, redirect, type AdminContext } from './_shared'

function service(c: AdminContext) {
  return new ClientService(c.get('db'))
}

export async function list(c: AdminContext) {
  const q = (c.req.query('q') ?? '').trim()
  const archived = c.req.query('archives') === '1'
  const rows = await service(c).list({ q, archived })
  return adminPage(
    c,
    { title: 'Clients', active: 'clients' },
    <>
      <PageHead title="Clients" intro="Les coordonnées reprises sur les devis et les factures.">
        <ButtonLink href="/admin/clients/nouveau" icon="add" variant="primary">
          Nouveau client
        </ButtonLink>
      </PageHead>
      <div class="toolbar-row">
        <Tabs
          current={archived ? 'archived' : 'active'}
          items={[
            { key: 'active', href: '/admin/clients', label: 'Actifs' },
            { key: 'archived', href: '/admin/clients?archives=1', label: 'Archivés' },
          ]}
        />
        <form class="search" method="get">
          {archived ? <input type="hidden" name="archives" value="1" /> : null}
          <input class="input input-sm" type="search" name="q" value={q} placeholder="Nom, mail, ville…" aria-label="Rechercher" />
          <button class="btn btn-sm" type="submit">
            <Icon name="search" size={16} />
          </button>
        </form>
      </div>
      <Card flush>
        {rows.length ? (
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Ville</th>
                  <th class="num">À encaisser</th>
                  <th class="num">Encaissé</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((client) => (
                  <tr>
                    <td>
                      <a class="row-link" href={`/admin/clients/${client.id}`}>
                        {client.name}
                      </a>
                      {client.siren ? <div class="small muted">SIREN {formatSiren(client.siren)}</div> : null}
                    </td>
                    <td>
                      {client.contactName ?? ''}
                      {client.email ? <div class="small muted">{client.email}</div> : null}
                    </td>
                    <td>{client.city ?? ''}</td>
                    <td class="num">{client.dueCents ? formatEuros(client.dueCents) : <span class="muted">—</span>}</td>
                    <td class="num">{client.paidCents ? formatEuros(client.paidCents) : <span class="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon="groups"
            title={q ? 'Aucun client ne correspond' : archived ? 'Aucun client archivé' : 'Pas encore de client'}
            action={
              q || archived ? undefined : (
                <ButtonLink href="/admin/clients/nouveau" icon="add" variant="primary">
                  Ajouter un client
                </ButtonLink>
              )
            }
          />
        )}
      </Card>
    </>,
  )
}

function ClientForm({ client, action, error }: { client?: Partial<Client>; action: string; error?: string }) {
  return (
    <form method="post" action={action} class="form">
      <Card title="Identité" icon="badge">
        <div class="fields">
          <Select
            label="Type"
            name="kind"
            value={client?.kind ?? 'company'}
            options={[
              { value: 'company', label: 'Entreprise ou association' },
              { value: 'person', label: 'Particulier' },
            ]}
          />
          <Field label="Nom ou raison sociale" name="name" value={client?.name} required />
          <Field label="Contact" name="contactName" value={client?.contactName} hint="La personne à qui s’adressent les mails." />
          <Field label="Téléphone" name="phone" value={client?.phone} type="tel" />
          <Field label="Mail" name="email" value={client?.email} type="email" hint="Les mails reçus de cette adresse sont rangés chez ce client." />
          <Field label="Mails en copie" name="ccEmails" value={client?.ccEmails} hint="Comptabilité, associé… séparés par des virgules." />
        </div>
      </Card>
      <Card title="Adresse de facturation" icon="location_on">
        <div class="fields">
          <TextArea label="Adresse" name="address" value={client?.address} rows={2} />
          <Field label="Code postal" name="postalCode" value={client?.postalCode} />
          <Field label="Ville" name="city" value={client?.city} />
          <Field label="Pays" name="country" value={client?.country ?? 'France'} />
          <Field label="SIREN ou SIRET" name="siren" value={client?.siren} inputmode="numeric" />
          <Field label="N° de TVA intracommunautaire" name="vatNumber" value={client?.vatNumber} />
          <Field
            label="Délai de paiement (jours)"
            name="paymentTermsDays"
            value={client?.paymentTermsDays ?? ''}
            type="number"
            min="0"
            hint="Vide : le délai des réglages."
          />
        </div>
      </Card>
      <Card title="Notes" icon="edit">
        <TextArea label="Notes internes" name="notes" value={client?.notes} hint="Jamais imprimées sur les documents." />
      </Card>
      {error ? <p class="flash flash-err">{error}</p> : null}
      <div class="form-foot">
        <button type="submit" class="btn btn-primary">
          <Icon name="check" size={18} />
          Enregistrer
        </button>
      </div>
    </form>
  )
}

function readClient(form: FormBody): { ok: true; value: ClientInput } | { ok: false; error: string; draft: Partial<Client> } {
  const days = str(form, 'paymentTermsDays')
  const draft: ClientInput = {
    kind: str(form, 'kind') === 'person' ? 'person' : 'company',
    name: str(form, 'name', 200),
    contactName: nullable(str(form, 'contactName', 200)),
    email: nullable(str(form, 'email', 200).toLowerCase()),
    ccEmails: nullable(emailList(str(form, 'ccEmails', 1000)).join(', ')),
    phone: nullable(str(form, 'phone', 40)),
    address: nullable(text(form, 'address', 500)),
    postalCode: nullable(str(form, 'postalCode', 20)),
    city: nullable(str(form, 'city', 100)),
    country: str(form, 'country', 80) || 'France',
    siren: null,
    vatNumber: nullable(str(form, 'vatNumber', 30).replace(/\s/g, '').toUpperCase()),
    paymentTermsDays: days === '' ? null : Math.max(0, Math.min(365, Number.parseInt(days, 10) || 0)),
    notes: nullable(text(form, 'notes', 10_000)),
  }
  const siren = parseSiren(str(form, 'siren', 30))
  if (!draft.name) return { ok: false, error: 'Le nom est obligatoire.', draft }
  if (draft.email && !isEmail(draft.email)) return { ok: false, error: 'Ce mail n’a pas l’air valide.', draft }
  if (!siren.ok) return { ok: false, error: 'Le SIREN compte 9 chiffres (14 pour un SIRET).', draft: { ...draft, siren: str(form, 'siren') } }
  return { ok: true, value: { ...draft, siren: siren.value } }
}

/** Après la création, revenir au devis ou à la facture en cours (`?ensuite=devis`). */
function createAction(c: AdminContext): string {
  const next = c.req.query('ensuite')
  return next === 'devis' || next === 'facture' ? `/admin/clients?ensuite=${next}` : '/admin/clients'
}

export async function newForm(c: AdminContext) {
  return adminPage(
    c,
    { title: 'Nouveau client', active: 'clients', narrow: true },
    <>
      <PageHead title="Nouveau client" back={{ href: '/admin/clients', label: 'Clients' }} />
      <ClientForm action={createAction(c)} />
    </>,
  )
}

export async function create(c: AdminContext) {
  const parsed = readClient((await c.req.parseBody()) as FormBody)
  if (!parsed.ok) {
    return adminPage(
      c,
      { title: 'Nouveau client', active: 'clients', narrow: true, status: 422 },
      <>
        <PageHead title="Nouveau client" back={{ href: '/admin/clients', label: 'Clients' }} />
        <ClientForm action={createAction(c)} client={parsed.draft} error={parsed.error} />
      </>,
    )
  }
  const id = await service(c).create(parsed.value)
  const next = c.req.query('ensuite')
  if (next === 'devis' || next === 'facture') {
    return redirect(c, `/admin/${next === 'devis' ? 'devis/nouveau' : 'factures/nouvelle'}?client=${id}`, { type: 'ok', message: 'Client ajouté.' })
  }
  return redirect(c, `/admin/clients/${id}`, { type: 'ok', message: 'Client ajouté.' })
}

export async function show(c: AdminContext) {
  const client = await service(c).get(c.req.param('id')!)
  if (!client) return notFound(c, 'Ce client')
  const db = c.get('db')
  const [docs, clientMails] = await Promise.all([
    new DocumentService(db, c.get('settings')).list({ types: ['quote', 'invoice', 'credit_note'], clientId: client.id }),
    db.select().from(mails).where(eq(mails.clientId, client.id)).orderBy(desc(mails.date)).limit(30),
  ])
  const due = docs.filter((doc) => doc.type === 'invoice' && (doc.status === 'issued' || doc.status === 'sent')).reduce((sum, doc) => sum + doc.totalTtcCents, 0)
  const paid = docs.filter((doc) => doc.type === 'invoice' && doc.status === 'paid').reduce((sum, doc) => sum + doc.totalTtcCents, 0)
  const locality = [client.postalCode, client.city].filter(Boolean).join(' ')

  return adminPage(
    c,
    { title: client.name, active: 'clients' },
    <>
      <PageHead
        title={client.name}
        intro={client.archivedAt ? 'Client archivé' : client.contactName ?? undefined}
        back={{ href: '/admin/clients', label: 'Clients' }}
      >
        <ButtonLink href={`/admin/mails/nouveau?client=${client.id}`} icon="send">
          Écrire
        </ButtonLink>
        <ButtonLink href={`/admin/devis/nouveau?client=${client.id}`} icon="request_quote">
          Devis
        </ButtonLink>
        <ButtonLink href={`/admin/factures/nouvelle?client=${client.id}`} icon="receipt_long" variant="primary">
          Facture
        </ButtonLink>
      </PageHead>
      <div class="grid grid-side">
        <div class="stack">
          <Card title="Devis et factures" icon="receipt_long" flush>
            <DocumentsTable rows={docs} showClient={false} emptyText="Rien d'émis pour ce client." />
          </Card>
          <Card
            title="Mails"
            icon="inbox"
            flush
            actions={
              <ButtonLink href={`/admin/mails?client=${client.id}`} size="sm">
                Tout voir
              </ButtonLink>
            }
          >
            <MailsTable rows={clientMails} />
          </Card>
        </div>
        <div class="stack">
          <Card
            title="Fiche"
            icon="badge"
            actions={
              <ButtonLink href={`/admin/clients/${client.id}/modifier`} icon="edit" size="sm">
                Modifier
              </ButtonLink>
            }
          >
            <dl class="kv">
              <dt>À encaisser</dt>
              <dd>{formatEuros(due)}</dd>
              <dt>Encaissé</dt>
              <dd>{formatEuros(paid)}</dd>
              {client.email ? (
                <>
                  <dt>Mail</dt>
                  <dd>
                    <a class="link" href={`/admin/mails/nouveau?client=${client.id}`}>
                      {client.email}
                    </a>
                  </dd>
                </>
              ) : null}
              {client.ccEmails ? (
                <>
                  <dt>En copie</dt>
                  <dd>{client.ccEmails}</dd>
                </>
              ) : null}
              {client.phone ? (
                <>
                  <dt>Téléphone</dt>
                  <dd>{client.phone}</dd>
                </>
              ) : null}
              <dt>Adresse</dt>
              <dd class="mail-text">{[client.address, locality, client.country].filter(Boolean).join('\n') || '—'}</dd>
              {client.siren ? (
                <>
                  <dt>SIREN</dt>
                  <dd>{formatSiren(client.siren)}</dd>
                </>
              ) : null}
              {client.vatNumber ? (
                <>
                  <dt>TVA</dt>
                  <dd>{client.vatNumber}</dd>
                </>
              ) : null}
              {client.paymentTermsDays != null ? (
                <>
                  <dt>Délai</dt>
                  <dd>{client.paymentTermsDays} jours</dd>
                </>
              ) : null}
            </dl>
            {client.notes ? <p class="mail-text muted">{client.notes}</p> : null}
          </Card>
          <div class="actions">
            <PostButton
              action={`/admin/clients/${client.id}/archive`}
              icon={client.archivedAt ? 'unarchive' : 'archive'}
              size="sm"
              fields={{ archived: client.archivedAt ? 'false' : 'true' }}
            >
              {client.archivedAt ? 'Désarchiver' : 'Archiver'}
            </PostButton>
            {docs.length === 0 ? (
              <PostButton action={`/admin/clients/${client.id}/supprimer`} icon="delete" size="sm" variant="danger" confirm="Supprimer ce client ?">
                Supprimer
              </PostButton>
            ) : null}
          </div>
        </div>
      </div>
    </>,
  )
}

export async function editForm(c: AdminContext) {
  const client = await service(c).get(c.req.param('id')!)
  if (!client) return notFound(c, 'Ce client')
  return adminPage(
    c,
    { title: `Modifier ${client.name}`, active: 'clients', narrow: true },
    <>
      <PageHead title={`Modifier ${client.name}`} back={{ href: `/admin/clients/${client.id}`, label: client.name }} />
      <p class="flash flash-info">Les documents déjà émis gardent les coordonnées du jour de leur émission.</p>
      <ClientForm action={`/admin/clients/${client.id}`} client={client} />
    </>,
  )
}

export async function update(c: AdminContext) {
  const id = c.req.param('id')!
  const client = await service(c).get(id)
  if (!client) return notFound(c, 'Ce client')
  const parsed = readClient((await c.req.parseBody()) as FormBody)
  if (!parsed.ok) {
    return adminPage(
      c,
      { title: `Modifier ${client.name}`, active: 'clients', narrow: true, status: 422 },
      <>
        <PageHead title={`Modifier ${client.name}`} back={{ href: `/admin/clients/${id}`, label: client.name }} />
        <ClientForm action={`/admin/clients/${id}`} client={{ ...client, ...parsed.draft }} error={parsed.error} />
      </>,
    )
  }
  await service(c).update(id, parsed.value)
  return redirect(c, `/admin/clients/${id}`, { type: 'ok', message: 'Fiche enregistrée.' })
}

export async function archive(c: AdminContext) {
  const id = c.req.param('id')!
  const form = (await c.req.parseBody()) as FormBody
  const archived = str(form, 'archived') === 'true'
  await service(c).setArchived(id, archived)
  return redirect(c, `/admin/clients/${id}`, { type: 'ok', message: archived ? 'Client archivé.' : 'Client désarchivé.' })
}

export async function remove(c: AdminContext) {
  const id = c.req.param('id')!
  const removed = await service(c).remove(id)
  if (!removed) return redirect(c, `/admin/clients/${id}`, { type: 'err', message: 'Ce client a des documents : archive-le plutôt.' })
  return redirect(c, '/admin/clients', { type: 'ok', message: 'Client supprimé.' })
}
