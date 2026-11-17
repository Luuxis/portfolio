/**
 * Lecture des réponses IMAP (RFC 3501 / 9051) au niveau des octets : une
 * réponse est une ligne terminée par CRLF, éventuellement coupée par des
 * littéraux « {n} », « {n+} » ou « ~{n} » dont les n octets suivent la ligne.
 * Les littéraux restent en Uint8Array (corps des messages), le texte est lu
 * en UTF-8.
 */

const LF = 0x0a
const CR = 0x0d

const decoder = new TextDecoder()

/** Erreur du serveur (NO, BAD, BYE), délai dépassé ou connexion fermée. */
export class ImapError extends Error {
  /** Statut de la réponse qui a fait échouer la commande. */
  readonly status: 'NO' | 'BAD' | 'BYE' | null
  /** Code de réponse entre crochets, ex. « AUTHENTICATIONFAILED ». */
  readonly code: string | null

  constructor(message: string, options: { status?: 'NO' | 'BAD' | 'BYE' | null; code?: string | null } = {}) {
    super(message)
    this.name = 'ImapError'
    this.status = options.status ?? null
    this.code = options.code ?? null
  }
}

/** File d'octets en morceaux : on évite de recopier tout le tampon à chaque paquet reçu. */
class ByteQueue {
  private chunks: Uint8Array[] = []
  private head = 0
  length = 0

  push(chunk: Uint8Array): void {
    if (chunk.length === 0) return
    this.chunks.push(chunk)
    this.length += chunk.length
  }

  /** Position du premier octet `byte` à partir de `from`, ou -1. */
  indexOf(byte: number, from: number): number {
    let base = 0
    for (let c = 0; c < this.chunks.length; c++) {
      const chunk = this.chunks[c]
      const start = c === 0 ? this.head : 0
      const size = chunk.length - start
      if (from < base + size) {
        const found = chunk.indexOf(byte, start + Math.max(0, from - base))
        if (found !== -1) return base + found - start
      }
      base += size
    }
    return -1
  }

  take(n: number): Uint8Array {
    if (n > this.length) throw new RangeError('ByteQueue: pas assez d’octets')
    const first = this.chunks[0]
    if (first && first.length - this.head >= n) {
      const out = first.subarray(this.head, this.head + n)
      this.head += n
      if (this.head === first.length) {
        this.chunks.shift()
        this.head = 0
      }
      this.length -= n
      return out
    }

    const out = new Uint8Array(n)
    let written = 0
    while (written < n) {
      const chunk = this.chunks[0]
      const available = chunk.length - this.head
      const count = Math.min(available, n - written)
      out.set(chunk.subarray(this.head, this.head + count), written)
      written += count
      this.head += count
      if (this.head === chunk.length) {
        this.chunks.shift()
        this.head = 0
      }
    }
    this.length -= n
    return out
  }
}

/** Une réponse brute : du texte, et les littéraux à l'endroit où ils étaient annoncés. */
export type RawResponse = (string | Uint8Array)[]

const LITERAL_MARKER = /~?\{(\d+)\+?\}$/

export class ImapReader {
  private queue = new ByteQueue()
  private ended = false

  constructor(
    private readonly reader: ReadableStreamDefaultReader<Uint8Array>,
    private readonly timeoutMs: number,
  ) {}

  /** Lit un paquet de plus. Le délai court depuis le dernier paquet reçu, pas depuis le début de la réponse. */
  private async fill(): Promise<void> {
    if (this.ended) throw new ImapError('Connexion IMAP fermée par le serveur')

    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new ImapError('Délai dépassé en attendant le serveur IMAP')), this.timeoutMs)
    })

    try {
      const { value, done } = await Promise.race([this.reader.read(), timeout])
      if (done) {
        this.ended = true
        throw new ImapError('Connexion IMAP fermée par le serveur')
      }
      if (value) this.queue.push(value instanceof Uint8Array ? value : new Uint8Array(value))
    } finally {
      clearTimeout(timer)
    }
  }

  /** Une ligne, sans son CRLF. */
  async readLine(): Promise<Uint8Array> {
    let scanned = 0
    while (true) {
      const index = this.queue.indexOf(LF, scanned)
      if (index !== -1) {
        const line = this.queue.take(index + 1)
        const end = line.length >= 2 && line[line.length - 2] === CR ? line.length - 2 : line.length - 1
        return line.subarray(0, end)
      }
      scanned = this.queue.length
      await this.fill()
    }
  }

  async readBytes(n: number): Promise<Uint8Array> {
    while (this.queue.length < n) await this.fill()
    return this.queue.take(n)
  }

  /** Une réponse complète, littéraux compris. */
  async readResponse(): Promise<RawResponse> {
    const parts: RawResponse = []
    while (true) {
      const line = decoder.decode(await this.readLine())
      const marker = LITERAL_MARKER.exec(line)
      if (!marker) {
        parts.push(line)
        return parts
      }
      parts.push(line.slice(0, marker.index))
      parts.push(await this.readBytes(Number(marker[1])))
    }
  }
}

// --- Valeurs -----------------------------------------------------------------

/** Atome IMAP (mot sans guillemets) : drapeaux, mots-clés, nombres, sections « BODY[…] ». */
export class Atom {
  constructor(readonly value: string) {}
}

/** Atome, chaîne entre guillemets, littéral, NIL ou liste parenthésée. */
export type ImapValue = Atom | string | Uint8Array | null | ImapValue[]

export function isList(value: ImapValue | undefined): value is ImapValue[] {
  return Array.isArray(value)
}

/** Texte d'un atome, d'une chaîne ou d'un littéral ; null pour NIL ou une liste. */
export function valueText(value: ImapValue | undefined): string | null {
  if (value instanceof Atom) return value.value
  if (typeof value === 'string') return value
  if (value instanceof Uint8Array) return decoder.decode(value)
  return null
}

export function valueNumber(value: ImapValue | undefined): number | null {
  const text = valueText(value)
  if (text === null || !/^\d+$/.test(text)) return null
  return Number(text)
}

export function valueBytes(value: ImapValue | undefined): Uint8Array | null {
  if (value instanceof Uint8Array) return value
  if (typeof value === 'string') return new TextEncoder().encode(value)
  if (value instanceof Atom) return new TextEncoder().encode(value.value)
  return null
}

/** Lecture des valeurs d'une réponse, partie texte par partie texte, les littéraux à leur place. */
class Lexer {
  private part = 0
  private pos = 0

  constructor(private readonly parts: RawResponse) {}

  private current(): string | Uint8Array | undefined {
    return this.parts[this.part]
  }

  private skipSpaces(): void {
    while (true) {
      const part = this.current()
      if (typeof part !== 'string') return
      while (this.pos < part.length && part[this.pos] === ' ') this.pos += 1
      if (this.pos < part.length) return
      // Fin de cette partie texte : on passe à la suivante (souvent un littéral).
      this.part += 1
      this.pos = 0
    }
  }

  /** Toutes les valeurs restantes, jusqu'à la fin de la réponse. */
  values(): ImapValue[] {
    const out: ImapValue[] = []
    while (true) {
      this.skipSpaces()
      const part = this.current()
      if (part === undefined) return out
      if (typeof part === 'string' && part[this.pos] === ')') {
        // Parenthèse fermante orpheline : on l'ignore plutôt que de tourner en rond.
        this.pos += 1
        continue
      }
      out.push(this.value())
    }
  }

  private value(): ImapValue {
    const part = this.current()
    if (part instanceof Uint8Array) {
      this.part += 1
      this.pos = 0
      return part
    }
    if (part === undefined) return null

    const char = part[this.pos]
    if (char === '(') {
      this.pos += 1
      return this.list()
    }
    if (char === '"') return this.quoted(part)
    return this.atom(part)
  }

  private list(): ImapValue[] {
    const out: ImapValue[] = []
    while (true) {
      this.skipSpaces()
      const part = this.current()
      if (part === undefined) return out
      if (typeof part === 'string' && part[this.pos] === ')') {
        this.pos += 1
        return out
      }
      out.push(this.value())
    }
  }

  private quoted(part: string): string {
    let out = ''
    let i = this.pos + 1
    while (i < part.length) {
      const char = part[i]
      if (char === '\\' && i + 1 < part.length) {
        out += part[i + 1]
        i += 2
        continue
      }
      if (char === '"') {
        i += 1
        break
      }
      out += char
      i += 1
    }
    this.pos = i
    return out
  }

  /** Un atome ; une section entre crochets (« BODY[HEADER.FIELDS (FROM)] ») en fait partie, espaces compris. */
  private atom(part: string): Atom | null {
    let i = this.pos
    let depth = 0
    while (i < part.length) {
      const char = part[i]
      if (char === '[') depth += 1
      else if (char === ']') {
        if (depth === 0) break
        depth -= 1
      } else if (depth === 0 && (char === ' ' || char === '(' || char === ')' || char === '"')) break
      i += 1
    }
    if (i === this.pos) i += 1 // caractère isolé (« ] ») : on avance quand même
    const text = part.slice(this.pos, i)
    this.pos = i
    return text.toUpperCase() === 'NIL' ? null : new Atom(text)
  }
}

export function parseValues(parts: RawResponse): ImapValue[] {
  return new Lexer(parts).values()
}

// --- Réponses ----------------------------------------------------------------

export type ResponseStatus = 'OK' | 'NO' | 'BAD' | 'BYE' | 'PREAUTH'

export type ImapResponse = {
  /** « * » (non étiquetée), « + » (suite attendue) ou l'étiquette de la commande. */
  tag: string
  /** Réponses d'état : OK, NO, BAD, BYE, PREAUTH. */
  status: ResponseStatus | null
  /** Contenu des crochets d'une réponse d'état, ex. « UIDVALIDITY 3857529045 ». */
  code: string | null
  /** Texte lisible d'une réponse d'état ou d'une demande de suite. */
  text: string
  /** « * 23 EXISTS » → 23. */
  number: number | null
  /** EXISTS, FETCH, LIST, SEARCH, CAPABILITY, FLAGS… */
  keyword: string | null
  values: ImapValue[]
}

const STATUSES = new Set<ResponseStatus>(['OK', 'NO', 'BAD', 'BYE', 'PREAUTH'])

function splitWord(text: string): [string, string] {
  const space = text.indexOf(' ')
  return space === -1 ? [text, ''] : [text.slice(0, space), text.slice(space + 1)]
}

export function parseResponse(parts: RawResponse): ImapResponse {
  const first = typeof parts[0] === 'string' ? parts[0] : ''
  const response: ImapResponse = { tag: '', status: null, code: null, text: '', number: null, keyword: null, values: [] }

  if (first.startsWith('+')) {
    response.tag = '+'
    response.text = first.slice(1).trim()
    return response
  }

  const [tag, afterTag] = splitWord(first)
  response.tag = tag
  const [word, afterWord] = splitWord(afterTag)
  const upper = word.toUpperCase()

  if (STATUSES.has(upper as ResponseStatus)) {
    response.status = upper as ResponseStatus
    let rest = afterWord
    if (rest.startsWith('[')) {
      const close = rest.indexOf(']')
      if (close !== -1) {
        response.code = rest.slice(1, close)
        rest = rest.slice(close + 1)
      }
    }
    response.text = rest.trim()
    return response
  }

  if (tag === '*' && /^\d+$/.test(word)) {
    response.number = Number(word)
    const [keyword, rest] = splitWord(afterWord)
    response.keyword = keyword.toUpperCase()
    response.values = parseValues([rest, ...parts.slice(1)])
    return response
  }

  response.keyword = upper
  response.values = parseValues([afterWord, ...parts.slice(1)])
  return response
}

// --- Dates -------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** INTERNALDATE « 17-Jul-1996 02:44:25 -0700 » → Date ; null si illisible. */
export function parseInternalDate(text: string | null): Date | null {
  if (!text) return null
  const match = /^\s*(\d{1,2})-([A-Za-z]{3})-(\d{4}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2})$/.exec(text)
  if (!match) return null
  const month = MONTHS.findIndex((m) => m.toLowerCase() === match[2].toLowerCase())
  if (month === -1) return null
  const utc = Date.UTC(Number(match[3]), month, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6]))
  const offset = (Number(match[8]) * 60 + Number(match[9])) * 60_000 * (match[7] === '-' ? -1 : 1)
  return new Date(utc - offset)
}

/** Date → « 07-Jul-1996 09:44:25 +0000 », pour APPEND. */
export function formatInternalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getUTCDate())}-${MONTHS[date.getUTCMonth()]}-${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} +0000`
}
