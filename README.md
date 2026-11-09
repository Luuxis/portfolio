# luuxis.fr

Portfolio et CV d'André Gallo (Luuxis). Hono sur Cloudflare Workers, pages rendues côté serveur en JSX.

| Route          | Ce qu'elle sert                                                     |
| -------------- | ------------------------------------------------------------------- |
| `/`            | Le site                                                             |
| `/cv`          | Le CV en HTML, une feuille A4                                       |
| `/cv.pdf`      | Page d'attente qui demande le PDF puis l'affiche                    |
| `/cv.pdf/file` | Le PDF, généré par Browser Run à partir de `/cv` et mis en cache    |

## Où changer quoi

- **Textes du site** : `src/models/portfolio.ts`
- **Textes du CV** : `src/models/cv.ts` (le CV doit tenir sur une page : vérifier le PDF après chaque ajout)
- **Coordonnées** : `src/models/profile.ts`
- **Couleurs** : `src/views/shared/theme.ts`, les jetons de l'identité LuuxCraft (clair et sombre)
- **Icônes** : `src/views/shared/icons.ts`, tracés Material Symbols Outlined. Pour en ajouter une, récupérer son SVG sur `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/<nom>/default/24px.svg` et copier le `d` du `<path>`.

Police : Arial partout, sans police web (Arial est installée sur Browser Run, donc le PDF sort pareil qu'à l'écran).

## Développement

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

Types des bindings après une modification de `wrangler.jsonc` :

```txt
npm run cf-typegen
```
