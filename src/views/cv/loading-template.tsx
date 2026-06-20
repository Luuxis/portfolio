import { person } from '../../models/cv'
import { cvLoadingScript, cvLoadingStyles } from './loading'

export function renderCvLoadingPage(): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Génération du CV — ${person.fullName}</title>
  <meta name="robots" content="noindex">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${cvLoadingStyles}</style>
</head>
<body>
  <div class="panel">
    <div class="icon" aria-hidden="true"></div>
    <h1>Génération du CV</h1>
    <p class="status" id="status">Initialisation…</p>
    <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="bar" id="bar"></div>
    </div>
    <p class="percent" id="percent">0%</p>
    <p class="hint">Le rendu passe par un navigateur headless — compte 5 à 15 secondes.</p>
    <div class="error" id="error">
      Impossible de générer le PDF. Le service Browser Rendering est peut-être indisponible.
      <br>
      <a class="back" href="/">← Retour au portfolio</a>
    </div>
  </div>
  <script>${cvLoadingScript}</script>
</body>
</html>`
}
