import { inArray } from 'drizzle-orm'
import type { Child } from 'hono/jsx'
import { documents, sequences, type DocumentType } from '../../db/schema'
import { TYPE_LABEL } from '../../lib/billing/labels'
import { formatDateTime, parseVatRate, todayIso } from '../../lib/billing/money'
import { formatNumber, isValidPattern, numberParts } from '../../lib/billing/numbering'
import { parseSiren } from '../../lib/billing/identity'
import { bool, isEmail, str, text, type FormBody } from '../../lib/http/form'
import { qrToDataUri } from '../../lib/security/qr'
import { generateTotpSecret, totpUri, verifyTotp } from '../../lib/security/totp'
import { InboxService } from '../../services/inbox.service'
import { MailService } from '../../services/mail.service'
import { settingBool, settingInt, type SettingKey, type SettingsMap } from '../../services/settings.service'
import type { MailboxInfo } from '../../lib/imap'
import { Card, Check, Field, PageHead, PostButton, Select, Tabs, TextArea } from '../../views/admin/ui'
import { Icon } from '../../views/shared/Icon'
import { adminPage, redirect, type AdminContext } from './_shared'

const SECTIONS = [
  { key: 'emetteur', label: 'Émetteur' },
  { key: 'facturation', label: 'Facturation' },
  { key: 'modeles', label: 'Modèles de mails' },
  { key: 'messagerie', label: 'Messagerie' },
  { key: 'securite', label: 'Sécurité' },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

const SERIES: DocumentType[] = ['invoice', 'quote', 'credit_note']

const SECURITY_OPTIONS = [
  { value: 'tls', label: 'SSL/TLS (465, 993)' },
  { value: 'starttls', label: 'STARTTLS (587, 143)' },
  { value: 'none', label: 'Aucune (déconseillé)' },
]

function Page({ section, children }: { section: SectionKey; children: Child }) {
  return (
    <>
      <PageHead title="Réglages" />
      <Tabs current={section} items={SECTIONS.map((item) => ({ key: item.key, label: item.label, href: `/admin/reglages/${item.key}` }))} />
      {children}
    </>
  )
}

function Save({ label = 'Enregistrer' }: { label?: string }) {
  return (
    <div class="form-foot">
      <button type="submit" class="btn btn-primary">
        <Icon name="check" size={18} />
        {label}
      </button>
    </div>
  )
}

function IssuerSection({ s }: { s: SettingsMap }) {
  return (
    <form method="post" action="/admin/reglages/emetteur" class="form">
      <Card title="Qui émet les devis et factures" icon="badge">
        <div class="fields">
          <Field label="Nom et prénom (ou raison sociale)" name="issuer.legal_name" value={s['issuer.legal_name']} required />
          <Field label="Forme juridique" name="issuer.legal_form" value={s['issuer.legal_form']} hint="« EI » est obligatoire après le nom d'un entrepreneur individuel." />
          <Field label="Nom commercial" name="issuer.trade_name" value={s['issuer.trade_name']} hint="Mis en avant en haut des documents." />
          <Field label="SIREN ou SIRET" name="issuer.siren" value={s['issuer.siren']} required />
          <TextArea label="Adresse" name="issuer.address" value={s['issuer.address']} rows={2} />
          <Field label="Code postal" name="issuer.postal_code" value={s['issuer.postal_code']} />
          <Field label="Ville" name="issuer.city" value={s['issuer.city']} />
          <Field label="Pays" name="issuer.country" value={s['issuer.country']} />
          <Field label="N° de TVA intracommunautaire" name="issuer.vat_number" value={s['issuer.vat_number']} hint="Seulement si tu es assujetti à la TVA." />
          <Field label="Immatriculation" name="issuer.registration" value={s['issuer.registration']} placeholder="RCS Lille Métropole, ou Dispensé d'immatriculation…" />
          <Field label="Mail affiché" name="issuer.email" value={s['issuer.email']} type="email" />
          <Field label="Téléphone affiché" name="issuer.phone" value={s['issuer.phone']} />
          <Field label="Site" name="issuer.website" value={s['issuer.website']} placeholder="luuxis.fr" />
        </div>
      </Card>
      <p class="small muted">Les documents déjà émis gardent les mentions du jour de leur émission.</p>
      <Save />
    </form>
  )
}

function BillingSection({ s, counters }: { s: SettingsMap; counters: { type: DocumentType; key: string; value: number; next: string }[] }) {
  return (
    <form method="post" action="/admin/reglages/facturation" class="form">
      <Card title="TVA et délais" icon="payments">
        <div class="fields fields-3">
          <Field label="TVA par défaut (%)" name="billing.vat_rate" value={s['billing.vat_rate']} placeholder="Vide : non applicable" hint="Vide : franchise en base (art. 293 B du CGI)." />
          <Field label="Délai de paiement (jours)" name="billing.payment_days" value={s['billing.payment_days']} type="number" min="0" />
          <Field label="Validité des devis (jours)" name="billing.quote_validity_days" value={s['billing.quote_validity_days']} type="number" min="1" />
          <Field label="Unité par défaut" name="billing.default_unit" value={s['billing.default_unit']} />
        </div>
      </Card>
      <Card title="Coordonnées bancaires" icon="payments">
        <div class="fields fields-3">
          <Field label="IBAN" name="billing.iban" value={s['billing.iban']} />
          <Field label="BIC" name="billing.bic" value={s['billing.bic']} />
          <Field label="Banque" name="billing.bank" value={s['billing.bank']} />
        </div>
      </Card>
      <Card title="Mentions" icon="description">
        <TextArea
          label="Modalités de règlement (factures)"
          name="billing.payment_terms"
          value={s['billing.payment_terms']}
          hint="Variables : {delai} (jours), {echeance}, {numero}."
        />
        <TextArea label="Pénalités de retard (factures)" name="billing.late_penalties" value={s['billing.late_penalties']} />
        <TextArea label="Acceptation (devis)" name="billing.quote_acceptance" value={s['billing.quote_acceptance']} hint="Variable : {validite}." />
        <TextArea label="Mention en pied de page" name="billing.extra_mention" value={s['billing.extra_mention']} rows={2} />
      </Card>
      <Card title="Numérotation" icon="receipt_long">
        <div class="fields fields-3">
          <Field label="Factures" name="numbering.invoice" value={s['numbering.invoice']} />
          <Field label="Devis" name="numbering.quote" value={s['numbering.quote']} />
          <Field label="Avoirs" name="numbering.credit_note" value={s['numbering.credit_note']} />
        </div>
        <p class="small muted">
          {'{YYYY}'} année, {'{YY}'} année sur deux chiffres, {'{MM}'} mois, {'{NNN}'} compteur sur trois chiffres. Le compteur repart à 1 chaque année, ou chaque mois si le modèle contient {'{MM}'}.
        </p>
        <div class="fields fields-3">
          {counters.map((counter) => (
            <Field
              label={`Dernier n° utilisé : ${TYPE_LABEL[counter.type].toLowerCase()}s`}
              name={`seq.${counter.type}`}
              value={String(counter.value)}
              type="number"
              min="0"
              hint={`Prochain : ${counter.next}`}
            />
          ))}
        </div>
        <p class="small muted">Si tu as déjà émis des documents ailleurs cette année (Word…), indique ici le dernier numéro pour continuer la suite sans trou.</p>
      </Card>
      <Card title="Relances" icon="notifications_active">
        <Check
          label="Relancer automatiquement les factures en retard"
          name="reminders.auto"
          checked={settingBool(s['reminders.auto'])}
          hint="Chaque matin à 9 h, avec le modèle « Relance » et la facture en pièce jointe."
        />
        <div class="fields fields-3">
          <Field label="Après l'échéance (jours)" name="reminders.after_days" value={s['reminders.after_days']} type="number" min="0" />
          <Field label="Puis tous les (jours)" name="reminders.every_days" value={s['reminders.every_days']} type="number" min="1" />
          <Field label="Relances au plus" name="reminders.max" value={s['reminders.max']} type="number" min="1" />
        </div>
      </Card>
      <Save />
    </form>
  )
}

const TEMPLATES = [
  { key: 'quote', label: 'Envoi d’un devis' },
  { key: 'invoice', label: 'Envoi d’une facture' },
  { key: 'reminder', label: 'Relance d’une facture' },
  { key: 'credit_note', label: 'Envoi d’un avoir' },
] as const

function TemplatesSection({ s }: { s: SettingsMap }) {
  return (
    <form method="post" action="/admin/reglages/modeles" class="form">
      <p class="flash flash-info">
        Variables : {'{contact}'}, {'{client}'}, {'{numero}'}, {'{objet}'}, {'{montant}'}, {'{echeance}'}, {'{validite}'}, {'{facture}'} (pour un avoir). Tu peux toujours retoucher le mail avant l'envoi.
      </p>
      {TEMPLATES.map((template) => (
        <Card title={template.label} icon="mail">
          <Field label="Objet" name={`mail.${template.key}.subject`} value={s[`mail.${template.key}.subject` as SettingKey]} full />
          <TextArea label="Message" name={`mail.${template.key}.body`} value={s[`mail.${template.key}.body` as SettingKey]} rows={8} />
        </Card>
      ))}
      <Card title="Signature" icon="edit">
        <TextArea
          label="Ajoutée sous chaque mail"
          name="mail.signature"
          value={s['mail.signature']}
          rows={4}
          hint="Vide : ton nom, ton nom commercial et ton site, d'après l'émetteur."
        />
      </Card>
      <Save />
    </form>
  )
}

function MailSection({ s, smtpPassword, imapPassword, folders, foldersError }: { s: SettingsMap; smtpPassword: boolean; imapPassword: boolean; folders?: MailboxInfo[]; foldersError?: string }) {
  const sentOptions = folders?.map((box) => ({ value: box.path, label: `${box.path}${box.specialUse ? ` (${box.specialUse.slice(1)})` : ''}` }))
  return (
    <>
      <p class="flash flash-info">
        Fournisseurs courants : OVH ssl0.ovh.net · Infomaniak mail.infomaniak.com · Zoho smtp.zoho.eu / imap.zoho.eu · Gmail smtp.gmail.com / imap.gmail.com (avec un mot de passe d'application). Outlook et
        Proton ne permettent pas cette connexion.
      </p>
      <form method="post" action="/admin/reglages/messagerie" class="form">
        <Card title="Envoi (SMTP)" icon="outgoing_mail">
          <div class="fields">
            <Field label="Serveur" name="smtp.host" value={s['smtp.host']} placeholder="ssl0.ovh.net" />
            <div class="fields">
              <Field label="Port" name="smtp.port" value={s['smtp.port']} type="number" />
              <Select label="Sécurité" name="smtp.security" value={s['smtp.security']} options={SECURITY_OPTIONS} />
            </div>
            <Field label="Identifiant" name="smtp.user" value={s['smtp.user']} autocomplete="off" />
            <Field
              label="Mot de passe"
              name="smtp.password"
              type="password"
              autocomplete="new-password"
              placeholder={smtpPassword ? '•••••••• (enregistré)' : ''}
              hint="Vide : inchangé. Chiffré en base."
            />
            <Field label="Adresse d'envoi" name="smtp.from_email" value={s['smtp.from_email']} type="email" placeholder="contact@luuxis.fr" />
            <Field label="Nom d'envoi" name="smtp.from_name" value={s['smtp.from_name']} placeholder="André Gallo" />
          </div>
        </Card>
        <Card title="Réception (IMAP)" icon="inbox">
          <Check label="Relever la boîte toutes les 5 minutes" name="imap.enabled" checked={settingBool(s['imap.enabled'])} />
          <div class="fields">
            <Field label="Serveur" name="imap.host" value={s['imap.host']} placeholder="ssl0.ovh.net" />
            <div class="fields">
              <Field label="Port" name="imap.port" value={s['imap.port']} type="number" />
              <Select label="Sécurité" name="imap.security" value={s['imap.security']} options={SECURITY_OPTIONS} />
            </div>
            <Field label="Identifiant" name="imap.user" value={s['imap.user']} autocomplete="off" />
            <Field
              label="Mot de passe"
              name="imap.password"
              type="password"
              autocomplete="new-password"
              placeholder={imapPassword ? '•••••••• (enregistré)' : ''}
              hint="Vide : inchangé. Souvent le même que pour le SMTP."
            />
            <Field label="Dossier de réception" name="imap.inbox" value={s['imap.inbox']} />
            {sentOptions?.length ? (
              <Select
                label="Dossier des envoyés"
                name="imap.sent"
                value={s['imap.sent'] || folders?.find((box) => box.specialUse === '\\Sent')?.path || ''}
                options={[{ value: '', label: 'Aucun (pas de copie)' }, ...sentOptions]}
                hint="Les mails envoyés depuis l'admin y sont copiés, et il est relu comme la réception."
              />
            ) : (
              <Field label="Dossier des envoyés" name="imap.sent" value={s['imap.sent']} placeholder="Sent" hint="« Tester » liste les dossiers de la boîte." />
            )}
            {folders?.length ? (
              <Select
                label="Corbeille"
                name="imap.trash"
                value={s['imap.trash'] || folders.find((box) => box.specialUse === '\\Trash')?.path || ''}
                options={[{ value: '', label: 'Aucune (suppression définitive)' }, ...(sentOptions ?? [])]}
                hint="Où vont les mails supprimés depuis l'admin."
              />
            ) : (
              <Field label="Corbeille" name="imap.trash" value={s['imap.trash']} placeholder="Trash" hint="Vide : celle annoncée par le serveur, sinon suppression définitive." />
            )}
            <Field label="Au premier passage, reprendre (jours)" name="imap.initial_days" value={s['imap.initial_days']} type="number" min="1" />
          </div>
          {foldersError ? <p class="flash flash-err">Connexion IMAP impossible : {foldersError}</p> : null}
          {folders ? <p class="flash flash-ok">Connexion réussie : {folders.length} dossiers.</p> : null}
          {s['imap.last_sync'] ? (
            <p class="small muted">
              Dernière relève le {formatDateTime(new Date(s['imap.last_sync']))}
              {s['imap.last_error'] ? ` · erreur : ${s['imap.last_error']}` : ' · sans erreur'}
            </p>
          ) : null}
        </Card>
        <div class="form-foot">
          <button type="submit" class="btn" name="intent" value="test-smtp">
            <Icon name="send" size={18} />
            Enregistrer et m'envoyer un test
          </button>
          <button type="submit" class="btn" name="intent" value="test-imap">
            <Icon name="inbox" size={18} />
            Enregistrer et tester l'IMAP
          </button>
          <button type="submit" class="btn btn-primary" name="intent" value="save">
            <Icon name="check" size={18} />
            Enregistrer
          </button>
        </div>
      </form>
    </>
  )
}

function SecuritySection({ s, pending, email }: { s: SettingsMap; pending?: { secret: string; uri: string }; email: string }) {
  const enabled = settingBool(s['auth.totp_enabled'])
  return (
    <div class="stack">
      <Card title="Double authentification" icon="lock">
        {enabled ? (
          <>
            <p>
              <span class="badge b-ok">Activée</span> Un code de l'application est demandé à chaque connexion.
            </p>
            <form method="post" action="/admin/reglages/securite/totp/desactiver" class="form" data-confirm="Désactiver la double authentification ?">
              <Field label="Code actuel pour désactiver" name="code" inputmode="numeric" autocomplete="one-time-code" required />
              <button type="submit" class="btn btn-danger btn-sm">
                Désactiver
              </button>
            </form>
          </>
        ) : pending ? (
          <form method="post" action="/admin/reglages/securite/totp/confirmer" class="form">
            <p>Scanne ce code avec ton application (Google Authenticator, 1Password, Aegis…), puis saisis le code qu'elle affiche.</p>
            <img class="qr" src={qrToDataUri(pending.uri, { border: 2 })} alt="QR code de la double authentification" width="196" height="196" />
            <p class="small">
              Ou saisis la clé à la main : <span class="mono">{pending.secret.replace(/(.{4})/g, '$1 ').trim()}</span>
            </p>
            <Field label="Code à 6 chiffres" name="code" inputmode="numeric" autocomplete="one-time-code" required />
            <button type="submit" class="btn btn-primary btn-sm">
              Activer
            </button>
          </form>
        ) : (
          <>
            <p class="muted">Recommandé : l'admin donne accès à tes clients, tes factures et ta boîte mail.</p>
            <PostButton action="/admin/reglages/securite/totp" icon="lock" variant="primary" size="sm">
              Configurer
            </PostButton>
          </>
        )}
      </Card>
      <Card title="Sessions" icon="key">
        <p>
          Connecté en tant que <b>{email}</b>. Le mot de passe se change avec <span class="mono">npm run admin:secrets</span> puis{' '}
          <span class="mono">wrangler secret put ADMIN_PASSWORD_HASH</span>.
        </p>
        <PostButton action="/admin/reglages/securite/sessions" icon="logout" size="sm" confirm="Fermer toutes les sessions, celle-ci comprise ?">
          Déconnecter tous les appareils
        </PostButton>
      </Card>
    </div>
  )
}

async function counters(c: AdminContext, s: SettingsMap) {
  const today = todayIso()
  const db = c.get('db')
  const parts = SERIES.map((type) => ({ type, parts: numberParts(type, s[`numbering.${type}`], today) }))
  const rows = await db
    .select()
    .from(sequences)
    .where(inArray(sequences.key, parts.map((item) => item.parts.key)))
  const values = new Map(rows.map((row) => [row.key, row.value]))
  return parts.map(({ type, parts: p }) => {
    const value = values.get(p.key) ?? 0
    return { type, key: p.key, value, next: formatNumber(p, value + 1) }
  })
}

export async function show(
  c: AdminContext,
  extra: { section?: SectionKey; folders?: MailboxInfo[]; foldersError?: string; pending?: { secret: string; uri: string } } = {},
) {
  const requested = extra.section ?? (c.req.param('section') as SectionKey | undefined)
  const section: SectionKey = SECTIONS.some((item) => item.key === requested) ? requested! : 'emetteur'
  const settings = c.get('settings')
  const s = await settings.all()
  let body: Child
  if (section === 'emetteur') body = <IssuerSection s={s} />
  else if (section === 'facturation') body = <BillingSection s={s} counters={await counters(c, s)} />
  else if (section === 'modeles') body = <TemplatesSection s={s} />
  else if (section === 'messagerie') body = <MailSection s={s} smtpPassword={Boolean(s['smtp.password'])} imapPassword={Boolean(s['imap.password'])} folders={extra.folders} foldersError={extra.foldersError} />
  else {
    let pending = extra.pending
    if (!pending && s['auth.totp_pending'] && !settingBool(s['auth.totp_enabled'])) {
      const secret = await settings.reveal('auth.totp_pending', s)
      if (secret) pending = { secret, uri: totpUri(secret, c.env.ADMIN_EMAIL) }
    }
    body = <SecuritySection s={s} pending={pending} email={c.env.ADMIN_EMAIL} />
  }
  return adminPage(c, { title: 'Réglages', active: 'settings', narrow: true }, <Page section={section}>{body}</Page>)
}

function values(form: FormBody, keys: SettingKey[], multiline: SettingKey[] = []): Partial<Record<SettingKey, string>> {
  return Object.fromEntries(keys.map((key) => [key, multiline.includes(key) ? text(form, key, 5000) : str(form, key, 1000)]))
}

export async function saveIssuer(c: AdminContext) {
  const form = (await c.req.parseBody()) as FormBody
  const keys: SettingKey[] = [
    'issuer.legal_name',
    'issuer.legal_form',
    'issuer.trade_name',
    'issuer.address',
    'issuer.postal_code',
    'issuer.city',
    'issuer.country',
    'issuer.siren',
    'issuer.vat_number',
    'issuer.registration',
    'issuer.email',
    'issuer.phone',
    'issuer.website',
  ]
  const next = values(form, keys, ['issuer.address'])
  const siren = parseSiren(next['issuer.siren'] ?? '')
  if (!siren.ok) return redirect(c, '/admin/reglages/emetteur', { type: 'err', message: 'Le SIREN compte 9 chiffres (14 pour un SIRET).' })
  next['issuer.siren'] = siren.value ?? ''
  if (next['issuer.email'] && !isEmail(next['issuer.email'])) return redirect(c, '/admin/reglages/emetteur', { type: 'err', message: 'Mail invalide.' })
  await c.get('settings').set(next)
  return redirect(c, '/admin/reglages/emetteur', { type: 'ok', message: 'Émetteur enregistré.' })
}

export async function saveBilling(c: AdminContext) {
  const form = (await c.req.parseBody()) as FormBody
  const back = '/admin/reglages/facturation'
  const next = values(
    form,
    [
      'billing.vat_rate',
      'billing.payment_days',
      'billing.quote_validity_days',
      'billing.default_unit',
      'billing.iban',
      'billing.bic',
      'billing.bank',
      'billing.payment_terms',
      'billing.late_penalties',
      'billing.quote_acceptance',
      'billing.extra_mention',
      'numbering.invoice',
      'numbering.quote',
      'numbering.credit_note',
      'reminders.after_days',
      'reminders.every_days',
      'reminders.max',
    ],
    ['billing.payment_terms', 'billing.late_penalties', 'billing.quote_acceptance', 'billing.extra_mention'],
  )
  next['reminders.auto'] = String(bool(form, 'reminders.auto'))
  const vat = parseVatRate(next['billing.vat_rate'])
  if (vat === undefined) return redirect(c, back, { type: 'err', message: 'Taux de TVA illisible.' })
  next['billing.vat_rate'] = vat === null ? '' : String(vat)
  for (const key of ['billing.payment_days', 'billing.quote_validity_days', 'reminders.after_days', 'reminders.every_days', 'reminders.max'] as const) {
    next[key] = String(Math.max(0, Math.min(365, settingInt(next[key] ?? '', 0))))
  }
  next['billing.iban'] = (next['billing.iban'] ?? '').replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim()
  for (const type of SERIES) {
    const pattern = next[`numbering.${type}`] ?? ''
    if (!isValidPattern(pattern)) return redirect(c, back, { type: 'err', message: `Modèle de numérotation invalide pour les ${TYPE_LABEL[type].toLowerCase()}s : il faut un seul {NNN}.` })
  }

  const settings = c.get('settings')
  await settings.set(next)

  // Dernier numéro utilisé : jamais en dessous d'un numéro déjà attribué.
  const s = await settings.all()
  const db = c.get('db')
  for (const counter of await counters(c, s)) {
    const raw = str(form, `seq.${counter.type}`)
    if (raw === '') continue
    const wanted = Math.max(0, Math.min(99_999, Number.parseInt(raw, 10) || 0))
    if (wanted === counter.value) continue
    if (wanted < counter.value) {
      const parts = numberParts(counter.type, s[`numbering.${counter.type}`], todayIso())
      const taken = Array.from({ length: Math.min(500, counter.value - wanted) }, (_, i) => formatNumber(parts, wanted + 1 + i))
      const [used] = await db.select({ number: documents.number }).from(documents).where(inArray(documents.number, taken)).limit(1)
      if (used) return redirect(c, back, { type: 'err', message: `Impossible de revenir en arrière : ${used.number} est déjà attribué.` })
    }
    await db.insert(sequences).values({ key: counter.key, value: wanted }).onConflictDoUpdate({ target: sequences.key, set: { value: wanted } })
  }
  return redirect(c, back, { type: 'ok', message: 'Facturation enregistrée.' })
}

export async function saveTemplates(c: AdminContext) {
  const form = (await c.req.parseBody()) as FormBody
  const keys = TEMPLATES.flatMap((template) => [`mail.${template.key}.subject`, `mail.${template.key}.body`] as SettingKey[])
  const next = values(form, [...keys, 'mail.signature'], [...keys.filter((key) => key.endsWith('.body')), 'mail.signature'])
  for (const key of keys) if (!next[key]) next[key] = null as never
  await c.get('settings').set(next)
  return redirect(c, '/admin/reglages/modeles', { type: 'ok', message: 'Modèles enregistrés (un champ vidé reprend le texte d’origine).' })
}

export async function saveMail(c: AdminContext) {
  const form = (await c.req.parseBody()) as FormBody
  const settings = c.get('settings')
  const next = values(form, [
    'smtp.host',
    'smtp.port',
    'smtp.security',
    'smtp.user',
    'smtp.from_email',
    'smtp.from_name',
    'imap.host',
    'imap.port',
    'imap.security',
    'imap.user',
    'imap.inbox',
    'imap.sent',
    'imap.trash',
    'imap.initial_days',
  ])
  for (const key of ['smtp.security', 'imap.security'] as const) {
    if (!['tls', 'starttls', 'none'].includes(next[key] ?? '')) next[key] = 'tls'
  }
  next['imap.enabled'] = String(bool(form, 'imap.enabled'))
  const smtpPassword = str(form, 'smtp.password', 500)
  const imapPassword = str(form, 'imap.password', 500)
  if (smtpPassword) next['smtp.password'] = smtpPassword
  if (imapPassword) next['imap.password'] = imapPassword
  if (next['smtp.from_email'] && !isEmail(next['smtp.from_email'])) return redirect(c, '/admin/reglages/messagerie', { type: 'err', message: "Adresse d'envoi invalide." })

  // Un dossier qui change repart de zéro au prochain passage.
  const before = await settings.many(['imap.host', 'imap.user', 'imap.inbox', 'imap.sent'])
  if (before['imap.host'] !== next['imap.host'] || before['imap.user'] !== next['imap.user']) {
    const states = await settings.getPrefixed('imap.state.')
    await settings.setRaw(Object.fromEntries(Object.keys(states).map((key) => [key, null])))
  }
  await settings.set(next)

  const intent = str(form, 'intent')
  if (intent === 'test-smtp') {
    const s = await settings.all()
    const to = s['issuer.email'] || s['smtp.from_email'] || c.env.ADMIN_EMAIL
    const result = await new MailService(c.get('db'), settings, c.env.files).test(to)
    return redirect(c, '/admin/reglages/messagerie', result.ok ? { type: 'ok', message: `Mail de test envoyé à ${to}.` } : { type: 'err', message: result.error })
  }
  if (intent === 'test-imap') {
    const folders = await new InboxService(c.get('db'), settings, c.env.files).folders()
    if ('error' in folders) return show(c, { section: 'messagerie', foldersError: folders.error })
    return show(c, { section: 'messagerie', folders })
  }
  return redirect(c, '/admin/reglages/messagerie', { type: 'ok', message: 'Messagerie enregistrée.' })
}

export async function totpStart(c: AdminContext) {
  const settings = c.get('settings')
  if (settingBool(await settings.get('auth.totp_enabled'))) return redirect(c, '/admin/reglages/securite')
  const secret = generateTotpSecret()
  await settings.set({ 'auth.totp_pending': secret })
  return redirect(c, '/admin/reglages/securite')
}

export async function totpConfirm(c: AdminContext) {
  const settings = c.get('settings')
  const form = (await c.req.parseBody()) as FormBody
  const secret = await settings.reveal('auth.totp_pending')
  if (!secret) return redirect(c, '/admin/reglages/securite', { type: 'err', message: 'Recommence la configuration.' })
  const counter = await verifyTotp(secret, str(form, 'code', 20))
  if (counter === null) return redirect(c, '/admin/reglages/securite', { type: 'err', message: 'Code incorrect : vérifie l’heure du téléphone et réessaie.' })
  await settings.set({ 'auth.totp_secret': secret, 'auth.totp_enabled': 'true', 'auth.totp_pending': null, 'auth.totp_last_counter': String(counter) })
  return redirect(c, '/admin/reglages/securite', { type: 'ok', message: 'Double authentification activée.' })
}

export async function totpDisable(c: AdminContext) {
  const settings = c.get('settings')
  const form = (await c.req.parseBody()) as FormBody
  const secret = await settings.reveal('auth.totp_secret')
  const counter = secret ? await verifyTotp(secret, str(form, 'code', 20), settingInt(await settings.get('auth.totp_last_counter'), -1)) : null
  if (counter === null) return redirect(c, '/admin/reglages/securite', { type: 'err', message: 'Code incorrect.' })
  await settings.set({ 'auth.totp_enabled': 'false', 'auth.totp_secret': null, 'auth.totp_last_counter': String(counter) })
  return redirect(c, '/admin/reglages/securite', { type: 'ok', message: 'Double authentification désactivée.' })
}

export async function revokeSessions(c: AdminContext) {
  const settings = c.get('settings')
  const version = settingInt(await settings.get('auth.session_version'), 1)
  await settings.set({ 'auth.session_version': String(version + 1) })
  return redirect(c, '/admin/connexion', { type: 'info', message: 'Toutes les sessions sont fermées.' })
}

