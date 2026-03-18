import { useState, useEffect, useCallback } from 'react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTransactionQueue } from '@/services/transactions'
import { getLatestTransactions } from '@/utils/tx-list'
import { useSpaceSafesWithQueue } from './useSpaceSafesWithQueue'

type SpacePendingTxItem = TransactionQueuedItem & { safeAddress: string; chainId: string }

export const useSpacePendingTransactions = (limit = 3) => {
  const { safesWithQueue, isLoading: isLoadingQueue } = useSpaceSafesWithQueue()
  const [allTransactions, setAllTransactions] = useState<SpacePendingTxItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchAll = useCallback(async () => {
    if (safesWithQueue.length === 0) {
      setAllTransactions([])
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      const results = await safesWithQueue.reduce<
        Promise<Array<{ chainId: string; address: string; transactions: TransactionQueuedItem[] }>>
      >(async (accPromise, { chainId, address }, index) => {
        const acc = await accPromise

        if (index > 0) {
          // Wait for 300ms between requests to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 300))
        }

        const page = await getTransactionQueue(chainId, address, {
          trusted: true,
          cursor: `limit=${limit}&offset=0`,
        })

        acc.push({ chainId, address, transactions: getLatestTransactions(page.results) })

        return acc
      }, Promise.resolve([]))

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
  }, [safesWithQueue, limit])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    transactions: allTransactions,
    count: allTransactions.length,
    isLoading: isLoadingQueue || isLoading,
    error,
    refetch: fetchAll,
  }
}
