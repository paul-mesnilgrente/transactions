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
  editingRow?: number
}

export function TransactionsTable({ transactions, onEdit, editingRow }: Props) {
  if (transactions.length === 0) {
    return <p className="empty">Aucune transaction pour l'instant.</p>
  }

  return (
    <div className="table-wrap">
      <table className="tx-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Prestations</th>
            <th className="num">Facturé prest.</th>
            <th>Marchandises</th>
            <th className="num">Facturé march.</th>
            <th>Paiement</th>
            <th>Notes</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const services = formatAmount(t.servicesAmount)
            const goods = formatAmount(t.goodsAmount)
            return (
              <tr
                key={t.row}
                className={t.row === editingRow ? 'editing' : undefined}
              >
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
                <td className="actions-cell">
                  <button type="button" onClick={() => onEdit(t)}>
                    Modifier
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
