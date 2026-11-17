import { themeTokens } from '../shared/theme'

/**
 * L'admin reprend l'identité du site : Arial, angles vifs, traits d'encre,
 * ombres dures, accent vert. Thème clair et sombre comme le site.
 */
export const adminStyles = `
${themeTokens}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; background: var(--page); }
body {
  margin: 0;
  font-family: var(--font);
  font-size: 15px;
  line-height: 1.5;
  color: var(--ink);
  background: var(--page);
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4, p, dl, dd, ul, ol, figure { margin: 0; }
ul, ol { padding: 0; list-style: none; }
a { color: inherit; }
button, input, select, textarea { font: inherit; color: inherit; }
img { display: block; max-width: 100%; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
::selection { background: var(--accent-soft); color: var(--ink); }
[hidden] { display: none !important; }
.ms { display: block; flex: none; }

/* ---------- Ossature ---------- */
.shell { display: grid; grid-template-columns: 244px minmax(0, 1fr); min-height: 100vh; }
.side {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 14px;
  background: var(--side);
  border-right: var(--bw) solid var(--edge);
  overflow-y: auto;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -.045em;
  text-decoration: none;
}
.brand small {
  margin-left: auto;
  padding: 2px 6px;
  border: 2px solid var(--edge);
  background: var(--accent);
  color: var(--on-accent);
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.nav { display: grid; gap: 2px; }
.nav-group { margin: 10px 6px 4px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
.nav a {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 10px;
  border: 2px solid transparent;
  font-weight: 700;
  text-decoration: none;
  color: var(--ink-2);
}
.nav a:hover { background: color-mix(in srgb, var(--ink) 7%, transparent); color: var(--ink); }
.nav a[aria-current="page"] {
  background: var(--surface);
  border-color: var(--edge);
  color: var(--ink);
  box-shadow: 3px 3px 0 var(--edge);
}
.nav .count {
  margin-left: auto;
  min-width: 22px;
  padding: 1px 6px;
  border: 2px solid var(--edge);
  background: var(--accent);
  color: var(--on-accent);
  font-size: 11px;
  text-align: center;
}
.nav .count.err { background: var(--err-soft); color: var(--err); border-color: var(--err); }
.side-foot { margin-top: auto; display: grid; gap: 8px; }
.side-foot form { display: contents; }

.main { min-width: 0; padding: 28px clamp(16px, 3vw, 40px) 64px; }
.page { max-width: 1180px; margin: 0 auto; }
.page-narrow { max-width: 820px; }

.topbar { display: none; }
@media (max-width: 900px) {
  .shell { grid-template-columns: minmax(0, 1fr); align-content: start; }
  .side { display: none; }
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--side);
    border-bottom: var(--bw) solid var(--edge);
    overflow-x: auto;
  }
  .topbar a { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 10px; font-weight: 700; text-decoration: none; white-space: nowrap; }
  .topbar a[aria-current="page"] { background: var(--surface); outline: 2px solid var(--edge); }
  .main { padding-top: 20px; }
}

/* ---------- En-tête de page ---------- */
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px 20px;
  margin-bottom: 22px;
}
.head h1 { font-size: clamp(26px, 3vw, 34px); font-weight: 700; letter-spacing: -.035em; line-height: 1.05; }
.head p { margin-top: 6px; color: var(--ink-3); }
.crumb { display: inline-flex; align-items: center; gap: 4px; margin-bottom: 8px; font-size: 13px; font-weight: 700; color: var(--ink-3); text-decoration: none; }
.crumb:hover { color: var(--ink); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.actions form { display: contents; }

/* ---------- Boutons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border: var(--bw) solid var(--edge);
  background: var(--surface);
  color: var(--ink);
  font: 700 13px/1.1 var(--font);
  letter-spacing: .05em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: var(--shadow-btn);
  transition: transform .1s ease, box-shadow .1s ease;
}
.btn:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-btn-hover); }
.btn:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 var(--edge); }
.btn[disabled], .btn[aria-disabled="true"] { opacity: .5; pointer-events: none; }
.btn-primary { background: var(--accent); color: var(--on-accent); }
.btn-danger { background: var(--err-soft); color: var(--err); border-color: var(--err); box-shadow: 4px 4px 0 var(--err); }
.btn-danger:hover { box-shadow: 6px 6px 0 var(--err); }
.btn-ghost { border-color: transparent; background: transparent; box-shadow: none; }
.btn-ghost:hover { transform: none; box-shadow: none; background: color-mix(in srgb, var(--ink) 7%, transparent); }
.btn-sm { min-height: 34px; padding: 0 10px; font-size: 12px; box-shadow: 3px 3px 0 var(--edge); }
.btn-block { width: 100%; }
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 2px solid var(--edge);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}
.icon-btn:hover { background: var(--raised); }
.icon-btn.danger { color: var(--err); }
.theme-ico-sun { display: none; }
:root.dark .theme-ico-sun { display: block; }
:root.dark .theme-ico-moon { display: none; }
.link { font-weight: 700; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
.link:hover { color: var(--accent-ink); }
.muted { color: var(--ink-3); }
.small { font-size: 13px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; }
.nowrap { white-space: nowrap; }
.right { text-align: right; }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }

/* ---------- Cartes ---------- */
.card {
  background: var(--surface);
  border: var(--bw) solid var(--edge);
  box-shadow: var(--shadow-card);
}
.card + .card, .card + .grid, .grid + .card, .grid + .grid, .stack > * + * { margin-top: 22px; }
.card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: var(--bw) solid var(--edge);
  background: var(--sunken);
}
.card-head h2 { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
.card-body { padding: 18px; }
.card-body > * + * { margin-top: 14px; }
.card-flush { padding: 0; }

.grid { display: grid; gap: 22px; }
.grid > * { margin-top: 0 !important; }
.grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-side { grid-template-columns: minmax(0, 1fr) 340px; align-items: start; }
@media (max-width: 1100px) { .grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grid-side { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 720px) { .grid-2, .grid-3, .grid-4 { grid-template-columns: minmax(0, 1fr); } }

.stat { padding: 16px 18px; }
.stat-label { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
.stat-value { margin-top: 6px; font-size: 28px; font-weight: 700; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
.stat-note { margin-top: 2px; font-size: 13px; color: var(--ink-3); }
.stat a { text-decoration: none; }

/* ---------- Tableaux ---------- */
.table-wrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 11px 14px; text-align: left; vertical-align: top; border-bottom: 1.5px solid var(--line); }
.table th { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); background: var(--sunken); border-bottom: 2px solid var(--edge); }
.table tr:last-child td { border-bottom: 0; }
.table tbody tr:hover td { background: color-mix(in srgb, var(--ink) 4%, transparent); }
.table a.row-link { font-weight: 700; text-decoration: none; }
.table a.row-link:hover { text-decoration: underline; }
.table .unread td { font-weight: 700; }
.table td.pick { width: 1%; padding-right: 0; }
.table td.pick input, .card-head .check input { width: 18px; height: 18px; margin: 0; accent-color: var(--accent); }
.card-head .check { align-items: center; font-size: 13px; letter-spacing: 0; text-transform: none; }
.table .unread td .small { font-weight: 400; }
.mail-row { display: grid; gap: 2px; text-decoration: none; }
.mail-row-top { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
.mail-row-top span:last-child { flex: none; color: var(--ink-3); font-weight: 400; }
.mail-row:hover strong { text-decoration: underline; }
.table .num { text-align: right; }
.table tfoot td { font-weight: 700; border-top: 2px solid var(--edge); }

/* ---------- Pastilles ---------- */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 2px solid currentColor;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.b-off { color: var(--ink-3); background: var(--sunken); }
.b-info { color: var(--info); background: var(--info-soft); }
.b-warn { color: var(--warn); background: var(--warn-soft); }
.b-ok { color: var(--ok); background: var(--ok-soft); }
.b-err { color: var(--err); background: var(--err-soft); }
.dot { display: inline-block; width: 9px; height: 9px; border: 2px solid var(--edge); background: var(--accent); }

/* ---------- Messages ---------- */
.flash {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border: var(--bw) solid currentColor;
}
.flash p { color: var(--ink); font-weight: 400; }
.flash-ok { color: var(--ok); background: var(--ok-soft); }
.flash-err { color: var(--err); background: var(--err-soft); }
.flash-info { color: var(--info); background: var(--info-soft); }
.flash-warn { color: var(--warn); background: var(--warn-soft); }

.empty { padding: 36px 18px; text-align: center; color: var(--ink-3); }
.empty .ms { margin: 0 auto 10px; color: var(--ink-3); }
.empty h3 { color: var(--ink); font-size: 17px; }
.empty p { margin-top: 4px; }
.empty .btn { margin-top: 16px; }

/* ---------- Formulaires ---------- */
.form > * + * { margin-top: 16px; }
.fields { display: grid; gap: 14px 18px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.fields-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.fields .full { grid-column: 1 / -1; }
@media (max-width: 720px) { .fields, .fields-3 { grid-template-columns: minmax(0, 1fr); } }
.field { display: grid; gap: 6px; align-content: start; }
.field > span, .label { font-size: 13px; font-weight: 700; }
.field small, .hint { font-size: 12.5px; color: var(--ink-3); }
.input, .select, .textarea {
  width: 100%;
  min-height: 42px;
  padding: 9px 11px;
  border: 2px solid var(--edge);
  background: var(--raised);
  color: var(--ink);
  border-radius: 0;
}
.input:focus, .select:focus, .textarea:focus { outline: 3px solid var(--focus); outline-offset: 0; }
.textarea { min-height: 96px; resize: vertical; line-height: 1.5; }
.textarea.tall { min-height: 220px; }
.input[readonly] { background: var(--sunken); color: var(--ink-2); }
.input-sm { min-height: 36px; padding: 6px 9px; }
.check { display: flex; align-items: flex-start; gap: 10px; font-weight: 700; cursor: pointer; }
.check input { width: 18px; height: 18px; margin: 2px 0 0; accent-color: var(--accent); }
.check small { display: block; font-weight: 400; }
.form-foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 2px dashed var(--line);
}
.search { display: flex; gap: 8px; max-width: 420px; }
.tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }
.tabs a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 2px solid var(--edge);
  background: var(--surface);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.tabs a[aria-current="page"] { background: var(--accent); color: var(--on-accent); box-shadow: 3px 3px 0 var(--edge); }
.toolbar-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.toolbar-row .tabs { margin: 0; }

/* Lignes répétées (lignes de facture, expériences du CV…) */
.rep-list > * + * { margin-top: 12px; }
.rep-item {
  position: relative;
  padding: 14px;
  border: 2px solid var(--edge);
  background: var(--raised);
}
.rep-item-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.rep-item-head strong { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-3); }
.rep-tools { display: flex; gap: 6px; }
.rep-add { margin-top: 12px; }
.line-grid { display: grid; grid-template-columns: minmax(0, 1fr) 96px 110px 130px 120px; gap: 10px; align-items: end; }
.line-grid .details { grid-column: 1 / -1; }
.line-total { min-height: 42px; display: flex; align-items: center; justify-content: flex-end; font-weight: 700; font-variant-numeric: tabular-nums; }
@media (max-width: 900px) { .line-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .line-grid .title { grid-column: 1 / -1; } }

.totals { display: grid; gap: 4px; width: min(320px, 100%); margin-left: auto; }
.totals div { display: flex; justify-content: space-between; gap: 16px; font-variant-numeric: tabular-nums; }
.totals .grand { margin-top: 6px; padding-top: 8px; border-top: var(--bw) solid var(--edge); font-size: 18px; font-weight: 700; }

/* ---------- Fiches ---------- */
.kv { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 8px 14px; }
.kv dt { font-size: 13px; font-weight: 700; color: var(--ink-3); }
.kv dd { min-width: 0; overflow-wrap: anywhere; }
.timeline li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 10px; padding: 8px 0; border-bottom: 1.5px dotted var(--line-strong); }
.timeline li:last-child { border-bottom: 0; }
.timeline li::before { content: ""; width: 10px; height: 10px; margin-top: 5px; border: 2px solid var(--edge); background: var(--accent); }
.timeline small { display: block; color: var(--ink-3); font-size: 12.5px; }

/* Aperçu d'un document A4 ou d'un mail */
.preview-frame { display: block; width: 100%; height: 900px; border: var(--bw) solid var(--edge); background: #FFFFFF; box-shadow: var(--shadow-card); }
.mail-frame { display: block; width: 100%; min-height: 420px; border: 0; background: #FFFFFF; }
.mail-text { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14.5px; line-height: 1.6; }
.mail-meta { display: grid; gap: 4px; font-size: 14px; }
.mail-meta b { display: inline-block; min-width: 56px; color: var(--ink-3); }
.attachments { display: flex; flex-wrap: wrap; gap: 8px; }
.attachments a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 2px solid var(--edge);
  background: var(--raised);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.attachments a:hover { background: var(--sunken); }

/* ---------- Connexion ---------- */
.auth {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: repeating-conic-gradient(var(--side) 0 25%, var(--check) 0 50%) 0 0 / 32px 32px;
}
.auth-card { width: min(420px, 100%); background: var(--surface); border: var(--bw) solid var(--edge); box-shadow: var(--shadow-pop); }
.auth-card .card-body { padding: 24px; }
.auth-card h1 { font-size: 26px; letter-spacing: -.03em; }
.qr { width: 196px; height: 196px; border: 2px solid var(--edge); background: #FFFFFF; }

/* Encaissements par mois */
.bars { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 4px; height: 130px; }
.bar { display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 4px; text-align: center; }
.bar span { align-self: end; height: max(var(--h), 3px); background: var(--accent-soft); border: 2px solid var(--edge); }
.bar.now span { background: var(--accent); }
.bar small { font-size: 10px; font-weight: 700; color: var(--ink-3); }
a.card { display: block; text-decoration: none; }
a.card:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-pop); }
.inline { display: inline-block; vertical-align: -2px; }
.pager { margin-top: 16px; }

/* Éditeur du CV : formulaire et aperçu réduit de la feuille A4 */
.cv-editor { display: grid; grid-template-columns: minmax(0, 1fr) 434px; gap: 22px; align-items: start; }
.cv-side { position: sticky; top: 20px; display: grid; gap: 16px; }
.cv-preview-box { width: 434px; height: 606px; overflow: hidden; border: var(--bw) solid var(--edge); background: var(--page); box-shadow: var(--shadow-card); }
.cv-preview-box iframe { width: 868px; height: 1212px; border: 0; transform: scale(.5); transform-origin: 0 0; }
.cv-preview .flash { margin-bottom: 10px; }
.cv-preview > p.small { margin-top: 14px; }
.cv-thumb { width: 72px; height: 72px; object-fit: cover; border: 2px solid var(--edge); }
.cv-foot { position: sticky; bottom: 0; z-index: 5; align-items: center; padding: 12px; margin: 0 -12px; background: var(--page); }
.cv-foot .input { flex: 1; min-width: 200px; }
.timeline .btn { margin-top: 6px; }
@media (max-width: 1240px) {
  .cv-editor { grid-template-columns: minmax(0, 1fr); }
  .cv-side { position: static; }
}
@media (max-width: 520px) {
  .cv-preview-box { width: 100%; height: 420px; }
  .cv-preview-box iframe { transform: scale(.35); }
}

@media (prefers-reduced-motion: reduce) { .btn, a.card { transition: none; } }
`
