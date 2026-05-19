import { useMemo } from 'react'
import {
  useSpaceTransactionsGetTransactionQueueV1Query,
  useSpaceSafesGetV1Query,
  type TransactionQueuedItem,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

type SpacePendingTxItem = TransactionQueuedItem & { safeAddress: string; chainId: string }

const TX_ID_PREFIX = 'multisig_'
const TX_ID_SEPARATOR = '_'

const parseSafeAddress = (txId: string): string | null => {
  if (!txId.startsWith(TX_ID_PREFIX)) return null
  const rest = txId.slice(TX_ID_PREFIX.length)
  const sepIdx = rest.indexOf(TX_ID_SEPARATOR)
  if (sepIdx === -1) return null
  return rest.slice(0, sepIdx)
}

export const useSpacePendingTransactions = (limit = 3) => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  const { currentData: spaceSafes } = useSpaceSafesGetV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )

  const addressToChainId = useMemo(() => {
    const map = new Map<string, string>()
    if (!spaceSafes?.safes) return map
    for (const [chainId, addresses] of Object.entries(spaceSafes.safes)) {
      for (const address of addresses as string[]) {
        map.set(address.toLowerCase(), chainId)
      }
    }
    return map
  }, [spaceSafes?.safes])

  const {
    currentData: queuePage,
    isFetching,
    error,
    refetch,
  } = useSpaceTransactionsGetTransactionQueueV1Query(
    { spaceId: Number(spaceId), cursor: `limit=${limit}&offset=0` },
    { skip: !isUserSignedIn || !spaceId },
  )

  const transactions = useMemo<SpacePendingTxItem[]>(() => {
    if (!queuePage?.results) return []
    const items: SpacePendingTxItem[] = []
    for (const item of queuePage.results) {
      if (item.type !== 'TRANSACTION') continue
      const safeAddress = parseSafeAddress(item.transaction.id)
      if (!safeAddress) continue
      const chainId = addressToChainId.get(safeAddress.toLowerCase()) ?? ''
      items.push({ ...item, safeAddress, chainId })
    }
    return items.sort((a, b) => a.transaction.timestamp - b.transaction.timestamp).slice(0, limit)
  }, [queuePage?.results, addressToChainId, limit])

  return {
    transactions,
    count: transactions.length,
    isLoading: isFetching,
    error: error ? 'Failed to load pending transactions' : undefined,
    refetch,
  }
}
