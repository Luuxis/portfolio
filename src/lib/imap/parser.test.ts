/// <reference types="node" />
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  Atom,
  formatInternalDate,
  ImapReader,
  parseInternalDate,
  parseResponse,
  parseValues,
  valueText,
  type RawResponse,
} from './parser'
import { uidSet } from './client'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/** Un flux qui livre `bytes` en morceaux de `size` octets. */
function streamOf(bytes: Uint8Array, size: number): ReadableStream<Uint8Array> {
  let offset = 0
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close()
        return
      }
      controller.enqueue(bytes.slice(offset, offset + size))
      offset += size
    },
  })
}

function concat(...parts: (string | Uint8Array)[]): Uint8Array {
  const chunks = parts.map((part) => (typeof part === 'string' ? encoder.encode(part) : part))
  const out = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

test('lecteur : lignes et littéraux coupés à n’importe quel octet', async () => {
  const body = concat('Subject: é\r\n\r\nligne\r\n', new Uint8Array([0, 255, 13, 10, 41]))
  const wire = concat(
    '* OK ready\r\n',
    `* 1 FETCH (UID 7 BODY[] {${body.length}}\r\n`,
    body,
    ' FLAGS (\\Seen))\r\n',
    'A1 OK done\r\n',
  )

  for (const size of [1, 2, 3, 7, 64, 4096]) {
    const reader = new ImapReader(streamOf(wire, size).getReader(), 1000)
    assert.deepEqual(await reader.readResponse(), ['* OK ready'])

    const fetch = await reader.readResponse()
    assert.equal(fetch.length, 3)
    assert.equal(fetch[0], '* 1 FETCH (UID 7 BODY[] ')
    assert.deepEqual(fetch[1], body)
    assert.equal(fetch[2], ' FLAGS (\\Seen))')

    assert.deepEqual(await reader.readResponse(), ['A1 OK done'])
    await assert.rejects(reader.readResponse(), /fermée/)
  }
})

test('lecteur : littéraux non synchronisés et littéral binaire', async () => {
  const wire = concat('* 2 FETCH (BODY[] ~{3}\r\nabc BODY[HEADER] {2+}\r\nxy)\r\n')
  const reader = new ImapReader(streamOf(wire, 5).getReader(), 1000)
  const parts = await reader.readResponse()
  assert.equal(decoder.decode(parts[1] as Uint8Array), 'abc')
  assert.equal(decoder.decode(parts[3] as Uint8Array), 'xy')
})

test('lecteur : délai dépassé', async () => {
  const silent = new ReadableStream<Uint8Array>({ pull() {} })
  const reader = new ImapReader(silent.getReader(), 20)
  await assert.rejects(reader.readResponse(), /Délai/)
})

test('tokenizer : listes, chaînes, NIL, sections et littéraux', () => {
  const literal = encoder.encode('Archives/26')
  const parts: RawResponse = ['(\\HasNoChildren \\Sent) "/" "dit \\"oui\\" \\\\ ok" NIL BODY[HEADER.FIELDS (FROM TO)] (a (b c) "") ', literal, ' x']
  const values = parseValues(parts)

  assert.equal(values.length, 8)
  assert.deepEqual(
    (values[0] as Atom[]).map((atom) => atom.value),
    ['\\HasNoChildren', '\\Sent'],
  )
  assert.equal(values[1], '/')
  assert.equal(values[2], 'dit "oui" \\ ok')
  assert.equal(values[3], null)
  assert.equal(valueText(values[4]), 'BODY[HEADER.FIELDS (FROM TO)]')
  assert.equal(valueText((values[5] as unknown[])[0] as Atom), 'a')
  assert.deepEqual(((values[5] as unknown[])[1] as Atom[]).map((atom) => atom.value), ['b', 'c'])
  assert.equal((values[5] as unknown[])[2], '')
  assert.equal(values[6], literal)
  assert.equal(valueText(values[7]), 'x')
})

test('tokenizer : parenthèse orpheline sans boucle infinie', () => {
  const values = parseValues(['a ) b (c'])
  assert.equal(values.length, 3)
})

test('réponses : état, code, nombre, continuation', () => {
  const status = parseResponse(['* OK [UIDVALIDITY 3857529045] UIDs valid'])
  assert.equal(status.tag, '*')
  assert.equal(status.status, 'OK')
  assert.equal(status.code, 'UIDVALIDITY 3857529045')
  assert.equal(status.text, 'UIDs valid')

  const tagged = parseResponse(['A3 NO [AUTHENTICATIONFAILED] Invalid credentials (failure)'])
  assert.equal(tagged.tag, 'A3')
  assert.equal(tagged.status, 'NO')
  assert.equal(tagged.code, 'AUTHENTICATIONFAILED')
  assert.equal(tagged.text, 'Invalid credentials (failure)')

  const exists = parseResponse(['* 23 EXISTS'])
  assert.equal(exists.number, 23)
  assert.equal(exists.keyword, 'EXISTS')

  const search = parseResponse(['* SEARCH 2 84 882'])
  assert.equal(search.keyword, 'SEARCH')
  assert.deepEqual(search.values.map(valueText), ['2', '84', '882'])

  const empty = parseResponse(['* SEARCH'])
  assert.deepEqual(empty.values, [])

  const more = parseResponse(['+ Ready for literal data'])
  assert.equal(more.tag, '+')
  assert.equal(more.text, 'Ready for literal data')

  const bare = parseResponse(['+'])
  assert.equal(bare.tag, '+')
  assert.equal(bare.text, '')
})

test('dates INTERNALDATE', () => {
  assert.equal(parseInternalDate('17-Jul-1996 02:44:25 -0700')?.toISOString(), '1996-07-17T09:44:25.000Z')
  assert.equal(parseInternalDate(' 7-Nov-2026 10:00:00 +0100')?.toISOString(), '2026-11-07T09:00:00.000Z')
  assert.equal(parseInternalDate('n’importe quoi'), null)
  assert.equal(formatInternalDate(new Date('2026-11-07T08:05:09Z')), '07-Nov-2026 08:05:09 +0000')
})

test('uidSet', () => {
  assert.equal(uidSet([1, 2, 3, 7]), '1:3,7')
  assert.equal(uidSet([9, 3, 4, 3, 10, 12]), '3:4,9:10,12')
  assert.equal(uidSet([5]), '5')
  assert.equal(uidSet([]), '')
})
