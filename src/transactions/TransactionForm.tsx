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

function today(): string {
  return new Date().toISOString().slice(0, 10)
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
    date: d.date,
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
    <form className="tx-form" onSubmit={handleSubmit}>
      <h2>{editing ? 'Modifier la transaction' : 'Nouvelle transaction'}</h2>

      <div className="grid">
        <label>
          Date
          <input
            type="date"
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </label>

        <label>
          Client
          <input
            type="text"
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
        </label>

        <label>
          Prestations
          <input
            type="text"
            value={draft.services}
            onChange={(e) => set('services', e.target.value)}
          />
        </label>

        <label>
          Facturé prestation
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={draft.servicesAmount}
            onChange={(e) => set('servicesAmount', e.target.value)}
          />
        </label>

        <label>
          Marchandises
          <input
            type="text"
            value={draft.goods}
            onChange={(e) => set('goods', e.target.value)}
          />
        </label>

        <label>
          Facturé marchandise
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={draft.goodsAmount}
            onChange={(e) => set('goodsAmount', e.target.value)}
          />
        </label>

        <label>
          Type de paiement
          <input
            type="text"
            list="payment-types"
            value={draft.paymentType}
            onChange={(e) => set('paymentType', e.target.value)}
          />
          <datalist id="payment-types">
            {PAYMENT_TYPES.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>

        <label className="full">
          Notes
          <textarea
            rows={2}
            value={draft.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </label>
      </div>

      <div className="actions">
        <button type="submit" disabled={busy}>
          {busy ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Ajouter'}
        </button>
        {editing && onCancel && (
          <button type="button" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
