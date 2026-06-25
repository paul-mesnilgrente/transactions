import { useCallback } from 'react'
import { useAuth } from '../auth/auth-context'
import {
  appendCharge,
  deleteCharge,
  listCharges,
  updateCharge,
} from './chargesService'
import type { Charge, ChargeRecord } from './charge'

/**
 * Charge CRUD bound to the signed-in user's access token. Each call fetches a
 * fresh token (refreshing silently when needed) before hitting the Sheets API.
 */
export function useCharges() {
  const { getAccessToken } = useAuth()

  const list = useCallback(
    async (): Promise<ChargeRecord[]> => listCharges(await getAccessToken()),
    [getAccessToken],
  )

  const add = useCallback(
    async (charge: Charge): Promise<ChargeRecord> =>
      appendCharge(await getAccessToken(), charge),
    [getAccessToken],
  )

  const update = useCallback(
    async (charge: ChargeRecord): Promise<ChargeRecord> =>
      updateCharge(await getAccessToken(), charge),
    [getAccessToken],
  )

  const remove = useCallback(
    async (row: number): Promise<void> =>
      deleteCharge(await getAccessToken(), row),
    [getAccessToken],
  )

  return { list, add, update, remove }
}
