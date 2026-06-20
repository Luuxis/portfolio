import type { Context } from 'hono'
import { cvContentDigest, getCachedCvPdf, putCachedCvPdf, CACHE_CONTROL } from '../lib/cv-cache'
import { renderPdf } from '../lib/ferrum-pdf'
import { pdfResponse } from '../lib/ferrum-pdf/response'
import { cvPdfOptions, cvPdfPageOptions } from '../lib/cv-pdf'
import type { CloudflareBindings } from '../types/bindings'
import { renderCvLoadingPage } from '../views/cv/loading-template'
import { cvDisplayUrl, renderCv } from '../views/cv/template'

type AppContext = Context<{ Bindings: CloudflareBindings }>

export function index(c: AppContext) {
  return c.html(renderCv())
}

async function generateCvPdf(c: AppContext) {
  const origin = new URL(c.req.url).origin

  return renderPdf(c.env.BROWSER, {
    html: renderCv(),
    displayUrl: cvDisplayUrl(origin),
    pdfOptions: cvPdfOptions,
    ...cvPdfPageOptions,
  })
}

export function loader(c: AppContext) {
  return c.html(renderCvLoadingPage())
}

export async function file(c: AppContext) {
  const digest = await cvContentDigest()
  const cached = await getCachedCvPdf(digest)

  if (cached) {
    return cached
  }

  const pdf = await generateCvPdf(c)
  const response = pdfResponse(pdf, {
    filename: 'andre-gallo-cv.pdf',
    disposition: 'inline',
    cacheControl: CACHE_CONTROL,
  })

  putCachedCvPdf(digest, response.clone(), c.executionCtx.waitUntil.bind(c.executionCtx))

  return response
}
