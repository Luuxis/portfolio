import type { Context } from 'hono'
import { respondWithPdf } from '../lib/ferrum-pdf'
import { cvPdfOptions, cvPdfPageOptions } from '../lib/cv-pdf'
import type { CloudflareBindings } from '../types/bindings'
import { cvDisplayUrl, renderCv } from '../views/cv/template'

type AppContext = Context<{ Bindings: CloudflareBindings }>

export async function pdf(c: AppContext) {
  const origin = new URL(c.req.url).origin

  return respondWithPdf(c, {
    html: renderCv(),
    displayUrl: cvDisplayUrl(origin),
    filename: 'andre-gallo-cv.pdf',
    disposition: 'inline',
    pdfOptions: cvPdfOptions,
    ...cvPdfPageOptions,
  })
}
