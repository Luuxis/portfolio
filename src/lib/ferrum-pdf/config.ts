import type { FerrumPdfConfig } from './types'

export const DEFAULT_HEADER_TEMPLATE = '<span></span>'

export const DEFAULT_FOOTER_TEMPLATE = `
<div style="width: 100%; font-size: 10px; padding: 0 1cm; color: #666; text-align: center;">
  Page <span class="pageNumber"></span> / <span class="totalPages"></span>
</div>
`

const defaultConfig: FerrumPdfConfig = {
  pageOptions: {
    waitForIdleOptions: { connections: 0, duration: 50, timeout: 5000 },
    timeoutIfOpenConnections: true,
    retries: 1,
  },
  pdfOptions: {
    printBackground: true,
    marginTop: 0.4,
    marginBottom: 0.4,
    marginLeft: 0.4,
    marginRight: 0.4,
    headerTemplate: DEFAULT_HEADER_TEMPLATE,
    footerTemplate: DEFAULT_FOOTER_TEMPLATE,
  },
  screenshotOptions: {
    full: true,
    type: 'png',
  },
}

let config: FerrumPdfConfig = structuredClone(defaultConfig)

export function configure(partial: Partial<FerrumPdfConfig>): void {
  config = {
    pageOptions: { ...config.pageOptions, ...partial.pageOptions },
    pdfOptions: { ...config.pdfOptions, ...partial.pdfOptions },
    screenshotOptions: { ...config.screenshotOptions, ...partial.screenshotOptions },
  }
}

export function getConfig(): Readonly<FerrumPdfConfig> {
  return config
}

export function resetConfig(): void {
  config = structuredClone(defaultConfig)
}
