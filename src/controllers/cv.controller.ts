import type { Context } from 'hono'
import { cvContentDigest, getCachedCvPdf, putCachedCvPdf, CACHE_CONTROL } from '../lib/cv-cache'
import { renderPdf } from '../lib/ferrum-pdf'
import { pdfResponse } from '../lib/ferrum-pdf/response'
import { cvPdfOptions, cvPdfPageOptions } from '../lib/cv-pdf'
import { defaultCv, type CvContent } from '../models/cv-content'
import { loadCv } from '../services/cv.service'
import type { CloudflareBindings } from '../types/bindings'
import { renderCvLoadingPage } from '../views/cv/loading-template'
import { cvDisplayUrl, renderCv } from '../views/cv/template'

type AppContext = Context<{ Bindings: CloudflareBindings }>

/** Le CV en ligne ; si la base ne répond pas, celui écrit dans le code plutôt qu'une erreur. */
async function currentCv(c: AppContext): Promise<CvContent> {
  try {
    return await loadCv(c.env.db)
  } catch (error) {
    console.error('CV en base illisible, contenu par défaut :', error)
    return defaultCv
  }
}

export async function index(c: AppContext) {
  return c.html(renderCv(await currentCv(c)))
}

export async function loader(c: AppContext) {
  const digest = await cvContentDigest(renderCv(await currentCv(c)))
  return c.html(renderCvLoadingPage(digest))
}

export async function file(c: AppContext) {
  const html = renderCv(await currentCv(c))
  const digest = await cvContentDigest(html)
  // Sans la bonne empreinte dans l'adresse, la réponse ne doit pas rester figée dans le navigateur.
  const versioned = c.req.query('v') === digest
  const cached = await getCachedCvPdf(digest)

  if (cached) {
    if (versioned) return cached
    const response = new Response(cached.body, cached)
    response.headers.set('Cache-Control', 'public, max-age=300')
    return response
  }

  const origin = new URL(c.req.url).origin
  const pdf = await renderPdf(c.env.BROWSER, {
    html,
    displayUrl: cvDisplayUrl(origin),
    pdfOptions: cvPdfOptions,
    ...cvPdfPageOptions,
  })
  const response = pdfResponse(pdf, {
    filename: 'andre-gallo-cv.pdf',
    disposition: 'inline',
    cacheControl: versioned ? CACHE_CONTROL : 'public, max-age=300',
  })

  putCachedCvPdf(digest, response.clone(), c.executionCtx.waitUntil.bind(c.executionCtx))

  return response
}
