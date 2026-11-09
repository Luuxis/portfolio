import { themeTokens } from '../shared/theme'

export const cvLoadingStyles = `
${themeTokens}
*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  font-family: var(--font);
  color: var(--ink);
  background: repeating-conic-gradient(var(--side) 0 25%, var(--check) 0 50%) 0 0 / 32px 32px;
  -webkit-font-smoothing: antialiased;
}
h1, p { margin: 0; }
.panel {
  width: min(440px, 100%);
  background: var(--surface);
  border: 3px solid var(--edge);
  box-shadow: 8px 8px 0 var(--edge);
}
.panel-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
  padding: 0 14px;
  border-bottom: 3px solid var(--edge);
  background: var(--sunken);
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-2);
}
.panel-bar i {
  display: block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--edge);
  background: var(--accent);
}
.panel-body { padding: 26px 24px 24px; }
h1 { font-size: 28px; font-weight: 700; letter-spacing: -.03em; line-height: 1.1; }
.status { margin-top: 8px; min-height: 1.5em; font-size: 16px; color: var(--ink-2); }
.track {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 4px;
  margin-top: 22px;
}
.track i {
  display: block;
  height: 16px;
  border: 2px solid var(--line-strong);
  background: var(--sunken);
}
.track i.on { border-color: var(--edge); background: var(--accent); }
.percent {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ink-3);
}
.hint { margin-top: 18px; font-size: 14px; line-height: 1.5; color: var(--ink-3); }
.error {
  display: none;
  margin-top: 18px;
  padding: 14px 16px;
  border: 3px solid var(--edge);
  background: color-mix(in srgb, #FF8A80 22%, var(--surface));
  font-size: 15px;
  line-height: 1.45;
}
.error.visible { display: block; }
.links { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 10px; }
.links a { font-weight: 700; color: var(--ink); text-decoration: underline; text-underline-offset: 4px; }
`

export const cvLoadingScript = `
(function () {
  var cells = document.querySelectorAll('.track i');
  var status = document.getElementById('status');
  var percent = document.getElementById('percent');
  var error = document.getElementById('error');
  var track = document.querySelector('.track');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var progress = 0;
  var labels = [
    'Mise en page du document…',
    'Ouverture du navigateur…',
    'Rendu de la feuille A4…',
    'Écriture du PDF…',
  ];
  var labelIndex = 0;

  function setProgress(value) {
    progress = Math.min(100, Math.max(0, value));
    var lit = Math.round((progress / 100) * cells.length);
    for (var i = 0; i < cells.length; i++) cells[i].classList.toggle('on', i < lit);
    percent.textContent = Math.round(progress) + ' %';
    if (track) track.setAttribute('aria-valuenow', String(Math.round(progress)));
  }

  function tick() {
    if (progress < 92) setProgress(progress + (reduced ? 4 : 1.5 + Math.random() * 4));
    if (progress > 22 * (labelIndex + 1) && labelIndex < labels.length - 1) {
      labelIndex += 1;
      status.textContent = labels[labelIndex];
    }
  }

  var timer = setInterval(tick, reduced ? 120 : 220);
  status.textContent = labels[0];

  function showPdf(blob) {
    clearInterval(timer);
    setProgress(100);
    status.textContent = 'PDF prêt, ouverture…';
    var url = URL.createObjectURL(blob);
    document.body.innerHTML =
      '<embed src="' + url + '" type="application/pdf" width="100%" height="100%" ' +
      'style="position:fixed;inset:0;border:0;background:#24231F" />';
    document.title = 'CV d\\'André Gallo';
  }

  fetch('/cv.pdf/file', { headers: { Accept: 'application/pdf' } })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.blob();
    })
    .then(showPdf)
    .catch(function (err) {
      clearInterval(timer);
      setProgress(0);
      status.textContent = 'La génération a échoué.';
      error.classList.add('visible');
      console.error(err);
    });
})();
`
