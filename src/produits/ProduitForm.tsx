import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Produit, ProduitRecord } from '../sheets/produit'

const PAYMENT_TYPES = ['CB', 'ESP', 'VIR', 'Chèque']

// The form keeps every field as a string (what inputs give us) and converts
// to a Produit on submit.
interface Draft {
  date: string
  client: string
  services: string
  servicesAmount: string
  goods: string
  goodsAmount: string
  paymentType: string
  notes: string
}

// Day-first French format (JJ/MM/AAAA), matching the spreadsheet.
function today(): string {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${d.getFullYear()}`
}

function emptyDraft(): Draft {
  return {
    date: today(),
    client: '',
    services: '',
    servicesAmount: '',
    goods: '',
    goodsAmount: '',
    paymentType: '',
    notes: '',
  }
}

function fromRecord(r: ProduitRecord): Draft {
  return {
    date: r.date,
    client: r.client,
    services: r.services,
    servicesAmount: r.servicesAmount?.toString() ?? '',
    goods: r.goods,
    goodsAmount: r.goodsAmount?.toString() ?? '',
    paymentType: r.paymentType,
    notes: r.notes,
  }
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const n = Number(trimmed.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function toProduit(d: Draft): Produit {
  return {
    date: d.date.trim(),
    client: d.client.trim(),
    services: d.services.trim(),
    servicesAmount: parseAmount(d.servicesAmount),
    goods: d.goods.trim(),
    goodsAmount: parseAmount(d.goodsAmount),
    paymentType: d.paymentType.trim(),
    notes: d.notes.trim(),
  }
}

interface Props {
  /** When set, the form edits this record; otherwise it adds a new one. */
  initial?: ProduitRecord | null
  /** Known client names, shown as autocomplete suggestions. */
  clients?: string[]
  /** Scroll the form into view and focus the first field on mount. */
  autoFocus?: boolean
  /** Persist the produit. Resolve true on success so the form can reset. */
  onSubmit: (produit: Produit) => Promise<boolean>
  onCancel?: () => void
  busy?: boolean
}

export function ProduitForm({
  initial,
  clients = [],
  autoFocus,
  onSubmit,
  onCancel,
  busy,
}: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const editing = initial != null

  // Unique ids so multiple forms (top "add" + inline "edit") can coexist.
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`

  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    setDraft(initial ? fromRecord(initial) : emptyDraft())
  }, [initial])

  useEffect(() => {
    if (!autoFocus) return
    const node = formRef.current
    if (!node) return
    node.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    node.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
  }, [autoFocus])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await onSubmit(toProduit(draft))
    if (ok && !editing) setDraft(emptyDraft())
  }

  return (
    <form
      ref={formRef}
      className="card card-body shadow-sm mb-3"
      onSubmit={handleSubmit}
    >
      {editing && (
        <div className="small text-body-secondary mb-2">
          Modifier le produit
        </div>
      )}

      <div className="row g-2">
        <div className="col-4 col-lg-2">
          <label htmlFor={id('date')} className="visually-hidden">
            Date
          </label>
          <input
            id={id('date')}
            type="text"
            className="form-control form-control-sm"
            inputMode="numeric"
            placeholder="JJ/MM/AAAA"
            pattern="\d{1,2}/\d{1,2}/\d{4}"
            title="Format attendu : JJ/MM/AAAA"
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </div>

        <div className="col-8 col-lg-2">
          <label htmlFor={id('client')} className="visually-hidden">
            Client
          </label>
          <input
            id={id('client')}
            type="text"
            className="form-control form-control-sm"
            list={id('clients-list')}
            autoComplete="off"
            placeholder="Client"
            value={draft.client}
            onChange={(e) => set('client', e.target.value)}
          />
          <datalist id={id('clients-list')}>
            {clients.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {/* Prestations + montant facturé */}
        <div className="col-12 col-lg-3">
          <div className="input-group input-group-sm">
            <label htmlFor={id('services')} className="visually-hidden">
              Prestations
            </label>
            <input
              id={id('services')}
              type="text"
              className="form-control"
              placeholder="Prestations"
              value={draft.services}
              onChange={(e) => set('services', e.target.value)}
            />
            <input
              type="number"
              className="form-control flex-grow-0"
              style={{ width: '5.5rem' }}
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              aria-label="Facturé prestation"
              value={draft.servicesAmount}
              onChange={(e) => set('servicesAmount', e.target.value)}
            />
            <span className="input-group-text">€</span>
          </div>
        </div>

        {/* Marchandises + montant facturé */}
        <div className="col-12 col-lg-3">
          <div className="input-group input-group-sm">
            <label htmlFor={id('goods')} className="visually-hidden">
              Marchandises
            </label>
            <input
              id={id('goods')}
              type="text"
              className="form-control"
              placeholder="Marchandises"
              value={draft.goods}
              onChange={(e) => set('goods', e.target.value)}
            />
            <input
              type="number"
              className="form-control flex-grow-0"
              style={{ width: '5.5rem' }}
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              aria-label="Facturé marchandise"
              value={draft.goodsAmount}
              onChange={(e) => set('goodsAmount', e.target.value)}
            />
            <span className="input-group-text">€</span>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <label htmlFor={id('payment')} className="visually-hidden">
            Type de paiement
          </label>
          <input
            id={id('payment')}
            type="text"
            className="form-control form-control-sm"
            list={id('payment-types')}
            placeholder="Paiement"
            value={draft.paymentType}
            onChange={(e) => set('paymentType', e.target.value)}
          />
          <datalist id={id('payment-types')}>
            {PAYMENT_TYPES.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div className="col-6 col-lg">
          <label htmlFor={id('notes')} className="visually-hidden">
            Notes
          </label>
          <input
            id={id('notes')}
            type="text"
            className="form-control form-control-sm"
            placeholder="Notes"
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="col-12 col-lg-auto d-flex gap-2">
          <button
            type="submit"
            className="btn btn-sm btn-primary"
            disabled={busy}
          >
            {busy ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editing && onCancel && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onCancel}
              disabled={busy}
            >
              Annuler
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
