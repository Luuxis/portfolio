# luuxis.fr

Portfolio, CV et admin d'André Gallo (Luuxis). Hono sur Cloudflare Workers, pages rendues côté serveur en JSX, D1 pour les données, R2 pour les fichiers.

| Route          | Ce qu'elle sert                                                     |
| -------------- | ------------------------------------------------------------------- |
| `/`            | Le site                                                             |
| `/cv`          | Le CV en HTML, une feuille A4                                       |
| `/cv.pdf`      | Page d'attente qui demande le PDF puis l'affiche                    |
| `/cv.pdf/file` | Le PDF, généré par Browser Run à partir de `/cv` et mis en cache    |
| `/admin`       | L'admin : clients, devis, factures, mails, CV, réglages             |

## L'admin

- **Clients** : coordonnées de facturation, mails rattachés automatiquement par adresse.
- **Devis, factures, avoirs** : brouillon modifiable, puis émission (numéro définitif sans trou, client et émetteur figés, PDF rangé dans R2). Devis → facture en un clic, facture annulée par un avoir, paiement enregistré, relances manuelles ou automatiques.
- **Mails** : envoi en SMTP (worker-mailer) avec PDF joint, relève IMAP toutes les 5 minutes (`src/lib/imap`, client maison sur les sockets des Workers), copie des envois dans le dossier « Envoyés ». Le HTML des mails reçus s'affiche dans une iframe sandbox, sans scripts ni images distantes.
- **CV** : tout le contenu se modifie depuis l'admin, avec aperçu (et alerte si le CV dépasse la page A4) et historique des versions. Sans version enregistrée, le CV affiche `src/models/cv.ts`.
- **Réglages** : émetteur et mentions légales, TVA, numérotation, modèles de mails, serveurs SMTP/IMAP (mots de passe chiffrés en base), double authentification.

Tâches planifiées (`src/cron.ts`) : relève IMAP toutes les 5 minutes, et chaque matin les devis expirés, les relances automatiques et le ménage.

## Où changer quoi

- **Textes du site** : `src/models/portfolio.ts`
- **Textes du CV** : depuis `/admin/cv` (le contenu d'origine reste dans `src/models/cv.ts`)
- **Coordonnées du site** : `src/models/profile.ts`
- **Couleurs** : `src/views/shared/theme.ts`, les jetons de l'identité LuuxCraft (clair et sombre)
- **Icônes** : `src/views/shared/icons.ts`, tracés Material Symbols Outlined. Pour en ajouter une, récupérer son SVG sur `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/<nom>/default/24px.svg` et copier le `d` du `<path>`.
- **Schéma de la base** : `src/db/schema.ts`, puis `npm run db:generate` pour la migration

Police : Arial partout, sans police web (Arial est installée sur Browser Run, donc le PDF sort pareil qu'à l'écran).

## Développement

```txt
npm install
npm run admin:secrets -- --dev    # mot de passe de l'admin → .dev.vars
npm run db:migrate:local
npm run dev                       # admin sur http://localhost:8787/admin
```

`ADMIN_EMAIL` (l'identifiant de connexion) est dans `wrangler.jsonc`.

## Mise en production

Une seule fois :

```txt
npx wrangler d1 create portfolio            # puis reporter le database_id dans wrangler.jsonc
npx wrangler r2 bucket create files
npm run admin:secrets -- --prod             # ADMIN_PASSWORD_HASH et APP_SECRET
```

Ensuite :

```txt
npm run deploy                              # migrations D1 distantes, puis déploiement
```

`APP_SECRET` signe les sessions et chiffre les mots de passe SMTP/IMAP enregistrés : le changer oblige à les ressaisir. Pour changer seulement le mot de passe : `npm run admin:secrets -- --prod --keep-secret`.

Le forfait Workers gratuit limite chaque requête à 10 ms de CPU : la relève des mails risque de les dépasser, le forfait payant est conseillé.

## Tests

```txt
npm test          # facturation, client IMAP
npm run typecheck
```

Types des bindings après une modification de `wrangler.jsonc` :

```txt
npm run cf-typegen
```
