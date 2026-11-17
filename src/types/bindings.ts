import type { BrowserWorker } from '@cloudflare/puppeteer'

export type CloudflareBindings = {
  BROWSER: BrowserWorker
  db: D1Database
  /** PDF des documents émis, mails bruts (.eml). */
  files: R2Bucket
  /** Identifiant de connexion à l'admin (variable). */
  ADMIN_EMAIL: string
  /** Empreinte PBKDF2 du mot de passe, `npm run admin:secrets` (secret). */
  ADMIN_PASSWORD_HASH: string
  /** Signe la session et chiffre les mots de passe SMTP/IMAP en base (secret). */
  APP_SECRET: string
}

export type AppEnv = { Bindings: CloudflareBindings }
