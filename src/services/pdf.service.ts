import { renderPdf, renderScreenshot } from '../lib/ferrum-pdf'
import type { BrowserBinding, RenderPdfArgs, RenderScreenshotArgs } from '../lib/ferrum-pdf'

export class PdfService {
  constructor(private readonly browser: BrowserBinding) {}

  render(args: RenderPdfArgs) {
    return renderPdf(this.browser, args)
  }

  screenshot(args: RenderScreenshotArgs) {
    return renderScreenshot(this.browser, args)
  }

  renderFromHtml(html: string, displayUrl: string, pdfOptions?: RenderPdfArgs['pdfOptions']) {
    return this.render({ html, displayUrl, pdfOptions })
  }

  renderFromUrl(url: string, pdfOptions?: RenderPdfArgs['pdfOptions']) {
    return this.render({ url, pdfOptions })
  }
}

export function createPdfService(browser: BrowserBinding) {
  return new PdfService(browser)
}
