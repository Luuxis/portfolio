import cvHtml from './cv.html'

export function renderCv(): string {
  return cvHtml
}

export function cvDisplayUrl(origin: string): string {
  return new URL('/cv', origin).href
}
