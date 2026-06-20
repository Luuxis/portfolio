export const cvLoadingStyles = `
  :root {
    --bg: #07080c;
    --surface: #12151d;
    --border: rgba(255,255,255,.08);
    --text: #f1f3f8;
    --muted: #8b93a7;
    --accent: #6e7bff;
    --mono: "JetBrains Mono", ui-monospace, monospace;
    --sans: "Plus Jakarta Sans", system-ui, sans-serif;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
    -webkit-font-smoothing: antialiased;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: radial-gradient(600px 320px at 50% 30%, rgba(110,123,255,.12), transparent 70%);
    pointer-events: none;
  }
  .panel {
    position: relative;
    width: min(420px, 100%);
    padding: 2rem 1.75rem;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--surface);
    text-align: center;
    box-shadow: 0 24px 80px rgba(0,0,0,.45);
  }
  .icon {
    width: 44px;
    height: 44px;
    margin: 0 auto 1.25rem;
    border-radius: 10px;
    background: rgba(110,123,255,.12);
    border: 1px solid rgba(110,123,255,.25);
    position: relative;
  }
  .icon::after {
    content: "";
    position: absolute;
    inset: 12px 10px 10px;
    border: 2px solid var(--accent);
    border-radius: 3px;
    opacity: .7;
  }
  h1 {
    font-size: 1.05rem;
    font-weight: 600;
    letter-spacing: -.02em;
    margin-bottom: .35rem;
  }
  .status {
    font-size: .84rem;
    color: var(--muted);
    margin-bottom: 1.5rem;
    min-height: 1.25rem;
  }
  .track {
    height: 4px;
    border-radius: 999px;
    background: rgba(255,255,255,.06);
    overflow: hidden;
    margin-bottom: .65rem;
  }
  .bar {
    height: 100%;
    width: 0%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--accent), #9aa4ff);
    transition: width .25s ease;
  }
  .percent {
    font-family: var(--mono);
    font-size: .72rem;
    color: var(--muted);
    margin-bottom: 1.25rem;
  }
  .hint {
    font-size: .75rem;
    color: #5c6378;
    line-height: 1.5;
  }
  .error {
    display: none;
    margin-top: 1rem;
    padding: .75rem;
    border-radius: 8px;
    background: rgba(239,68,68,.08);
    border: 1px solid rgba(239,68,68,.2);
    color: #fca5a5;
    font-size: .8rem;
  }
  .error.visible { display: block; }
  .back {
    display: inline-block;
    margin-top: 1rem;
    font-size: .8rem;
    color: var(--accent);
  }
  @media (prefers-reduced-motion: reduce) {
    .bar { transition: none; }
  }
`

export const cvLoadingScript = `
(function () {
  var bar = document.getElementById('bar');
  var status = document.getElementById('status');
  var percent = document.getElementById('percent');
  var error = document.getElementById('error');
  var track = document.querySelector('.track');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var progress = 0;
  var labels = [
    'Préparation du document…',
    'Chargement des styles…',
    'Rendu du CV…',
    'Génération du PDF…',
  ];
  var labelIndex = 0;

  function setProgress(value) {
    progress = Math.min(100, Math.max(0, value));
    bar.style.width = progress + '%';
    percent.textContent = Math.round(progress) + '%';
    if (track) track.setAttribute('aria-valuenow', String(Math.round(progress)));
  }

  function tick() {
    if (progress < 92) {
      var step = reduced ? 4 : 1.5 + Math.random() * 4;
      setProgress(progress + step);
    }
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
    status.textContent = 'PDF prêt — ouverture…';

    var url = URL.createObjectURL(blob);

    // Affiche le PDF en plein écran dans la page
    document.body.innerHTML =
      '<embed src="' + url + '" type="application/pdf" width="100%" height="100%" ' +
      'style="position:fixed;inset:0;border:0;background:#111" />';
    document.title = 'CV — André Gallo';
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
      status.textContent = 'Échec de la génération';
      error.classList.add('visible');
      console.error(err);
    });
})();
`
