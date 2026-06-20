import type { PDFOptions } from '@cloudflare/puppeteer'
import type { FerrumPdfOptions } from './types'

function inch(value: number | undefined): string | undefined {
  return value === undefined ? undefined : `${value}in`
}

export function toPuppeteerPdfOptions(options: FerrumPdfOptions): PDFOptions {
  const pdf: PDFOptions = {}

  if (options.landscape !== undefined) pdf.landscape = options.landscape
  if (options.scale !== undefined) pdf.scale = options.scale
  if (options.format !== undefined) pdf.format = options.format
  if (options.paperWidth !== undefined) pdf.width = `${options.paperWidth}in`
  if (options.paperHeight !== undefined) pdf.height = `${options.paperHeight}in`
  if (options.pageRanges !== undefined) pdf.pageRanges = options.pageRanges
  if (options.displayHeaderFooter !== undefined) pdf.displayHeaderFooter = options.displayHeaderFooter
  if (options.printBackground !== undefined) pdf.printBackground = options.printBackground
  if (options.headerTemplate !== undefined) pdf.headerTemplate = options.headerTemplate
  if (options.footerTemplate !== undefined) pdf.footerTemplate = options.footerTemplate
  if (options.omitBackground !== undefined) pdf.omitBackground = options.omitBackground
  if (options.preferCSSPageSize !== undefined) pdf.preferCSSPageSize = options.preferCSSPageSize
  if (options.timeout !== undefined) pdf.timeout = options.timeout

  const margin = {
    top: inch(options.marginTop),
    bottom: inch(options.marginBottom),
    left: inch(options.marginLeft),
    right: inch(options.marginRight),
  }

  if (margin.top || margin.bottom || margin.left || margin.right) {
    pdf.margin = margin
  }

  return pdf
}

export function mergePdfOptions(...sources: Array<FerrumPdfOptions | undefined>): FerrumPdfOptions {
  return Object.assign({}, ...sources.filter(Boolean))
}
