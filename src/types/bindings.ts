import type { BrowserWorker } from '@cloudflare/puppeteer'

export type CloudflareBindings = {
  BROWSER: BrowserWorker
}
