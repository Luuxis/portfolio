import { renderToString } from 'hono/jsx/dom/server'
import { fillTemplate, formatSiren } from '../../lib/billing/identity'
import { TYPE_LABEL } from '../../lib/billing/labels'
import { daysBetween, formatDate, formatEuros, formatQuantity, formatRate, todayIso } from '../../lib/billing/money'
import type { PrintableDocument } from '../../services/document.service'
import { typo } from '../../models/typo'
import { LogoMark } from '../shared/Icon'
import { documentFitScript, documentStyles } from './styles'

function plural(unit: string, quantity: number): string {
  if (!unit) return ''
  return quantity >= 2 && !/[sx]$/i.test(unit) ? `${unit}s` : unit
}

function lines(text: string | null | undefined): string[] {
  return (text ?? '')
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
}

function Sheet({ data }: { data: PrintableDocument }) {
  const { doc, issuer: snapshot, client, sourceNumber } = data
  const { issuer, legal } = snapshot
  const draft = doc.status === 'draft'
  const issueDate = doc.issueDate ?? todayIso()
  const brand = issuer.tradeName || issuer.legalName || 'Émetteur'
  const vars = {
    numero: doc.number ?? '(numéro attribué à l’émission)',
    delai: doc.dueDate ? String(Math.max(0, daysBetween(issueDate, doc.dueDate))) : '',
    echeance: formatDate(doc.dueDate),
    validite: formatDate(doc.dueDate),
  }
  const t = (template: string) => typo(fillTemplate(template, vars))
  const grandLabel = doc.type === 'invoice' ? 'Net à payer' : doc.type === 'credit_note' ? "Montant de l'avoir" : doc.vatRate ? 'Total TTC' : 'Total'
  const issuerName = [issuer.legalName, issuer.legalForm].filter(Boolean).join(', ')
  const clientLocality = [client.postalCode, client.city].filter(Boolean).join(' ')

  return (
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{`${TYPE_LABEL[doc.type]} ${doc.number ?? '(brouillon)'}`}</title>
        <style dangerouslySetInnerHTML={{ __html: documentStyles }} />
      </head>
      <body>
        {draft ? <div class="draft-mark">BROUILLON</div> : null}
        <main class="doc">
          <div class="doc-bar" />
          <header class="doc-head">
            <div class="brand">
              <LogoMark size={40} />
              <div>
                <p class="brand-name">{brand}</p>
                {issuer.tradeName && issuer.legalName ? <p class="brand-sub">{issuerName}</p> : null}
              </div>
            </div>
            <div class="doc-title">
              <h1>{TYPE_LABEL[doc.type]}</h1>
              <dl class="doc-meta">
                <dt>N°</dt>
                <dd>{doc.number ?? 'Brouillon'}</dd>
                <dt>Date</dt>
                <dd>{draft ? '—' : formatDate(issueDate)}</dd>
                {doc.type === 'invoice' && doc.dueDate ? (
                  <>
                    <dt>Échéance</dt>
                    <dd>{formatDate(doc.dueDate)}</dd>
                  </>
                ) : null}
                {doc.type === 'quote' && doc.dueDate ? (
                  <>
                    <dt>Valable jusqu'au</dt>
                    <dd>{formatDate(doc.dueDate)}</dd>
                  </>
                ) : null}
                {sourceNumber && doc.type === 'invoice' ? (
                  <>
                    <dt>Réf. devis</dt>
                    <dd>{sourceNumber}</dd>
                  </>
                ) : null}
                {sourceNumber && doc.type === 'credit_note' ? (
                  <>
                    <dt>Facture annulée</dt>
                    <dd>{sourceNumber}</dd>
                  </>
                ) : null}
              </dl>
            </div>
          </header>

          <section class="parties">
            <div class="party">
              <h2>Émetteur</h2>
              <p class="name">{issuerName}</p>
              {issuer.tradeName ? <p>Nom commercial : {issuer.tradeName}</p> : null}
              <p>{[issuer.address, [issuer.postalCode, issuer.city].filter(Boolean).join(' '), issuer.country].filter(Boolean).join('\n')}</p>
              <p class="ids">
                {issuer.siren ? `SIREN : ${formatSiren(issuer.siren)}` : null}
                {issuer.vatNumber ? <><br />TVA : {issuer.vatNumber}</> : null}
                {issuer.registration ? <><br />{issuer.registration}</> : null}
              </p>
              {issuer.email || issuer.phone ? <p class="ids">{[issuer.email, issuer.phone].filter(Boolean).join(' · ')}</p> : null}
            </div>
            <div class="party party-client">
              <h2>Client</h2>
              <p class="name">{client.name}</p>
              {client.contactName && client.contactName !== client.name ? <p>À l'attention de {client.contactName}</p> : null}
              <p>{[client.address, clientLocality, client.country].filter(Boolean).join('\n')}</p>
              {client.siren || client.vatNumber ? (
                <p class="ids">
                  {client.siren ? `SIREN : ${formatSiren(client.siren)}` : null}
                  {client.siren && client.vatNumber ? <br /> : null}
                  {client.vatNumber ? `TVA : ${client.vatNumber}` : null}
                </p>
              ) : null}
            </div>
          </section>

          {doc.subject ? (
            <p class="subject">
              <b>Objet : </b>
              {typo(doc.subject)}
            </p>
          ) : null}

          <table class="lines">
            <thead>
              <tr>
                <th>Désignation</th>
                <th class="num">Quantité</th>
                <th class="num">Prix unitaire HT</th>
                <th class="num">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line) => (
                <tr>
                  <td>
                    <p class="title">{typo(line.title)}</p>
                    {lines(line.details).length ? (
                      <ul class="details">
                        {lines(line.details).map((detail) => (
                          <li>{typo(detail)}</li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td class="num">
                    {formatQuantity(line.quantity)} {plural(line.unit ?? '', line.quantity)}
                  </td>
                  <td class="num">{formatEuros(line.unitPriceCents)}</td>
                  <td class="num">{formatEuros(line.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <section class="bottom">
            <div class="mentions">
              <p class="vat">{doc.vatRate ? `TVA au taux de ${formatRate(doc.vatRate)}.` : 'TVA non applicable, art. 293 B du CGI.'}</p>
              {doc.type === 'credit_note' && sourceNumber ? <p>Avoir émis en annulation de la facture {sourceNumber}.</p> : null}
              {doc.type === 'quote' && doc.terms ? <p>{t(doc.terms)}</p> : null}
              {doc.type === 'quote' && draft && !doc.terms && legal.quoteAcceptance ? <p>{t(legal.quoteAcceptance)}</p> : null}
            </div>
            <div class="totals">
              <div>
                <span>Total HT</span>
                <span>{formatEuros(doc.totalHtCents)}</span>
              </div>
              {doc.vatRate ? (
                <div>
                  <span>TVA {formatRate(doc.vatRate)}</span>
                  <span>{formatEuros(doc.vatCents)}</span>
                </div>
              ) : null}
              <div class="grand">
                <span>{grandLabel}</span>
                <span>{formatEuros(doc.totalTtcCents)}</span>
              </div>
            </div>
          </section>

          {doc.type === 'invoice' ? (
            <section class="pay">
              <h2>Règlement</h2>
              <p>{t(doc.terms ?? legal.paymentTerms)}</p>
              {issuer.iban ? (
                <dl>
                  <dt>IBAN</dt>
                  <dd>{issuer.iban}</dd>
                  {issuer.bic ? (
                    <>
                      <dt>BIC</dt>
                      <dd>{issuer.bic}</dd>
                    </>
                  ) : null}
                  {issuer.bank ? (
                    <>
                      <dt>Banque</dt>
                      <dd>{issuer.bank}</dd>
                    </>
                  ) : null}
                </dl>
              ) : null}
            </section>
          ) : null}

          {doc.notes ? <p class="notes">{typo(doc.notes)}</p> : null}

          {doc.type === 'quote' ? (
            <section class="sign">
              <div>
                <h2>Date</h2>
              </div>
              <div>
                <h2>Signature du client, « Bon pour accord »</h2>
              </div>
            </section>
          ) : null}

          <footer class="legal">
            {doc.type === 'invoice' && legal.latePenalties ? <p>{typo(legal.latePenalties)}</p> : null}
            {legal.extraMention ? <p>{typo(legal.extraMention)}</p> : null}
            <p>
              {[issuerName, issuer.tradeName ? `nom commercial ${issuer.tradeName}` : '', issuer.siren ? `SIREN ${formatSiren(issuer.siren)}` : '', issuer.website]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </footer>
        </main>
        <script dangerouslySetInnerHTML={{ __html: documentFitScript }} />
      </body>
    </html>
  )
}

export function renderDocumentSheet(data: PrintableDocument): string {
  return `<!DOCTYPE html>${renderToString(<Sheet data={data} />)}`
}

/** Pied de page du PDF : numéro et pagination, dessinés par Chrome. */
export function documentFooterTemplate(data: PrintableDocument): string {
  const label = `${TYPE_LABEL[data.doc.type]} ${data.doc.number ?? 'brouillon'}`.replace(/[<>&]/g, '')
  return `<div style="width:100%;padding:0 14mm;font-family:Arial,sans-serif;font-size:8px;color:#5E5546;display:flex;justify-content:space-between;"><span>${label}</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`
}
