import type { Browser, Page, ScreenshotOptions } from '@cloudflare/puppeteer'
import { getConfig } from './config'
import { loadPage } from './load-page'
import type { BrowserBinding, FerrumScreenshotOptions, LoadPageCallback, RenderScreenshotArgs } from './types'

function toPuppeteerScreenshotOptions(options: FerrumScreenshotOptions): ScreenshotOptions {
  const screenshot: ScreenshotOptions = {}

  if (options.full !== undefined) screenshot.fullPage = options.full
  if (options.type !== undefined) screenshot.type = options.type
  if (options.quality !== undefined) screenshot.quality = options.quality
  if (options.omitBackground !== undefined) screenshot.omitBackground = options.omitBackground
  if (options.captureBeyondViewport !== undefined) {
    screenshot.captureBeyondViewport = options.captureBeyondViewport
  }
  if (options.clip !== undefined) screenshot.clip = options.clip

  return screenshot
}

function mergeScreenshotOptions(...sources: Array<FerrumScreenshotOptions | undefined>): FerrumScreenshotOptions {
  return Object.assign({}, ...sources.filter(Boolean))
}

async function captureScreenshot(page: Page, args: RenderScreenshotArgs): Promise<Uint8Array> {
  const config = getConfig()
  const screenshotOptions = mergeScreenshotOptions(config.screenshotOptions, args.screenshotOptions)
  const buffer = await page.screenshot(toPuppeteerScreenshotOptions(screenshotOptions))
  return new Uint8Array(buffer)
}

export async function renderScreenshot(
  binding: BrowserBinding,
  args: RenderScreenshotArgs,
  callback?: LoadPageCallback,
): Promise<Uint8Array> {
  let screenshot!: Uint8Array

  await loadPage(binding, args, async (browser, page) => {
    if (callback) await callback(browser, page)
    screenshot = await captureScreenshot(page, args)
  })

  return screenshot
}

export async function renderScreenshotFromPage(
  page: Page,
  args: Pick<RenderScreenshotArgs, 'screenshotOptions'> = {},
): Promise<Uint8Array> {
  return captureScreenshot(page, args)
}
