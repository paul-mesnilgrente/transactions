import type { TransactionRecord } from '../sheets/transaction'

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
})

function formatAmount(value: number | null): string {
  return value == null ? '' : money.format(value)
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
          {transactions.map((t) => (
            <tr key={t.row} className={t.row === editingRow ? 'editing' : undefined}>
              <td>{t.date}</td>
              <td>{t.client}</td>
              <td>{t.services}</td>
              <td className="num">{formatAmount(t.servicesAmount)}</td>
              <td>{t.goods}</td>
              <td className="num">{formatAmount(t.goodsAmount)}</td>
              <td>{t.paymentType}</td>
              <td>{t.notes}</td>
              <td>
                <button type="button" onClick={() => onEdit(t)}>
                  Modifier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
