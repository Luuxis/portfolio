export type PdfResponseOptions = {
  filename?: string
  disposition?: 'inline' | 'attachment'
  cacheControl?: string
}

export function pdfResponse(body: Uint8Array, options: PdfResponseOptions = {}): Response {
  const disposition = options.disposition ?? 'inline'
  const filename = options.filename ?? 'document.pdf'
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `${disposition}; filename="${filename}"`,
  })

  if (options.cacheControl) {
    headers.set('Cache-Control', options.cacheControl)
  }

  return new Response(body, { headers })
}

export function imageResponse(
  body: Uint8Array,
  type: 'png' | 'jpeg' | 'webp' = 'png',
  options: { filename?: string; disposition?: 'inline' | 'attachment' } = {},
): Response {
  const disposition = options.disposition ?? 'inline'
  const filename = options.filename ?? `screenshot.${type}`
  const mime = type === 'jpeg' ? 'image/jpeg' : type === 'webp' ? 'image/webp' : 'image/png'

  return new Response(body, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `${disposition}; filename="${filename}"`,
    },
  })
}
