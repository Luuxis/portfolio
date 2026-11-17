/**
 * Client IMAP minimal (RFC 3501 / 9051) pour les Workers : connexion,
 * dossiers, recherche par UID, lecture des messages bruts, drapeaux et APPEND.
 * Le transport (socket TLS) est injecté : ce fichier n'importe pas
 * `cloudflare:sockets`, il se teste sous Node avec un faux serveur.
 *
 * Les commandes passent une par une (file d'attente interne) : deux appels
 * simultanés ne s'entremêlent jamais sur la connexion.
 */

import {
  Atom,
  formatInternalDate,
  ImapError,
  ImapReader,
  isList,
  parseInternalDate,
  parseResponse,
  valueBytes,
  valueNumber,
  valueText,
  type ImapResponse,
  type ImapValue,
} from './parser'
import { decodeMailboxName, encodeMailboxName } from './utf7'

export type ImapConfig = {
  host: string
  port: number
  /** TLS implicite (993). */
  secure: boolean
  /** Si !secure : STARTTLS (143). */
  startTls?: boolean
  user: string
  password: string
  /** Attente maximale d'une réponse du serveur, sans aucun octet reçu ; défaut 30 000 ms. */
  timeoutMs?: number
}

export type SpecialUse = '\\Sent' | '\\Drafts' | '\\Trash' | '\\Junk' | '\\Archive' | '\\All' | '\\Flagged'

export type MailboxInfo = {
  /** Chemin complet, décodé (UTF-8). */
  path: string
  /** Dernier segment du chemin. */
  name: string
  delimiter: string | null
  flags: string[]
  specialUse: SpecialUse | null
  selectable: boolean
}

export type SelectResult = { exists: number; uidValidity: number; uidNext: number | null }

export type FetchedMessage = {
  uid: number
  flags: string[]
  internalDate: Date | null
  size: number
  /** Message complet si size <= maxBytes. */
  raw: Uint8Array | null
  /** En-têtes seuls si le message dépasse maxBytes. */
  headers: Uint8Array | null
}

export interface Transport {
  readable: ReadableStream<Uint8Array>
  writable: WritableStream<Uint8Array>
  /** Passe la connexion en TLS après STARTTLS ; rend le nouveau transport. */
  startTls?(): Transport
  close(): Promise<void>
}

export type TransportFactory = (config: ImapConfig) => Transport

const encoder = new TextEncoder()

const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024
/** Messages complets par commande FETCH, et volume visé par commande. */
const BODY_BATCH = 50
const BODY_BATCH_BYTES = 16 * 1024 * 1024
/** UID par commande pour ce qui ne ramène que des métadonnées (taille, drapeaux). */
const META_BATCH = 500

const SPECIAL_USES: SpecialUse[] = ['\\Sent', '\\Drafts', '\\Trash', '\\Junk', '\\Archive', '\\All', '\\Flagged']

/** Noms courants des dossiers spéciaux, pour les serveurs qui n'annoncent pas SPECIAL-USE. */
const GUESSED_NAMES: [SpecialUse, string[]][] = [
  ['\\Sent', ['sent', 'sent items', 'sent messages', 'sent mail', 'envoyés', 'envoyes', 'éléments envoyés', 'elements envoyes', 'messages envoyés', 'messages envoyes']],
  ['\\Drafts', ['drafts', 'draft', 'brouillons', 'brouillon']],
  ['\\Trash', ['trash', 'deleted', 'deleted items', 'deleted messages', 'bin', 'corbeille', 'éléments supprimés', 'elements supprimes']],
  ['\\Junk', ['junk', 'spam', 'junk e-mail', 'junk email', 'courrier indésirable', 'indésirables', 'indesirables', 'pourriel']],
  ['\\Archive', ['archive', 'archives']],
]

/** Morceau d'une commande : du texte, ou un littéral envoyé après « {n} ». */
type CommandPart = string | { literal: Uint8Array }

type CommandResult = { untagged: ImapResponse[]; done: ImapResponse }

/** [1, 2, 3, 7] → « 1:3,7 ». Triés et dédoublonnés ; chaîne vide pour une liste vide. */
export function uidSet(uids: number[]): string {
  const sorted = [...new Set(uids.filter((uid) => Number.isInteger(uid) && uid > 0))].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i <= sorted.length; i++) {
    const uid = sorted[i]
    if (uid === prev + 1) {
      prev = uid
      continue
    }
    if (start !== undefined) ranges.push(start === prev ? String(start) : `${start}:${prev}`)
    start = uid
    prev = uid
  }
  return ranges.join(',')
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** Chaîne entre guillemets si possible, sinon littéral (non ASCII, CR, LF, NUL). */
function astring(value: string): CommandPart {
  if (/[^\x01-\x09\x0b\x0c\x0e-\x7f]/.test(value)) return { literal: encoder.encode(value) }
  return `"${value.replace(/[\\"]/g, (char) => `\\${char}`)}"`
}

function mailboxArg(path: string): CommandPart {
  return astring(encodeMailboxName(path))
}

/** Drapeaux d'une commande STORE ou APPEND : atomes seuls, sans espace ni parenthèse. */
function flagList(flags: string[]): string {
  for (const flag of flags) {
    if (!/^\\?[^\s()"{}\\\]%*]+$/.test(flag)) throw new ImapError(`Drapeau IMAP invalide : ${flag}`)
  }
  return `(${flags.join(' ')})`
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function flagsOf(value: ImapValue | undefined): string[] {
  return isList(value) ? value.map(valueText).filter((flag): flag is string => flag !== null) : []
}

/** Paires clé / valeur d'une réponse FETCH, clés en majuscules (« UID », « BODY[] », « BODY[HEADER] »). */
function fetchItems(response: ImapResponse): Map<string, ImapValue> {
  const items = new Map<string, ImapValue>()
  const list = response.values[0]
  if (!isList(list)) return items
  for (let i = 0; i + 1 < list.length; i += 2) {
    const key = valueText(list[i])
    if (key === null) continue
    // « BODY[]<0> » (lecture partielle) se range sous « BODY[] ».
    items.set(key.toUpperCase().replace(/<\d+>$/, ''), list[i + 1])
  }
  return items
}

export class ImapClient {
  readonly capabilities = new Set<string>()

  private transport: Transport
  private reader!: ImapReader
  private streamReader!: ReadableStreamDefaultReader<Uint8Array>
  private writer!: WritableStreamDefaultWriter<Uint8Array>
  private readonly timeoutMs: number
  private tagCounter = 0
  private queue: Promise<unknown> = Promise.resolve()
  private closed = false
  private lastBye: string | null = null

  private constructor(private readonly config: ImapConfig, transport: Transport) {
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.transport = transport
    this.attach(transport)
  }

  /** Ouvre la connexion, lit l'accueil, passe en TLS si demandé et s'authentifie. */
  static async connect(config: ImapConfig, transport: TransportFactory): Promise<ImapClient> {
    const client = new ImapClient(config, transport(config))
    try {
      await client.open()
    } catch (error) {
      await client.close()
      throw error
    }
    return client
  }

  private attach(transport: Transport): void {
    this.streamReader = transport.readable.getReader()
    this.writer = transport.writable.getWriter()
    this.reader = new ImapReader(this.streamReader, this.timeoutMs)
  }

  private async open(): Promise<void> {
    const greeting = parseResponse(await this.reader.readResponse())
    if (greeting.status === 'BYE') throw new ImapError(`Connexion refusée : ${greeting.text}`, { status: 'BYE', code: greeting.code })
    const preauth = greeting.status === 'PREAUTH'
    this.readCapabilityCode(greeting)

    if (!this.config.secure && this.config.startTls && !preauth) {
      if (!this.capabilities.size) await this.refreshCapabilities()
      if (!this.capabilities.has('STARTTLS')) throw new ImapError('Le serveur IMAP ne propose pas STARTTLS')
      if (!this.transport.startTls) throw new ImapError('Ce transport ne sait pas passer en TLS')
      await this.run(['STARTTLS'])
      this.streamReader.releaseLock()
      this.writer.releaseLock()
      this.transport = this.transport.startTls()
      this.attach(this.transport)
      // Ce que le serveur annonçait en clair ne vaut plus une fois en TLS.
      this.capabilities.clear()
    }

    if (!preauth) {
      if (!this.capabilities.size) await this.refreshCapabilities()
      const done = await this.authenticate()
      this.capabilities.clear()
      this.readCapabilityCode(done)
    }
    if (!this.capabilities.size) await this.refreshCapabilities()
  }

  /** « [CAPABILITY IMAP4rev1 …] » dans une réponse d'état. */
  private readCapabilityCode(response: ImapResponse): void {
    const code = response.code ?? ''
    if (!/^CAPABILITY /i.test(code)) return
    this.capabilities.clear()
    for (const name of code.split(' ').slice(1)) if (name) this.capabilities.add(name.toUpperCase())
  }

  private async refreshCapabilities(): Promise<void> {
    const { untagged } = await this.run(['CAPABILITY'])
    this.capabilities.clear()
    for (const response of untagged) {
      if (response.keyword !== 'CAPABILITY') continue
      for (const value of response.values) {
        const name = valueText(value)
        if (name) this.capabilities.add(name.toUpperCase())
      }
    }
  }

  private async authenticate(): Promise<ImapResponse> {
    const { user, password } = this.config
    if (this.capabilities.has('LOGINDISABLED')) {
      if (!this.capabilities.has('AUTH=PLAIN')) throw new ImapError('Le serveur IMAP refuse LOGIN et ne propose pas AUTH=PLAIN')
      return this.authenticatePlain(user, password)
    }
    return (await this.run(['LOGIN ', astring(user), ' ', astring(password)])).done
  }

  private async authenticatePlain(user: string, password: string): Promise<ImapResponse> {
    const token = base64(encoder.encode(`\0${user}\0${password}`))
    if (this.capabilities.has('SASL-IR')) return (await this.run([`AUTHENTICATE PLAIN ${token}`])).done

    return this.exclusive(async () => {
      const tag = this.nextTag()
      await this.write(`${tag} AUTHENTICATE PLAIN\r\n`)
      const untagged: ImapResponse[] = []
      const first = await this.waitForContinuation(tag, untagged)
      if (first) return this.finish(tag, first, untagged).done
      await this.write(`${token}\r\n`)
      return (await this.collect(tag, untagged)).done
    })
  }

  // --- Commandes publiques ---------------------------------------------------

  /** Tous les dossiers (LIST "" "*"), avec leur usage spécial annoncé ou deviné d'après le nom. */
  async list(): Promise<MailboxInfo[]> {
    const { untagged } = await this.run(['LIST "" "*"'])
    const boxes: MailboxInfo[] = []

    for (const response of untagged) {
      if (response.keyword !== 'LIST') continue
      const [rawFlags, rawDelimiter, rawName] = response.values
      const encoded = valueText(rawName)
      if (encoded === null) continue

      const flags = flagsOf(rawFlags)
      const delimiter = valueText(rawDelimiter)
      const path = decodeMailboxName(encoded)
      const lowerFlags = flags.map((flag) => flag.toLowerCase())
      const specialUse = SPECIAL_USES.find((use) => lowerFlags.includes(use.toLowerCase())) ?? null

      boxes.push({
        path,
        name: delimiter ? path.split(delimiter).pop() || path : path,
        delimiter,
        flags,
        specialUse,
        selectable: !lowerFlags.includes('\\noselect') && !lowerFlags.includes('\\nonexistent'),
      })
    }

    // Un usage spécial déjà annoncé par le serveur n'est jamais deviné ailleurs.
    const taken = new Set(boxes.map((box) => box.specialUse).filter(Boolean))
    for (const [use, names] of GUESSED_NAMES) {
      if (taken.has(use)) continue
      const box = boxes.find((candidate) => {
        if (candidate.specialUse || !candidate.selectable) return false
        const name = candidate.name.toLowerCase()
        const path = candidate.path.toLowerCase()
        return names.includes(name) || names.includes(path)
      })
      if (box) {
        box.specialUse = use
        taken.add(use)
      }
    }
    return boxes
  }

  /** SELECT, ou EXAMINE en lecture seule. */
  async select(path: string, opts: { readOnly?: boolean } = {}): Promise<SelectResult> {
    const { untagged } = await this.run([opts.readOnly ? 'EXAMINE ' : 'SELECT ', mailboxArg(path)])
    const result: SelectResult = { exists: 0, uidValidity: 0, uidNext: null }

    for (const response of untagged) {
      if (response.keyword === 'EXISTS' && response.number !== null) result.exists = response.number
      const code = response.code ?? ''
      const validity = /^UIDVALIDITY (\d+)/i.exec(code)
      if (validity) result.uidValidity = Number(validity[1])
      const next = /^UIDNEXT (\d+)/i.exec(code)
      if (next) result.uidNext = Number(next[1])
    }
    return result
  }

  /**
   * UID SEARCH. Attention : « UID n:* » renvoie toujours au moins le dernier
   * message de la boîte, même si son UID est inférieur à n (« * » vaut le plus
   * grand UID existant). Le tri des UID déjà connus reste à faire par l'appelant.
   */
  async searchUids(criteria: string): Promise<number[]> {
    const { untagged } = await this.run([`UID SEARCH ${criteria}`])
    const uids = new Set<number>()
    for (const response of untagged) {
      if (response.keyword !== 'SEARCH') continue
      for (const value of response.values) {
        const uid = valueNumber(value)
        if (uid !== null) uids.add(uid)
      }
    }
    return [...uids].sort((a, b) => a - b)
  }

  /**
   * Messages complets (BODY.PEEK[], sans les marquer lus) ; au-delà de
   * `maxBytes`, en-têtes seuls. Un message supprimé entre-temps est absent du
   * résultat. Tout reste en mémoire : passer des lots raisonnables.
   */
  async fetch(uids: number[], opts: { maxBytes?: number } = {}): Promise<FetchedMessage[]> {
    const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES
    const wanted = new Set(uids)
    const messages = new Map<number, FetchedMessage>()

    for (const batch of chunk([...wanted].sort((a, b) => a - b), META_BATCH)) {
      const set = uidSet(batch)
      if (!set) continue
      const { untagged } = await this.run([`UID FETCH ${set} (UID FLAGS INTERNALDATE RFC822.SIZE)`])
      for (const response of untagged) {
        if (response.keyword !== 'FETCH') continue
        const items = fetchItems(response)
        const uid = valueNumber(items.get('UID'))
        if (uid === null || !wanted.has(uid)) continue
        messages.set(uid, {
          uid,
          flags: flagsOf(items.get('FLAGS')),
          internalDate: parseInternalDate(valueText(items.get('INTERNALDATE'))),
          size: valueNumber(items.get('RFC822.SIZE')) ?? 0,
          raw: null,
          headers: null,
        })
      }
    }

    const all = [...messages.values()].sort((a, b) => a.uid - b.uid)
    const small = all.filter((message) => message.size <= maxBytes)
    const large = all.filter((message) => message.size > maxBytes)

    for (const batch of this.bodyBatches(small)) {
      await this.fetchSection(batch, 'BODY.PEEK[]', 'BODY[]', (message, bytes) => {
        message.raw = bytes
      })
    }
    for (const batch of chunk(large, BODY_BATCH)) {
      await this.fetchSection(batch, 'BODY.PEEK[HEADER]', 'BODY[HEADER]', (message, bytes) => {
        message.headers = bytes
      })
    }

    return all
  }

  /** Lots d'au plus BODY_BATCH messages et d'environ BODY_BATCH_BYTES octets. */
  private bodyBatches(messages: FetchedMessage[]): FetchedMessage[][] {
    const batches: FetchedMessage[][] = []
    let current: FetchedMessage[] = []
    let bytes = 0
    for (const message of messages) {
      if (current.length && (current.length >= BODY_BATCH || bytes + message.size > BODY_BATCH_BYTES)) {
        batches.push(current)
        current = []
        bytes = 0
      }
      current.push(message)
      bytes += message.size
    }
    if (current.length) batches.push(current)
    return batches
  }

  private async fetchSection(
    batch: FetchedMessage[],
    request: string,
    key: string,
    store: (message: FetchedMessage, bytes: Uint8Array) => void,
  ): Promise<void> {
    const byUid = new Map(batch.map((message) => [message.uid, message]))
    const set = uidSet([...byUid.keys()])
    if (!set) return
    const { untagged } = await this.run([`UID FETCH ${set} (UID ${request})`])
    for (const response of untagged) {
      if (response.keyword !== 'FETCH') continue
      const items = fetchItems(response)
      const message = byUid.get(valueNumber(items.get('UID')) ?? -1)
      if (!message) continue
      const bytes = valueBytes(items.get(key))
      if (bytes) store(message, bytes)
      const flags = items.get('FLAGS')
      if (isList(flags)) message.flags = flagsOf(flags)
    }
  }

  async fetchFlags(uids: number[]): Promise<{ uid: number; flags: string[] }[]> {
    const wanted = new Set(uids)
    const out = new Map<number, string[]>()
    for (const batch of chunk([...wanted].sort((a, b) => a - b), META_BATCH)) {
      const set = uidSet(batch)
      if (!set) continue
      const { untagged } = await this.run([`UID FETCH ${set} (UID FLAGS)`])
      for (const response of untagged) {
        if (response.keyword !== 'FETCH') continue
        const items = fetchItems(response)
        const uid = valueNumber(items.get('UID'))
        if (uid === null || !wanted.has(uid)) continue
        out.set(uid, flagsOf(items.get('FLAGS')))
      }
    }
    return [...out.entries()].sort((a, b) => a[0] - b[0]).map(([uid, flags]) => ({ uid, flags }))
  }

  addFlags(uids: number[], flags: string[]): Promise<void> {
    return this.store(uids, '+FLAGS.SILENT', flags)
  }

  removeFlags(uids: number[], flags: string[]): Promise<void> {
    return this.store(uids, '-FLAGS.SILENT', flags)
  }

  /**
   * Déplace des messages du dossier sélectionné vers `path` (la corbeille) :
   * MOVE (RFC 6851) si le serveur l'a, sinon COPY, \Deleted et effacement.
   */
  async move(uids: number[], path: string): Promise<void> {
    const sorted = [...new Set(uids)].sort((a, b) => a - b)
    for (const batch of chunk(sorted, META_BATCH)) {
      const set = uidSet(batch)
      if (!set) continue
      if (this.capabilities.has('MOVE')) {
        await this.run([`UID MOVE ${set} `, mailboxArg(path)])
      } else {
        await this.run([`UID COPY ${set} `, mailboxArg(path)])
        await this.store(batch, '+FLAGS.SILENT', ['\\Deleted'])
        await this.expunge(batch)
      }
    }
  }

  /** Efface définitivement des messages du dossier sélectionné. */
  async delete(uids: number[]): Promise<void> {
    const sorted = [...new Set(uids)].sort((a, b) => a - b)
    await this.store(sorted, '+FLAGS.SILENT', ['\\Deleted'])
    for (const batch of chunk(sorted, META_BATCH)) await this.expunge(batch)
  }

  /**
   * UID EXPUNGE (UIDPLUS) n'efface que ces messages. Sans UIDPLUS, EXPUNGE
   * efface aussi ceux qu'un autre logiciel aurait marqués \Deleted dans ce
   * dossier : c'est ce que font tous les clients mail dans ce cas.
   */
  private async expunge(uids: number[]): Promise<void> {
    const set = uidSet(uids)
    if (!set) return
    await this.run([this.capabilities.has('UIDPLUS') ? `UID EXPUNGE ${set}` : 'EXPUNGE'])
  }

  private async store(uids: number[], action: string, flags: string[]): Promise<void> {
    if (!flags.length) return
    const list = flagList(flags)
    for (const batch of chunk([...new Set(uids)].sort((a, b) => a - b), META_BATCH)) {
      const set = uidSet(batch)
      if (set) await this.run([`UID STORE ${set} ${action} ${list}`])
    }
  }

  /**
   * Dépose un message dans un dossier (copie dans « Envoyés »). Le message doit
   * avoir des fins de ligne CRLF ; une chaîne est normalisée. Rend l'UID
   * attribué si le serveur a UIDPLUS, sinon null.
   */
  async append(path: string, raw: Uint8Array | string, flags: string[] = [], date?: Date): Promise<number | null> {
    const bytes = typeof raw === 'string' ? encoder.encode(raw.replace(/\r?\n/g, '\r\n')) : raw
    const parts: CommandPart[] = ['APPEND ', mailboxArg(path)]
    if (flags.length) parts.push(` ${flagList(flags)}`)
    if (date) parts.push(` "${formatInternalDate(date)}"`)
    parts.push(' ', { literal: bytes })

    const { done } = await this.run(parts)
    const appended = /^APPENDUID \d+ (\d+)/i.exec(done.code ?? '')
    return appended ? Number(appended[1]) : null
  }

  /** LOGOUT puis fermeture ; ne lève jamais. */
  async logout(): Promise<void> {
    if (this.closed) return
    try {
      await this.run(['LOGOUT'])
    } catch {
      // Le serveur ferme souvent la connexion juste après BYE : rien à signaler.
    }
    await this.close()
  }

  // --- Échanges ----------------------------------------------------------------

  private exclusive<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task)
    this.queue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  private nextTag(): string {
    this.tagCounter += 1
    return `A${this.tagCounter}`
  }

  private async write(data: string | Uint8Array): Promise<void> {
    await this.writer.write(typeof data === 'string' ? encoder.encode(data) : data)
  }

  private async read(): Promise<ImapResponse> {
    const response = parseResponse(await this.reader.readResponse())
    if (response.tag === '*' && response.status === 'BYE') this.lastBye = response.text
    return response
  }

  /** Envoie une commande (littéraux compris) et attend sa réponse étiquetée. */
  private run(parts: CommandPart[]): Promise<CommandResult> {
    return this.exclusive(async () => {
      if (this.closed) throw new ImapError('Connexion IMAP fermée')
      const tag = this.nextTag()
      const untagged: ImapResponse[] = []

      try {
        let pending = `${tag} `
        for (const part of parts) {
          if (typeof part === 'string') {
            pending += part
            continue
          }
          const size = part.literal.length
          const nonSync = this.capabilities.has('LITERAL+') || (this.capabilities.has('LITERAL-') && size <= 4096)
          await this.write(`${pending}{${size}${nonSync ? '+' : ''}}\r\n`)
          pending = ''
          if (!nonSync) {
            const refused = await this.waitForContinuation(tag, untagged)
            if (refused) return this.finish(tag, refused, untagged)
          }
          await this.write(part.literal)
        }
        await this.write(`${pending}\r\n`)
        return await this.collect(tag, untagged)
      } catch (error) {
        if (!(error instanceof ImapError) || error.status === null) await this.close()
        throw this.withBye(error)
      }
    })
  }

  /** Attend « + » ; rend la réponse étiquetée si le serveur refuse la suite. */
  private async waitForContinuation(tag: string, untagged: ImapResponse[]): Promise<ImapResponse | null> {
    while (true) {
      const response = await this.read()
      if (response.tag === '+') return null
      if (response.tag === tag) return response
      untagged.push(response)
    }
  }

  private async collect(tag: string, untagged: ImapResponse[]): Promise<CommandResult> {
    while (true) {
      const response = await this.read()
      if (response.tag === tag) return this.finish(tag, response, untagged)
      // Une demande de suite inattendue reste sans réponse : on l'ignore.
      if (response.tag === '+') continue
      untagged.push(response)
    }
  }

  private finish(tag: string, done: ImapResponse, untagged: ImapResponse[]): CommandResult {
    if (done.status === 'OK') return { untagged, done }
    const status = done.status === 'NO' || done.status === 'BAD' ? done.status : 'BAD'
    const code = done.code ? ` [${done.code}]` : ''
    throw new ImapError(`IMAP ${status}${code} : ${done.text || `réponse inattendue à ${tag}`}`, { status, code: done.code })
  }

  private withBye(error: unknown): unknown {
    if (this.lastBye && error instanceof ImapError && error.status === null) {
      return new ImapError(`${error.message} (BYE : ${this.lastBye})`, { status: 'BYE' })
    }
    return error
  }

  private async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    try {
      await this.writer.close()
    } catch {
      // déjà fermé
    }
    try {
      await this.transport.close()
    } catch {
      // déjà fermé
    }
  }
}

export { Atom, ImapError }
