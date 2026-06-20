import type { Browser, Page } from '@cloudflare/puppeteer'
import { withBrowser } from './browser'
import { getConfig } from './config'
import type { BrowserBinding, LoadPageArgs, LoadPageCallback } from './types'

const DEFAULT_DISPLAY_URL = 'http://example.com'

async function applyViewport(page: Page, viewport: LoadPageArgs['viewport']): Promise<void> {
  if (!viewport) return

  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.scaleFactor ?? 1,
  })
}

async function applyAuthorize(page: Page, authorize: LoadPageArgs['authorize']): Promise<void> {
  if (!authorize) return
  await page.authenticate({ username: authorize.user, password: authorize.password })
}

async function loadHtml(page: Page, html: string, displayUrl: string): Promise<void> {
  await page.setRequestInterception(true)

  let htmlIntercepted = false

  page.on('request', (request) => {
    if (htmlIntercepted) {
      void request.continue()
      return
    }

    htmlIntercepted = true
    void request.respond({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: html.trim() ? html : '<html><body></body></html>',
    })
  })

  await page.goto(displayUrl, { waitUntil: 'networkidle0' })
}

async function loadUrl(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle0' })
}

async function waitForNetworkIdle(
  page: Page,
  options: NonNullable<ReturnType<typeof getConfig>['pageOptions']['waitForIdleOptions']>,
  timeoutIfOpenConnections: boolean,
): Promise<void> {
  const timeout = options.timeout ?? 5000
  const duration = options.duration ?? 50

  await page.waitForNetworkIdle({ idleTime: duration, timeout }).catch(() => {
    if (timeoutIfOpenConnections) {
      throw new Error('FerrumPdf: network did not become idle before timeout')
    }
  })
}

async function runLoadPage(
  binding: BrowserBinding,
  args: LoadPageArgs,
  callback: LoadPageCallback,
): Promise<void> {
  const config = getConfig()
  const authorize = args.authorize ?? config.pageOptions.authorize
  const viewport = args.viewport ?? config.pageOptions.viewport
  const waitForIdleOptions = {
    ...config.pageOptions.waitForIdleOptions,
    ...args.waitForIdleOptions,
  }
  const timeoutIfOpenConnections =
    args.timeoutIfOpenConnections ?? config.pageOptions.timeoutIfOpenConnections ?? true
  const retries = args.retries ?? config.pageOptions.retries ?? 1

  if (!args.url && !args.html) {
    throw new Error('FerrumPdf: either url or html must be provided')
  }

  if (args.url && args.html) {
    throw new Error('FerrumPdf: provide url or html, not both')
  }

  let attempt = 0

  while (true) {
    try {
      await withBrowser(binding, args.browser, async (browser) => {
        const page = await browser.newPage()

        try {
          await applyAuthorize(page, authorize)
          await applyViewport(page, viewport)

          if (args.html) {
            await loadHtml(page, args.html, args.displayUrl ?? DEFAULT_DISPLAY_URL)
          } else if (args.url) {
            await loadUrl(page, args.url)
          }

          await waitForNetworkIdle(page, waitForIdleOptions, timeoutIfOpenConnections)
          await callback(browser, page)
        } finally {
          await page.close()
        }
      })
      return
    } catch (error) {
      attempt += 1
      if (attempt > retries) throw error
    }
  }
}

export async function loadPage(
  binding: BrowserBinding,
  args: LoadPageArgs,
  callback: LoadPageCallback,
): Promise<void> {
  return runLoadPage(binding, args, callback)
}
