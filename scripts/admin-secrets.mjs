#!/usr/bin/env node
/**
 * Prépare les secrets de l'admin :
 *   ADMIN_PASSWORD_HASH  empreinte PBKDF2 du mot de passe (même format que le Worker)
 *   APP_SECRET           signe les sessions et chiffre les mots de passe SMTP/IMAP en base
 *
 *   npm run admin:secrets -- --dev    écrit .dev.vars pour `npm run dev`
 *   npm run admin:secrets -- --prod   envoie les secrets au Worker (wrangler secret put)
 *   npm run admin:secrets -- --prod --keep-secret   ne change que le mot de passe
 *
 * Changer APP_SECRET rend illisibles les mots de passe SMTP/IMAP déjà enregistrés
 * (à ressaisir dans Réglages) et ferme les sessions : ne le change qu'au besoin.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { webcrypto as crypto } from 'node:crypto'
import { createInterface } from 'node:readline'
import { spawnSync } from 'node:child_process'

const ITERATIONS = 100_000

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    rl._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text)
    }
    rl.question(question, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
  })
}

async function hash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256)
  return ['pbkdf2', 'sha256', ITERATIONS, Buffer.from(salt).toString('base64'), Buffer.from(bits).toString('base64')].join('$')
}

const password = process.env.ADMIN_PASSWORD ?? (await askHidden('Mot de passe de l’admin : '))
if (!process.env.ADMIN_PASSWORD) {
  const again = await askHidden('Encore une fois : ')
  if (again !== password) {
    console.error('Les deux saisies diffèrent.')
    process.exit(1)
  }
}

const passwordHash = await hash(password)
const appSecret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url')

if (process.argv.includes('--dev')) {
  const path = '.dev.vars'
  const kept = existsSync(path)
    ? readFileSync(path, 'utf8')
        .split('\n')
        .filter((line) => line && !/^(ADMIN_PASSWORD_HASH|APP_SECRET)=/.test(line))
    : []
  const previousSecret = existsSync(path) ? readFileSync(path, 'utf8').match(/^APP_SECRET='?([^'\n]*)'?$/m)?.[1] : null
  // wrangler passe .dev.vars par dotenv-expand : les « $ » de l'empreinte doivent être échappés.
  const escapedHash = passwordHash.replaceAll('$', '\\$')
  writeFileSync(path, [...kept, `ADMIN_PASSWORD_HASH='${escapedHash}'`, `APP_SECRET='${previousSecret ?? appSecret}'`, ''].join('\n'))
  console.log(`${path} mis à jour${previousSecret ? ' (APP_SECRET conservé)' : ''}.`)
} else if (process.argv.includes('--prod')) {
  const put = (name, value) => {
    const result = spawnSync('npx', ['wrangler', 'secret', 'put', name], { input: value, stdio: ['pipe', 'inherit', 'inherit'] })
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
  put('ADMIN_PASSWORD_HASH', passwordHash)
  if (!process.argv.includes('--keep-secret')) put('APP_SECRET', appSecret)
} else {
  console.log('Rien n’a été écrit : ajoute --dev (fichier .dev.vars) ou --prod (secrets du Worker).')
}
