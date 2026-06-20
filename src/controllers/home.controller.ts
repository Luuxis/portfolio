import type { Context } from 'hono'
import { renderHome } from '../views/home/template'

export function index(c: Context) {
  return c.html(renderHome())
}
