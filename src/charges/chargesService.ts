// Charge reads/writes against the "Charges" sheet.

import {
  a1Range,
  getSheetId,
  sheetsFetch,
  VALUE_INPUT,
  type ValueRange,
} from '../sheets/api'
import {
  COLUMN_SPAN,
  FIRST_DATA_ROW,
  SHEET_NAME,
  fromRow,
  toRow,
  type Charge,
  type ChargeRecord,
} from './charge'

/** Read every charge row from the sheet. */
export async function listCharges(token: string): Promise<ChargeRecord[]> {
  const a1 = a1Range(SHEET_NAME, `A${FIRST_DATA_ROW}:G`)
  const data = await sheetsFetch<ValueRange>(
    `/values/${encodeURIComponent(a1)}`,
    token,
  )
  const rows = data.values ?? []
  return rows
    .map((row, i) => fromRow(row, FIRST_DATA_ROW + i))
    .filter((r): r is ChargeRecord => r !== null)
}

interface AppendResponse {
  updates: { updatedRange: string }
}

/** Append a new charge as the next row. Returns it tagged with its row number. */
export async function appendCharge(
  token: string,
  charge: Charge,
): Promise<ChargeRecord> {
  const a1 = a1Range(SHEET_NAME, COLUMN_SPAN)
  const result = await sheetsFetch<AppendResponse>(
    `/values/${encodeURIComponent(a1)}:append?valueInputOption=${VALUE_INPUT}&insertDataOption=INSERT_ROWS`,
    token,
    { method: 'POST', body: JSON.stringify({ values: [toRow(charge)] }) },
  )
  return { ...charge, row: parseAppendedRow(result.updates.updatedRange) }
}

/** Overwrite an existing charge row in place. */
export async function updateCharge(
  token: string,
  charge: ChargeRecord,
): Promise<ChargeRecord> {
  const { row } = charge
  const a1 = a1Range(SHEET_NAME, `A${row}:G${row}`)
  await sheetsFetch(
    `/values/${encodeURIComponent(a1)}?valueInputOption=${VALUE_INPUT}`,
    token,
    { method: 'PUT', body: JSON.stringify({ values: [toRow(charge)] }) },
  )
  return charge
}

/** Delete the given 1-based row entirely (rows below it shift up by one). */
export async function deleteCharge(token: string, row: number): Promise<void> {
  const sheetId = await getSheetId(token, SHEET_NAME)
  await sheetsFetch(':batchUpdate', token, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: row - 1, // 0-based, end-exclusive
              endIndex: row,
            },
          },
        },
      ],
    }),
  })
}

/** Extract the row number from an A1 range like "Charges!A12:G12" or "A12:G12". */
function parseAppendedRow(updatedRange: string): number {
  const match = updatedRange.match(/[A-Z]+(\d+)/)
  return match ? Number(match[1]) : FIRST_DATA_ROW
}
