import type { DocumentType } from '../../../db/schema'
import { PAYMENT_METHODS, TYPE_LABEL } from '../../../lib/billing/labels'
import { centsToInput, formatEuros, formatQuantity, todayIso } from '../../../lib/billing/money'
import { Icon } from '../../shared/Icon'
import { Card, Field, Select, TextArea } from '../ui'

export type EditorLine = { title: string; details: string; quantity: string; unit: string; price: string }

export type EditorValues = {
  type: DocumentType
  clientId: string
  subject: string
  dueDate: string
  vatRate: string
  notes: string
  lines: EditorLine[]
}

function LineFields({ line, index }: { line: EditorLine; index: number | '$' }) {
  const name = (field: string) => ({ 'data-name': `lines.$.${field}`, name: `lines.${index}.${field}` })
  return (
    <div class="rep-item" data-item data-line>
      <div class="rep-item-head">
        <strong>
          Ligne <span data-index>1</span>
        </strong>
        <div class="rep-tools">
          <button type="button" class="icon-btn" data-up aria-label="Monter">
            <Icon name="arrow_upward" size={18} />
          </button>
          <button type="button" class="icon-btn" data-down aria-label="Descendre">
            <Icon name="arrow_downward" size={18} />
          </button>
          <button type="button" class="icon-btn danger" data-remove aria-label="Supprimer la ligne">
            <Icon name="delete" size={18} />
          </button>
        </div>
      </div>
      <div class="line-grid">
        <label class="field title">
          <span>Désignation</span>
          <input class="input" {...name('title')} value={line.title} placeholder="Développement full-stack" />
        </label>
        <label class="field">
          <span>Quantité</span>
          <input class="input" {...name('quantity')} value={line.quantity} inputmode="decimal" data-qty />
        </label>
        <label class="field">
          <span>Unité</span>
          <input class="input" {...name('unit')} value={line.unit} placeholder="jour" list="units" />
        </label>
        <label class="field">
          <span>Prix unitaire HT</span>
          <input class="input" {...name('price')} value={line.price} inputmode="decimal" placeholder="0,00" data-price />
        </label>
        <div class="field">
          <span>Total HT</span>
          <div class="line-total" data-line-total>
            0,00 €
          </div>
        </div>
        <label class="field details">
          <span>Détail (une ligne par point)</span>
          <textarea class="textarea" {...name('details')} rows={2}>
            {line.details}
          </textarea>
        </label>
      </div>
    </div>
  )
}

const EMPTY_LINE = (unit: string): EditorLine => ({ title: '', details: '', quantity: '1', unit, price: '' })

export function DocumentEditor({
  values,
  clients,
  action,
  defaultUnit,
  error,
  isNew,
}: {
  values: EditorValues
  clients: { id: string; name: string }[]
  action: string
  defaultUnit: string
  error?: string
  isNew: boolean
}) {
  const dueLabel = values.type === 'quote' ? 'Valable jusqu’au' : values.type === 'invoice' ? 'Échéance' : null
  const lines = values.lines.length ? values.lines : [EMPTY_LINE(defaultUnit)]
  const newClient = `/admin/clients/nouveau?ensuite=${values.type === 'quote' ? 'devis' : 'facture'}`
  return (
    <form method="post" action={action} class="form" data-doc-editor>
      <input type="hidden" name="type" value={values.type} />
      <datalist id="units">
        {['jour', 'demi-journée', 'heure', 'forfait', 'mois', 'unité', 'page'].map((unit) => (
          <option value={unit} />
        ))}
      </datalist>
      <Card title="En-tête" icon="description">
        <div class="fields">
          {clients.length ? (
            <Select
              label="Client"
              name="clientId"
              value={values.clientId}
              options={[{ value: '', label: 'Choisir…' }, ...clients.map((client) => ({ value: client.id, label: client.name }))]}
              hint={
                <a class="link" href={newClient}>
                  Nouveau client
                </a>
              }
            />
          ) : (
            <div class="field">
              <span>Client</span>
              <a class="btn" href={newClient}>
                <Icon name="add" size={18} />
                Ajouter un premier client
              </a>
            </div>
          )}
          <Field label="Objet" name="subject" value={values.subject} placeholder="Refonte du site, maintenance de novembre…" />
          {dueLabel ? (
            <Field
              label={dueLabel}
              name="dueDate"
              value={values.dueDate}
              type="date"
              min={todayIso()}
              hint="Vide : calculée à l’émission d’après les réglages."
            />
          ) : null}
          <label class="field">
            <span>TVA (%)</span>
            <input class="input" name="vatRate" value={values.vatRate} inputmode="decimal" placeholder="Non applicable" data-vat />
            <small>Vide : TVA non applicable, art. 293 B du CGI.</small>
          </label>
        </div>
      </Card>

      <Card title="Lignes" icon="receipt_long">
        <div data-repeater>
          <div class="rep-list" data-items>
            {lines.map((line, index) => (
              <LineFields line={line} index={index} />
            ))}
          </div>
          <template>
            <LineFields line={EMPTY_LINE(defaultUnit)} index="$" />
          </template>
          <button type="button" class="btn btn-sm rep-add" data-add>
            <Icon name="add" size={16} />
            Ajouter une ligne
          </button>
        </div>
        <div class="totals">
          <div>
            <span>Total HT</span>
            <span data-total="ht">0,00 €</span>
          </div>
          <div data-vat-row hidden>
            <span>TVA</span>
            <span data-total="vat">0,00 €</span>
          </div>
          <div class="grand">
            <span>{values.type === 'invoice' ? 'Net à payer' : 'Total'}</span>
            <span data-total="ttc">0,00 €</span>
          </div>
        </div>
      </Card>

      <Card title="Notes" icon="edit">
        <TextArea label="Texte imprimé sous les lignes" name="notes" value={values.notes} hint="Conditions particulières, planning, référence de commande…" />
      </Card>

      {error ? <p class="flash flash-err">{error}</p> : null}

      <div class="form-foot">
        <button type="submit" class="btn" name="intent" value="save">
          <Icon name="check" size={18} />
          {isNew ? 'Créer le brouillon' : 'Enregistrer le brouillon'}
        </button>
        <button
          type="submit"
          class="btn"
          name="intent"
          value="issue"
          data-confirm={`Émettre ${values.type === 'quote' ? 'ce devis' : values.type === 'invoice' ? 'cette facture' : 'cet avoir'} ? Il prendra son numéro définitif et ne sera plus modifiable.`}
        >
          <Icon name="task_alt" size={18} />
          Émettre
        </button>
        <button type="submit" class="btn btn-primary" name="intent" value="send">
          <Icon name="send" size={18} />
          Émettre et envoyer
        </button>
      </div>
    </form>
  )
}

export function PaidForm({ action }: { action: string }) {
  return (
    <form method="post" action={action} class="form">
      <div class="fields">
        <Field label="Réglée le" name="paidOn" type="date" value={todayIso()} required />
        <Select label="Moyen" name="method" value="transfer" options={Object.entries(PAYMENT_METHODS).map(([value, label]) => ({ value, label }))} />
      </div>
      <button type="submit" class="btn btn-primary btn-sm">
        <Icon name="payments" size={16} />
        Marquer payée
      </button>
    </form>
  )
}

export function linesToEditor(lines: { title: string; details: string | null; quantity: number; unit: string | null; unitPriceCents: number }[]): EditorLine[] {
  return lines.map((line) => ({
    title: line.title,
    details: line.details ?? '',
    quantity: formatQuantity(line.quantity).replace(/ /g, ''),
    unit: line.unit ?? '',
    price: centsToInput(line.unitPriceCents),
  }))
}

export function typeTitle(type: DocumentType, number: string | null): string {
  return number ? `${TYPE_LABEL[type]} ${number}` : `${TYPE_LABEL[type]} (brouillon)`
}

export { formatEuros }
