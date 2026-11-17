import { fromBase64Url, hmacSign, hmacVerify, toBase64Url } from './crypto'

/**
 * Session de l'admin : un jeton signé (HMAC) dans un cookie HttpOnly, sans
 * table. `v` reprend `auth.session_version` : l'incrémenter (« déconnecter
 * partout ») invalide tous les jetons déjà distribués.
 */

export const SESSION_COOKIE = 'admin_session'
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

type SessionPayload = { exp: number; v: number }

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function signSession(secret: string, version: number, ttl = SESSION_TTL_SECONDS): Promise<string> {
  const payload: SessionPayload = { exp: Math.floor(Date.now() / 1000) + ttl, v: version }
  const data = toBase64Url(encoder.encode(JSON.stringify(payload)))
  return `${data}.${await hmacSign(secret, data)}`
}

export async function verifySession(secret: string, token: string | undefined, version: number): Promise<boolean> {
  if (!token || !secret) return false
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return false
  const data = token.slice(0, dot)
  if (!(await hmacVerify(secret, data, token.slice(dot + 1)))) return false
  try {
    const payload = JSON.parse(decoder.decode(fromBase64Url(data))) as SessionPayload
    return payload.exp > Math.floor(Date.now() / 1000) && payload.v === version
  } catch {
    return false
  }
}
