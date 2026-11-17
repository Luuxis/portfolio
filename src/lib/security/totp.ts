import { timingSafeEqualString } from './crypto'

/**
 * TOTP (RFC 6238) en WebCrypto : HMAC-SHA1, 6 chiffres, pas de 30 s, comme
 * toutes les applis d'authentification (et le panel LuuxCraft).
 */

const DIGITS = 6
const STEP = 30
const ISSUER = 'luuxis.fr'
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function generateTotpSecret(bytes = 20): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(bytes)))
}

export function totpUri(secret: string, account: string): string {
  const label = encodeURIComponent(`${ISSUER}:${account}`)
  const params = new URLSearchParams({ secret, issuer: ISSUER, algorithm: 'SHA1', digits: String(DIGITS), period: String(STEP) })
  return `otpauth://totp/${label}?${params}`
}

/**
 * Vérifie un code avec une marge d'un pas de chaque côté. Renvoie le compteur
 * accepté (pour refuser qu'un même code serve deux fois), ou null.
 */
export async function verifyTotp(secret: string, code: string, lastCounter = -1): Promise<number | null> {
  const normalized = code.replace(/\D/g, '')
  if (normalized.length !== DIGITS) return null
  const now = Math.floor(Date.now() / 1000 / STEP)
  for (const counter of [now - 1, now, now + 1]) {
    if (counter <= lastCounter) continue
    if (timingSafeEqualString(await generate(secret, counter), normalized)) return counter
  }
  return null
}

async function generate(secret: string, counter: number): Promise<string> {
  const message = new Uint8Array(8)
  let value = counter
  for (let i = 7; i >= 0; i--) {
    message[i] = value & 0xff
    value = Math.floor(value / 256)
  }
  const key = await crypto.subtle.importKey('raw', base32Decode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  const offset = sig[sig.length - 1] & 0x0f
  const binary =
    ((sig[offset] & 0x7f) << 24) | ((sig[offset + 1] & 0xff) << 16) | ((sig[offset + 2] & 0xff) << 8) | (sig[offset + 3] & 0xff)
  return String(binary % 10 ** DIGITS).padStart(DIGITS, '0')
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s=]/g, '')
  let bits = 0
  let value = 0
  const output: number[] = []
  for (const char of clean) {
    const index = ALPHABET.indexOf(char)
    if (index === -1) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return new Uint8Array(output)
}
