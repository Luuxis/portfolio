import { renderToString } from 'hono/jsx/dom/server'
import type { CvContent } from '../../models/cv-content'
import { CvPage } from './CvPage'

export function renderCv(cv: CvContent, options: { toolbar?: boolean } = {}): string {
  return `<!DOCTYPE html>${renderToString(<CvPage cv={cv} toolbar={options.toolbar} />)}`
}

export function cvDisplayUrl(origin: string): string {
  return new URL('/cv.pdf', origin).href
}
