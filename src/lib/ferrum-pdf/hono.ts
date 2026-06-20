import type { Context } from 'hono'
import { renderPdf } from './render-pdf'
import { renderScreenshot } from './render-screenshot'
import { pdfResponse, imageResponse } from './response'
import type { CloudflareBindings } from '../../types/bindings'
import type { RenderPdfArgs, RenderScreenshotArgs } from './types'

type AppContext = Context<{ Bindings: CloudflareBindings }>

export async function respondWithPdf(
  c: AppContext,
  args: RenderPdfArgs & { filename?: string; disposition?: 'inline' | 'attachment' },
) {
  const { filename, disposition, ...renderArgs } = args
  const pdf = await renderPdf(c.env.BROWSER, renderArgs)
  return pdfResponse(pdf, { filename, disposition })
}

export async function respondWithScreenshot(
  c: AppContext,
  args: RenderScreenshotArgs & {
    filename?: string
    disposition?: 'inline' | 'attachment'
    type?: 'png' | 'jpeg' | 'webp'
  },
) {
  const { filename, disposition, type, ...renderArgs } = args
  const screenshot = await renderScreenshot(c.env.BROWSER, renderArgs)
  return imageResponse(screenshot, type ?? renderArgs.screenshotOptions?.type ?? 'png', {
    filename,
    disposition,
  })
}
