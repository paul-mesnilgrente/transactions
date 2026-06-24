import { useCallback } from 'react'
import { useAuth } from '../auth/auth-context'
import {
  appendTransaction,
  listTransactions,
  updateTransaction,
} from './sheetsService'
import type { Transaction, TransactionRecord } from './transaction'

/**
 * Transaction CRUD bound to the signed-in user's access token. Each call
 * fetches a fresh token (refreshing silently when needed) before hitting the
 * Sheets API, so callers don't manage tokens themselves.
 */
export function useSheets() {
  const { getAccessToken } = useAuth()

  const list = useCallback(
    async (): Promise<TransactionRecord[]> =>
      listTransactions(await getAccessToken()),
    [getAccessToken],
  )

  const add = useCallback(
    async (transaction: Transaction): Promise<TransactionRecord> =>
      appendTransaction(await getAccessToken(), transaction),
    [getAccessToken],
  )

  const update = useCallback(
    async (transaction: TransactionRecord): Promise<TransactionRecord> =>
      updateTransaction(await getAccessToken(), transaction),
    [getAccessToken],
  )

  return { list, add, update }
}
