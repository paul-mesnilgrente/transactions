import { useEffect, useState, type FormEvent } from 'react'
import type { Transaction, TransactionRecord } from '../sheets/transaction'

const PAYMENT_TYPES = ['Carte', 'Espèces', 'Virement', 'Chèque']

// The form keeps every field as a string (what inputs give us) and converts
// to a Transaction on submit.
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

function fromRecord(r: TransactionRecord): Draft {
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

function toTransaction(d: Draft): Transaction {
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
  initial?: TransactionRecord | null
  /** Known client names, shown as autocomplete suggestions. */
  clients?: string[]
  /** Persist the transaction. Resolve true on success so the form can reset. */
  onSubmit: (transaction: Transaction) => Promise<boolean>
  onCancel?: () => void
  busy?: boolean
}

export function TransactionForm({
  initial,
  clients = [],
  onSubmit,
  onCancel,
  busy,
}: Props) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const editing = initial != null

  useEffect(() => {
    setDraft(initial ? fromRecord(initial) : emptyDraft())
  }, [initial])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await onSubmit(toTransaction(draft))
    if (ok && !editing) setDraft(emptyDraft())
  }

  return (
    <form className="card card-body shadow-sm mb-4" onSubmit={handleSubmit}>
      <h2 className="h5 mb-3">
        {editing ? 'Modifier la transaction' : 'Nouvelle transaction'}
      </h2>

      <div className="row g-3">
        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="tx-date" className="form-label">
            Date
          </label>
          <input
            id="tx-date"
            type="text"
            className="form-control"
            inputMode="numeric"
            placeholder="JJ/MM/AAAA"
            pattern="\d{1,2}/\d{1,2}/\d{4}"
            title="Format attendu : JJ/MM/AAAA"
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="tx-client" className="form-label">
            Client
          </label>
          <input
            id="tx-client"
            type="text"
            className="form-control"
            list="clients-list"
            autoComplete="off"
            placeholder="Choisir ou créer…"
            value={draft.client}
            onChange={(e) => set('client', e.target.value)}
          />
          <datalist id="clients-list">
            {clients.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="tx-services" className="form-label">
            Prestations
          </label>
          <input
            id="tx-services"
            type="text"
            className="form-control"
            value={draft.services}
            onChange={(e) => set('services', e.target.value)}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="tx-services-amount" className="form-label">
            Facturé prestation
          </label>
          <input
            id="tx-services-amount"
            type="number"
            className="form-control"
            step="0.01"
            inputMode="decimal"
            value={draft.servicesAmount}
            onChange={(e) => set('servicesAmount', e.target.value)}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="tx-goods" className="form-label">
            Marchandises
          </label>
          <input
            id="tx-goods"
            type="text"
            className="form-control"
            value={draft.goods}
            onChange={(e) => set('goods', e.target.value)}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="tx-goods-amount" className="form-label">
            Facturé marchandise
          </label>
          <input
            id="tx-goods-amount"
            type="number"
            className="form-control"
            step="0.01"
            inputMode="decimal"
            value={draft.goodsAmount}
            onChange={(e) => set('goodsAmount', e.target.value)}
          />
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="tx-payment" className="form-label">
            Type de paiement
          </label>
          <input
            id="tx-payment"
            type="text"
            className="form-control"
            list="payment-types"
            value={draft.paymentType}
            onChange={(e) => set('paymentType', e.target.value)}
          />
          <datalist id="payment-types">
            {PAYMENT_TYPES.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div className="col-12">
          <label htmlFor="tx-notes" className="form-label">
            Notes
          </label>
          <textarea
            id="tx-notes"
            className="form-control"
            rows={2}
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>
      </div>

      <div className="d-flex gap-2 mt-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ajouter'}
        </button>
        {editing && onCancel && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
