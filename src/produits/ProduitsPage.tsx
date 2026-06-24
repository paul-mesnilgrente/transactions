import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSheets } from '../sheets/useSheets'
import type { Produit, ProduitRecord } from '../sheets/produit'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ProduitForm } from './ProduitForm'
import { ProduitFilters } from './ProduitFilters'
import { ProduitsTable } from './ProduitsTable'
import {
  applyFilters,
  clientsIn,
  defaultFilters,
  normalizeFilters,
  totals,
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

export function ProduitsPage() {
  const {
    list,
    add,
    update,
    remove,
    clients: fetchClients,
    addClient,
  } = useSheets()

  const [produits, setProduits] = useState<ProduitRecord[]>([])
  const [clients, setClients] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ProduitRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<ProduitRecord | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setProduits(await list())
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

  const handleAdd = useCallback(
    async (draft: Produit): Promise<boolean> => {
      setSaving(true)
      setError(null)
      try {
        await ensureClient(draft.client)
        const added = await add(draft)
        setProduits((prev) => [...prev, added])
        return true
      } catch (e) {
        setError(errorMessage(e))
        return false
      } finally {
        setSaving(false)
      }
    },
    [add, ensureClient],
  )

  const handleUpdate = useCallback(
    async (draft: Produit): Promise<boolean> => {
      if (!editing) return false
      setSaving(true)
      setError(null)
      try {
        await ensureClient(draft.client)
        const updated = await update({ ...draft, row: editing.row })
        setProduits((prev) =>
          prev.map((t) => (t.row === updated.row ? updated : t)),
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
    [editing, update, ensureClient],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleting) return
    const deletedRow = deleting.row
    setDeletingBusy(true)
    setError(null)
    try {
      await remove(deletedRow)
      // Deleting a row shifts every later row up by one, so renumber state.
      setProduits((prev) =>
        prev
          .filter((t) => t.row !== deletedRow)
          .map((t) => (t.row > deletedRow ? { ...t, row: t.row - 1 } : t)),
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

  const clientOptions = useMemo(() => clientsIn(produits), [produits])
  const yearOptions = useMemo(() => yearsIn(produits), [produits])
  const filtered = useMemo(
    // Most recent first (rows are appended chronologically to the sheet).
    () => applyFilters(produits, filters).reverse(),
    [produits, filters],
  )
  const filteredTotals = useMemo(() => totals(filtered), [filtered])

  return (
    <section className="produits">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <ProduitFilters
        filters={filters}
        onChange={(f) => setFilters(normalizeFilters(f))}
        onReset={() => setFilters(defaultFilters())}
        clientOptions={clientOptions}
        yearOptions={yearOptions}
      />

      <p className="text-body-secondary small">
        {filtered.length} / {produits.length} produit
        {produits.length > 1 ? 's' : ''} · Prestations&nbsp;:{' '}
        <strong>{money.format(filteredTotals.services)}</strong> ·
        Marchandises&nbsp;:{' '}
        <strong>{money.format(filteredTotals.goods)}</strong> · Total&nbsp;:{' '}
        <strong>{money.format(filteredTotals.total)}</strong>
      </p>

      {/* Always-present draft at the top of the list — adding is the most
          common action, so the form is permanently ready. */}
      <ProduitForm
        clients={clients}
        onSubmit={handleAdd}
        busy={saving && editing == null}
      />

      {loading && produits.length === 0 ? (
        <p>Chargement…</p>
      ) : (
        <ProduitsTable
          produits={filtered}
          onEdit={setEditing}
          onDelete={setDeleting}
          editingRow={editing?.row}
          editor={
            editing && (
              <ProduitForm
                key={editing.row}
                initial={editing}
                clients={clients}
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
        title="Supprimer le produit"
        message={
          deleting && (
            <>
              Supprimer définitivement le produit du{' '}
              <strong>{deleting.date}</strong>
              {deleting.client ? (
                <>
                  {' '}
                  pour <strong>{deleting.client}</strong>
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
