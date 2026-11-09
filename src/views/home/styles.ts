import { themeTokens } from '../shared/theme'

export const homeStyles = `
${themeTokens}

*, *::before, *::after { box-sizing: border-box; }
html {
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
  scroll-padding-top: 96px;
  background: var(--page);
}
body {
  margin: 0;
  font-family: var(--font);
  font-size: 17px;
  line-height: 1.55;
  color: var(--ink);
  background: var(--page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}
h1, h2, h3, p, dl, dd, ul, ol, figure { margin: 0; }
ul, ol { padding: 0; list-style: none; }
img { display: block; max-width: 100%; height: auto; }
a { color: inherit; }
button { font: inherit; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
::selection { background: var(--accent-soft); color: var(--ink); }
p, li, dd { text-wrap: pretty; }

.ms { display: block; flex: none; }

.skip {
  position: absolute;
  left: 16px;
  top: -100px;
  z-index: 100;
  padding: 10px 14px;
  background: var(--accent);
  color: var(--on-accent);
  border: var(--bw) solid var(--edge);
  font-weight: 700;
}
.skip:focus { top: 12px; }

.wrap {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-inline: clamp(16px, 5vw, 56px);
}

/* ---------- Typographie ---------- */
.lbl {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--ink-2);
}
.disp {
  font-weight: 700;
  letter-spacing: -.035em;
  line-height: 1;
  text-wrap: balance;
}
.mark {
  background: linear-gradient(transparent 68%, var(--accent) 68%, var(--accent) 92%, transparent 92%);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding: 0 .04em;
}

/* ---------- Boutons ---------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 20px;
  border: var(--bw) solid var(--edge);
  font: 700 14px/1.2 var(--font);
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
.btn-primary { background: var(--accent); color: var(--on-accent); }
.btn-secondary { background: var(--surface); color: var(--ink); }
.btn-sm { min-height: 40px; padding: 0 14px; font-size: 13px; }

.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: var(--bw) solid var(--edge);
  background: var(--surface);
  color: var(--ink);
  cursor: pointer;
}
.icon-btn:hover { background: var(--raised); }
.theme-ico-sun { display: none; }
:root.dark .theme-ico-sun { display: block; }
:root.dark .theme-ico-moon { display: none; }

.link-arrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
}
.link-arrow:hover { color: var(--accent-ink); }

/* ---------- En-tête ---------- */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--page);
  border-bottom: var(--bw) solid var(--edge);
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  text-decoration: none;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -.045em;
}
.logo-mark { display: block; flex: none; }
.nav-links { display: flex; gap: 2px; }
.nav-links a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}
.nav-links a:hover { background: color-mix(in srgb, var(--ink) 8%, transparent); }
.header-actions { display: flex; align-items: center; gap: 12px; }
@media (max-width: 860px) {
  .nav-links { display: none; }
}

/* ---------- Haut de page ---------- */
.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, .9fr);
  gap: clamp(36px, 6vw, 80px);
  align-items: center;
  padding-block: clamp(44px, 7vw, 96px) clamp(56px, 7vw, 104px);
}
.hero-title {
  margin: 16px 0 22px;
  font-size: clamp(54px, 9vw, 112px);
}
.hero-handle {
  display: flex;
  width: fit-content;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  font-size: clamp(16px, 1.6vw, 20px);
  font-weight: 700;
  letter-spacing: 0;
  color: var(--ink-2);
}
.hero-handle b {
  padding: 4px 10px;
  border: var(--bw) solid var(--edge);
  background: var(--accent);
  color: var(--on-accent);
  box-shadow: 3px 3px 0 var(--edge);
}
.hero-lead {
  max-width: 33em;
  font-size: clamp(18px, 1.7vw, 22px);
  line-height: 1.5;
  color: var(--ink-2);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 18px;
  margin-top: 30px;
}
.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-top: 44px;
}
.facts > div { border-top: var(--bw) solid var(--edge); padding-top: 12px; }
.facts dt { font-size: 13px; font-weight: 700; color: var(--ink-3); }
.facts dd {
  margin-top: 4px;
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 700;
  letter-spacing: -.035em;
  font-variant-numeric: tabular-nums;
}

.win {
  background: var(--surface);
  border: var(--bw) solid var(--edge);
  box-shadow: var(--shadow-pop);
}
.win-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  padding: 0 14px;
  border-bottom: var(--bw) solid var(--edge);
  background: var(--sunken);
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-2);
}
.win-ctrls { display: flex; gap: 6px; }
.win-ctrls i {
  display: block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--edge);
  background: var(--surface);
}
.win-ctrls i:first-child { background: var(--accent); }

.profile { padding: 22px; }
.profile-top { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; }
.profile-photo {
  width: 104px;
  height: 104px;
  object-fit: cover;
  border: var(--bw) solid var(--edge);
  box-shadow: 4px 4px 0 var(--edge);
}
.profile-name { font-size: 22px; font-weight: 700; letter-spacing: -.02em; line-height: 1.15; }
.profile-handle { margin-top: 4px; font-size: 15px; color: var(--ink-3); font-weight: 700; }
.profile-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-top: 2px dotted var(--line-strong);
  font-size: 16px;
  font-weight: 700;
}
.profile-list .ms { color: var(--accent-ink); }
.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 6px 10px;
  border: 2px solid currentColor;
  color: var(--accent-ink);
  font-size: 14px;
  font-weight: 700;
}
.status i { display: block; width: 8px; height: 8px; background: currentColor; }

@media (max-width: 900px) {
  .hero-grid { grid-template-columns: minmax(0, 1fr); }
  .hero-card { max-width: 460px; }
}
@media (max-width: 560px) {
  .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .facts > div:last-child { grid-column: 1 / -1; }
  .hero-actions .btn { flex: 1 1 auto; }
}

/* Relief en blocs sous le haut de page */
.terrain {
  position: relative;
  height: 56px;
  border-bottom: 8px solid var(--edge);
}
.terrain::before,
.terrain::after { content: ""; position: absolute; inset: 0; }
.terrain::before {
  background: var(--accent-soft);
  clip-path: polygon(0 100%, 0 24px, 4% 24px, 4% 8px, 11% 8px, 11% 0, 17% 0, 17% 16px, 26% 16px, 26% 8px, 33% 8px, 33% 24px, 44% 24px, 44% 0, 52% 0, 52% 16px, 63% 16px, 63% 8px, 71% 8px, 71% 24px, 80% 24px, 80% 8px, 88% 8px, 88% 0, 94% 0, 94% 16px, 100% 16px, 100% 100%);
}
.terrain::after {
  background: var(--accent);
  clip-path: polygon(0 100%, 0 40px, 7% 40px, 7% 32px, 15% 32px, 15% 40px, 23% 40px, 23% 24px, 30% 24px, 30% 32px, 39% 32px, 39% 40px, 48% 40px, 48% 32px, 57% 32px, 57% 24px, 66% 24px, 66% 40px, 76% 40px, 76% 32px, 85% 32px, 85% 40px, 92% 40px, 92% 24px, 100% 24px, 100% 100%);
}

/* ---------- Sections ---------- */
.section { padding-block: clamp(64px, 9vw, 120px); }
.section + .section { border-top: var(--bw) solid var(--edge); }
.section-head {
  display: grid;
  gap: 14px;
  max-width: 46rem;
  margin-bottom: clamp(32px, 4vw, 52px);
}
.section-head h2 { font-size: clamp(38px, 5.5vw, 64px); }
.section-head p { font-size: 18px; color: var(--ink-2); }
.band { background: repeating-conic-gradient(var(--side) 0 25%, var(--check) 0 50%) 0 0 / 32px 32px; }

/* ---------- LuuxCraft ---------- */
.feature {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  background: var(--surface);
  border: var(--bw) solid var(--edge);
  box-shadow: var(--shadow-pop);
}
.feature-media {
  display: grid;
  place-items: center;
  padding: clamp(18px, 3vw, 36px);
  border-right: var(--bw) solid var(--edge);
}
.feature-media img {
  width: 100%;
  border: var(--bw) solid var(--edge);
  box-shadow: var(--shadow-card);
}
.feature-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: clamp(22px, 3vw, 40px);
}
.feature-body h3 { font-size: clamp(36px, 4vw, 52px); }
.feature-body > p { color: var(--ink-2); }
.feature-links { display: flex; flex-wrap: wrap; gap: 4px 22px; margin-top: auto; }
.parts {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: var(--bw) solid var(--edge);
}
.parts li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 22px clamp(18px, 2.4vw, 28px);
}
.parts li + li { border-left: var(--bw) solid var(--edge); }
.part-ico {
  display: grid;
  place-items: center;
  flex: none;
  width: 46px;
  height: 46px;
  border: var(--bw) solid var(--edge);
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.parts strong { font-size: 18px; }
.parts p { margin-top: 2px; font-size: 15px; color: var(--ink-2); }
.parts small { display: block; margin-top: 6px; font-size: 13px; font-weight: 700; color: var(--ink-3); }
@media (max-width: 900px) {
  .feature { grid-template-columns: minmax(0, 1fr); }
  .feature-media { border-right: 0; border-bottom: var(--bw) solid var(--edge); }
  .parts { grid-template-columns: minmax(0, 1fr); }
  .parts li + li { border-left: 0; border-top: 2px dotted var(--line-strong); }
}

/* ---------- Cartes projet ---------- */
.projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(330px, 100%), 1fr));
  gap: 28px;
  margin-top: 40px;
}
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background: var(--surface);
  border: var(--bw) solid var(--edge);
  box-shadow: var(--shadow-card);
  transition: transform .12s ease, box-shadow .12s ease;
}
.card:has(.card-link:hover) { transform: translate(-3px, -3px); box-shadow: 9px 9px 0 var(--edge); }
.card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
.card-ico {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: var(--bw) solid var(--edge);
  background: var(--accent-soft);
  color: var(--accent-ink);
}
.card-go {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-3);
}
.card h3 { font-size: 23px; letter-spacing: -.025em; line-height: 1.15; }
.card-link { text-decoration: none; }
.card-link::after { content: ""; position: absolute; inset: 0; }
.card-meta { font-size: 14px; font-weight: 700; color: var(--ink-3); }
.card p { font-size: 16px; color: var(--ink-2); }
.card-stat {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--accent-soft);
  color: var(--accent-ink);
  font-size: 14px;
  font-weight: 700;
}
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; padding-top: 6px; }
.tag {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 9px;
  border: 2px solid var(--edge);
  background: var(--page);
  font-size: 13px;
  font-weight: 700;
}

/* ---------- Parcours ---------- */
.steps { border-top: var(--bw) solid var(--edge); }
.step {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 8px 32px;
  padding: 26px 0;
  border-bottom: 2px dotted var(--line-strong);
}
.step-period {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-top: 3px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ink-2);
}
.step-period::before {
  content: "";
  flex: none;
  width: 12px;
  height: 12px;
  margin-top: 5px;
  border: 2px solid var(--edge);
  background: var(--surface);
}
.step.current .step-period::before { background: var(--accent); }
.step h3 { font-size: 23px; letter-spacing: -.025em; line-height: 1.2; }
.step-org { color: var(--accent-ink); }
.step p { margin-top: 6px; max-width: 44em; color: var(--ink-2); }
@media (max-width: 700px) {
  .step { grid-template-columns: minmax(0, 1fr); }
}

/* ---------- Outils ---------- */
.tool-rows > li {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 12px 24px;
  align-items: center;
  padding: 20px clamp(18px, 3vw, 32px);
}
.tool-rows > li + li { border-top: 2px dotted var(--line-strong); }
.tool-rows h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 19px;
}
.tool-rows h3 .ms { color: var(--accent-ink); }
.tool-rows .tags { margin: 0; padding: 0; }
.tool-rows .tag { min-height: 32px; padding: 0 11px; font-size: 14px; }
@media (max-width: 700px) {
  .tool-rows > li { grid-template-columns: minmax(0, 1fr); }
}

/* ---------- Contact ---------- */
.contact {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 32px;
  align-items: end;
  padding: clamp(24px, 4vw, 48px);
  background: var(--surface);
  border: var(--bw) solid var(--edge);
  box-shadow: var(--shadow-pop);
}
.contact h2 { font-size: clamp(36px, 5vw, 60px); margin: 12px 0 16px; }
.contact p { max-width: 32em; font-size: 18px; color: var(--ink-2); }
.contact-mail {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  font-size: clamp(20px, 2.6vw, 30px);
  font-weight: 700;
  letter-spacing: -.02em;
  overflow-wrap: anywhere;
}
.contact-links { display: grid; gap: 14px; min-width: 240px; }
.contact-links .btn { justify-content: flex-start; }
@media (max-width: 820px) {
  .contact { grid-template-columns: minmax(0, 1fr); }
  .contact-links { min-width: 0; grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); }
}

/* ---------- Pied de page ---------- */
.site-footer {
  border-top: var(--bw) solid var(--edge);
  background: var(--page);
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
  min-height: 80px;
  padding-block: 20px;
  font-size: 14px;
  color: var(--ink-3);
}
.footer-inner nav { display: flex; flex-wrap: wrap; gap: 4px 18px; }
.footer-inner a { font-weight: 700; color: var(--ink-2); text-underline-offset: 4px; }
.footer-inner a:hover { color: var(--ink); }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
`
