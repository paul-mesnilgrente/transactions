// Single source of truth for the "Charges" sheet layout.
//
// Columns A–G, in order:
//   A Date    C Catégorie   E Montant            G Notes
//   B Fournisseur  D Libellé   F Type de paiement

/** Header labels as they appear in row 1 of the sheet. */
export const HEADERS = [
  'Date',
  'Fournisseur',
  'Catégorie',
  'Libellé',
  'Montant',
  'Type de paiement',
  'Notes',
] as const

/** First row holding data (row 1 is the header). */
export const FIRST_DATA_ROW = 2

/** Column span covering every field. */
export const COLUMN_SPAN = 'A:G'

/** Tab/worksheet name. */
export const SHEET_NAME = 'Charges'

export interface Charge {
  /** ISO or French date string, e.g. "24/06/2024". */
  date: string
  /** Fournisseur. */
  supplier: string
  /** Catégorie. */
  category: string
  /** Libellé. */
  label: string
  /** Montant; null when blank. */
  amount: number | null
  /** Type de paiement. */
  paymentType: string
  notes: string
}

/** A charge as read from the sheet, tagged with its 1-based row number. */
export interface ChargeRecord extends Charge {
  row: number
}

/** Parse a cell into a number, tolerating empty cells, French commas and symbols. */
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

/** Map a sheet row (array of cell strings) to a ChargeRecord. */
export function fromRow(
  values: string[],
  rowNumber: number,
): ChargeRecord | null {
  if (isEmptyRow(values)) return null
  const [date, supplier, category, label, amount, paymentType, notes] = values
  return {
    row: rowNumber,
    date: date ?? '',
    supplier: supplier ?? '',
    category: category ?? '',
    label: label ?? '',
    amount: parseAmount(amount),
    paymentType: paymentType ?? '',
    notes: notes ?? '',
  }
}

/** Map a Charge to a sheet row. An empty amount becomes a blank cell. */
export function toRow(c: Charge): (string | number)[] {
  return [
    c.date,
    c.supplier,
    c.category,
    c.label,
    c.amount ?? '',
    c.paymentType,
    c.notes,
  ]
}
