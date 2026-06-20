import puppeteer, { type Browser } from '@cloudflare/puppeteer'
import type { BrowserBinding } from './types'

export async function launchBrowser(binding: BrowserBinding): Promise<Browser> {
  return puppeteer.launch(binding)
}

export async function withBrowser<T>(
  binding: BrowserBinding,
  browser: Browser | undefined,
  fn: (browser: Browser) => Promise<T>,
): Promise<T> {
  const ownsBrowser = !browser
  const session = browser ?? (await launchBrowser(binding))

  try {
    return await fn(session)
  } finally {
    if (ownsBrowser) {
      await session.close()
    }
  }
}
