// Single source of truth for the transactions sheet layout.
//
// Columns A–H, in order:
//   A Date              C Prestations          E Marchandises          G Type de paiement
//   B Client            D Facturé prestation   F Facturé marchandise   H Notes

/** Header labels as they appear in row 1 of the sheet. */
export const HEADERS = [
  'Date',
  'Client',
  'Prestations',
  'Facturé prestation',
  'Marchandises',
  'Facturé marchandise',
  'Type de paiement',
  'Notes',
] as const

/** First row holding data (row 1 is the header). */
export const FIRST_DATA_ROW = 2

/** Column span covering every field, e.g. used to build A1 ranges. */
export const COLUMN_SPAN = 'A:H'

/**
 * Name of the tab/worksheet to read and write. Leave empty to target the
 * first sheet in the spreadsheet; set it if your transactions live on a
 * specifically-named tab (e.g. 'Transactions').
 */
export const SHEET_NAME = 'Revenus'

export interface Transaction {
  /** ISO date string, e.g. "2026-06-24". */
  date: string
  client: string
  /** Prestations — services performed. */
  services: string
  /** Facturé prestation — amount billed for services; null when not applicable. */
  servicesAmount: number | null
  /** Marchandises — goods sold. */
  goods: string
  /** Facturé marchandise — amount billed for goods; null when not applicable. */
  goodsAmount: number | null
  /** Type de paiement — e.g. "Carte", "Espèces". */
  paymentType: string
  notes: string
}

/** A transaction as read from the sheet, tagged with its 1-based row number. */
export interface TransactionRecord extends Transaction {
  /** 1-based row in the sheet, used to target updates. */
  row: number
}

/** Parse a cell into a number, tolerating empty cells, French commas and currency symbols. */
function parseAmount(raw: string | undefined): number | null {
  if (raw == null) return null
  const cleaned = raw.replace(/[^0-9,.-]/g, '').replace(',', '.')
  if (cleaned === '') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

/** True when every cell in the row is blank. */
function isEmptyRow(values: string[]): boolean {
  return values.every((v) => (v ?? '').trim() === '')
}

/** Map a sheet row (array of cell strings) to a TransactionRecord. */
export function fromRow(
  values: string[],
  rowNumber: number,
): TransactionRecord | null {
  if (isEmptyRow(values)) return null
  const [
    date,
    client,
    services,
    servicesAmount,
    goods,
    goodsAmount,
    paymentType,
    notes,
  ] = values
  return {
    row: rowNumber,
    date: date ?? '',
    client: client ?? '',
    services: services ?? '',
    servicesAmount: parseAmount(servicesAmount),
    goods: goods ?? '',
    goodsAmount: parseAmount(goodsAmount),
    paymentType: paymentType ?? '',
    notes: notes ?? '',
  }
}

/** Map a Transaction to a sheet row. Empty amounts become blank cells. */
export function toRow(t: Transaction): (string | number)[] {
  return [
    t.date,
    t.client,
    t.services,
    t.servicesAmount ?? '',
    t.goods,
    t.goodsAmount ?? '',
    t.paymentType,
    t.notes,
  ]
}
