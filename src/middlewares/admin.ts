import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'
import { createDb } from '../db'
import { readFlash, type AdminEnv } from '../controllers/admin/_shared'
import { SESSION_COOKIE, verifySession } from '../lib/security/session'
import { settingInt, SettingsService } from '../services/settings.service'

/**
 * Sécurité commune aux pages de l'admin : jamais en cache, jamais indexées,
 * pas de référent vers les liens ouverts depuis un mail, scripts et styles
 * limités à la page.
 */
export const adminHeaders: MiddlewareHandler<AdminEnv> = async (c, next) => {
  await next()
  const headers = c.res.headers
  headers.set('Cache-Control', 'no-store')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Content-Type-Options', 'nosniff')
  if (!headers.has('Content-Security-Policy')) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-src 'self'; form-action 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'self'",
    )
  }
}

/** Base, réglages et message flash à disposition des contrôleurs. */
export const adminServices: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const db = createDb(c.env.db)
  c.set('db', db)
  c.set('settings', new SettingsService(db, c.env.APP_SECRET ?? ''))
  c.set('flash', readFlash(c))
  await next()
}

/** Toute l'admin sauf la page de connexion demande une session valide. */
export const requireAdmin: MiddlewareHandler<AdminEnv> = async (c, next) => {
  const version = settingInt(await c.get('settings').get('auth.session_version'), 1)
  const ok = await verifySession(c.env.APP_SECRET, getCookie(c, SESSION_COOKIE), version)
  if (ok) return next()

  const url = new URL(c.req.url)
  if (c.req.method !== 'GET') return c.text('Session expirée, reconnecte-toi.', 401)
  const next_ = url.pathname + url.search
  return c.redirect(`/admin/connexion${next_ !== '/admin' ? `?next=${encodeURIComponent(next_)}` : ''}`, 303)
}
