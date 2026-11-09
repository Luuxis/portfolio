/** JSON-LD sûr dans un <script> : aucun `</script>` ne peut fermer la balise. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
