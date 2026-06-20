import type { Browser, Page, PDFOptions, ScreenshotOptions, BrowserWorker } from '@cloudflare/puppeteer'

export type BrowserBinding = BrowserWorker

export type FerrumPdfAuthorize = {
  user: string
  password: string
}

export type FerrumPdfViewport = {
  width: number
  height: number
  scaleFactor?: number
}

export type FerrumPdfWaitForIdleOptions = {
  connections?: number
  duration?: number
  timeout?: number
}

/** Options style ferrum_pdf (snake_case) + overrides Puppeteer natifs */
export type FerrumPdfOptions = {
  landscape?: boolean
  scale?: number
  format?: PDFOptions['format']
  paperWidth?: number
  paperHeight?: number
  pageRanges?: string
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
  displayHeaderFooter?: boolean
  printBackground?: boolean
  headerTemplate?: string
  footerTemplate?: string
  omitBackground?: boolean
  preferCSSPageSize?: boolean
  timeout?: number
}

export type FerrumScreenshotOptions = Pick<
  ScreenshotOptions,
  'type' | 'quality' | 'omitBackground' | 'captureBeyondViewport' | 'clip'
> & {
  full?: boolean
}

export type FerrumPdfPageOptions = {
  authorize?: FerrumPdfAuthorize
  waitForIdleOptions?: FerrumPdfWaitForIdleOptions
  timeoutIfOpenConnections?: boolean
  retries?: number
  viewport?: FerrumPdfViewport
}

export type FerrumPdfConfig = {
  pageOptions: FerrumPdfPageOptions
  pdfOptions: FerrumPdfOptions
  screenshotOptions: FerrumScreenshotOptions
}

export type LoadPageArgs = FerrumPdfPageOptions & {
  url?: string
  html?: string
  displayUrl?: string
  browser?: Browser
  viewport?: FerrumPdfViewport
}

export type RenderPdfArgs = LoadPageArgs & {
  pdfOptions?: FerrumPdfOptions
}

export type RenderScreenshotArgs = LoadPageArgs & {
  screenshotOptions?: FerrumScreenshotOptions
}

export type LoadPageCallback = (browser: Browser, page: Page) => Promise<void> | void
