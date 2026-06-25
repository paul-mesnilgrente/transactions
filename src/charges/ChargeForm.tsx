import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Charge, ChargeRecord } from './charge'

const PAYMENT_TYPES = ['CB', 'ESP', 'VIR', 'Chèque']

interface Draft {
  date: string
  supplier: string
  category: string
  label: string
  amount: string
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
    supplier: '',
    category: '',
    label: '',
    amount: '',
    paymentType: '',
    notes: '',
  }
}

function fromRecord(r: ChargeRecord): Draft {
  return {
    date: r.date,
    supplier: r.supplier,
    category: r.category,
    label: r.label,
    amount: r.amount?.toString() ?? '',
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

function toCharge(d: Draft): Charge {
  return {
    date: d.date.trim(),
    supplier: d.supplier.trim(),
    category: d.category.trim(),
    label: d.label.trim(),
    amount: parseAmount(d.amount),
    paymentType: d.paymentType.trim(),
    notes: d.notes.trim(),
  }
}

interface Props {
  initial?: ChargeRecord | null
  suppliers?: string[]
  categories?: string[]
  autoFocus?: boolean
  onSubmit: (charge: Charge) => Promise<boolean>
  onCancel?: () => void
  busy?: boolean
}

export function ChargeForm({
  initial,
  suppliers = [],
  categories = [],
  autoFocus,
  onSubmit,
  onCancel,
  busy,
}: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const editing = initial != null

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
    const ok = await onSubmit(toCharge(draft))
    if (ok && !editing) setDraft(emptyDraft())
  }

  return (
    <form
      ref={formRef}
      className="card card-body shadow-sm mb-3"
      onSubmit={handleSubmit}
    >
      {editing && (
        <div className="small text-body-secondary mb-2">Modifier la charge</div>
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

        <div className="col-8 col-lg-3">
          <label htmlFor={id('supplier')} className="visually-hidden">
            Fournisseur
          </label>
          <input
            id={id('supplier')}
            type="text"
            className="form-control form-control-sm"
            list={id('suppliers-list')}
            autoComplete="off"
            placeholder="Fournisseur"
            value={draft.supplier}
            onChange={(e) => set('supplier', e.target.value)}
          />
          <datalist id={id('suppliers-list')}>
            {suppliers.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="col-6 col-lg-2">
          <label htmlFor={id('category')} className="visually-hidden">
            Catégorie
          </label>
          <input
            id={id('category')}
            type="text"
            className="form-control form-control-sm"
            list={id('categories-list')}
            autoComplete="off"
            placeholder="Catégorie"
            value={draft.category}
            onChange={(e) => set('category', e.target.value)}
          />
          <datalist id={id('categories-list')}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="col-6 col-lg-3">
          <label htmlFor={id('label')} className="visually-hidden">
            Libellé
          </label>
          <input
            id={id('label')}
            type="text"
            className="form-control form-control-sm"
            placeholder="Libellé"
            value={draft.label}
            onChange={(e) => set('label', e.target.value)}
          />
        </div>

        <div className="col-6 col-lg-2">
          <label htmlFor={id('amount')} className="visually-hidden">
            Montant
          </label>
          <div className="input-group input-group-sm">
            <input
              id={id('amount')}
              type="number"
              className="form-control"
              step="0.01"
              inputMode="decimal"
              placeholder="0,00"
              value={draft.amount}
              onChange={(e) => set('amount', e.target.value)}
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
