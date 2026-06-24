import { type ReactNode } from 'react'
import type { TransactionRecord } from '../sheets/transaction'

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
  transactions: TransactionRecord[]
  onEdit: (transaction: TransactionRecord) => void
  onDelete: (transaction: TransactionRecord) => void
  editingRow?: number
  /** Editor that replaces the row being edited (morph in place). */
  editor?: ReactNode
}

export function TransactionsTable({
  transactions,
  onEdit,
  onDelete,
  editingRow,
  editor,
}: Props) {
  if (transactions.length === 0) {
    return (
      <p className="text-body-secondary">Aucune transaction pour l'instant.</p>
    )
  }

  return (
    <div>
      <table className="table table-hover align-middle mb-0 tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Prestations</th>
            <th className="num">€</th>
            <th>Marchandises</th>
            <th className="num">€</th>
            <th>Paiement</th>
            <th>Notes</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            // The row being edited is replaced by the form (morph in place).
            if (t.row === editingRow && editor) {
              return (
                <tr key={t.row} className="tx-edit-row">
                  <td colSpan={9} className="p-0 border-0">
                    <div className="tx-edit-panel">{editor}</div>
                  </td>
                </tr>
              )
            }

            const services = formatAmount(t.servicesAmount)
            const goods = formatAmount(t.goodsAmount)
            return (
              <tr key={t.row}>
                <td data-label="Date" className={cellClass(t.date)}>
                  {t.date}
                </td>
                <td data-label="Client" className={cellClass(t.client)}>
                  {t.client}
                </td>
                <td data-label="Prestations" className={cellClass(t.services)}>
                  {t.services}
                </td>
                <td
                  data-label="Facturé prestation"
                  className={cellClass(services, 'num')}
                >
                  {services}
                </td>
                <td data-label="Marchandises" className={cellClass(t.goods)}>
                  {t.goods}
                </td>
                <td
                  data-label="Facturé marchandise"
                  className={cellClass(goods, 'num')}
                >
                  {goods}
                </td>
                <td data-label="Paiement" className={cellClass(t.paymentType)}>
                  {t.paymentType}
                </td>
                <td data-label="Notes" className={cellClass(t.notes)}>
                  {t.notes}
                </td>
                <td className="actions-cell text-end">
                  <div className="row-actions justify-content-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onEdit(t)}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(t)}
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
