import { renderCv } from '../views/cv/template'

const CACHE_PREFIX = 'https://cv-cache.internal/pdf/'
const CACHE_CONTROL = 'public, max-age=604800, immutable'

async function cvContentDigest(): Promise<string> {
  const data = new TextEncoder().encode(renderCv())
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(hash)

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 16)
}

function cacheRequest(digest: string): Request {
  return new Request(`${CACHE_PREFIX}${digest}`, { method: 'GET' })
}

export async function getCachedCvPdf(digest: string): Promise<Response | undefined> {
  const cached = await caches.default.match(cacheRequest(digest))
  return cached ?? undefined
}

export function putCachedCvPdf(
  digest: string,
  response: Response,
  waitUntil: (promise: Promise<unknown>) => void,
): void {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', CACHE_CONTROL)

  const toCache = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })

  waitUntil(caches.default.put(cacheRequest(digest), toCache))
}

export { cvContentDigest, CACHE_CONTROL }
