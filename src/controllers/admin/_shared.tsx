import type { Context } from 'hono'
import type { Child } from 'hono/jsx'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { Db } from '../../db'
import { todayIso } from '../../lib/billing/money'
import { fromBase64Url, toBase64Url } from '../../lib/security/crypto'
import type { SettingsService } from '../../services/settings.service'
import type { CloudflareBindings } from '../../types/bindings'
import { AdminLayout, render, type NavCounts, type NavKey } from '../../views/admin/Layout'
import type { Flash } from '../../views/admin/ui'

export type AdminVariables = {
  db: Db
  settings: SettingsService
  flash: Flash | null
}

export type AdminEnv = { Bindings: CloudflareBindings; Variables: AdminVariables }
export type AdminContext = Context<AdminEnv>

const FLASH_COOKIE = 'admin_flash'
const encoder = new TextEncoder()
const decoder = new TextDecoder()

function isHttps(c: Context): boolean {
  return new URL(c.req.url).protocol === 'https:'
}

/** Redirige (303) avec un message affiché une seule fois sur la page suivante. */
export function redirect(c: AdminContext, url: string, flash?: Flash) {
  if (flash) {
    setCookie(c, FLASH_COOKIE, toBase64Url(encoder.encode(JSON.stringify(flash))), {
      path: '/admin',
      httpOnly: true,
      sameSite: 'Strict',
      secure: isHttps(c),
      maxAge: 60,
    })
  }
  return c.redirect(url, 303)
}

export function readFlash(c: AdminContext): Flash | null {
  const raw = getCookie(c, FLASH_COOKIE)
  if (!raw) return null
  deleteCookie(c, FLASH_COOKIE, { path: '/admin' })
  try {
    const flash = JSON.parse(decoder.decode(fromBase64Url(raw))) as Flash
    return typeof flash.message === 'string' ? flash : null
  } catch {
    return null
  }
}

export async function navCounts(c: AdminContext): Promise<NavCounts> {
  const row = await c.env.db.prepare(
    `SELECT
      (SELECT count(*) FROM mails WHERE direction = 'in' AND seen = 0) AS unread,
      (SELECT count(*) FROM documents WHERE type = 'invoice' AND status IN ('issued', 'sent') AND due_date < ?1) AS overdue,
      (SELECT count(*) FROM documents WHERE type = 'quote' AND status = 'sent') AS pending`,
  )
    .bind(todayIso())
    .first<{ unread: number; overdue: number; pending: number }>()
  return { unreadMails: row?.unread ?? 0, overdueInvoices: row?.overdue ?? 0, pendingQuotes: row?.pending ?? 0 }
}

/** Rend une page de l'admin dans son ossature (barre latérale, compteurs, message). */
export async function adminPage(
  c: AdminContext,
  options: { title: string; active: NavKey; narrow?: boolean; status?: 200 | 400 | 404 | 422 },
  body: Child,
) {
  const counts = await navCounts(c)
  const html = render(
    <AdminLayout title={options.title} active={options.active} counts={counts} flash={c.get('flash')} narrow={options.narrow}>
      {body}
    </AdminLayout>,
  )
  return c.html(html, options.status ?? 200)
}

export function notFound(c: AdminContext, what = 'Cette page') {
  return redirect(c, '/admin', { type: 'err', message: `${what} n'existe pas ou a été supprimé.` })
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
