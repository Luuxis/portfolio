import type { FerrumPdfOptions } from './ferrum-pdf'

/** Options PDF calibrées pour le CV (A4, @page sans marges, fonds imprimés) */
export const cvPdfOptions: FerrumPdfOptions = {
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  displayHeaderFooter: false,
}

export const cvPdfPageOptions = {
  waitForIdleOptions: { connections: 0, duration: 500, timeout: 15000 },
  viewport: { width: 794, height: 1123, scaleFactor: 1 },
}
