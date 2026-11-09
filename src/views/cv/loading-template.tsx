import { person } from '../../models/profile'
import { themeBootScript } from '../shared/theme'
import { cvLoadingScript, cvLoadingStyles } from './loading'

const cells = '<i></i>'.repeat(12)

export function renderCvLoadingPage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Génération du CV, ${person.fullName}</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <script>${themeBootScript}</script>
  <style>${cvLoadingStyles}</style>
</head>
<body>
  <main class="panel">
    <div class="panel-bar" aria-hidden="true"><span>andre-gallo-cv.pdf</span><i></i></div>
    <div class="panel-body">
      <h1>Je prépare le PDF</h1>
      <p class="status" id="status" aria-live="polite">Démarrage…</p>
      <div class="track" role="progressbar" aria-label="Avancement" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${cells}</div>
      <p class="percent" id="percent">0 %</p>
      <p class="hint">Le CV passe par un vrai navigateur côté serveur, ça prend entre 5 et 15 secondes. Les fois suivantes, il sort du cache.</p>
      <div class="error" id="error" role="alert">
        Le PDF n'a pas pu être généré, le service de rendu est peut-être indisponible.
        <div class="links"><a href="/cv">Voir le CV en ligne</a><a href="/">Retour au site</a></div>
      </div>
    </div>
  </main>
  <script>${cvLoadingScript}</script>
</body>
</html>`
}
