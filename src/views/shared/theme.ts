/**
 * Jetons de couleur repris de l'identité LuuxCraft (panel et site public) :
 * fond chaud, encre presque noire, accent vert, angles vifs et ombres dures.
 * Une seule source pour le site, le CV et la page de génération du PDF.
 */

export const FONT_STACK = `Arial, "Liberation Sans", Arimo, "Helvetica Neue", Helvetica, sans-serif`

const lightTokens = `
  color-scheme: light;
  --page: #E8E4DA;
  --side: #DDD7CA;
  --surface: #FBF9F4;
  --raised: #FFFFFF;
  --sunken: #F1EDE4;
  --check: #D6CFC0;
  --line: #BDB4A3;
  --line-strong: #8F8676;
  --edge: #1B1712;
  --ink: #1B1712;
  --ink-2: #413A2F;
  --ink-3: #5E5546;
  --accent: #6DB33F;
  --on-accent: #1B1712;
  --accent-ink: #2F6216;
  --accent-soft: #CFE6B8;
  --accent-2: #7E5128;
  --focus: #1F59B3;
`

const darkTokens = `
  color-scheme: dark;
  --page: #24231F;
  --side: #2C2A25;
  --surface: #34312B;
  --raised: #3B3832;
  --sunken: #1D1C19;
  --check: #28261F;
  --line: #4A463E;
  --line-strong: #6A6458;
  --edge: #0C0B09;
  --ink: #F2EEE4;
  --ink-2: #D2CBBB;
  --ink-3: #ADA594;
  --accent: #7BC64A;
  --on-accent: #10180A;
  --accent-ink: #93D865;
  --accent-soft: #2E3A22;
  --accent-2: #D19760;
  --focus: #8AB4F8;
`

/**
 * Thème clair par défaut, sombre si le système le demande, et la classe
 * posée sur <html> par le script de démarrage l'emporte dans les deux sens.
 */
export const themeTokens = `
:root {
  --font: ${FONT_STACK};
  --bw: 3px;
  --shadow-btn: 4px 4px 0 var(--edge);
  --shadow-btn-hover: 6px 6px 0 var(--edge);
  --shadow-card: 6px 6px 0 var(--edge);
  --shadow-pop: 8px 8px 0 var(--edge);
  ${lightTokens}
}
@media (prefers-color-scheme: dark) {
  :root:not(.light) { ${darkTokens} }
}
:root.dark { ${darkTokens} }
:root.light { ${lightTokens} }
`

/** Tokens clairs seuls, pour le CV (papier) quel que soit le thème. */
export const paperTokens = `
:root {
  --font: ${FONT_STACK};
  ${lightTokens}
}
`

/** Lu avant le premier rendu : évite le flash du mauvais thème. */
export const themeBootScript = `(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.add(t)})();`

export const themeToggleScript = `(function(){var root=document.documentElement;var buttons=document.querySelectorAll('[data-theme-toggle]');function sync(){var dark=root.classList.contains('dark');buttons.forEach(function(b){b.setAttribute('aria-pressed',String(dark))})}buttons.forEach(function(b){b.addEventListener('click',function(){var next=root.classList.contains('dark')?'light':'dark';root.classList.remove('dark','light');root.classList.add(next);try{localStorage.setItem('theme',next)}catch(e){}sync()})});sync()})();`
