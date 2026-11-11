import { useState, useEffect, useCallback } from 'react'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getTransactionQueue } from '@/services/transactions'
import { getLatestTransactions } from '@/utils/tx-list'
import type { SpacePendingTxItem } from '../store/spacePendingTransactionsApi'
import { useSpaceSafesWithQueue } from './useSpaceSafesWithQueue'

type SafeQueueResult = { chainId: string; address: string; transactions: TransactionQueuedItem[] }

const BATCH_SIZE = 3
const BATCH_DELAY_MS = 300

/** Reads the queue of each Space Safe, for chains without the Space queue endpoint */
export const usePerSafePendingTransactions = (limit = 3, skip = false) => {
  const { safesWithQueue, isLoading: isLoadingQueue } = useSpaceSafesWithQueue()
  const [allTransactions, setAllTransactions] = useState<SpacePendingTxItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const fetchAll = useCallback(async () => {
    if (skip) return

    if (safesWithQueue.length === 0) {
      setAllTransactions([])
      return
    }

    setIsLoading(true)
    setError(undefined)

    try {
      const results: SafeQueueResult[] = []

      for (let i = 0; i < safesWithQueue.length; i += BATCH_SIZE) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
        }

        const batch = safesWithQueue.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(async ({ chainId, address }) => {
            const page = await getTransactionQueue(chainId, address, {
              trusted: true,
              cursor: `limit=${limit}&offset=0`,
            })
            return { chainId, address, transactions: getLatestTransactions(page.results) }
          }),
        )
        results.push(...batchResults)
      }

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
  }, [safesWithQueue, limit, skip])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    transactions: allTransactions,
    count: allTransactions.length,
    isLoading: !skip && (isLoadingQueue || isLoading),
    error,
    refetch: fetchAll,
  }
}
