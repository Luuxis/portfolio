/// <reference types="node" />
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fillSubject, fillTemplate, parseSiren } from './identity'
import { displayStatus } from './labels'
import { addDays, computeTotals, daysBetween, formatEuros, lineTotal, parseAmount, parseQuantity, parseVatRate } from './money'
import { formatNumber, isValidPattern, numberParts } from './numbering'

test('montants saisis à la française', () => {
  assert.equal(parseAmount('65,00'), 6500)
  assert.equal(parseAmount('1 234,5 €'), 123450)
  assert.equal(parseAmount('12.5'), 1250)
  assert.equal(parseAmount('-50'), -5000)
  assert.equal(parseAmount('abc'), null)
  assert.equal(parseAmount('1,234'), null)
  assert.equal(parseQuantity('0,5'), 0.5)
  assert.equal(parseQuantity('-1'), null)
  assert.equal(parseVatRate(''), null)
  assert.equal(parseVatRate('20 %'), 20)
  assert.equal(parseVatRate('5,5'), 5.5)
  assert.equal(parseVatRate('200'), undefined)
})

test('totaux en centimes, TVA arrondie une fois', () => {
  const lines = [{ totalCents: lineTotal(8, 6500) }, { totalCents: lineTotal(1, 1250) }]
  assert.deepEqual(computeTotals(lines, null), { totalHtCents: 53250, vatCents: 0, totalTtcCents: 53250 })
  assert.deepEqual(computeTotals([{ totalCents: lineTotal(3, 333) }], 20), { totalHtCents: 999, vatCents: 200, totalTtcCents: 1199 })
  assert.equal(lineTotal(0.5, 45000), 22500)
  assert.equal(formatEuros(123450), '1 234,50 €')
})

test('dates calendaires', () => {
  assert.equal(addDays('2026-12-28', 7), '2027-01-04')
  assert.equal(daysBetween('2026-07-31', '2026-08-07'), 7)
})

test('numérotation : compteur annuel ou mensuel', () => {
  const invoice = numberParts('invoice', 'F{YYYY}-{NNN}', '2026-08-14')
  assert.equal(invoice.key, 'invoice:2026')
  assert.equal(formatNumber(invoice, 3), 'F2026-003')
  const quote = numberParts('quote', 'D{YYYY}-{MM}-{NNN}', '2026-08-14')
  assert.equal(quote.key, 'quote:2026-08')
  assert.equal(formatNumber(quote, 1), 'D2026-08-001')
  assert.equal(formatNumber(numberParts('credit_note', 'AV-{YY}{NNNN}', '2026-01-02'), 12), 'AV-260012')
  assert.ok(isValidPattern('F{YYYY}-{NNN}'))
  assert.ok(!isValidPattern('F{YYYY}'))
  assert.ok(!isValidPattern('F{NNN}-{NNN}'))
  assert.ok(!isValidPattern('F{DD}-{NNN}'))
})

test('modèles de mails', () => {
  assert.equal(fillTemplate('Facture {numero} de {montant}, {inconnu}', { numero: 'F2026-003', montant: '10 €' }), 'Facture F2026-003 de 10 €, {inconnu}')
  assert.equal(fillSubject('Facture {numero} : {objet}', { numero: 'F2026-003', objet: '' }), 'Facture F2026-003')
  assert.equal(fillSubject('Devis {numero} : {objet}', { numero: 'D1', objet: 'Refonte' }), 'Devis D1 : Refonte')
})

test('SIREN et statut en retard', () => {
  assert.deepEqual(parseSiren('910 156 207'), { ok: true, value: '910156207' })
  assert.deepEqual(parseSiren(''), { ok: true, value: null })
  assert.deepEqual(parseSiren('12345'), { ok: false })
  assert.equal(displayStatus({ type: 'invoice', status: 'sent', dueDate: '2026-11-01' }, '2026-11-17'), 'overdue')
  assert.equal(displayStatus({ type: 'invoice', status: 'paid', dueDate: '2026-11-01' }, '2026-11-17'), 'paid')
  assert.equal(displayStatus({ type: 'quote', status: 'sent', dueDate: '2026-11-01' }, '2026-11-17'), 'sent')
})
