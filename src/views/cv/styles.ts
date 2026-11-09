import { paperTokens } from '../shared/theme'

/**
 * Le CV est une feuille A4 unique. À l'écran, elle est posée sur le fond
 * LuuxCraft avec son contour d'encre ; à l'impression (et dans le PDF généré
 * par Browser Rendering), il ne reste que la feuille.
 */
export const cvStyles = `
${paperTokens}

*, *::before, *::after { box-sizing: border-box; }
@page { size: A4; margin: 0; }
html {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  -webkit-text-size-adjust: 100%;
}
body {
  margin: 0;
  font-family: var(--font);
  color: var(--ink);
  background: var(--page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
h1, h2, h3, p, ul, dl, dd { margin: 0; }
ul { padding: 0; list-style: none; }
a { color: inherit; text-decoration: none; }
.ms { display: block; flex: none; }

/* ---------- Autour de la feuille (écran seulement) ---------- */
.cv-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  padding: 24px 16px 56px;
}
.toolbar {
  width: 210mm;
  max-width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 16px;
  border: 3px solid var(--edge);
  box-shadow: 4px 4px 0 var(--edge);
  font: 700 13px/1 var(--font);
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--surface);
  transition: transform .1s ease, box-shadow .1s ease;
}
.btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--edge); }
.btn:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 var(--edge); }
.btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
.btn-primary { background: var(--accent); color: var(--on-accent); }

/* ---------- La feuille ---------- */
.sheet {
  position: relative;
  width: 210mm;
  height: 297mm;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 30px 40px 40px;
  background: #FFFFFF;
  color: var(--ink);
  font-size: 10.5px;
  line-height: 1.42;
  box-shadow: 0 0 0 3px var(--edge), 11px 11px 0 3px var(--edge);
}
@media screen and (max-width: 860px) {
  .sheet { zoom: var(--fit, 1); }
}

/* En-tête */
.cv-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 24px;
  padding-bottom: 14px;
  border-bottom: 3px solid var(--edge);
}
.cv-name {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -.045em;
  line-height: 1;
}
.cv-role {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .09em;
  text-transform: uppercase;
}
.cv-role span {
  background: linear-gradient(transparent 62%, var(--accent) 62%, var(--accent) 94%, transparent 94%);
  padding: 0 2px;
}
.cv-now { margin-top: 5px; font-size: 11.5px; color: var(--ink-2); }
.cv-photo {
  grid-row: 1 / span 2;
  grid-column: 2;
  width: 88px;
  height: 88px;
  object-fit: cover;
  border: 2px solid var(--edge);
  box-shadow: 4px 4px 0 var(--edge);
}
.cv-contact {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 5px 18px;
  margin-top: 14px;
  font-size: 10px;
  font-weight: 700;
}
.cv-contact li { display: flex; align-items: center; gap: 5px; }
.cv-contact .ms { color: var(--accent-ink); }

.cv-intro {
  margin-top: 12px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--ink-2);
}

/* Titres de section */
.cv-h {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.cv-h::before {
  content: "";
  flex: none;
  width: 10px;
  height: 10px;
  background: var(--accent);
  border: 2px solid var(--edge);
}
.cv-h::after { content: ""; flex: 1; height: 2px; background: var(--edge); }

/* Expériences */
.job {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  column-gap: 16px;
}
.job + .job {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1.5px dotted var(--line-strong);
}
.job-when { padding-top: 1px; font-size: 10px; font-weight: 700; }
.job-place { display: block; margin-top: 2px; font-weight: 400; color: var(--ink-3); }
.job h3 { font-size: 12px; line-height: 1.3; }
.job-role { font-weight: 400; }
.job-ctx { margin-top: 1px; color: var(--ink-3); }
.job-list { display: grid; gap: 2px; margin-top: 4px; }
/* Puce dans le flux (pas en position absolue) : le texte du PDF garde
   chaque puce sous son poste, dans l'ordre de lecture. */
.job-list li {
  display: grid;
  grid-template-columns: 13px minmax(0, 1fr);
}
.job-list li::before {
  content: "";
  width: 6px;
  height: 6px;
  margin: .45em 0 0 1px;
  background: var(--accent);
  border: 1px solid var(--edge);
}
.job-stack { margin-top: 4px; font-size: 9.5px; color: var(--ink-3); }
.job-stack b { color: var(--ink-2); }

/* Bas de page en deux colonnes */
.cv-cols {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  column-gap: 30px;
}
.proj + .proj { margin-top: 7px; }
.proj h3 { font-size: 11px; line-height: 1.3; }
.proj-meta { font-size: 9.5px; font-weight: 400; color: var(--ink-3); }
.proj p { color: var(--ink-2); }

.edu li + li { margin-top: 6px; }
.edu h3 { font-size: 11px; line-height: 1.3; }
.edu p { color: var(--ink-3); }

.skills {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 3px 10px;
}
.skills dt { font-weight: 700; }
.skills dd { color: var(--ink-2); }

.langs li + li { margin-top: 2px; }
.langs b { font-weight: 700; }
.langs span { color: var(--ink-2); }
.outside { color: var(--ink-2); }

/* Relief en blocs, posé sur le bord bas de la feuille */
.cv-terrain {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 20px;
  border-bottom: 5px solid var(--edge);
}
.cv-terrain::before,
.cv-terrain::after { content: ""; position: absolute; inset: 0; }
.cv-terrain::before {
  background: var(--accent-soft);
  clip-path: polygon(0 100%, 0 50%, 4% 50%, 4% 16.667%, 11% 16.667%, 11% 0, 17% 0, 17% 33.333%, 26% 33.333%, 26% 16.667%, 33% 16.667%, 33% 50%, 44% 50%, 44% 0, 52% 0, 52% 33.333%, 63% 33.333%, 63% 16.667%, 71% 16.667%, 71% 50%, 80% 50%, 80% 16.667%, 88% 16.667%, 88% 0, 94% 0, 94% 33.333%, 100% 33.333%, 100% 100%);
}
.cv-terrain::after {
  background: var(--accent);
  clip-path: polygon(0 100%, 0 83.333%, 7% 83.333%, 7% 66.667%, 15% 66.667%, 15% 83.333%, 23% 83.333%, 23% 50%, 30% 50%, 30% 66.667%, 39% 66.667%, 39% 83.333%, 48% 83.333%, 48% 66.667%, 57% 66.667%, 57% 50%, 66% 50%, 66% 83.333%, 76% 83.333%, 76% 66.667%, 85% 66.667%, 85% 83.333%, 92% 83.333%, 92% 50%, 100% 50%, 100% 100%);
}

@media print {
  html, body { width: 210mm; height: 297mm; background: #FFFFFF; overflow: hidden; }
  .cv-screen { display: block; min-height: 0; padding: 0; }
  .toolbar { display: none; }
  .sheet { box-shadow: none; }
}

@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
}
`

/** À l'écran sur téléphone, la feuille A4 est réduite pour tenir en largeur. */
export const cvFitScript = `(function(){var root=document.documentElement;function fit(){var k=Math.min(1,(root.clientWidth-32)/806);root.style.setProperty('--fit',String(Math.max(.3,k)))}fit();window.addEventListener('resize',fit)})();`
