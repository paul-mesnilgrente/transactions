import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCharges } from './useCharges'
import type { Charge, ChargeRecord } from './charge'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ChargeForm } from './ChargeForm'
import { ChargeFilters } from './ChargeFilters'
import { ChargesTable } from './ChargesTable'
import {
  applyFilters,
  categoriesIn,
  defaultFilters,
  normalizeFilters,
  suppliersIn,
  totalAmount,
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

export function ChargesPage() {
  const { list, add, update, remove } = useCharges()

  const [charges, setCharges] = useState<ChargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ChargeRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<ChargeRecord | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCharges(await list())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [list])

  useEffect(() => {
    void reload()
  }, [reload])

  const handleAdd = useCallback(
    async (draft: Charge): Promise<boolean> => {
      setSaving(true)
      setError(null)
      try {
        const added = await add(draft)
        setCharges((prev) => [...prev, added])
        return true
      } catch (e) {
        setError(errorMessage(e))
        return false
      } finally {
        setSaving(false)
      }
    },
    [add],
  )

  const handleUpdate = useCallback(
    async (draft: Charge): Promise<boolean> => {
      if (!editing) return false
      setSaving(true)
      setError(null)
      try {
        const updated = await update({ ...draft, row: editing.row })
        setCharges((prev) =>
          prev.map((c) => (c.row === updated.row ? updated : c)),
        )
        setEditing(null)
        return true
      } catch (e) {
        setError(errorMessage(e))
        return false
      } finally {
        setSaving(false)
      }
    },
    [editing, update],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleting) return
    const deletedRow = deleting.row
    setDeletingBusy(true)
    setError(null)
    try {
      await remove(deletedRow)
      // Deleting a row shifts every later row up by one, so renumber state.
      setCharges((prev) =>
        prev
          .filter((c) => c.row !== deletedRow)
          .map((c) => (c.row > deletedRow ? { ...c, row: c.row - 1 } : c)),
      )
      setEditing((cur) => {
        if (!cur) return cur
        if (cur.row === deletedRow) return null
        return cur.row > deletedRow ? { ...cur, row: cur.row - 1 } : cur
      })
      setDeleting(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setDeletingBusy(false)
    }
  }, [deleting, remove])

  const categoryOptions = useMemo(() => categoriesIn(charges), [charges])
  const supplierOptions = useMemo(() => suppliersIn(charges), [charges])
  const yearOptions = useMemo(() => yearsIn(charges), [charges])
  const filtered = useMemo(
    // Most recent first (rows are appended chronologically to the sheet).
    () => applyFilters(charges, filters).reverse(),
    [charges, filters],
  )
  const filteredTotal = useMemo(() => totalAmount(filtered), [filtered])

  return (
    <section className="charges">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <ChargeFilters
        filters={filters}
        onChange={(f) => setFilters(normalizeFilters(f))}
        onReset={() => setFilters(defaultFilters())}
        categoryOptions={categoryOptions}
        yearOptions={yearOptions}
      />

      <p className="text-body-secondary small">
        {filtered.length} / {charges.length} charge
        {charges.length > 1 ? 's' : ''} · Total&nbsp;:{' '}
        <strong>{money.format(filteredTotal)}</strong>
      </p>

      {/* Always-present draft at the top of the list. */}
      <ChargeForm
        suppliers={supplierOptions}
        categories={categoryOptions}
        onSubmit={handleAdd}
        busy={saving && editing == null}
      />

      {loading && charges.length === 0 ? (
        <p>Chargement…</p>
      ) : (
        <ChargesTable
          charges={filtered}
          onEdit={setEditing}
          onDelete={setDeleting}
          onReload={() => void reload()}
          loading={loading}
          editingRow={editing?.row}
          editor={
            editing && (
              <ChargeForm
                key={editing.row}
                initial={editing}
                suppliers={supplierOptions}
                categories={categoryOptions}
                autoFocus
                onSubmit={handleUpdate}
                onCancel={() => setEditing(null)}
                busy={saving}
              />
            )
          }
        />
      )}

      <ConfirmDialog
        open={deleting != null}
        title="Supprimer la charge"
        message={
          deleting && (
            <>
              Supprimer définitivement la charge du{' '}
              <strong>{deleting.date}</strong>
              {deleting.supplier ? (
                <>
                  {' '}
                  — <strong>{deleting.supplier}</strong>
                </>
              ) : null}
              &nbsp;? Cette action est irréversible.
            </>
          )
        }
        confirmLabel="Supprimer"
        busy={deletingBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}
