import { type ReactNode } from 'react'
import type { ChargeRecord } from './charge'
import { RefreshButton } from '../components/RefreshButton'

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

function formatAmount(value: number | null): string {
  return value == null ? '' : money.format(value)
}

/** Combine a base class with `empty` so blank cells can be hidden on mobile. */
function cellClass(value: string, base = ''): string | undefined {
  const classes = [base, value.trim() === '' ? 'empty' : '']
    .filter(Boolean)
    .join(' ')
  return classes || undefined
}

interface Props {
  charges: ChargeRecord[]
  onEdit: (charge: ChargeRecord) => void
  onDelete: (charge: ChargeRecord) => void
  onReload: () => void
  loading?: boolean
  editingRow?: number
  /** Editor that replaces the row being edited (morph in place). */
  editor?: ReactNode
}

export function ChargesTable({
  charges,
  onEdit,
  onDelete,
  onReload,
  loading,
  editingRow,
  editor,
}: Props) {
  return (
    <div>
      <table className="table table-hover align-middle mb-0 tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Fournisseur</th>
            <th>Catégorie</th>
            <th>Libellé</th>
            <th className="num">Montant</th>
            <th>Paiement</th>
            <th>Notes</th>
            <th className="text-end">
              <RefreshButton onClick={onReload} loading={loading} />
            </th>
          </tr>
        </thead>
        <tbody>
          {charges.length === 0 && (
            <tr className="tx-empty-row">
              <td colSpan={8} className="text-body-secondary py-3">
                Aucune charge pour l'instant.
              </td>
            </tr>
          )}
          {charges.map((c) => {
            if (c.row === editingRow && editor) {
              return (
                <tr key={c.row} className="tx-edit-row">
                  <td colSpan={8} className="p-0 border-0">
                    <div className="tx-edit-panel">{editor}</div>
                  </td>
                </tr>
              )
            }

            const amount = formatAmount(c.amount)
            return (
              <tr key={c.row}>
                <td data-label="Date" className={cellClass(c.date)}>
                  {c.date}
                </td>
                <td data-label="Fournisseur" className={cellClass(c.supplier)}>
                  {c.supplier}
                </td>
                <td data-label="Catégorie" className={cellClass(c.category)}>
                  {c.category}
                </td>
                <td data-label="Libellé" className={cellClass(c.label)}>
                  {c.label}
                </td>
                <td data-label="Montant" className={cellClass(amount, 'num')}>
                  {amount}
                </td>
                <td data-label="Paiement" className={cellClass(c.paymentType)}>
                  {c.paymentType}
                </td>
                <td data-label="Notes" className={cellClass(c.notes)}>
                  {c.notes}
                </td>
                <td className="actions-cell text-end">
                  <div className="row-actions justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onEdit(c)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(c)}
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
