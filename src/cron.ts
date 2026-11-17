import { purgeLoginAttempts } from './controllers/admin/auth.controller'
import { createDb } from './db'
import { DocumentMailService } from './services/document-mail.service'
import { InboxService } from './services/inbox.service'
import { SettingsService } from './services/settings.service'
import type { CloudflareBindings } from './types/bindings'

/** Toutes les 5 minutes : relève de la boîte mail. */
export const EVERY_5_MINUTES = '*/5 * * * *'
/** Chaque matin (8 h UTC, 9 h ou 10 h à Paris) : devis expirés, relances, ménage. */
export const DAILY = '0 8 * * *'

export async function scheduled(controller: ScheduledController, env: CloudflareBindings): Promise<void> {
  const db = createDb(env.db)
  const settings = new SettingsService(db, env.APP_SECRET ?? '')

  if (controller.cron === EVERY_5_MINUTES) {
    const result = await new InboxService(db, settings, env.files).sync()
    if (!result.ok && !result.error.includes('pas configurée')) console.error(result.error)
    return
  }

  if (controller.cron === DAILY) {
    const mailer = new DocumentMailService(db, settings, env)
    const expired = await mailer.documents.expireQuotes()
    const reminded = await mailer.autoReminders()
    await purgeLoginAttempts(db)
    if (expired || reminded) console.log(`tâches du jour : ${expired} devis expirés, ${reminded} relances`)
  }
}
