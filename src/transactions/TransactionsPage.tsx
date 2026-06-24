import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSheets } from '../sheets/useSheets'
import type { Transaction, TransactionRecord } from '../sheets/transaction'
import { TransactionForm } from './TransactionForm'
import { TransactionFilters } from './TransactionFilters'
import { TransactionsTable } from './TransactionsTable'
import {
  applyFilters,
  clientsIn,
  defaultFilters,
  normalizeFilters,
  totalBilled,
  yearsIn,
  type Filters,
} from './filtering'

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Une erreur est survenue'
}

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

export function TransactionsPage() {
  const { list, add, update, clients: fetchClients, addClient } = useSheets()

  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [clients, setClients] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<TransactionRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTransactions(await list())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [list])

  useEffect(() => {
    void reload()
  }, [reload])

  // Client list is best-effort: a missing Clients tab shouldn't block the page.
  useEffect(() => {
    fetchClients()
      .then(setClients)
      .catch(() => undefined)
  }, [fetchClients])

  // Create the client in the Clients tab if it's a name we haven't seen yet.
  const ensureClient = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      const exists = clients.some(
        (c) => c.toLowerCase() === trimmed.toLowerCase(),
      )
      if (exists) return
      await addClient(trimmed)
      setClients((prev) =>
        [...prev, trimmed].sort((a, b) => a.localeCompare(b, 'fr')),
      )
    },
    [clients, addClient],
  )

  const handleSubmit = useCallback(
    async (draft: Transaction): Promise<boolean> => {
      setSaving(true)
      setError(null)
      try {
        await ensureClient(draft.client)
        if (editing) {
          const updated = await update({ ...draft, row: editing.row })
          setTransactions((prev) =>
            prev.map((t) => (t.row === updated.row ? updated : t)),
          )
          setEditing(null)
        } else {
          const added = await add(draft)
          setTransactions((prev) => [...prev, added])
        }
        return true
      } catch (e) {
        setError(errorMessage(e))
        return false
      } finally {
        setSaving(false)
      }
    },
    [add, update, editing, ensureClient],
  )

  const clientOptions = useMemo(() => clientsIn(transactions), [transactions])
  const yearOptions = useMemo(() => yearsIn(transactions), [transactions])
  const filtered = useMemo(
    () => applyFilters(transactions, filters),
    [transactions, filters],
  )
  const filteredTotal = useMemo(() => totalBilled(filtered), [filtered])

  return (
    <section className="transactions">
      <TransactionForm
        initial={editing}
        clients={clients}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
        busy={saving}
      />

      {error && <p className="error" role="alert">{error}</p>}

      <div className="list-header">
        <h2>Transactions</h2>
        <button type="button" onClick={() => void reload()} disabled={loading}>
          {loading ? 'Chargement…' : 'Rafraîchir'}
        </button>
      </div>

      <TransactionFilters
        filters={filters}
        onChange={(f) => setFilters(normalizeFilters(f))}
        onReset={() => setFilters(defaultFilters())}
        clientOptions={clientOptions}
        yearOptions={yearOptions}
      />

      <p className="summary">
        {filtered.length} / {transactions.length} transaction
        {transactions.length > 1 ? 's' : ''} · Total facturé&nbsp;:{' '}
        <strong>{money.format(filteredTotal)}</strong>
      </p>

      {loading && transactions.length === 0 ? (
        <p>Chargement…</p>
      ) : (
        <TransactionsTable
          transactions={filtered}
          onEdit={setEditing}
          editingRow={editing?.row}
        />
      )}
    </section>
  )
}
