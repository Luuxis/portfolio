import { and, count, eq, gt, lt } from 'drizzle-orm'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { loginAttempts } from '../../db/schema'
import { str, safeNext, type FormBody } from '../../lib/http/form'
import { timingSafeEqualString, verifyPassword } from '../../lib/security/crypto'
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from '../../lib/security/session'
import { verifyTotp } from '../../lib/security/totp'
import { settingBool, settingInt } from '../../services/settings.service'
import { render } from '../../views/admin/Layout'
import { LoginPage } from '../../views/admin/pages/LoginPage'
import type { Flash } from '../../views/admin/ui'
import type { AdminContext } from './_shared'

/** Au-delà, la connexion est refusée un quart d'heure : par adresse IP, et en tout. */
const MAX_FAILURES_PER_IP = 5
const MAX_FAILURES_TOTAL = 30
const WINDOW_MS = 15 * 60 * 1000

function clientIp(c: AdminContext): string {
  return c.req.header('cf-connecting-ip') ?? 'local'
}

async function isThrottled(c: AdminContext, ip: string): Promise<boolean> {
  const db = c.get('db')
  const since = new Date(Date.now() - WINDOW_MS)
  const [byIp] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.ok, false), gt(loginAttempts.at, since)))
  const [total] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ok, false), gt(loginAttempts.at, since)))
  return byIp.n >= MAX_FAILURES_PER_IP || total.n >= MAX_FAILURES_TOTAL
}

async function loginView(c: AdminContext, flash: Flash | null, values: { email?: string; next?: string } = {}, status: 200 | 401 | 429 | 503 = 200) {
  const totp = settingBool(await c.get('settings').get('auth.totp_enabled'))
  return c.html(render(<LoginPage email={values.email} next={values.next} totp={totp} flash={flash} />), status)
}

export async function loginPage(c: AdminContext) {
  const version = settingInt(await c.get('settings').get('auth.session_version'), 1)
  if (await verifySession(c.env.APP_SECRET, getCookie(c, SESSION_COOKIE), version)) {
    return c.redirect(safeNext(c.req.query('next')), 303)
  }
  return loginView(c, c.get('flash'), { next: c.req.query('next') })
}

export async function login(c: AdminContext) {
  const form = (await c.req.parseBody()) as FormBody
  const email = str(form, 'email', 200)
  const next = safeNext(str(form, 'next', 500))
  const ip = clientIp(c)

  if (!c.env.ADMIN_PASSWORD_HASH || !c.env.APP_SECRET || !c.env.ADMIN_EMAIL) {
    return loginView(
      c,
      { type: 'err', message: "L'admin n'est pas configurée : lance `npm run admin:secrets` puis renseigne ADMIN_EMAIL, ADMIN_PASSWORD_HASH et APP_SECRET." },
      { email, next },
      503,
    )
  }

  if (await isThrottled(c, ip)) {
    return loginView(c, { type: 'err', message: 'Trop de tentatives. Réessaie dans un quart d’heure.' }, { email, next }, 429)
  }

  const settings = c.get('settings')
  const values = await settings.many(['auth.totp_enabled', 'auth.totp_secret', 'auth.totp_last_counter', 'auth.session_version'])
  const emailOk = timingSafeEqualString(email.toLowerCase(), c.env.ADMIN_EMAIL.trim().toLowerCase())
  const passwordOk = await verifyPassword(str(form, 'password', 500), c.env.ADMIN_PASSWORD_HASH)

  let ok = emailOk && passwordOk
  let counter: number | null = null
  if (ok && settingBool(values['auth.totp_enabled'])) {
    const secret = await settings.reveal('auth.totp_secret', values)
    counter = secret ? await verifyTotp(secret, str(form, 'code', 20), settingInt(values['auth.totp_last_counter'], -1)) : null
    ok = counter !== null
  }

  const db = c.get('db')
  await db.insert(loginAttempts).values({ ip, ok, at: new Date() })

  if (!ok) {
    return loginView(c, { type: 'err', message: 'Identifiant, mot de passe ou code incorrect.' }, { email, next }, 401)
  }

  if (counter !== null) await settings.set({ 'auth.totp_last_counter': String(counter) })
  // Les échecs de cette adresse ne comptent plus après une connexion réussie.
  await db.delete(loginAttempts).where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.ok, false)))

  const token = await signSession(c.env.APP_SECRET, settingInt(values['auth.session_version'], 1))
  setCookie(c, SESSION_COOKIE, token, {
    path: '/admin',
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict',
    maxAge: SESSION_TTL_SECONDS,
  })
  return c.redirect(next, 303)
}

export function logout(c: AdminContext) {
  deleteCookie(c, SESSION_COOKIE, { path: '/admin' })
  return c.redirect('/admin/connexion', 303)
}

/** Nettoyage quotidien des tentatives de connexion. */
export async function purgeLoginAttempts(db: AdminContext['var']['db']) {
  await db.delete(loginAttempts).where(lt(loginAttempts.at, new Date(Date.now() - 24 * 60 * 60 * 1000)))
}
