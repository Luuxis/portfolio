import { and, desc, eq, gt, inArray, isNotNull, sql } from 'drizzle-orm'
import PostalMime, { type Address, type Email as ParsedEmail } from 'postal-mime'
import type { Db } from '../db'
import { clients, mails, type Mail, type MailAddress, type MailAttachmentMeta } from '../db/schema'
import { parseJson } from '../lib/billing/identity'
import { connectImap, formatInternalDate, type FetchedMessage, type ImapClient, type MailboxInfo } from '../lib/imap'
import { loadImap, type ImapSetup } from './mail-config'
import type { SettingsService } from './settings.service'

/** Au-delà, seuls les en-têtes sont copiés. */
const MAX_MESSAGE_BYTES = 8 * 1024 * 1024
/** Par passage et par dossier : la suite arrive au passage suivant (toutes les 5 minutes). */
const MAX_PER_RUN = 60
const BATCH = 15
/** Premier passage sur un dossier : les plus récents seulement. */
const INITIAL_MAX = 200
const TEXT_LIMIT = 100_000
const LOCK_MS = 4 * 60 * 1000

type FolderState = { uidValidity: number; lastUid: number }

export type RemoveReport = { ok: true; removed: number; trashed: boolean } | { ok: false; error: string }

export type SyncReport = { ok: true; added: number; folders: string[] } | { ok: false; error: string }

function flatten(list: Address[] | Address | undefined): MailAddress[] {
  const items = Array.isArray(list) ? list : list ? [list] : []
  return items.flatMap((item) =>
    item.group ? item.group.map((member) => ({ name: member.name || null, address: member.address })) : [{ name: item.name || null, address: item.address }],
  )
}

function htmlToText(html: string): string {
  return html
    .replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h\d|li)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

function snippet(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('>'))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
}

function mailboxKey(path: string): string {
  return `imap.state.${path}`
}

/**
 * Copie des boîtes IMAP vers l'admin. Chaque passage reprend après le dernier
 * UID vu ; si le serveur change d'UIDVALIDITY (dossier recréé), le dossier
 * repart de zéro. Les messages sont lus avec BODY.PEEK : les copier ne les
 * marque pas comme lus.
 */
export class InboxService {
  constructor(
    private readonly db: Db,
    private readonly settings: SettingsService,
    private readonly files: R2Bucket,
  ) {}

  async setup(): Promise<ImapSetup | null> {
    return loadImap(this.settings)
  }

  async sync(options: { force?: boolean } = {}): Promise<SyncReport> {
    const setup = await this.setup()
    if (!setup) return { ok: false, error: 'La lecture des mails n’est pas configurée (Réglages → Messagerie).' }

    const lock = await this.settings.getPrefixed('imap.lock')
    const lockedAt = Number(lock['imap.lock'] ?? 0)
    if (!options.force && Date.now() - lockedAt < LOCK_MS) return { ok: true, added: 0, folders: [] }
    await this.settings.setRaw({ 'imap.lock': String(Date.now()) })

    let client: ImapClient | null = null
    try {
      client = await connectImap(setup.config)
      const folders = [
        { path: setup.inbox, direction: 'in' as const },
        ...(setup.sent && setup.sent !== setup.inbox ? [{ path: setup.sent, direction: 'out' as const }] : []),
      ]
      let added = 0
      for (const folder of folders) added += await this.syncFolder(client, folder.path, folder.direction, setup.initialDays)
      await this.settings.set({ 'imap.last_sync': new Date().toISOString(), 'imap.last_error': '' })
      return { ok: true, added, folders: folders.map((folder) => folder.path) }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.settings.set({ 'imap.last_sync': new Date().toISOString(), 'imap.last_error': message.slice(0, 500) })
      return { ok: false, error: `Synchronisation IMAP impossible : ${message}` }
    } finally {
      await client?.logout()
      await this.settings.setRaw({ 'imap.lock': null })
    }
  }

  /** Les dossiers de la boîte, pour choisir celui des messages envoyés. */
  async folders(): Promise<MailboxInfo[] | { error: string }> {
    const setup = await this.setup()
    if (!setup) return { error: 'Active et renseigne d’abord la boîte IMAP.' }
    let client: ImapClient | null = null
    try {
      client = await connectImap(setup.config)
      return (await client.list()).filter((box) => box.selectable)
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) }
    } finally {
      await client?.logout()
    }
  }

  private async syncFolder(client: ImapClient, path: string, direction: 'in' | 'out', initialDays: number): Promise<number> {
    const selected = await client.select(path, { readOnly: true })
    const stored = (await this.settings.getPrefixed(mailboxKey(path)))[mailboxKey(path)]
    let state: FolderState | null = null
    try {
      state = stored ? (JSON.parse(stored) as FolderState) : null
    } catch {
      state = null
    }

    let uids: number[]
    if (!state || state.uidValidity !== selected.uidValidity) {
      if (selected.exists === 0) {
        uids = []
      } else {
        const since = new Date(Date.now() - initialDays * 86_400_000)
        uids = (await client.searchUids(`SINCE ${formatInternalDate(since).split(' ')[0]}`)).sort((a, b) => a - b).slice(-INITIAL_MAX)
      }
      state = { uidValidity: selected.uidValidity, lastUid: uids.length ? uids[0] - 1 : Math.max(0, (selected.uidNext ?? 1) - 1) }
    } else {
      // `UID n:*` renvoie toujours le dernier message, même déjà vu : on filtre.
      const lastUid = state.lastUid
      uids = selected.exists === 0 ? [] : (await client.searchUids(`UID ${lastUid + 1}:*`)).filter((uid) => uid > lastUid).sort((a, b) => a - b)
    }

    const todo = uids.slice(0, MAX_PER_RUN)
    let added = 0
    if (todo.length) {
      const known = await this.clientEmails()
      for (let i = 0; i < todo.length; i += BATCH) {
        const batch = todo.slice(i, i + BATCH)
        const fetched = await client.fetch(batch, { maxBytes: MAX_MESSAGE_BYTES })
        added += await this.store(fetched, path, selected.uidValidity, direction, known)
        state.lastUid = Math.max(state.lastUid, ...batch)
        await this.settings.setRaw({ [mailboxKey(path)]: JSON.stringify(state) })
      }
    } else {
      await this.settings.setRaw({ [mailboxKey(path)]: JSON.stringify(state) })
    }

    await this.syncFlags(client, path, selected.uidValidity)
    return added
  }

  /**
   * Les messages récents suivent ce qui a été fait ailleurs (webmail,
   * téléphone) : l'état « lu », et la suppression.
   */
  private async syncFlags(client: ImapClient, path: string, uidValidity: number) {
    const recent = await this.db
      .select({ id: mails.id, uid: mails.uid, seen: mails.seen, rawKey: mails.rawKey })
      .from(mails)
      .where(and(eq(mails.mailbox, path), eq(mails.uidValidity, uidValidity), isNotNull(mails.uid), gt(mails.date, new Date(Date.now() - 21 * 86_400_000))))
      .orderBy(desc(mails.date))
      .limit(300)
    if (!recent.length) return
    const flags = await client.fetchFlags(recent.map((row) => row.uid!))
    const seenByUid = new Map(flags.map((item) => [item.uid, item.flags.includes('\\Seen')]))
    const nowSeen = recent.filter((row) => seenByUid.get(row.uid!) === true && !row.seen).map((row) => row.id)
    const nowUnseen = recent.filter((row) => seenByUid.get(row.uid!) === false && row.seen).map((row) => row.id)
    if (nowSeen.length) await this.db.update(mails).set({ seen: true }).where(inArray(mails.id, nowSeen))
    if (nowUnseen.length) await this.db.update(mails).set({ seen: false }).where(inArray(mails.id, nowUnseen))
    // Absents de la réponse : supprimés du dossier depuis la dernière relève.
    const gone = recent.filter((row) => !seenByUid.has(row.uid!))
    if (gone.length) await this.forget(gone)
  }

  private async clientEmails(): Promise<Map<string, string>> {
    const rows = await this.db.select({ id: clients.id, email: clients.email, cc: clients.ccEmails }).from(clients)
    const map = new Map<string, string>()
    for (const row of rows) {
      for (const email of [row.email, ...(row.cc ?? '').split(',')]) {
        const key = email?.trim().toLowerCase()
        if (key && !map.has(key)) map.set(key, row.id)
      }
    }
    return map
  }

  private async store(
    fetched: FetchedMessage[],
    path: string,
    uidValidity: number,
    direction: 'in' | 'out',
    known: Map<string, string>,
  ): Promise<number> {
    const parsed: { message: FetchedMessage; email: ParsedEmail }[] = []
    for (const message of fetched) {
      const source = message.raw ?? message.headers
      if (!source) continue
      try {
        parsed.push({ message, email: await PostalMime.parse(source) })
      } catch (error) {
        console.error(`message ${path}/${message.uid} illisible :`, error)
      }
    }
    if (!parsed.length) return 0

    // Un mail envoyé depuis l'admin est déjà là : on lui ajoute sa place dans le dossier.
    const messageIds = parsed.map((item) => item.email.messageId).filter((id): id is string => Boolean(id))
    const existing = messageIds.length
      ? await this.db
          .select({ id: mails.id, messageId: mails.messageId, uid: mails.uid })
          .from(mails)
          .where(and(inArray(mails.messageId, messageIds), eq(mails.direction, direction)))
      : []
    const existingByMessageId = new Map(existing.map((row) => [row.messageId, row]))

    const statements = []
    let added = 0
    for (const { message, email } of parsed) {
      const already = email.messageId ? existingByMessageId.get(email.messageId) : undefined
      if (already) {
        if (already.uid == null) {
          statements.push(this.db.update(mails).set({ mailbox: path, uidValidity, uid: message.uid }).where(eq(mails.id, already.id)))
        }
        continue
      }

      const id = crypto.randomUUID()
      let rawKey: string | null = null
      if (message.raw) {
        rawKey = `mails/imap/${uidValidity}/${encodeURIComponent(path)}/${message.uid}.eml`
        await this.files.put(rawKey, message.raw, { httpMetadata: { contentType: 'message/rfc822' } })
      }

      const from = flatten(email.from)[0]
      const to = flatten(email.to)
      const cc = flatten(email.cc)
      const replyTo = flatten(email.replyTo)
      const text = (email.text?.trim() || (email.html ? htmlToText(email.html) : '')).slice(0, TEXT_LIMIT)
      const attachments: MailAttachmentMeta[] = email.attachments
        .filter((file) => !(file.related || (file.disposition === 'inline' && file.contentId && file.mimeType.startsWith('image/'))))
        .map((file) => ({
          filename: file.filename || 'piece-jointe',
          mimeType: file.mimeType,
          size: typeof file.content === 'string' ? file.content.length : file.content.byteLength,
        }))
      // Reçu : l'expéditeur, ou l'adresse où il veut qu'on lui réponde.
      const counterparts = direction === 'in' ? [from?.address, ...replyTo.map((item) => item.address)] : [to[0]?.address]
      const clientId = counterparts.map((address) => (address ? known.get(address.toLowerCase()) : undefined)).find(Boolean) ?? null
      const date = email.date && !Number.isNaN(Date.parse(email.date)) ? new Date(email.date) : (message.internalDate ?? new Date())

      statements.push(
        this.db
          .insert(mails)
          .values({
            id,
            direction,
            mailbox: path,
            uidValidity,
            uid: message.uid,
            messageId: email.messageId ?? null,
            inReplyTo: email.inReplyTo ?? null,
            references: email.references ?? null,
            fromAddress: from?.address ?? null,
            fromName: from?.name ?? null,
            toAddresses: JSON.stringify(to),
            ccAddresses: JSON.stringify(cc),
            replyTo: JSON.stringify(replyTo),
            subject: email.subject ?? null,
            snippet: snippet(text),
            textBody: text,
            hasHtml: Boolean(email.html),
            attachments: JSON.stringify(attachments),
            rawKey,
            size: message.size,
            partial: !message.raw,
            date,
            seen: direction === 'out' || message.flags.includes('\\Seen'),
            clientId,
            status: direction === 'in' ? 'received' : 'sent',
            createdAt: new Date(),
          })
          .onConflictDoNothing(),
      )
      added += 1
    }
    if (statements.length) {
      const [first, ...rest] = statements
      await this.db.batch([first, ...rest])
    }
    return added
  }

  /** Le message relu depuis R2 (HTML, pièces jointes). */
  async parsed(mail: Mail): Promise<ParsedEmail | null> {
    if (!mail.rawKey) return null
    const object = await this.files.get(mail.rawKey)
    if (!object) return null
    return PostalMime.parse(await object.arrayBuffer())
  }

  /**
   * L'en-tête Reply-To d'un mail. Ceux copiés avant qu'on le garde en base
   * (colonne vide) sont relus depuis R2, une fois, puis complétés.
   */
  async replyTo(mail: Mail): Promise<MailAddress[]> {
    if (mail.replyTo != null) return parseJson<MailAddress[]>(mail.replyTo) ?? []
    if (!mail.rawKey) return []
    const parsed = await this.parsed(mail).catch(() => null)
    if (!parsed) return []
    const replyTo = flatten(parsed.replyTo)
    await this.db.update(mails).set({ replyTo: JSON.stringify(replyTo) }).where(eq(mails.id, mail.id))
    return replyTo
  }

  /**
   * Supprime des mails dans l'admin et sur le serveur : ils partent dans la
   * corbeille de la boîte (réglage, sinon celle que le serveur annonce), ou
   * sont effacés s'il n'y en a pas ou s'ils y sont déjà. Si le serveur refuse,
   * rien n'est effacé dans l'admin, pour ne pas perdre la trace d'un mail
   * resté dans la boîte.
   */
  async remove(list: Mail[]): Promise<RemoveReport> {
    if (!list.length) return { ok: true, removed: 0, trashed: false }
    const onServer = list.filter((mail) => mail.mailbox != null && mail.uid != null && mail.uidValidity != null)
    let trashed = false

    if (onServer.length) {
      const setup = await this.setup()
      if (!setup) return { ok: false, error: 'La boîte IMAP n’est plus configurée : impossible de supprimer ces mails sur le serveur.' }
      let client: ImapClient | null = null
      try {
        client = await connectImap(setup.config)
        const trash = setup.trash ?? (await this.detectTrash(client))
        const byMailbox = new Map<string, Mail[]>()
        for (const mail of onServer) byMailbox.set(mail.mailbox!, [...(byMailbox.get(mail.mailbox!) ?? []), mail])
        for (const [path, group] of byMailbox) {
          const selected = await client.select(path)
          // Dossier recréé depuis la copie : ces UID désignent d'autres messages, on n'y touche pas.
          const uids = group.filter((mail) => mail.uidValidity === selected.uidValidity).map((mail) => mail.uid!)
          if (!uids.length) continue
          if (trash && trash !== path) {
            await client.move(uids, trash)
            trashed = true
          } else {
            await client.delete(uids)
          }
        }
      } catch (error) {
        return { ok: false, error: `Le serveur IMAP a refusé la suppression : ${error instanceof Error ? error.message : String(error)}` }
      } finally {
        await client?.logout()
      }
    }

    await this.forget(list)
    return { ok: true, removed: list.length, trashed }
  }

  /** Efface des mails de l'admin seulement (base et message brut dans R2). */
  private async forget(list: Pick<Mail, 'id' | 'rawKey'>[]): Promise<void> {
    if (!list.length) return
    const keys = list.map((mail) => mail.rawKey).filter((key): key is string => Boolean(key))
    if (keys.length) {
      try {
        await this.files.delete(keys)
      } catch (error) {
        console.error('messages bruts non effacés de R2 :', error)
      }
    }
    for (let i = 0; i < list.length; i += 50) {
      await this.db.delete(mails).where(inArray(mails.id, list.slice(i, i + 50).map((mail) => mail.id)))
    }
  }

  /** La corbeille annoncée par le serveur (ou devinée d'après son nom), gardée dans les réglages. */
  private async detectTrash(client: ImapClient): Promise<string | null> {
    const trash = (await client.list()).find((box) => box.specialUse === '\\Trash' && box.selectable)?.path ?? null
    if (trash) await this.settings.set({ 'imap.trash': trash })
    return trash
  }

  /** Marque lu (ou non lu) dans l'admin et sur le serveur. */
  async setSeen(mail: Mail, seen: boolean): Promise<void> {
    await this.db.update(mails).set({ seen }).where(eq(mails.id, mail.id))
    if (mail.mailbox == null || mail.uid == null) return
    const setup = await this.setup()
    if (!setup) return
    let client: ImapClient | null = null
    try {
      client = await connectImap(setup.config)
      const selected = await client.select(mail.mailbox)
      if (selected.uidValidity !== mail.uidValidity) return
      if (seen) await client.addFlags([mail.uid], ['\\Seen'])
      else await client.removeFlags([mail.uid], ['\\Seen'])
    } catch (error) {
      console.error('drapeau \\Seen non mis à jour sur le serveur :', error)
    } finally {
      await client?.logout()
    }
  }

  async unreadCount(): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(mails)
      .where(and(eq(mails.direction, 'in'), eq(mails.seen, false)))
    return row?.n ?? 0
  }
}
