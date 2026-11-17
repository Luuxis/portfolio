import { sql, type SQL, type SQLWrapper } from 'drizzle-orm'

/**
 * Recherches de texte sans LIKE : D1 refuse en production un motif LIKE de
 * plus de 50 octets (« LIKE or GLOB pattern too complex »), ce qu'un
 * Message-ID ou une recherche un peu longue dépassent vite. instr() n'a pas
 * cette limite. En local (SQLite de Miniflare), la limite n'existe pas.
 */

/** La colonne contient le texte, sans tenir compte de la casse (ASCII, comme LIKE). */
export function contains(column: SQLWrapper, needle: string): SQL {
  return sql`instr(lower(${column}), lower(${needle})) > 0`
}

/** La colonne commence par le préfixe. */
export function startsWith(column: SQLWrapper, prefix: string): SQL {
  return sql`substr(${column}, 1, ${prefix.length}) = ${prefix}`
}
