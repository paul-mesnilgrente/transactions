import { useCallback, useEffect, useState } from 'react'
import { useSheets } from '../sheets/useSheets'
import type { Transaction, TransactionRecord } from '../sheets/transaction'
import { TransactionForm } from './TransactionForm'
import { TransactionsTable } from './TransactionsTable'

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Une erreur est survenue'
}

export function TransactionsPage() {
  const { list, add, update } = useSheets()

  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<TransactionRecord | null>(null)
  const [saving, setSaving] = useState(false)

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

  const handleSubmit = useCallback(
    async (draft: Transaction): Promise<boolean> => {
      setSaving(true)
      setError(null)
      try {
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
    [add, update, editing],
  )

  return (
    <section className="transactions">
      <TransactionForm
        initial={editing}
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

      {loading && transactions.length === 0 ? (
        <p>Chargement…</p>
      ) : (
        <TransactionsTable
          transactions={transactions}
          onEdit={setEditing}
          editingRow={editing?.row}
        />
      )}
    </section>
  )
}
