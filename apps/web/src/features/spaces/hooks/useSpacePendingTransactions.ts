import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTransactionQueue } from '@/services/transactions'
import { getLatestTransactions } from '@/utils/tx-list'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

type SpacePendingTxItem = TransactionQueuedItem & { safeAddress: string; chainId: string }

export const useSpacePendingTransactions = (limit = 3) => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const [allTransactions, setAllTransactions] = useState<SpacePendingTxItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const { currentData: spaceSafes } = useSpaceSafesGetV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )

  const safePairs = useMemo(() => {
    if (!spaceSafes?.safes) return []
    return Object.entries(spaceSafes.safes).flatMap(([chainId, addresses]) =>
      addresses.map((address) => ({ chainId, address })),
    )
  }, [spaceSafes?.safes])

  const fetchAll = useCallback(async () => {
    if (safePairs.length === 0) {
      setAllTransactions([])
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      const results = await Promise.all(
        safePairs.map(({ chainId, address }) =>
          getTransactionQueue(chainId, address, { trusted: true, cursor: `limit=${limit}&offset=0` }).then((page) => ({
            chainId,
            address,
            transactions: getLatestTransactions(page.results),
          })),
        ),
      )

      const merged = results
        .flatMap(({ chainId, address, transactions }) =>
          transactions.map((tx) => ({ ...tx, safeAddress: address, chainId })),
        )
        .sort((a, b) => a.transaction.timestamp - b.transaction.timestamp)
        .slice(0, limit)

      setAllTransactions(merged)
    } catch {
      setError('Failed to load pending transactions')
    } finally {
      setIsLoading(false)
    }
  }, [safePairs, limit])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    transactions: allTransactions,
    count: allTransactions.length,
    isLoading,
    error,
    refetch: fetchAll,
  }
}
