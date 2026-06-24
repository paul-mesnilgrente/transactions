import { useCallback } from 'react'
import { useAuth } from '../auth/auth-context'
import {
  appendProduit,
  deleteProduit,
  listProduits,
  updateProduit,
} from './sheetsService'
import { appendClient, listClients } from './clientsService'
import type { Produit, ProduitRecord } from './produit'

/**
 * Produit CRUD bound to the signed-in user's access token. Each call
 * fetches a fresh token (refreshing silently when needed) before hitting the
 * Sheets API, so callers don't manage tokens themselves.
 */
export function useSheets() {
  const { getAccessToken } = useAuth()

  const list = useCallback(
    async (): Promise<ProduitRecord[]> =>
      listProduits(await getAccessToken()),
    [getAccessToken],
  )

  const add = useCallback(
    async (produit: Produit): Promise<ProduitRecord> =>
      appendProduit(await getAccessToken(), produit),
    [getAccessToken],
  )

  const update = useCallback(
    async (produit: ProduitRecord): Promise<ProduitRecord> =>
      updateProduit(await getAccessToken(), produit),
    [getAccessToken],
  )

  const remove = useCallback(
    async (row: number): Promise<void> =>
      deleteProduit(await getAccessToken(), row),
    [getAccessToken],
  )

  const clients = useCallback(
    async (): Promise<string[]> => listClients(await getAccessToken()),
    [getAccessToken],
  )

  const addClient = useCallback(
    async (name: string): Promise<void> =>
      appendClient(await getAccessToken(), name),
    [getAccessToken],
  )

  return { list, add, update, remove, clients, addClient }
}
