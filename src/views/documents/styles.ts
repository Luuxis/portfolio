import { paperTokens } from '../shared/theme'

/**
 * Devis, factures et avoirs : une feuille A4 qui s'allonge sur plusieurs pages
 * si besoin (l'en-tête du tableau se répète). Même papier que le CV : Arial,
 * encre, accent vert, angles vifs.
 */
export const documentStyles = `
${paperTokens}
*, *::before, *::after { box-sizing: border-box; }
/* Marges données au rendu PDF (DocumentPdfService), où Chrome dessine le pied de page. */
@page { size: A4; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  margin: 0;
  font-family: var(--font);
  font-size: 10.5px;
  line-height: 1.45;
  color: var(--ink);
  background: #FFFFFF;
}
h1, h2, h3, p, ul, dl, dd { margin: 0; }
ul { padding: 0; list-style: none; }

.doc { position: relative; }
@media screen {
  body { background: var(--page); padding: 20px 12px; }
  .doc { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm; background: #FFFFFF; box-shadow: 0 0 0 3px var(--edge), 10px 10px 0 3px var(--edge); zoom: var(--fit, 1); }
}

.doc-bar { height: 8px; margin-bottom: 18px; background: var(--accent); border: 2px solid var(--edge); }
.doc-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: start; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand-name { font-size: 24px; font-weight: 700; letter-spacing: -.04em; line-height: 1; }
.brand-sub { margin-top: 3px; font-size: 11px; color: var(--ink-3); }
.doc-title { text-align: right; }
.doc-title h1 { font-size: 30px; font-weight: 700; letter-spacing: -.04em; line-height: 1; text-transform: uppercase; }
.doc-meta { display: grid; grid-template-columns: auto auto; justify-content: end; gap: 2px 12px; margin-top: 10px; font-size: 11px; }
.doc-meta dt { color: var(--ink-3); text-align: right; }
.doc-meta dd { font-weight: 700; text-align: right; }

.parties { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
.party { padding: 12px 14px; border: 2px solid var(--edge); }
.party-client { background: var(--sunken); }
.party h2 { margin-bottom: 6px; font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
.party .name { font-size: 12.5px; font-weight: 700; }
.party p { white-space: pre-line; }
.party .ids { margin-top: 5px; color: var(--ink-2); }

.subject { margin-top: 20px; font-size: 12px; }
.subject b { font-weight: 700; }

.lines { width: 100%; margin-top: 12px; border-collapse: collapse; }
.lines thead { display: table-header-group; }
.lines tr { break-inside: avoid; }
.lines th {
  padding: 8px 10px;
  background: var(--edge);
  color: #FFFFFF;
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: .08em;
  text-align: left;
  text-transform: uppercase;
}
.lines td { padding: 10px; vertical-align: top; border-bottom: 1.5px solid var(--line); }
.lines .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.lines .title { font-weight: 700; font-size: 11px; }
.lines .details { margin-top: 3px; color: var(--ink-3); }
.lines .details li { display: grid; grid-template-columns: 10px minmax(0, 1fr); }
.lines .details li::before { content: ""; width: 4px; height: 4px; margin-top: .55em; background: var(--accent-ink); }

.bottom { display: grid; grid-template-columns: minmax(0, 1fr) 250px; gap: 24px; margin-top: 16px; break-inside: avoid; }
.mentions { color: var(--ink-2); }
.mentions p + p { margin-top: 6px; }
.mentions .vat { font-weight: 700; color: var(--ink); }
.totals { border: 2px solid var(--edge); }
.totals div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 12px; font-variant-numeric: tabular-nums; }
.totals div + div { border-top: 1.5px solid var(--line); }
.totals .grand { background: var(--accent); border-top: 2px solid var(--edge); font-size: 13px; font-weight: 700; }

.pay { margin-top: 18px; padding: 12px 14px; border: 2px dashed var(--line-strong); break-inside: avoid; }
.pay h2 { margin-bottom: 6px; font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
.pay dl { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 2px 10px; margin-top: 6px; }
.pay dt { color: var(--ink-3); }
.pay dd { font-weight: 700; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10.5px; }

.notes { margin-top: 16px; white-space: pre-line; color: var(--ink-2); break-inside: avoid; }
.sign { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; break-inside: avoid; }
.sign div { min-height: 84px; padding: 10px 12px; border: 2px solid var(--edge); }
.sign h2 { font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
.legal { margin-top: 20px; padding-top: 10px; border-top: 2px solid var(--edge); font-size: 9px; color: var(--ink-3); break-inside: avoid; }
.legal p + p { margin-top: 4px; }

.draft-mark {
  position: fixed;
  top: 40%;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 110px;
  font-weight: 700;
  letter-spacing: .05em;
  color: rgba(27, 23, 18, .07);
  transform: rotate(-24deg);
  pointer-events: none;
}
`

/** À l'écran (aperçu dans l'admin), la feuille est réduite pour tenir en largeur ; jamais à l'impression. */
export const documentFitScript = `(function(){var r=document.documentElement;function fit(){r.style.setProperty('--fit',String(Math.max(.4,Math.min(1,(r.clientWidth-36)/806))))}fit();window.addEventListener('resize',fit)})();`
