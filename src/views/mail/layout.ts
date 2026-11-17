/**
 * Mails envoyés depuis l'admin : un texte simple mis en page aux couleurs du
 * site, version claire (la plupart des clients mail ignorent le thème sombre),
 * styles en ligne, tableaux pour Outlook. Le texte brut part à côté.
 */

const C = {
  page: '#E8E4DA',
  surface: '#FFFFFF',
  ink: '#1B1712',
  ink2: '#413A2F',
  ink3: '#5E5546',
  accent: '#6DB33F',
  line: '#BDB4A3',
} as const

const FONT = 'Arial,"Helvetica Neue",Helvetica,sans-serif'

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Paragraphes séparés par une ligne vide, liens cliquables, citations « > » en retrait. */
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const quoted = block.split('\n').every((line) => line.startsWith('>'))
      const content = escapeHtml(quoted ? block.replace(/^> ?/gm, '') : block)
        .replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g, `<a href="$1" style="color:${C.ink};font-weight:700;">$1</a>`)
        .replace(/\n/g, '<br>')
      return quoted
        ? `<blockquote style="margin:0 0 16px;padding:0 0 0 12px;border-left:3px solid ${C.line};color:${C.ink3};">${content}</blockquote>`
        : `<p style="margin:0 0 16px;">${content}</p>`
    })
    .join('')
}

export function renderMailHtml({ text, signature, preheader }: { text: string; signature?: string; preheader?: string }): string {
  const signatureHtml = signature
    ? `<p style="margin:20px 0 0;padding-top:14px;border-top:2px solid ${C.ink};color:${C.ink3};font-size:13px;line-height:1.5;">${escapeHtml(signature).replace(/\n/g, '<br>')}</p>`
    : ''
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
</head>
<body style="margin:0;padding:0;background:${C.page};">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader ?? '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.surface};border:3px solid ${C.ink};">
<tr><td style="height:8px;background:${C.accent};border-bottom:3px solid ${C.ink};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 32px;font-family:${FONT};font-size:15px;line-height:1.6;color:${C.ink2};">${textToHtml(text)}${signatureHtml}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

export function withSignature(text: string, signature?: string): string {
  return signature ? `${text}\n\n-- \n${signature}` : text
}
