/**
 * Primitives WebCrypto partagées : comparaison à temps constant, base64,
 * HMAC, PBKDF2 (mot de passe de l'admin) et AES-GCM (mots de passe SMTP/IMAP
 * et secret TOTP rangés en base). Une seule clé de départ, `APP_SECRET`, dont
 * on dérive une clé par usage (HKDF) : la clé qui signe les sessions n'est pas
 * celle qui chiffre.
 */

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export function timingSafeEqualString(a: string, b: string): boolean {
  return timingSafeEqual(encoder.encode(a), encoder.encode(b))
}

export function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4)
  return fromBase64(padded)
}

export function randomToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)))
}

const derivedKeys = new Map<string, Promise<CryptoKey>>()

/** Clé dérivée d'APP_SECRET pour un usage donné, gardée par isolat. */
function derivedKey(secret: string, purpose: 'session' | 'vault'): Promise<CryptoKey> {
  const cacheKey = `${purpose}:${secret}`
  let key = derivedKeys.get(cacheKey)
  if (!key) {
    key = (async () => {
      const base = await crypto.subtle.importKey('raw', encoder.encode(secret), 'HKDF', false, ['deriveKey'])
      const params = {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: encoder.encode('luuxis.fr'),
        info: encoder.encode(purpose),
      }
      return purpose === 'session'
        ? crypto.subtle.deriveKey(params, base, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign', 'verify'])
        : crypto.subtle.deriveKey(params, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    })()
    derivedKeys.set(cacheKey, key)
  }
  return key
}

export async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await derivedKey(secret, 'session')
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return toBase64Url(new Uint8Array(signature))
}

export async function hmacVerify(secret: string, data: string, signature: string): Promise<boolean> {
  let bytes: Uint8Array
  try {
    bytes = fromBase64Url(signature)
  } catch {
    return false
  }
  const key = await derivedKey(secret, 'session')
  return crypto.subtle.verify('HMAC', key, bytes, encoder.encode(data))
}

/** Chiffre une valeur pour la base : `v1.<iv>.<données>` en base64url. */
export async function seal(secret: string, plain: string): Promise<string> {
  const key = await derivedKey(secret, 'vault')
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plain))
  return `v1.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(data))}`
}

/** Null si la valeur a été chiffrée avec un autre APP_SECRET ou abîmée. */
export async function unseal(secret: string, sealed: string): Promise<string | null> {
  const [version, iv, data] = sealed.split('.')
  if (version !== 'v1' || !iv || !data) return null
  try {
    const key = await derivedKey(secret, 'vault')
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(iv) }, key, fromBase64Url(data))
    return decoder.decode(plain)
  } catch {
    return null
  }
}

/** Au-delà, Workers refuse PBKDF2 (NotSupportedError). */
const PBKDF2_MAX_ITERATIONS = 100_000

async function pbkdf2(password: string, salt: Uint8Array, iterations: number, length: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, length * 8)
  return new Uint8Array(bits)
}

/** Même format que le panel LuuxCraft : `pbkdf2$sha256$<itérations>$<sel>$<empreinte>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt, PBKDF2_MAX_ITERATIONS, 32)
  return ['pbkdf2', 'sha256', PBKDF2_MAX_ITERATIONS, toBase64(salt), toBase64(hash)].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, digest, rawIterations, salt, hash] = stored.trim().split('$')
  if (algorithm !== 'pbkdf2' || digest !== 'sha256' || !salt || !hash) return false
  const iterations = Number(rawIterations)
  if (!Number.isInteger(iterations) || iterations <= 0 || iterations > PBKDF2_MAX_ITERATIONS) return false
  const expected = fromBase64(hash)
  const computed = await pbkdf2(password, fromBase64(salt), iterations, expected.length)
  return timingSafeEqual(computed, expected)
}
