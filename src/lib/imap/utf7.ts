/**
 * UTF-7 modifié des noms de dossiers IMAP (RFC 3501 §5.1.3) : l'ASCII
 * imprimable passe tel quel, « & » devient « &- », et tout le reste est écrit
 * en UTF-16 gros-boutiste, en base64 (« , » à la place de « / », sans « = »),
 * entre « & » et « - ». Exemple : « Éléments envoyés » ↔ « &AMk-l&AOk-ments envoy&AOk-s ».
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+,'

function isDirect(code: number): boolean {
  return code >= 0x20 && code <= 0x7e
}

function encodeRun(units: number[]): string {
  const bytes: number[] = []
  for (const unit of units) bytes.push(unit >> 8, unit & 0xff)

  let out = ''
  let i = 0
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63] + ALPHABET[(n >> 6) & 63] + ALPHABET[n & 63]
  }
  const rest = bytes.length - i
  if (rest === 1) {
    const n = bytes[i] << 16
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63]
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63] + ALPHABET[(n >> 6) & 63]
  }
  return `&${out}-`
}

function decodeRun(run: string): string {
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of run) {
    const index = ALPHABET.indexOf(char)
    if (index === -1) continue
    value = ((value << 6) | index) & 0xffffff
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 0xff)
    }
  }

  let out = ''
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1])
  }
  return out
}

/** Nom UTF-8 → nom à envoyer au serveur. */
export function encodeMailboxName(name: string): string {
  let out = ''
  let run: number[] = []

  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i)
    if (isDirect(code)) {
      if (run.length) {
        out += encodeRun(run)
        run = []
      }
      out += code === 0x26 ? '&-' : name[i]
    } else {
      // Unités UTF-16 telles quelles : les paires de substitution restent entières.
      run.push(code)
    }
  }
  if (run.length) out += encodeRun(run)
  return out
}

/** Nom reçu du serveur → UTF-8. Un nom mal formé est rendu tel quel. */
export function decodeMailboxName(name: string): string {
  if (!name.includes('&')) return name

  let out = ''
  let i = 0
  while (i < name.length) {
    const char = name[i]
    if (char !== '&') {
      out += char
      i += 1
      continue
    }
    const end = name.indexOf('-', i + 1)
    if (end === -1) return name
    out += end === i + 1 ? '&' : decodeRun(name.slice(i + 1, end))
    i = end + 1
  }
  return out
}
