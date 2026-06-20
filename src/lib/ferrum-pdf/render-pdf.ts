import type { Browser, Page } from '@cloudflare/puppeteer'
import { getConfig } from './config'
import { loadPage } from './load-page'
import { mergePdfOptions, toPuppeteerPdfOptions } from './pdf-options'
import type { BrowserBinding, LoadPageCallback, RenderPdfArgs } from './types'

async function generatePdf(page: Page, args: RenderPdfArgs): Promise<Uint8Array> {
  const config = getConfig()
  const pdfOptions = mergePdfOptions(config.pdfOptions, args.pdfOptions)
  const buffer = await page.pdf(toPuppeteerPdfOptions(pdfOptions))
  return new Uint8Array(buffer)
}

export async function renderPdf(
  binding: BrowserBinding,
  args: RenderPdfArgs,
  callback?: LoadPageCallback,
): Promise<Uint8Array> {
  let pdf!: Uint8Array

  await loadPage(binding, args, async (browser, page) => {
    if (callback) await callback(browser, page)
    pdf = await generatePdf(page, args)
  })

  return pdf
}

export async function renderPdfFromPage(page: Page, args: Pick<RenderPdfArgs, 'pdfOptions'> = {}): Promise<Uint8Array> {
  return generatePdf(page, args)
}
