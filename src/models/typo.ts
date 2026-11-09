/**
 * Typographie française appliquée aux contenus : espace insécable avant
 * « : ; ? ! », entre les milliers et devant « % » ou « h ». Évite qu'un
 * deux-points ou un « 000 » se retrouve seul en début de ligne.
 */
const rules: [RegExp, string][] = [
  [/ ([:;?!])/g, ' $1'],
  [/(\d) (?=\d{3}\b)/g, '$1 '],
  [/(\d) (%|h\b)/g, '$1 $2'],
]

function fix(text: string): string {
  return rules.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text)
}

export function typo<T>(value: T): T {
  if (typeof value === 'string') return fix(value) as T
  if (Array.isArray(value)) return value.map((item) => typo(item)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typo(item)])) as T
  }
  return value
}
