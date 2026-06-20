import { renderToString } from 'hono/jsx/dom/server'
import { HomePage } from './HomePage'

export function renderHome(): string {
  return `<!DOCTYPE html>${renderToString(<HomePage />)}`
}
