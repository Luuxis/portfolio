import { renderToString } from 'hono/jsx/dom/server'
import { CvPage } from './CvPage'

export function renderCv(): string {
  return `<!DOCTYPE html>${renderToString(<CvPage />)}`
}

export function cvDisplayUrl(origin: string): string {
  return new URL('/cv.pdf', origin).href
}
