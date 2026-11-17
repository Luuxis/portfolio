/// <reference types="node" />
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decodeMailboxName, encodeMailboxName } from './utf7'

test('UTF-7 modifié : exemple français', () => {
  assert.equal(decodeMailboxName('&AMk-l&AOk-ments envoy&AOk-s'), 'Éléments envoyés')
  assert.equal(encodeMailboxName('Éléments envoyés'), '&AMk-l&AOk-ments envoy&AOk-s')
})

test('UTF-7 modifié : esperluette, ASCII et noms simples', () => {
  assert.equal(encodeMailboxName('A&B'), 'A&-B')
  assert.equal(decodeMailboxName('A&-B'), 'A&B')
  assert.equal(encodeMailboxName('INBOX/Sent Items'), 'INBOX/Sent Items')
  assert.equal(decodeMailboxName('INBOX'), 'INBOX')
})

test('UTF-7 modifié : exemples de la RFC 3501 et aller-retour', () => {
  // RFC 3501 §5.1.3 : « ~peter/mail/台北/日本語 »
  assert.equal(decodeMailboxName('~peter/mail/&U,BTFw-/&ZeVnLIqe-'), '~peter/mail/台北/日本語')
  assert.equal(encodeMailboxName('~peter/mail/台北/日本語'), '~peter/mail/&U,BTFw-/&ZeVnLIqe-')

  for (const name of ['Brouillons', 'Corbeille', 'Courrier indésirable', 'Reçus/Clients & partenaires', 'Émoji 📬', 'ÿ']) {
    assert.equal(decodeMailboxName(encodeMailboxName(name)), name)
  }
})

test('UTF-7 modifié : un nom mal formé est rendu tel quel', () => {
  assert.equal(decodeMailboxName('Dossier &AMk'), 'Dossier &AMk')
})
