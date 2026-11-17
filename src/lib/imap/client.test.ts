/// <reference types="node" />
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ImapClient, ImapError, type ImapConfig, type Transport, type TransportFactory } from './client'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

type Command = { tag: string; text: string; literals: Uint8Array[] }
type Handler = (command: Command, server: FakeServer) => string | void

/**
 * Faux serveur IMAP scripté : il découpe ce que le client écrit en commandes
 * (littéraux compris, « + » envoyé pour les littéraux synchronisés) et
 * répond en petits morceaux pour éprouver le lecteur.
 */
class FakeServer {
  readonly commands: Command[] = []
  tls = false
  closed = false
  private controller!: ReadableStreamDefaultController<Uint8Array>
  private buffer = new Uint8Array(0)
  private pending = ''
  private literals: Uint8Array[] = []
  private awaiting: number | null = null

  constructor(
    private readonly greeting: string,
    private readonly handler: Handler,
    private readonly chunkSize = 5,
  ) {}

  readonly factory: TransportFactory = () => this.transport(true)

  private transport(greet: boolean): Transport {
    const readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        this.controller = controller
        if (greet) this.send(this.greeting)
      },
    })
    const writable = new WritableStream<Uint8Array>({
      write: (chunk) => {
        const next = new Uint8Array(this.buffer.length + chunk.length)
        next.set(this.buffer)
        next.set(chunk, this.buffer.length)
        this.buffer = next
        this.process()
      },
    })
    return {
      readable,
      writable,
      startTls: () => {
        this.tls = true
        return this.transport(false)
      },
      close: async () => {
        this.closed = true
        try {
          this.controller.close()
        } catch {
          // déjà fermé
        }
      },
    }
  }

  send(text: string | Uint8Array): void {
    const bytes = typeof text === 'string' ? encoder.encode(text) : text
    for (let i = 0; i < bytes.length; i += this.chunkSize) this.controller.enqueue(bytes.slice(i, i + this.chunkSize))
  }

  /** Ferme la connexion côté serveur. */
  hangUp(): void {
    this.controller.close()
  }

  private process(): void {
    while (true) {
      if (this.awaiting !== null) {
        if (this.buffer.length < this.awaiting) return
        this.literals.push(this.buffer.slice(0, this.awaiting))
        this.buffer = this.buffer.slice(this.awaiting)
        this.awaiting = null
        continue
      }
      const lf = this.buffer.indexOf(0x0a)
      if (lf === -1) return
      const line = decoder.decode(this.buffer.slice(0, lf - 1))
      this.buffer = this.buffer.slice(lf + 1)

      const marker = /\{(\d+)(\+?)\}$/.exec(line)
      if (marker) {
        this.pending += `${line.slice(0, marker.index)}{}`
        this.awaiting = Number(marker[1])
        if (!marker[2]) this.send('+ Ready for literal data\r\n')
        continue
      }

      const text = this.pending + line
      const space = text.indexOf(' ')
      const command = { tag: space === -1 ? text : text.slice(0, space), text: space === -1 ? '' : text.slice(space + 1), literals: this.literals }
      this.pending = ''
      this.literals = []
      this.commands.push(command)
      const reply = this.handler(command, this)
      if (reply) this.send(reply)
    }
  }
}

const config: ImapConfig = { host: 'imap.example.test', port: 993, secure: true, user: 'andre@example.test', password: 'p"ss\\', timeoutMs: 2000 }

test('bout en bout : connexion, dossiers, recherche, lecture, drapeaux, APPEND, LOGOUT', async () => {
  const message1 = 'From: Client <client@example.test>\r\nSubject: Devis\r\n\r\nBonjour, ça marche.\r\n'
  const message2 = 'From: x@example.test\r\nSubject: Re: Facture\r\n\r\n{5}\r\n) "piège"\r\n'
  const header3 = 'From: gros@example.test\r\nSubject: Pièce jointe\r\n\r\n'
  const size = (text: string) => encoder.encode(text).length
  const appended = 'From: André <contact@example.test>\nSubject: Copie\n\nTexte\n'
  let appendedBytes: Uint8Array | null = null

  const server = new FakeServer('* OK IMAP ready\r\n', ({ tag, text, literals }) => {
    switch (text) {
      case 'CAPABILITY':
        return `* CAPABILITY IMAP4rev1 AUTH=PLAIN UIDPLUS\r\n${tag} OK Capability completed\r\n`
      case 'LOGIN "andre@example.test" "p\\"ss\\\\"':
        return `${tag} OK [CAPABILITY IMAP4rev1 UIDPLUS SPECIAL-USE] Logged in\r\n`
      case 'LIST "" "*"':
        return [
          '* LIST (\\HasNoChildren) "/" INBOX',
          '* LIST (\\HasNoChildren \\Sent) "/" "&AMk-l&AOk-ments envoy&AOk-s"',
          '* LIST (\\Noselect \\HasChildren) "/" Archives',
          '* LIST (\\HasNoChildren) "/" {11}\r\nArchives/26',
          '* LIST (\\HasNoChildren) "/" Corbeille',
          '* LIST (\\HasNoChildren) "/" Sent',
          `${tag} OK List completed`,
          '',
        ].join('\r\n')
      case 'SELECT "INBOX"':
        return [
          '* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)',
          '* OK [PERMANENTFLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft \\*)] Flags permitted.',
          '* 3 EXISTS',
          '* 0 RECENT',
          '* OK [UIDVALIDITY 1700000000] UIDs valid',
          '* OK [UIDNEXT 105] Predicted next UID',
          `${tag} OK [READ-WRITE] Select completed.`,
          '',
        ].join('\r\n')
      case 'UID SEARCH UID 100:*':
        return `* 4 EXISTS\r\n* SEARCH 104 102 103\r\n${tag} OK Search completed\r\n`
      case 'UID FETCH 102:104 (UID FLAGS INTERNALDATE RFC822.SIZE)':
        return [
          `* 1 FETCH (UID 102 FLAGS (\\Seen) INTERNALDATE "17-Jul-2026 02:44:25 -0700" RFC822.SIZE ${size(message1)})`,
          `* 2 FETCH (UID 103 FLAGS () INTERNALDATE " 7-Nov-2026 10:00:00 +0100" RFC822.SIZE ${size(message2)})`,
          '* 1 FETCH (FLAGS (\\Seen \\Answered))',
          '* 3 FETCH (UID 104 FLAGS (\\Flagged) INTERNALDATE "17-Nov-2026 09:00:00 +0000" RFC822.SIZE 5000)',
          `${tag} OK Fetch completed`,
          '',
        ].join('\r\n')
      case 'UID FETCH 102:103 (UID BODY.PEEK[])':
        return [
          `* 1 FETCH (UID 102 BODY[] {${size(message1)}}\r\n${message1})`,
          `* 2 FETCH (UID 103 BODY[] {${size(message2)}}\r\n${message2} FLAGS (\\Seen))`,
          '* 5 EXPUNGE',
          `${tag} OK Fetch completed`,
          '',
        ].join('\r\n')
      case 'UID FETCH 104 (UID BODY.PEEK[HEADER])':
        return `* 3 FETCH (UID 104 BODY[HEADER] {${size(header3)}}\r\n${header3})\r\n${tag} OK Fetch completed\r\n`
      case 'UID FETCH 102:103 (UID FLAGS)':
        return `* 1 FETCH (FLAGS (\\Seen) UID 102)\r\n* 2 FETCH (UID 103 FLAGS (\\Seen $Forwarded))\r\n${tag} OK Fetch completed\r\n`
      case 'UID STORE 102 +FLAGS.SILENT (\\Seen)':
      case 'UID STORE 103 -FLAGS.SILENT (\\Seen \\Flagged)':
        return `${tag} OK Store completed\r\n`
      case 'APPEND "&AMk-l&AOk-ments envoy&AOk-s" (\\Seen) "17-Nov-2026 08:30:00 +0000" {}':
        appendedBytes = literals[0]
        return `${tag} OK [APPENDUID 1700000000 77] Append completed\r\n`
      case 'LOGOUT':
        return `* BYE Logging out\r\n${tag} OK Logout completed\r\n`
      default:
        return `${tag} BAD Unexpected command: ${text}\r\n`
    }
  })

  const client = await ImapClient.connect(config, server.factory)
  assert.ok(client.capabilities.has('SPECIAL-USE'))
  assert.ok(!client.capabilities.has('AUTH=PLAIN'), 'capacités relues après la connexion')

  const boxes = await client.list()
  assert.deepEqual(
    boxes.map((box) => [box.path, box.name, box.specialUse, box.selectable]),
    [
      ['INBOX', 'INBOX', null, true],
      ['Éléments envoyés', 'Éléments envoyés', '\\Sent', true],
      ['Archives', 'Archives', null, false],
      ['Archives/26', '26', null, true],
      ['Corbeille', 'Corbeille', '\\Trash', true],
      // « Sent » n'est pas deviné : le serveur a déjà annoncé \Sent ailleurs.
      ['Sent', 'Sent', null, true],
    ],
  )
  assert.equal(boxes[0].delimiter, '/')

  assert.deepEqual(await client.select('INBOX'), { exists: 3, uidValidity: 1700000000, uidNext: 105 })
  assert.deepEqual(await client.searchUids('UID 100:*'), [102, 103, 104])

  const messages = await client.fetch([104, 102, 103], { maxBytes: 1000 })
  assert.deepEqual(messages.map((message) => message.uid), [102, 103, 104])
  assert.equal(decoder.decode(messages[0].raw!), message1)
  assert.deepEqual(messages[0].flags, ['\\Seen'])
  assert.equal(messages[0].internalDate?.toISOString(), '2026-07-17T09:44:25.000Z')
  assert.equal(decoder.decode(messages[1].raw!), message2)
  assert.deepEqual(messages[1].flags, ['\\Seen'], 'drapeaux mis à jour par la réponse du corps')
  assert.equal(messages[1].headers, null)
  assert.equal(messages[2].raw, null)
  assert.equal(decoder.decode(messages[2].headers!), header3)
  assert.equal(messages[2].size, 5000)

  assert.deepEqual(await client.fetchFlags([102, 103]), [
    { uid: 102, flags: ['\\Seen'] },
    { uid: 103, flags: ['\\Seen', '$Forwarded'] },
  ])

  await client.addFlags([102], ['\\Seen'])
  await client.removeFlags([103], ['\\Seen', '\\Flagged'])
  await client.addFlags([], ['\\Seen'])
  await assert.rejects(client.addFlags([1], ['bad flag']), ImapError)

  const uid = await client.append('Éléments envoyés', appended, ['\\Seen'], new Date('2026-11-17T08:30:00Z'))
  assert.equal(uid, 77)
  assert.equal(decoder.decode(appendedBytes!), appended.replace(/\n/g, '\r\n'))

  await client.logout()
  assert.ok(server.closed)
  await client.logout()

  assert.deepEqual(
    server.commands.map((command) => command.tag),
    server.commands.map((_, index) => `A${index + 1}`),
  )
  assert.equal(server.commands.at(-1)?.text, 'LOGOUT')
})

test('erreur NO : identifiants refusés', async () => {
  const server = new FakeServer('* OK [CAPABILITY IMAP4rev1] ready\r\n', ({ tag, text }) =>
    text.startsWith('LOGIN') ? `${tag} NO [AUTHENTICATIONFAILED] Invalid credentials\r\n` : `${tag} BAD ?\r\n`,
  )
  await assert.rejects(ImapClient.connect(config, server.factory), (error: unknown) => {
    assert.ok(error instanceof ImapError)
    assert.equal(error.status, 'NO')
    assert.equal(error.code, 'AUTHENTICATIONFAILED')
    assert.match(error.message, /Invalid credentials/)
    return true
  })
  assert.ok(server.closed)
})

test('mot de passe non ASCII : littéral synchronisé, puis LITERAL+', async () => {
  for (const literalPlus of [false, true]) {
    const caps = literalPlus ? 'IMAP4rev1 LITERAL+' : 'IMAP4rev1'
    const server = new FakeServer(`* OK [CAPABILITY ${caps}] ready\r\n`, ({ tag, text }) => {
      if (text === 'CAPABILITY') return `* CAPABILITY ${caps}\r\n${tag} OK\r\n`
      if (text.startsWith('LOGIN')) return `${tag} OK Logged in\r\n`
      return `${tag} OK\r\n`
    })
    const client = await ImapClient.connect({ ...config, password: 'mötdepasse' }, server.factory)
    const login = server.commands.find((command) => command.text.startsWith('LOGIN'))!
    assert.equal(login.text, 'LOGIN "andre@example.test" {}')
    assert.equal(decoder.decode(login.literals[0]), 'mötdepasse')
    await client.logout()
  }
})

test('LOGINDISABLED : AUTHENTICATE PLAIN avec et sans SASL-IR', async () => {
  const token = btoa('\0andre@example.test\0p"ss\\')

  const withIr = new FakeServer('* OK [CAPABILITY IMAP4rev1 LOGINDISABLED AUTH=PLAIN SASL-IR] ready\r\n', ({ tag, text }) => {
    if (text === `AUTHENTICATE PLAIN ${token}`) return `${tag} OK [CAPABILITY IMAP4rev1 IDLE] Logged in\r\n`
    return `${tag} BAD ?\r\n`
  })
  const first = await ImapClient.connect(config, withIr.factory)
  assert.ok(first.capabilities.has('IDLE'))
  await first.logout()

  let waiting: string | null = null
  const withoutIr = new FakeServer('* OK [CAPABILITY IMAP4rev1 LOGINDISABLED AUTH=PLAIN] ready\r\n', ({ tag, text }, server) => {
    if (waiting) {
      const done = waiting
      waiting = null
      assert.equal(tag, token)
      return `${done} OK Logged in\r\n`
    }
    if (text === 'AUTHENTICATE PLAIN') {
      waiting = tag
      server.send('+ \r\n')
      return
    }
    if (text === 'CAPABILITY') return `* CAPABILITY IMAP4rev1 MOVE\r\n${tag} OK\r\n`
    return `${tag} OK\r\n`
  })
  const second = await ImapClient.connect(config, withoutIr.factory)
  assert.ok(second.capabilities.has('MOVE'))
  await second.logout()
})

test('STARTTLS puis authentification sur la connexion chiffrée', async () => {
  const server = new FakeServer('* OK [CAPABILITY IMAP4rev1 STARTTLS LOGINDISABLED] ready\r\n', ({ tag, text }, self) => {
    if (text === 'STARTTLS') return `${tag} OK Begin TLS negotiation now\r\n`
    if (text === 'CAPABILITY') {
      // En TLS, LOGINDISABLED disparaît : le client repasse à LOGIN.
      return self.tls ? `* CAPABILITY IMAP4rev1 AUTH=PLAIN\r\n${tag} OK\r\n` : `${tag} BAD pas en clair\r\n`
    }
    if (text.startsWith('LOGIN ')) return self.tls ? `${tag} OK [CAPABILITY IMAP4rev1 UIDPLUS] Logged in\r\n` : `${tag} NO\r\n`
    return `${tag} OK\r\n`
  })
  const client = await ImapClient.connect({ ...config, secure: false, startTls: true, port: 143 }, server.factory)
  assert.ok(server.tls)
  assert.deepEqual([...client.capabilities], ['IMAP4REV1', 'UIDPLUS'])
  assert.deepEqual(
    server.commands.map((command) => command.text.split(' ')[0]),
    ['STARTTLS', 'CAPABILITY', 'LOGIN'],
  )
  await client.logout()
})

test('STARTTLS absent : refus explicite', async () => {
  const server = new FakeServer('* OK [CAPABILITY IMAP4rev1] ready\r\n', ({ tag }) => `${tag} OK\r\n`)
  await assert.rejects(ImapClient.connect({ ...config, secure: false, startTls: true }, server.factory), /STARTTLS/)
})

test('délai dépassé et connexion coupée', async () => {
  const silent = new FakeServer('* PREAUTH [CAPABILITY IMAP4rev1] ready\r\n', () => undefined)
  const client = await ImapClient.connect({ ...config, timeoutMs: 50 }, silent.factory)
  await assert.rejects(client.select('INBOX'), /Délai/)
  assert.ok(silent.closed)
  await assert.rejects(client.select('INBOX'), /fermée/)

  const hangUp = new FakeServer('* PREAUTH [CAPABILITY IMAP4rev1] ready\r\n', ({ text }, server) => {
    if (text.startsWith('SELECT')) {
      server.send('* BYE Server shutting down\r\n')
      server.hangUp()
    }
  })
  const other = await ImapClient.connect(config, hangUp.factory)
  await assert.rejects(other.select('INBOX'), (error: unknown) => {
    assert.ok(error instanceof ImapError)
    assert.equal(error.status, 'BYE')
    assert.match(error.message, /shutting down/)
    return true
  })
})

test('accueil BYE : connexion refusée', async () => {
  const server = new FakeServer('* BYE Too many connections\r\n', () => undefined)
  await assert.rejects(ImapClient.connect(config, server.factory), /Too many connections/)
})

test('commandes simultanées : jamais entremêlées', async () => {
  const server = new FakeServer('* PREAUTH [CAPABILITY IMAP4rev1] ready\r\n', ({ tag, text }) => {
    if (text.startsWith('EXAMINE')) return `* 1 EXISTS\r\n* OK [UIDVALIDITY 9] ok\r\n${tag} OK [READ-ONLY]\r\n`
    if (text.startsWith('UID SEARCH')) return `* SEARCH 5\r\n${tag} OK\r\n`
    return `${tag} OK\r\n`
  })
  const client = await ImapClient.connect(config, server.factory)
  const [selected, uids] = await Promise.all([client.select('INBOX', { readOnly: true }), client.searchUids('ALL')])
  assert.equal(selected.uidValidity, 9)
  assert.deepEqual(uids, [5])
  assert.equal(server.commands[0].text, 'EXAMINE "INBOX"')
  await client.logout()
})

test('suppression : MOVE vers la corbeille, sinon COPY + \\Deleted + EXPUNGE', async () => {
  const run = async (caps: string) => {
    const server = new FakeServer(`* OK [CAPABILITY ${caps}] ready\r\n`, ({ tag, text }) => {
      if (text.startsWith('LOGIN')) return `${tag} OK Logged in\r\n`
      if (text === 'CAPABILITY') return `* CAPABILITY ${caps}\r\n${tag} OK done\r\n`
      if (text === 'SELECT "INBOX"') return `* 3 EXISTS\r\n* OK [UIDVALIDITY 7] ok\r\n${tag} OK [READ-WRITE] Select completed\r\n`
      if (text.startsWith('UID MOVE')) return `* OK [COPYUID 7 4,5 1:2] moved\r\n* 2 EXPUNGE\r\n* 1 EXPUNGE\r\n${tag} OK Move completed\r\n`
      if (text.startsWith('UID COPY') || text.startsWith('UID STORE') || text.startsWith('UID EXPUNGE') || text === 'EXPUNGE') return `${tag} OK done\r\n`
      if (text === 'LOGOUT') return `* BYE\r\n${tag} OK bye\r\n`
      return `${tag} BAD ${text}\r\n`
    })
    const client = await ImapClient.connect(config, server.factory)
    await client.select('INBOX')
    await client.move([5, 4], 'Corbeille')
    await client.delete([9])
    await client.logout()
    return server.commands.map((command) => command.text).filter((text) => /^(UID (MOVE|COPY|STORE|EXPUNGE)|EXPUNGE)/.test(text))
  }

  assert.deepEqual(await run('IMAP4rev1 MOVE UIDPLUS'), [
    'UID MOVE 4:5 "Corbeille"',
    'UID STORE 9 +FLAGS.SILENT (\\Deleted)',
    'UID EXPUNGE 9',
  ])
  assert.deepEqual(await run('IMAP4rev1 UIDPLUS'), [
    'UID COPY 4:5 "Corbeille"',
    'UID STORE 4:5 +FLAGS.SILENT (\\Deleted)',
    'UID EXPUNGE 4:5',
    'UID STORE 9 +FLAGS.SILENT (\\Deleted)',
    'UID EXPUNGE 9',
  ])
  assert.deepEqual(await run('IMAP4rev1'), [
    'UID COPY 4:5 "Corbeille"',
    'UID STORE 4:5 +FLAGS.SILENT (\\Deleted)',
    'EXPUNGE',
    'UID STORE 9 +FLAGS.SILENT (\\Deleted)',
    'EXPUNGE',
  ])
})
