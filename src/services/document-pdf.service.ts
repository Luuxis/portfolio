import type { FerrumPdfOptions } from '../lib/ferrum-pdf'
import { renderPdf } from '../lib/ferrum-pdf'
import { TYPE_SLUG } from '../lib/billing/labels'
import type { CloudflareBindings } from '../types/bindings'
import { documentFooterTemplate, renderDocumentSheet } from '../views/documents/DocumentSheet'
import type { DocumentService, DocumentFull } from './document.service'

/** Adresse d'affichage de la page rendue : le HTML est servi par interception, rien n'est chargé. */
const DISPLAY_URL = 'https://luuxis.fr/admin/document'

/**
 * PDF des documents, rendus par Browser Run depuis la même feuille HTML que
 * l'aperçu. Un document émis est rendu une fois puis rangé dans R2 : ce qui a
 * été envoyé au client ne change plus, même si la mise en page évolue.
 */
export class DocumentPdfService {
  constructor(
    private readonly env: CloudflareBindings,
    private readonly documents: DocumentService,
  ) {}

  filename(full: DocumentFull): string {
    const number = (full.doc.number ?? 'brouillon').replace(/[^A-Za-z0-9_-]/g, '-')
    return `${TYPE_SLUG[full.doc.type]}-${number}.pdf`
  }

  async html(full: DocumentFull): Promise<string> {
    return renderDocumentSheet(await this.documents.printable(full))
  }

  /** Le PDF d'un document : celui de R2 s'il est émis, sinon rendu à la volée. */
  async get(full: DocumentFull): Promise<Uint8Array> {
    const { doc } = full
    if (doc.pdfKey) {
      const stored = await this.env.files.get(doc.pdfKey)
      if (stored) return new Uint8Array(await stored.arrayBuffer())
    }
    const pdf = await this.render(full)
    if (doc.status !== 'draft' && doc.number) {
      const key = `documents/${doc.type}/${doc.number}.pdf`
      await this.env.files.put(key, pdf, {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: { documentId: doc.id, number: doc.number },
      })
      await this.documents.setPdfKey(doc.id, key)
    }
    return pdf
  }

  private async render(full: DocumentFull): Promise<Uint8Array> {
    const data = await this.documents.printable(full)
    const pdfOptions: FerrumPdfOptions = {
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      marginTop: 0.55,
      marginBottom: 0.7,
      marginLeft: 0.55,
      marginRight: 0.55,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: documentFooterTemplate(data),
    }
    return renderPdf(this.env.BROWSER, {
      html: renderDocumentSheet(data),
      displayUrl: DISPLAY_URL,
      pdfOptions,
      waitForIdleOptions: { connections: 0, duration: 200, timeout: 10_000 },
    })
  }
}
